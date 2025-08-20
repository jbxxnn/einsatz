'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MessageSquare, Eye, CheckCircle, X, AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from '@/hooks/use-toast'

interface FreelancerAnswer {
  question_id: number
  question_text: string
  category: string
  options: string[]
  selected_option_index: number
  selected_answer: string
  answer_score: number
  answered_at: string
}

interface GroupedFreelancerAnswers {
  [category: string]: FreelancerAnswer[]
}

interface FreelancerDBAData {
  has_freelancer_dba: boolean
  freelancer_id: string
  job_category_id: string
  total_score: number
  completion_date: string
  answers: GroupedFreelancerAnswers
  total_questions: number
}

interface ClientDBADisputeModalProps {
  isOpen: boolean
  onClose: () => void
  bookingId: string
  onResolved: (proceedWithBooking: boolean) => void
}

export function ClientDBADisputeModal({ 
  isOpen, 
  onClose, 
  bookingId,
  onResolved 
}: ClientDBADisputeModalProps) {
  const [freelancerData, setFreelancerData] = useState<FreelancerDBAData | null>(null)
  const [loading, setLoading] = useState(true)
  const [openingDispute, setOpeningDispute] = useState(false)
  const [disputeOpened, setDisputeOpened] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClientComponentClient()

  useEffect(() => {
    if (isOpen) {
      fetchFreelancerAnswers()
    }
  }, [isOpen, bookingId])

  const fetchFreelancerAnswers = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/client-dba/freelancer-answers?booking_id=${bookingId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          const errorData = await response.json()
          setError(errorData.error || 'Freelancer has not completed DBA for this job category')
          return
        }
        throw new Error('Failed to fetch freelancer answers')
      }

      const data = await response.json()
      setFreelancerData(data)
    } catch (error) {
      console.error('Error fetching freelancer answers:', error)
      setError('Failed to load freelancer DBA answers')
      toast({
        title: 'Error',
        description: 'Failed to load freelancer DBA answers',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDispute = async () => {
    try {
      setOpeningDispute(true)
      
      const response = await fetch('/api/client-dba/dispute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          booking_id: bookingId
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to open dispute')
      }

      const result = await response.json()
      
      if (result.success) {
        setDisputeOpened(true)
        toast({
          title: 'Dispute Opened',
          description: 'You can now message the freelancer to discuss the DBA answers',
        })
      } else {
        throw new Error(result.error || 'Failed to open dispute')
      }
    } catch (error) {
      console.error('Error opening dispute:', error)
      toast({
        title: 'Error',
        description: 'Failed to open dispute',
        variant: 'destructive',
      })
    } finally {
      setOpeningDispute(false)
    }
  }

  const handleProceedWithBooking = () => {
    onResolved(true)
    onClose()
  }

  const handleCancelBooking = () => {
    onResolved(false)
    onClose()
  }

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Loading Freelancer DBA Answers...</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (error || !freelancerData?.has_freelancer_dba) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Freelancer DBA Not Available</DialogTitle>
          </DialogHeader>
          
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error || 'The freelancer has not completed their DBA assessment for this job category.'}
            </AlertDescription>
          </Alert>

          <div className="flex items-center gap-3 pt-4">
            <Button onClick={handleProceedWithBooking} variant="destructive" className="flex-1">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Proceed Anyway (I Accept the Risk)
            </Button>
            <Button onClick={handleCancelBooking} variant="outline" className="flex-1">
              <X className="h-4 w-4 mr-2" />
              Cancel Booking
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const categories = Object.keys(freelancerData.answers)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review Freelancer's DBA Answers</DialogTitle>
          <p className="text-sm text-gray-600">
            Compare the freelancer's answers with yours to understand any discrepancies
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Freelancer Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Freelancer DBA Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium">Total Score:</span>
                <p className="text-lg font-bold">{freelancerData.total_score} points</p>
              </div>
              <div>
                <span className="text-sm font-medium">Completed On:</span>
                <p className="text-sm">
                  {new Date(freelancerData.completion_date).toLocaleDateString()}
                </p>
              </div>
              <div className="col-span-2">
                <span className="text-sm font-medium">Questions Answered:</span>
                <p className="text-sm">{freelancerData.total_questions} questions</p>
              </div>
            </CardContent>
          </Card>

          {/* Freelancer Answers by Category */}
          <Tabs defaultValue={categories[0]} className="w-full">
            <TabsList className="grid w-full grid-cols-auto">
              {categories.map((category) => (
                <TabsTrigger key={category} value={category} className="capitalize">
                  {category}
                  <Badge variant="secondary" className="ml-2">
                    {freelancerData.answers[category].length}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>

            {categories.map((category) => (
              <TabsContent key={category} value={category} className="space-y-4">
                {freelancerData.answers[category].map((answer) => (
                  <Card key={answer.question_id}>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <Badge variant="outline">{answer.question_id}</Badge>
                          <p className="text-sm font-medium flex-1">
                            {answer.question_text}
                          </p>
                        </div>

                        <div className="ml-8 space-y-2">
                          <p className="text-sm text-gray-600">Available options:</p>
                          {answer.options.map((option, index) => (
                            <div
                              key={index}
                              className={`p-2 rounded border text-sm ${
                                index === answer.selected_option_index
                                  ? 'bg-blue-50 border-blue-200 font-medium'
                                  : 'bg-gray-50 border-gray-200'
                              }`}
                            >
                              {index === answer.selected_option_index && (
                                <CheckCircle className="h-4 w-4 text-blue-500 inline mr-2" />
                              )}
                              {option}
                              {index === answer.selected_option_index && (
                                <Badge variant="secondary" className="ml-2">
                                  {answer.answer_score} pts
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>

                        <div className="ml-8 text-xs text-gray-500">
                          Answered on: {new Date(answer.answered_at).toLocaleString()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            ))}
          </Tabs>

          {/* Action Buttons */}
          <div className="space-y-3 pt-6 border-t">
            {!disputeOpened ? (
              <Button 
                onClick={handleOpenDispute} 
                className="w-full"
                size="lg"
                disabled={openingDispute}
              >
                {openingDispute ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Opening Dispute...
                  </>
                ) : (
                  <>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Start Discussion with Freelancer
                  </>
                )}
              </Button>
            ) : (
              <Alert>
                <MessageSquare className="h-4 w-4" />
                <AlertDescription>
                  <strong>Dispute opened!</strong> You can now message the freelancer through the messaging system 
                  to discuss any discrepancies in your DBA answers. After your discussion, you can choose to 
                  proceed with the booking or cancel it.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Button 
                onClick={handleProceedWithBooking} 
                variant="destructive"
                size="lg"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Proceed with Booking
              </Button>
              <Button 
                onClick={handleCancelBooking} 
                variant="outline"
                size="lg"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel Booking
              </Button>
            </div>

            <p className="text-xs text-gray-500 text-center">
              By proceeding, you acknowledge that you accept any legal risks associated 
              with the working relationship based on the DBA assessment.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}






