'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { AlertTriangle, Shield, CheckCircle, MessageSquare, X } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from '@/hooks/use-toast'

interface ClientDBAAnswer {
  question_id: number
  selected_option_index: number
  answer_score: number
}

interface DBAQuestion {
  id: number
  question_text: string
  options_json: string[]
  category: string
  score_mapping: { [key: string]: number }
}

interface GroupedQuestions {
  [category: string]: DBAQuestion[]
}

interface DBAAssessment {
  id: string
  booking_id: string
  client_total_score: number
  freelancer_total_score: number
  combined_score: number
  risk_level: 'safe' | 'doubtful' | 'high_risk'
  has_freelancer_dba: boolean
  client_decision: string
  dispute_opened: boolean
}

interface RiskThresholds {
  safe: string
  doubtful: string
  high_risk: string
}

interface ClientDBAModalProps {
  isOpen: boolean
  onClose: () => void
  bookingId: string
  onComplete: (assessment: DBAAssessment) => void
  onDisputeOpen: () => void
}

export function ClientDBAModal({ 
  isOpen, 
  onClose, 
  bookingId, 
  onComplete,
  onDisputeOpen 
}: ClientDBAModalProps) {
  const [questions, setQuestions] = useState<GroupedQuestions>({})
  const [answers, setAnswers] = useState<{ [questionId: number]: ClientDBAAnswer }>({})
  const [currentCategory, setCurrentCategory] = useState<string>('')
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [assessment, setAssessment] = useState<DBAAssessment | null>(null)
  const [riskThresholds, setRiskThresholds] = useState<RiskThresholds | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [noFreelancerDBA, setNoFreelancerDBA] = useState(false)

  const supabase = createClientComponentClient()

  useEffect(() => {
    if (isOpen) {
      fetchQuestions()
    }
  }, [isOpen])

  const fetchQuestions = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/client-dba/questions')
      
      if (!response.ok) {
        throw new Error('Failed to fetch questions')
      }

      const data = await response.json()
      setQuestions(data.questions)
      setTotalQuestions(data.totalQuestions)
      
      // Set first category as current
      const categories = Object.keys(data.questions)
      if (categories.length > 0) {
        setCurrentCategory(categories[0])
      }
    } catch (error) {
      console.error('Error fetching questions:', error)
      toast({
        title: 'Error',
        description: 'Failed to load DBA questions',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerChange = (questionId: number, optionIndex: number, score: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        question_id: questionId,
        selected_option_index: optionIndex,
        answer_score: score
      }
    }))
  }

  const getCurrentQuestions = () => {
    return currentCategory ? questions[currentCategory] || [] : []
  }

  const getProgressPercentage = () => {
    return totalQuestions > 0 ? (Object.keys(answers).length / totalQuestions) * 100 : 0
  }

  const canSubmit = () => {
    return Object.keys(answers).length === totalQuestions
  }

  const handleSubmit = async () => {
    if (!canSubmit()) {
      toast({
        title: 'Incomplete',
        description: 'Please answer all questions before submitting',
        variant: 'destructive',
      })
      return
    }

    try {
      setSubmitting(true)
      
      const response = await fetch('/api/client-dba/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          booking_id: bookingId,
          answers: Object.values(answers)
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit DBA')
      }

      const result = await response.json()
      
      if (result.success) {
        setAssessment(result.assessment)
        setRiskThresholds(result.risk_thresholds)
        setShowResults(true)
      } else {
        throw new Error(result.error || 'Failed to process DBA')
      }
    } catch (error) {
      console.error('Error submitting DBA:', error)
      toast({
        title: 'Error',
        description: 'Failed to submit DBA assessment',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleProceedAnyway = () => {
    if (assessment) {
      onComplete(assessment)
      onClose()
    }
  }

  const handleOpenDispute = () => {
    onDisputeOpen()
    onClose()
  }

  const handleCancel = () => {
    onClose()
  }

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'safe':
        return <CheckCircle className="h-6 w-6 text-green-500" />
      case 'doubtful':
        return <AlertTriangle className="h-6 w-6 text-yellow-500" />
      case 'high_risk':
        return <AlertTriangle className="h-6 w-6 text-red-500" />
      default:
        return <Shield className="h-6 w-6 text-gray-500" />
    }
  }

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'safe':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'doubtful':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'high_risk':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getRiskDescription = (riskLevel: string) => {
    if (!riskThresholds) return ''
    switch (riskLevel) {
      case 'safe':
        return riskThresholds.safe
      case 'doubtful':
        return riskThresholds.doubtful
      case 'high_risk':
        return riskThresholds.high_risk
      default:
        return ''
    }
  }

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Loading DBA Assessment...</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (showResults && assessment) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>DBA Risk Assessment Results</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Risk Level Display */}
            <Card className={`border-2 ${getRiskColor(assessment.risk_level)}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  {getRiskIcon(assessment.risk_level)}
                  Risk Level: {assessment.risk_level.replace('_', ' ').toUpperCase()}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4">
                  {getRiskDescription(assessment.risk_level)}
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Your Score:</span> {assessment.client_total_score} points
                  </div>
                  <div>
                    <span className="font-medium">Freelancer Score:</span> {assessment.freelancer_total_score} points
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium">Combined Total:</span> {assessment.combined_score} points
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* No Freelancer DBA Warning */}
            {!assessment.has_freelancer_dba && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Warning:</strong> The freelancer hasn't completed their DBA assessment for this job type. 
                  This increases the legal risk of your working relationship.
                </AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              {assessment.risk_level === 'safe' ? (
                <Button onClick={handleProceedAnyway} className="w-full" size="lg">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Continue with Booking
                </Button>
              ) : (
                <>
                  <Button 
                    onClick={handleOpenDispute} 
                    variant="outline" 
                    className="w-full"
                    size="lg"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Open Dispute & Review Freelancer's Answers
                  </Button>
                  <Button 
                    onClick={handleProceedAnyway} 
                    variant="destructive" 
                    className="w-full"
                    size="lg"
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Proceed Anyway (I Accept the Risk)
                  </Button>
                </>
              )}
              <Button onClick={handleCancel} variant="ghost" className="w-full">
                <X className="h-4 w-4 mr-2" />
                Cancel Booking
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const categories = Object.keys(questions)
  const currentQuestions = getCurrentQuestions()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Client DBA Assessment</DialogTitle>
          <div className="flex items-center gap-4 mt-4">
            <Progress value={getProgressPercentage()} className="flex-1" />
            <span className="text-sm text-gray-600">
              {Object.keys(answers).length} / {totalQuestions} completed
            </span>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={currentCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentCategory(category)}
                className="capitalize"
              >
                {category}
                <Badge 
                  variant="secondary" 
                  className="ml-2"
                >
                  {questions[category]?.filter(q => answers[q.id]).length || 0}/{questions[category]?.length || 0}
                </Badge>
              </Button>
            ))}
          </div>

          {/* Questions */}
          <div className="space-y-4">
            {currentQuestions.map((question, index) => (
              <Card key={question.id} className="p-4">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="mt-1">
                      {question.id}
                    </Badge>
                    <p className="text-sm font-medium leading-relaxed">
                      {question.question_text}
                    </p>
                  </div>

                  <div className="space-y-2 ml-8">
                    {question.options_json.map((option, optionIndex) => (
                      <label
                        key={optionIndex}
                        className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <input
                          type="radio"
                          name={`question-${question.id}`}
                          value={optionIndex}
                          checked={answers[question.id]?.selected_option_index === optionIndex}
                          onChange={() => handleAnswerChange(
                            question.id, 
                            optionIndex, 
                            question.score_mapping[optionIndex.toString()]
                          )}
                          className="mt-1"
                        />
                        <span className="text-sm flex-1">{option}</span>
                        <Badge variant="secondary" className="text-xs">
                          {question.score_mapping[optionIndex.toString()]} pts
                        </Badge>
                      </label>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Submit Button */}
          <div className="flex items-center gap-3 pt-6 border-t">
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit() || submitting}
              className="flex-1"
              size="lg"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Calculate Risk Assessment
                </>
              )}
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}






