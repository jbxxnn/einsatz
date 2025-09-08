'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { AlertTriangle, Shield, CheckCircle, X, ArrowLeft, ArrowRight, MessageSquare, Loader, FileText } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from '@/lib/toast'
import { useRouter } from 'next/navigation'
import { useOptimizedUser } from '@/components/optimized-user-provider'
import { useTranslation } from '@/lib/i18n'


const CustomRescheduleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg 
  xmlns="http://www.w3.org/2000/svg" 
  width="24" 
  height="24" 
  viewBox="0 0 24 24" 
  fill="none">
    <path 
    opacity=".4" d="M16 12.692v5.39c0 2.34-1.56 3.89-3.89 3.89H5.89c-2.33 0-3.89-1.55-3.89-3.89v-7.77c0-2.34 1.56-3.89 3.89-3.89h3.83c1.03 0 2.02.41 2.75 1.14l2.39 2.38c.73.73 1.14 1.72 1.14 2.75Z" 
    fill="#15dda9">
      </path>
      <path d="M22 8.249v5.39c0 2.33-1.56 3.89-3.89 3.89H16v-4.84c0-1.03-.41-2.02-1.14-2.75l-2.39-2.38a3.89 3.89 0 0 0-2.75-1.14H8v-.56c0-2.33 1.56-3.89 3.89-3.89h3.83c1.03 0 2.02.41 2.75 1.14l2.39 2.39A3.89 3.89 0 0 1 22 8.249Z" 
      fill="#15dda9">
        </path>
        </svg>
)

const CustomMessagesIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg 
  className={props.className}
  xmlns="http://www.w3.org/2000/svg" 
  width="24" 
  height="24" 
  viewBox="0 0 24 24" 
  fill="none">
    <path opacity=".4" d="M2 12.97V6.99C2 4.23 4.24 2 7 2h10c2.76 0 5 2.23 5 4.99v6.98c0 2.75-2.24 4.98-5 4.98h-1.5c-.31 0-.61.15-.8.4l-1.5 1.99c-.66.88-1.74.88-2.4 0l-1.5-1.99c-.16-.22-.52-.4-.8-.4H7c-2.76 0-5-2.23-5-4.98v-1Z" 
    fill="currentColor">
      </path>
      <path d="M12 12c-.56 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.44 1-1 1ZM16 12c-.56 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.44 1-1 1ZM8 12c-.56 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.44 1-1 1Z" 
      fill="currentColor">
        </path>
        </svg>
)


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

interface ClientDBAAnswer {
  question_id: number
  selected_option_index: number
  answer_score: number
}

interface DBAResult {
  answers: ClientDBAAnswer[]
  total_score: number
  client_score?: number
  freelancer_score?: number
  combined_score?: number
  risk_level: 'safe' | 'doubtful' | 'high_risk'
  max_possible_score: number
  has_freelancer_dba?: boolean
  error?: string
}

interface PreBookingDBAModalProps {
  isOpen: boolean
  onClose: () => void
  freelancerId: string
  jobCategoryId: string
  onComplete: (result: DBAResult) => void
}

export function PreBookingDBAModal({ 
  isOpen, 
  onClose, 
  freelancerId,
  jobCategoryId,
  onComplete
}: PreBookingDBAModalProps) {
  const [questions, setQuestions] = useState<GroupedQuestions>({})
  const [answers, setAnswers] = useState<{ [questionId: number]: ClientDBAAnswer }>({})
  const [currentCategory, setCurrentCategory] = useState<string>('')
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [step, setStep] = useState<'questions' | 'assessment'>('questions')
  const [dbaResult, setDbaResult] = useState<DBAResult | null>(null)
  const [showDisputeDetails, setShowDisputeDetails] = useState(false)
  const [freelancerAnswers, setFreelancerAnswers] = useState<any[]>([])
  const [disputeLoading, setDisputeLoading] = useState(false)
  const [messageText, setMessageText] = useState('')
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([])

  
  const supabase = createClientComponentClient()
  const router = useRouter()
  const { user } = useOptimizedUser()
  const { t } = useTranslation()

  const allCategories = [
    'independence',
    'work_relationship', 
    'financial_risk',
    'benefits',
    'work_environment',
    'professional_risk'
  ]

  // Only use categories that have questions
  const categories = allCategories.filter(cat => questions[cat] && questions[cat].length > 0)

  const categoryTitles = {
    independence: t('dbaModal.independence'),
    work_relationship: t('dbaModal.workRelationship'),
    financial_risk: t('dbaModal.financialRisk'),
    benefits: t('dbaModal.benefits'),
    work_environment: t('dbaModal.workEnvironment'),
    professional_risk: t('dbaModal.professionalRisk')
  }

  useEffect(() => {
    if (isOpen) {
      fetchQuestions()
    }
  }, [isOpen])

  // Set default message text when component mounts
  useEffect(() => {
    setMessageText(t('dbaModal.defaultMessage'))
  }, [t])

  const fetchQuestions = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('dba_questions')
        .select('*')
        .eq('respondent_type', 'client')
        .eq('is_visible', true)
        .order('display_order')

      if (error) throw error

      // Group questions by category
      const grouped: GroupedQuestions = {}
      data.forEach(question => {
        if (!grouped[question.category]) {
          grouped[question.category] = []
        }
        grouped[question.category].push(question)
      })

      setQuestions(grouped)
      setTotalQuestions(data.length)
      
      // Set first category with questions
      const categoriesWithQuestions = allCategories.filter(cat => grouped[cat] && grouped[cat].length > 0)
      if (categoriesWithQuestions.length > 0) {
        setCurrentCategory(categoriesWithQuestions[0])
        setCurrentQuestionIndex(0)
      }
    } catch (error) {
      toast.error(t('dbaModal.failedToLoadDBAQuestions'))
    } finally {
      setLoading(false)
    }
  }



  const handleAnswerSelect = (questionId: number, optionIndex: number, score: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        question_id: questionId,
        selected_option_index: optionIndex,
        answer_score: score
      }
    }))
  }

  const calculateRisk = (clientScore: number) => {
    // The actual combined calculation will be done server-side
    // This is just for UI preview - will be overwritten by server response
    if (clientScore < 30) return 'safe'
    if (clientScore <= 50) return 'doubtful'
    return 'high_risk'
  }

  const handleSubmit = async () => {
    try {
      setSubmitting(true)
      
      // Calculate client total score
      const clientScore = Object.values(answers).reduce((sum, answer) => sum + answer.answer_score, 0)
      const answersArray = Object.values(answers)
      
      // Get combined score by calling the server function
      const response = await fetch('/api/client-dba/calculate-combined', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          freelancer_id: freelancerId,
          job_category_id: jobCategoryId,
          client_answers: answersArray,
          client_total_score: clientScore
        }),
      })

      if (!response.ok) {
        throw new Error(t('dbaModal.failedToCalculateCombinedScore'))
      }

      const combinedResult = await response.json()

      const result: DBAResult = {
        answers: answersArray,
        total_score: combinedResult.combined_score, // Use combined score
        client_score: clientScore,
        freelancer_score: combinedResult.freelancer_score,
        combined_score: combinedResult.combined_score,
        risk_level: combinedResult.risk_level,
        has_freelancer_dba: combinedResult.has_freelancer_dba,
        max_possible_score: combinedResult.max_possible_score || 0
      }

      setDbaResult(result)
      setStep('assessment')
      
    } catch (error) {
      // Fallback to client-only calculation
      const clientScore = Object.values(answers).reduce((sum, answer) => sum + answer.answer_score, 0)
      const clientOnlyRiskLevel = calculateRisk(clientScore)
      
      const fallbackResult: DBAResult = {
        answers: Object.values(answers),
        total_score: clientScore,
        client_score: clientScore,
        freelancer_score: 0,
        combined_score: clientScore,
        risk_level: clientOnlyRiskLevel,
        has_freelancer_dba: false,
        max_possible_score: Object.values(questions).flat().length * 10,
        error: t('dbaModal.failedToGetFreelancerScore')
      }

      setDbaResult(fallbackResult)
      setStep('assessment')
      toast.error(t('dbaModal.warningCouldNotFetchFreelancerData'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleProceed = () => {
    if (dbaResult) {
      onComplete(dbaResult)
      onClose()
    }
  }

  const handleShowDispute = async () => {
    if (showDisputeDetails) {
      setShowDisputeDetails(false)
      setSelectedAnswers([]) // Reset selections when hiding
      return
    }

    setDisputeLoading(true)
    setShowDisputeDetails(true)
    setSelectedAnswers([]) // Reset selections when showing
    
    try {
      const url = `/api/client-dba/freelancer-answers?freelancer_id=${freelancerId}&job_category_id=${jobCategoryId}`
      
      const response = await fetch(url)
      
      if (response.ok) {
        const data = await response.json()
        setFreelancerAnswers(data.answers || [])
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        toast.error(`${t('dbaModal.failedToLoadFreelancerAnswers')}: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      toast.error(t('dbaModal.failedToLoadFreelancerAnswers'))
    } finally {
      setDisputeLoading(false)
    }
  }

  const handleStartConversation = async () => {
    if (!user) {
      toast.error(t('dbaModal.pleaseLogInToStartConversation'))
      return
    }

    try {
      // First, try to find existing conversation - use the correct table structure
      let conversationId: string | null = null
      
      // Find conversation where both user and freelancer are participants
      // First get all conversations where user is a participant
      const { data: userConversations, error: userError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('profile_id', user.id)

      if (userConversations && userConversations.length > 0) {
        // Then check which of these conversations also has the freelancer
        const userConversationIds = userConversations.map(c => c.conversation_id)
        
        const { data: freelancerConversations, error: freelancerError } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('profile_id', freelancerId)
          .in('conversation_id', userConversationIds)

        if (freelancerConversations && freelancerConversations.length > 0) {
          conversationId = freelancerConversations[0].conversation_id
        }
      }

      // If no existing conversation, create one
      if (!conversationId) {
        // First create the conversation
        const { data: newConversation, error: createError } = await supabase
          .from('conversations')
          .insert({})
          .select('id')
          .single()

        if (createError) {
          throw createError
        }
        
        conversationId = newConversation.id

        // Now add both participants to the conversation
        const { error: participant1Error } = await supabase
          .from('conversation_participants')
          .insert({
            conversation_id: conversationId,
            profile_id: user.id
          })

        if (participant1Error) {
          throw participant1Error
        }

        const { error: participant2Error } = await supabase
          .from('conversation_participants')
          .insert({
            conversation_id: conversationId,
            profile_id: freelancerId
          })

        if (participant2Error) {
          throw participant2Error
        }
      }

    // Prepare message with selected answers
    let fullMessage = messageText
    
    if (selectedAnswers.length > 0) {
      const selectedAnswersText = selectedAnswers
        .map(id => {
          const answer = freelancerAnswers.find(a => a.question_id === id)
          return `\n📋 Q${id}: ${answer?.question_text}\n\n   A: ${answer?.selected_answer} (${answer?.answer_score} pts)`
        })
        .join('')
      
      fullMessage = `${messageText}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n📝 SELECTED ANSWERS FOR DISCUSSION\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n${selectedAnswersText}`
    }

    // Send initial DBA-related message
    const { error: messageError } = await supabase
      .rpc('add_message', {
        p_conversation_id: conversationId,
        p_sender_id: user.id,
        p_content: fullMessage
      })

      if (messageError) {
        throw messageError
      }

      // Close modal and redirect to the specific conversation
      onClose()
      router.push(`/messages?conversation=${conversationId}`)

    } catch (error) {
      toast.error(t('dbaModal.failedToStartConversation'))
      
      // Fallback: just redirect to messages
      onClose()
      router.push('/messages')
    }
  }

  const getAnswerText = (questionId: number, selectedIndex: number) => {
    // Look up question in our categorized questions
    let question: DBAQuestion | null = null
    
    // Search through all categories for the question
    Object.values(questions).forEach((categoryQuestions: any) => {
      if (Array.isArray(categoryQuestions)) {
        const found = categoryQuestions.find((q: DBAQuestion) => q.id === questionId)
        if (found) question = found
      }
    })
    
    if (!question) return t('dbaModal.loadingText')
    
    const answerText = (question as DBAQuestion).options_json[selectedIndex] || t('dbaModal.unknownAnswer')
    const score = (question as DBAQuestion).score_mapping[selectedIndex.toString()] || 0
    
    return `${answerText} (${score} pts)`
  }

  const getCurrentCategoryQuestions = () => {
    return questions[currentCategory] || []
  }

  const getCurrentQuestion = () => {
    const categoryQuestions = getCurrentCategoryQuestions()
    return categoryQuestions[currentQuestionIndex] || null
  }

  const getTotalAnswered = () => {
    return Object.keys(answers).length
  }

  const getProgress = () => {
    return totalQuestions > 0 ? (getTotalAnswered() / totalQuestions) * 100 : 0
  }

  const canProceedToNext = () => {
    const currentQuestion = getCurrentQuestion()
    return currentQuestion && answers[currentQuestion.id]
  }

  const handleNext = () => {
    const categoryQuestions = getCurrentCategoryQuestions()
    if (currentQuestionIndex < categoryQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    } else {
      // Move to next category (all categories in the list have questions)
      const currentCategoryIndex = categories.indexOf(currentCategory)
      if (currentCategoryIndex < categories.length - 1) {
        setCurrentCategory(categories[currentCategoryIndex + 1])
        setCurrentQuestionIndex(0)
      }
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    } else {
      // Move to previous category (all categories in the list have questions)
      const currentCategoryIndex = categories.indexOf(currentCategory)
      if (currentCategoryIndex > 0) {
        const prevCategory = categories[currentCategoryIndex - 1]
        setCurrentCategory(prevCategory)
        setCurrentQuestionIndex(questions[prevCategory]?.length - 1 || 0)
      }
    }
  }

  const isFirstQuestion = () => {
    return categories.indexOf(currentCategory) === 0 && currentQuestionIndex === 0
  }

  const isLastQuestion = () => {
    const lastCategoryIndex = categories.length - 1
    const lastCategory = categories[lastCategoryIndex]
    const lastQuestionIndex = (questions[lastCategory]?.length || 1) - 1
    return currentCategory === lastCategory && currentQuestionIndex === lastQuestionIndex
  }

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('dbaModal.loading')}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (step === 'assessment' && dbaResult) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <CustomRescheduleIcon className="h-5 w-5" />
              {t('dbaModal.assessmentComplete')}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            <Card>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between border-t pt-2">
                  <span className="font-semibold">{t('dbaModal.dbaScore')}:</span>
                  <span className="font-bold text-lg">{dbaResult.combined_score || dbaResult.total_score}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{t('dbaModal.riskLevel')}:</span>
                  <Badge 
                    variant={dbaResult.risk_level === 'safe' ? 'default' : 'destructive'}
                    className="text-xs"
                  >
                    {dbaResult.risk_level === 'safe' ? t('dbaModal.lowRisk') : 
                     dbaResult.risk_level === 'doubtful' ? t('dbaModal.mediumRisk') : t('dbaModal.highRisk')}
                  </Badge>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  {dbaResult.has_freelancer_dba 
                    ? t('dbaModal.riskAssessmentIncludes')
                    : t('dbaModal.warningFreelancerNoDBA')}
                </div>
              </CardContent>
            </Card>

            {dbaResult.risk_level !== 'safe' && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {dbaResult.risk_level === 'doubtful' 
                    ? t('dbaModal.mediumRiskDetected')
                    : t('dbaModal.highRiskDetected')}
                </AlertDescription>
              </Alert>
            )}

            {/* Freelancer DBA Details Section */}
            {showDisputeDetails && (
              <div className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{t('dbaModal.freelancerDbaAssessment')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {disputeLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="text-sm text-gray-500 flex items-center">{t('dbaModal.loadingFreelancerAnswers')} <Loader className="h-4 w-4 ml-2 animate-spin" /></div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Freelancer Answers Display */}
                        {freelancerAnswers.length === 0 ? (
                          <div className="text-center py-8">
                            <div className="text-gray-500 mb-2">{t('dbaModal.noFreelancerAnswersFound')}</div>
                            <div className="text-sm text-gray-400">{t('dbaModal.freelancerNotCompletedDBA')}</div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-gray-600">
                                {t('dbaModal.selectAnswersToDiscuss')}
                              </p>
                              <div className="text-xs text-gray-500">
                                {selectedAnswers.length} {t('dbaModal.selected')}
                              </div>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              {freelancerAnswers.map((fAnswer: any) => (
                                <div key={fAnswer.question_id} className={`border rounded-lg p-4 transition-colors ${
                                  selectedAnswers.includes(fAnswer.question_id) 
                                    ? 'bg-blue-50 border-blue-200' 
                                    : 'bg-gray-50 border-gray-200'
                                }`}>
                                  <div className="flex items-start gap-3">
                                    <input
                                      type="checkbox"
                                      id={`answer-${fAnswer.question_id}`}
                                      checked={selectedAnswers.includes(fAnswer.question_id)}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedAnswers(prev => [...prev, fAnswer.question_id])
                                        } else {
                                          setSelectedAnswers(prev => prev.filter(id => id !== fAnswer.question_id))
                                        }
                                      }}
                                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                      aria-label={`${t('dbaModal.selectAnswerForQuestion')} ${fAnswer.question_id}`}
                                    />
                                    <div className="flex-1">
                                      <h5 className="font-medium mb-3 text-sm leading-tight">{fAnswer.question_text}</h5>
                                      
                                      <div className="bg-green-50 p-3 rounded border border-green-200">
                                        <p className="text-sm font-medium text-green-800 mb-1">{t('dbaModal.freelancersAnswer')}</p>
                                        <p className="text-sm">{fAnswer.selected_answer} ({fAnswer.answer_score} pts)</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Message Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{t('dbaModal.contactFreelancer')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600">
                        {t('dbaModal.contactFreelancerDescription')}
                      </p>
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder={t('dbaModal.typeMessagePlaceholder')}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                          />
                          <Button 
                            onClick={handleStartConversation} 
                            className="px-4" 
                            variant="outline"
                            disabled={!messageText.trim()}
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            {t('dbaModal.send')}
                          </Button>
                        </div>
                        <div className="text-xs text-gray-500 text-center">
                          {selectedAnswers.length > 0 
                            ? `${selectedAnswers.length} ${t('dbaModal.selectedAnswersMessage')}`
                            : t('dbaModal.typeMessageDefault')
                          }
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
          
          <div className="flex gap-2 pt-4 flex-shrink-0">
            {/* Main Action Buttons */}
            {dbaResult.risk_level === 'safe' ? (
              <Button onClick={handleProceed} className="flex-1">
                <CheckCircle className="h-4 w-4 mr-2" />
                {t('dbaModal.proceedWithBooking')}
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={onClose} className="flex-1">
                  {t('dbaModal.cancelBooking')}
                </Button>
                {dbaResult.risk_level === 'high_risk' && dbaResult.has_freelancer_dba && (
                  <Button 
                    variant="secondary" 
                    onClick={handleShowDispute}
                    className="flex-1"
                    disabled={disputeLoading}
                  >
                    <CustomMessagesIcon className="h-4 w-4 mr-2" />

                    {showDisputeDetails ? t('dbaModal.hideDetails') : disputeLoading ? t('dbaModal.loading') : t('dbaModal.disputeFreelancerDBA')}
                  </Button>
                )}
                
                {dbaResult.risk_level === 'high_risk' && !dbaResult.has_freelancer_dba && (
                  <Button 
                    variant="outline" 
                    disabled
                    className="flex-1"
                    title={t('dbaModal.warningFreelancerNoDBA')}
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    {t('dbaModal.noDbaDataAvailable')}
                  </Button>
                )}
                <Button onClick={handleProceed} className="flex-1">
                  {t('dbaModal.proceedAnyway')}
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const currentQuestion = getCurrentQuestion()

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <CustomRescheduleIcon className="h-5 w-5" />
            {t('dbaModal.dbaComplianceAssessment')}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{t('dbaModal.progress')}</span>
              <span>{getTotalAnswered()} of {totalQuestions}</span>
            </div>
            <Progress value={getProgress()} className="w-full" />
          </div>

          {/* Current Category */}
          {/* <div className="text-center">
            <Badge variant="outline" className="text-sm">
              {categoryTitles[currentCategory as keyof typeof categoryTitles]}
            </Badge>
          </div> */}

          {/* Question */}
          {currentQuestion && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{currentQuestion.question_text}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {currentQuestion.options_json.map((option, index) => {
                  const score = currentQuestion.score_mapping[index.toString()] || 0
                  const isSelected = answers[currentQuestion.id]?.selected_option_index === index
                  
                  return (
                    <div
                      key={index}
                      onClick={() => handleAnswerSelect(currentQuestion.id, index, score)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        isSelected 
                          ? 'border-primary bg-primary/5' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{option}</span>
                        <div className="flex items-center gap-2">
                          {/* <span className="text-xs text-gray-500">{score} pts</span> */}
                          {isSelected && <CheckCircle className="h-4 w-4 text-primary" />}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-4 flex-shrink-0">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={isFirstQuestion()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('dbaModal.previous')}
          </Button>

          {isLastQuestion() && getTotalAnswered() === totalQuestions ? (
            <Button
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? t('dbaModal.processing') : t('dbaModal.completeAssessment')}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!canProceedToNext()}
            >
              {t('dbaModal.next')}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
    
  </>
  )
}


