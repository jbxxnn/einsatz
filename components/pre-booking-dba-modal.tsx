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
  const [messageText, setMessageText] = useState('Hi! I have some questions about your DBA assessment for this job category. Can we discuss the answers?')

  
  const supabase = createClientComponentClient()
  const router = useRouter()
  const { user } = useOptimizedUser()

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
    independence: 'Independence & Autonomy',
    work_relationship: 'Work Relationship',
    financial_risk: 'Financial Risk',
    benefits: 'Benefits & Employment',
    work_environment: 'Work Environment',
    professional_risk: 'Professional Risk'
  }

  useEffect(() => {
    if (isOpen) {
      fetchQuestions()
    }
  }, [isOpen])

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
      console.error('Error fetching questions:', error)
      toast.error('Failed to load DBA questions')
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
      console.log('🎯 [DBA MODAL] Starting DBA completion...')
      
      // Calculate client total score
      const clientScore = Object.values(answers).reduce((sum, answer) => sum + answer.answer_score, 0)
      const answersArray = Object.values(answers)
      
      console.log('🎯 [DBA MODAL] Client score:', clientScore)
      console.log('🎯 [DBA MODAL] Fetching freelancer score and calculating combined result...')
      
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
        throw new Error('Failed to calculate combined DBA score')
      }

      const combinedResult = await response.json()
      console.log('🎯 [DBA MODAL] Combined result from server:', combinedResult)

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

      console.log('🎯 [DBA MODAL] Final DBA result:', result)
      setDbaResult(result)
      setStep('assessment')
      
    } catch (error) {
      console.error('🎯 [DBA MODAL] Error calculating combined score:', error)
      
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
        error: 'Failed to get freelancer score'
      }

      console.log('🎯 [DBA MODAL] Using fallback result:', fallbackResult)
      setDbaResult(fallbackResult)
      setStep('assessment')
      toast.error('Warning: Could not fetch freelancer DBA data. Showing client-only assessment.')
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
      return
    }

    setDisputeLoading(true)
    setShowDisputeDetails(true)
    
    try {
      const url = `/api/client-dba/freelancer-answers?freelancer_id=${freelancerId}&job_category_id=${jobCategoryId}`
      
      const response = await fetch(url)
      
      if (response.ok) {
        const data = await response.json()
        setFreelancerAnswers(data.answers || [])
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Failed to load freelancer answers:', response.status, errorData)
        toast.error(`Failed to load freelancer answers: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Network error loading freelancer answers:', error)
      toast.error('Failed to load freelancer answers - network error')
    } finally {
      setDisputeLoading(false)
    }
  }

  const handleStartConversation = async () => {
    if (!user) {
      toast.error('Please log in to start a conversation')
      return
    }

    try {
      console.log('🔍 [CONVERSATION] Starting conversation with freelancer:', freelancerId)
      console.log('🔍 [CONVERSATION] Current user:', user.id)

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

      console.log('🔍 [CONVERSATION] Find conversation result:', { conversationId, userConversations })

      // If no existing conversation, create one
      if (!conversationId) {
        console.log('🔍 [CONVERSATION] Creating new conversation...')
        
        // First create the conversation
        const { data: newConversation, error: createError } = await supabase
          .from('conversations')
          .insert({})
          .select('id')
          .single()

        console.log('🔍 [CONVERSATION] Create conversation result:', { newConversation, createError })

        if (createError) {
          console.error('🔍 [CONVERSATION] Create error details:', createError)
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
          console.error('🔍 [CONVERSATION] Add participant 1 error:', participant1Error)
          throw participant1Error
        }

        const { error: participant2Error } = await supabase
          .from('conversation_participants')
          .insert({
            conversation_id: conversationId,
            profile_id: freelancerId
          })

        if (participant2Error) {
          console.error('🔍 [CONVERSATION] Add participant 2 error:', participant2Error)
          throw participant2Error
        }

        console.log('🔍 [CONVERSATION] Both participants added successfully')
      }

      console.log('🔍 [CONVERSATION] Using conversation ID:', conversationId)

      // Send initial DBA-related message
      const { error: messageError } = await supabase
        .rpc('add_message', {
          p_conversation_id: conversationId,
          p_sender_id: user.id,
          p_content: messageText
        })

      console.log('🔍 [CONVERSATION] Add message result:', { messageError })

      if (messageError) {
        console.error('🔍 [CONVERSATION] Message error details:', messageError)
        throw messageError
      }

      // Close modal and redirect to the specific conversation
      console.log('🔍 [CONVERSATION] Success! Redirecting to:', `/messages?conversation=${conversationId}`)
      onClose()
      router.push(`/messages?conversation=${conversationId}`)

    } catch (error) {
      console.error('🔍 [CONVERSATION] Error starting conversation:', error)
      console.error('🔍 [CONVERSATION] Error type:', typeof error)
      console.error('🔍 [CONVERSATION] Error keys:', Object.keys(error || {}))
      
      // Type-safe error logging
      if (error && typeof error === 'object') {
        console.error('🔍 [CONVERSATION] Error message:', (error as any).message)
        console.error('🔍 [CONVERSATION] Error details:', (error as any).details)
      }
      
      toast.error('Failed to start conversation. Please try going to Messages manually.')
      
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
    
    if (!question) return 'Loading...'
    
    const answerText = (question as DBAQuestion).options_json[selectedIndex] || 'Unknown answer'
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
            <DialogTitle>Loading DBA Assessment</DialogTitle>
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
              DBA Assessment Complete
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            <Card>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between border-t pt-2">
                  <span className="font-semibold">DBA Score:</span>
                  <span className="font-bold text-lg">{dbaResult.combined_score || dbaResult.total_score}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Risk Level:</span>
                  <Badge 
                    variant={dbaResult.risk_level === 'safe' ? 'default' : 'destructive'}
                    className="text-xs"
                  >
                    {dbaResult.risk_level === 'safe' ? 'Low Risk' : 
                     dbaResult.risk_level === 'doubtful' ? 'Medium Risk' : 'High Risk'}
                  </Badge>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  {dbaResult.has_freelancer_dba 
                    ? 'Risk assessment includes freelancer\'s DBA completion data' 
                    : 'Warning: Freelancer has not completed DBA for this job category'}
                </div>
              </CardContent>
            </Card>

            {dbaResult.risk_level !== 'safe' && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {dbaResult.risk_level === 'doubtful' 
                    ? 'Medium risk detected. Please review the working relationship carefully.'
                    : 'High risk detected. This working relationship may not comply with DBA regulations.'}
                </AlertDescription>
              </Alert>
            )}

            {/* Freelancer DBA Details Section */}
            {showDisputeDetails && (
              <div className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Freelancer DBA Assessment</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {disputeLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="text-sm text-gray-500 flex items-center">Loading freelancer answers <Loader className="h-4 w-4 ml-2 animate-spin" /></div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Dispute Summary */}
                        {/* <div className="bg-gray-50 p-4 rounded-lg"> */}
                          {/* <h6 className="font-medium mb-2">Freelancer DBA Assessment</h6> */}
                          {/* <div className="text-center">
                            <div className="text-lg font-bold text-blue-600">
                              {freelancerAnswers.length}
                            </div>
                            <div className="text-gray-600">Questions Answered by Freelancer</div>
                          </div> */}
                        {/* </div> */}
                        
                        {/* Search/Filter */}
                        {/* {freelancerAnswers.length > 10 && (
                          <div className="space-y-3">
                            <input
                              type="text"
                              placeholder="Search questions..."
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                              onChange={(e) => {
                                const searchTerm = e.target.value.toLowerCase()
                                const filtered = freelancerAnswers.filter(answer => 
                                  answer.question_text.toLowerCase().includes(searchTerm) ||
                                  answer.selected_answer.toLowerCase().includes(searchTerm)
                                )
                                // For now, just filter in place - could add state for this
                                console.log('Filtered answers:', filtered.length)
                              }}
                            />
                            
                            Category Filter
                            <div className="flex flex-wrap gap-2">
                              <span className="text-xs text-gray-600 self-center">Filter by category:</span>
                              {Array.from(new Set(freelancerAnswers.map(a => a.category))).map(category => (
                                <Badge 
                                  key={category} 
                                  variant="outline" 
                                  className="text-xs cursor-pointer hover:bg-gray-100"
                                  onClick={() => {
                                    // For now, just log - could add state for filtering
                                    console.log('Filter by category:', category)
                                  }}
                                >
                                  {category}
                                </Badge>
                              ))}
                            </div>
                            
                            <div className="text-xs text-gray-500 text-center">
                              Type to search through questions and answers, or click categories to filter
                            </div>
                          </div>
                        )} */}
                        
                        {/* Freelancer Answers Display */}
                        {freelancerAnswers.length === 0 ? (
                          <div className="text-center py-8">
                            <div className="text-gray-500 mb-2">No freelancer answers found</div>
                            <div className="text-sm text-gray-400">The freelancer may not have completed their DBA assessment yet.</div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {freelancerAnswers.map((fAnswer: any) => (
                              <div key={fAnswer.question_id} className="border rounded-lg p-4 bg-gray-50">
                                <h5 className="font-medium mb-3 text-sm leading-tight">{fAnswer.question_text}</h5>
                                
                                <div className="bg-green-50 p-3 rounded border border-green-200">
                                  <p className="text-sm font-medium text-green-800 mb-1">Freelancer's Answer:</p>
                                  <p className="text-sm">{fAnswer.selected_answer} ({fAnswer.answer_score} pts)</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Message Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Contact Freelancer</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600">
                        If you have questions about the freelancer's DBA assessment or need to discuss any details, you can message them through our messaging system.
                      </p>
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Type your message here..."
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
                            Send
                          </Button>
                        </div>
                        <div className="text-xs text-gray-500 text-center">
                          Type your message above, then click Send to start a conversation with the freelancer
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
                Proceed with Booking
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={onClose} className="flex-1">
                  Cancel Booking
                </Button>
                {dbaResult.risk_level === 'high_risk' && dbaResult.has_freelancer_dba && (
                  <Button 
                    variant="secondary" 
                    onClick={handleShowDispute}
                    className="flex-1"
                    disabled={disputeLoading}
                  >
                    <CustomMessagesIcon className="h-4 w-4 mr-2" />

                    {showDisputeDetails ? 'Hide Details' : disputeLoading ? 'Loading...' : 'Dispute Freelancer DBA'}
                  </Button>
                )}
                
                {dbaResult.risk_level === 'high_risk' && !dbaResult.has_freelancer_dba && (
                  <Button 
                    variant="outline" 
                    disabled
                    className="flex-1"
                    title="Freelancer has not completed DBA assessment for this job category"
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    No DBA Data Available
                  </Button>
                )}
                <Button onClick={handleProceed} className="flex-1">
                  Proceed Anyway
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
            DBA Compliance Assessment
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{getTotalAnswered()} of {totalQuestions}</span>
            </div>
            <Progress value={getProgress()} className="w-full" />
          </div>

          {/* Current Category */}
          <div className="text-center">
            <Badge variant="outline" className="text-sm">
              {categoryTitles[currentCategory as keyof typeof categoryTitles]}
            </Badge>
          </div>

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
                          <span className="text-xs text-gray-500">{score} pts</span>
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
            Previous
          </Button>

          {isLastQuestion() && getTotalAnswered() === totalQuestions ? (
            <Button
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? 'Processing...' : 'Complete Assessment'}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!canProceedToNext()}
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
    
  </>
  )
}


