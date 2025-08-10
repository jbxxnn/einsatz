'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertTriangle, Users, MessageSquare, Check, X, Info } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'
import { toast } from '@/hooks/use-toast'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/database.types'

type DisputeInfo = {
  id: string
  question_group_id: string
  freelancer_answer: string
  client_answer: string
  dispute_score: number
  resolution_status: 'unresolved' | 'acknowledged' | 'resolved'
  resolution_notes?: string
  question_text: string
  question_options: string[]
}

interface DBADisputeResolverProps {
  bookingId: string
  disputes: DisputeInfo[]
  userType: 'freelancer' | 'client'
  onDisputeResolved?: (disputeId: string, resolution: string) => void
  onAllDisputesResolved?: () => void
  className?: string
}

export default function DBADisputeResolver({
  bookingId,
  disputes,
  userType,
  onDisputeResolved,
  onAllDisputesResolved,
  className = ""
}: DBADisputeResolverProps) {
  const { t } = useTranslation()
  const supabase = createClientComponentClient<Database>()
  
  const [selectedDispute, setSelectedDispute] = useState<DisputeInfo | null>(null)
  const [resolutionNotes, setResolutionNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [showDialog, setShowDialog] = useState(false)

  // Group disputes by severity
  const criticalDisputes = disputes.filter(d => d.dispute_score >= 8)
  const moderateDisputes = disputes.filter(d => d.dispute_score >= 5 && d.dispute_score < 8)
  const minorDisputes = disputes.filter(d => d.dispute_score < 5)

  const getDisputeSeverityColor = (score: number) => {
    if (score >= 8) return 'bg-red-100 text-red-800 border-red-200'
    if (score >= 5) return 'bg-orange-100 text-orange-800 border-orange-200'
    return 'bg-yellow-100 text-yellow-800 border-yellow-200'
  }

  const getDisputeSeverityLabel = (score: number) => {
    if (score >= 8) return 'Critical'
    if (score >= 5) return 'Moderate'
    return 'Minor'
  }

  const getAnswerText = (answerIndex: string, options: string[]) => {
    const index = parseInt(answerIndex)
    return options[index] || `Option ${index}`
  }

  const handleResolveDispute = async (dispute: DisputeInfo, action: 'acknowledge' | 'resolve') => {
    setLoading(true)
    try {
      const newStatus = action === 'acknowledge' ? 'acknowledged' : 'resolved'
      
      const { error } = await supabase
        .from('dba_answer_disputes')
        .update({ 
          resolution_status: newStatus,
          resolution_notes: resolutionNotes 
        })
        .eq('id', dispute.id)

      if (error) throw error

      toast({
        title: `Dispute ${action === 'acknowledge' ? 'Acknowledged' : 'Resolved'}`,
        description: `The dispute for this question has been ${action === 'acknowledge' ? 'acknowledged' : 'resolved'}.`
      })

      onDisputeResolved?.(dispute.id, newStatus)
      setShowDialog(false)
      setResolutionNotes("")
      setSelectedDispute(null)

      // Check if all disputes are resolved
      const remainingDisputes = disputes.filter(d => 
        d.id !== dispute.id && d.resolution_status === 'unresolved'
      )
      
      if (remainingDisputes.length === 0) {
        onAllDisputesResolved?.()
      }
    } catch (error) {
      console.error('Error resolving dispute:', error)
      toast({
        title: 'Error',
        description: 'Failed to resolve dispute. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const openDisputeDialog = (dispute: DisputeInfo) => {
    setSelectedDispute(dispute)
    setShowDialog(true)
    setResolutionNotes("")
  }

  if (disputes.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <Check className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Disputes Found</h3>
            <p className="text-gray-600">
              All answers match between freelancer and client. The DBA assessment can proceed normally.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-black text-lg">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            DBA Answer Disputes Detected
          </CardTitle>
          <CardDescription className="text-xs text-black">
            {disputes.length} conflicting answer(s) found between freelancer and client responses.
            These need to be reviewed and resolved before the final DBA assessment.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Dispute Impact Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Impact on DBA Score:</strong> Disputes automatically use the higher risk answer for scoring. 
          Resolving disputes may help clarify the working relationship and improve the assessment accuracy.
        </AlertDescription>
      </Alert>

      {/* Critical Disputes */}
      {criticalDisputes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-700 text-base">Critical Disputes (High Impact)</CardTitle>
            <CardDescription className="text-xs">
              These disputes have the highest impact on your DBA risk assessment.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {criticalDisputes.map((dispute) => (
                <DisputeCard 
                  key={dispute.id} 
                  dispute={dispute} 
                  onResolve={() => openDisputeDialog(dispute)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Moderate Disputes */}
      {moderateDisputes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-orange-700 text-base">Moderate Disputes</CardTitle>
            <CardDescription className="text-xs">
              These disputes have moderate impact on your assessment.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {moderateDisputes.map((dispute) => (
                <DisputeCard 
                  key={dispute.id} 
                  dispute={dispute} 
                  onResolve={() => openDisputeDialog(dispute)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Minor Disputes */}
      {minorDisputes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-yellow-700 text-base">Minor Disputes</CardTitle>
            <CardDescription className="text-xs">
              These disputes have minimal impact but should still be reviewed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {minorDisputes.map((dispute) => (
                <DisputeCard 
                  key={dispute.id} 
                  dispute={dispute} 
                  onResolve={() => openDisputeDialog(dispute)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resolution Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Resolve Dispute</DialogTitle>
            <DialogDescription>
              Review the conflicting answers and provide resolution notes.
            </DialogDescription>
          </DialogHeader>
          
          {selectedDispute && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-sm mb-2">Question:</h4>
                <p className="text-sm text-gray-700">{selectedDispute.question_text}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-sm text-blue-800 mb-2">Freelancer Answer:</h4>
                  <p className="text-sm text-blue-700">
                    {getAnswerText(selectedDispute.freelancer_answer, selectedDispute.question_options)}
                  </p>
                </div>

                <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-sm text-green-800 mb-2">Client Answer:</h4>
                  <p className="text-sm text-green-700">
                    {getAnswerText(selectedDispute.client_answer, selectedDispute.question_options)}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Resolution Notes (Optional):</label>
                <Textarea
                  placeholder="Add any notes about how this dispute should be resolved or additional context..."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => handleResolveDispute(selectedDispute, 'acknowledge')}
                  disabled={loading}
                >
                  Acknowledge Dispute
                </Button>
                <Button
                  onClick={() => handleResolveDispute(selectedDispute, 'resolve')}
                  disabled={loading}
                >
                  Mark as Resolved
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Helper component for individual dispute cards
function DisputeCard({ 
  dispute, 
  onResolve 
}: { 
  dispute: DisputeInfo
  onResolve: () => void 
}) {
  const getAnswerText = (answerIndex: string, options: string[]) => {
    const index = parseInt(answerIndex)
    return options[index] || `Option ${index}`
  }

  const getDisputeSeverityColor = (score: number) => {
    if (score >= 8) return 'bg-red-100 text-red-800 border-red-200'
    if (score >= 5) return 'bg-orange-100 text-orange-800 border-orange-200'
    return 'bg-yellow-100 text-yellow-800 border-yellow-200'
  }

  const getDisputeSeverityLabel = (score: number) => {
    if (score >= 8) return 'Critical'
    if (score >= 5) return 'Moderate'
    return 'Minor'
  }

  return (
    <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
      <div className="flex items-start justify-between mb-3">
        <h4 className="font-medium text-sm text-gray-900 flex-1">
          {dispute.question_text}
        </h4>
        <Badge 
          variant="outline" 
          className={`ml-2 ${getDisputeSeverityColor(dispute.dispute_score)}`}
        >
          {getDisputeSeverityLabel(dispute.dispute_score)}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="text-xs">
          <span className="font-medium text-blue-600">Freelancer:</span>
          <p className="text-gray-600 mt-1">
            {getAnswerText(dispute.freelancer_answer, dispute.question_options)}
          </p>
        </div>
        <div className="text-xs">
          <span className="font-medium text-green-600">Client:</span>
          <p className="text-gray-600 mt-1">
            {getAnswerText(dispute.client_answer, dispute.question_options)}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">
          Score Impact: {dispute.dispute_score} points
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={onResolve}
          className="flex items-center gap-1"
        >
          <MessageSquare className="h-3 w-3" />
          Resolve
        </Button>
      </div>
    </div>
  )
}

