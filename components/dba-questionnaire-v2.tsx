'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { CheckCircle, AlertTriangle, Save, Loader, Users, User } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'
import { toast } from '@/hooks/use-toast'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/database.types'

type DBAQuestionGroup = {
  id: string
  base_question_en: string
  base_question_nl: string
  category: string
  weight: number
  audience: 'freelancer' | 'client' | 'both'
  options_json: string[]
  score_mapping: Record<string, number>
  order_index: number
}

interface DBAQuestionnaireV2Props {
  userType: 'freelancer' | 'client'
  bookingId?: string
  freelancerId: string
  clientId: string
  jobCategoryId?: string
  onComplete?: (answers: Record<string, string>) => void
  onSave?: (answers: Record<string, string>) => void
  showProgress?: boolean
  className?: string
}

const categoryLabels = {
  control: { en: "Control & Supervision", nl: "Controle & Begeleiding" },
  substitution: { en: "Substitution", nl: "Vervangbaarheid" },  
  tools: { en: "Tools & Equipment", nl: "Gereedschap & Apparatuur" },
  risk: { en: "Financial Risk", nl: "Financieel Risico" },
  economic_independence: { en: "Economic Independence", nl: "Economische Onafhankelijkheid" }
}

export default function DBAQuestionnaireV2({
  userType,
  bookingId,
  freelancerId,
  clientId,
  jobCategoryId,
  onComplete,
  onSave,
  showProgress = true,
  className = ""
}: DBAQuestionnaireV2Props) {
  const { t, locale } = useTranslation()
  const supabase = createClientComponentClient<Database>()
  
  const [questionGroups, setQuestionGroups] = useState<DBAQuestionGroup[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [currentCategory, setCurrentCategory] = useState<string>("")

  // Get questions relevant to this user type
  const relevantQuestions = questionGroups.filter(q => 
    q.audience === userType || q.audience === 'both'
  )

  // Group questions by category
  const questionsByCategory = relevantQuestions.reduce((acc, question) => {
    if (!acc[question.category]) {
      acc[question.category] = []
    }
    acc[question.category].push(question)
    return acc
  }, {} as Record<string, DBAQuestionGroup[]>)

  const categories = Object.keys(questionsByCategory)

  useEffect(() => {
    fetchQuestionGroups()
  }, [])

  useEffect(() => {
    if (categories.length > 0 && !currentCategory) {
      setCurrentCategory(categories[0])
    }
  }, [categories, currentCategory])

  const fetchQuestionGroups = async () => {
    try {
      console.log('🔍 [DBA V2 DEBUG] Fetching question groups...')
      
      const { data, error } = await supabase
        .from('dba_question_groups')
        .select('*')
        .order('order_index')

      console.log('🔍 [DBA V2 DEBUG] Question groups fetch result:', { data, error })
      
      if (error) {
        console.error('🚨 [DBA V2 DEBUG] Question groups error:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw error
      }
      
      console.log('🔍 [DBA V2 DEBUG] Loaded question groups count:', data?.length || 0)
      setQuestionGroups(data || [])

      // Load existing answers
      await loadExistingAnswers()
    } catch (error) {
      console.error('🚨 [DBA V2 DEBUG] Error fetching question groups:', error)
      toast({
        title: t('dba.error.loading.title'),
        description: t('dba.error.loading.description'),
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const loadExistingAnswers = async () => {
    try {
      if (userType === 'freelancer' && jobCategoryId) {
        const { data } = await supabase
          .from('dba_freelancer_answers')
          .select('question_group_id, answer_value')
          .eq('freelancer_id', freelancerId)
          .eq('job_category_id', jobCategoryId)

        if (data) {
          const answerMap: Record<string, string> = {}
          data.forEach(answer => {
            // Only include answers with valid question_group_id (not null or empty)
            if (answer.question_group_id && answer.question_group_id !== 'null' && answer.question_group_id.trim() !== '') {
              answerMap[answer.question_group_id] = answer.answer_value
            }
          })
          setAnswers(answerMap)
        }
      } else if (userType === 'client' && bookingId) {
        const { data } = await supabase
          .from('dba_booking_answers')
          .select('question_group_id, answer_value')
          .eq('booking_id', bookingId)

        if (data) {
          const answerMap: Record<string, string> = {}
          data.forEach(answer => {
            // Only include answers with valid question_group_id (not null or empty)
            if (answer.question_group_id && answer.question_group_id !== 'null' && answer.question_group_id.trim() !== '') {
              answerMap[answer.question_group_id] = answer.answer_value
            }
          })
          setAnswers(answerMap)
        }
      }
    } catch (error) {
      console.error('Error loading existing answers:', error)
    }
  }

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }))
  }

  const saveAnswers = async () => {
    setSaving(true)
    try {
      console.log('🔍 [DBA V2 DEBUG] Starting save process...')
      console.log('🔍 [DBA V2 DEBUG] User type:', userType)
      console.log('🔍 [DBA V2 DEBUG] Booking ID:', bookingId)
      console.log('🔍 [DBA V2 DEBUG] Job Category ID:', jobCategoryId)
      console.log('🔍 [DBA V2 DEBUG] Raw answers:', answers)
      
      // Check user session
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      console.log('🔍 [DBA V2 DEBUG] Current user:', user?.id)
      console.log('🔍 [DBA V2 DEBUG] User error:', userError)
      
      if (!user) {
        throw new Error('User not authenticated')
      }

      // Filter out any answers with invalid question_group_id values
      const validAnswers = Object.entries(answers).filter(([question_group_id, answer_value]) => {
        return question_group_id && 
               question_group_id !== 'null' && 
               question_group_id.trim() !== '' && 
               answer_value && 
               answer_value.trim() !== ''
      })

      const answersArray = validAnswers.map(([question_group_id, answer_value]) => ({
        question_group_id,
        answer_value
      }))

      console.log('🔍 [DBA V2 DEBUG] Valid answers count:', validAnswers.length)
      console.log('🔍 [DBA V2 DEBUG] Filtered answers array:', answersArray)

      console.log('🔍 [DBA V2 DEBUG] Processed answers array:', answersArray)

      if (userType === 'freelancer' && jobCategoryId) {
        // Save freelancer answers
        const freelancerAnswers = answersArray.map(answer => ({
          ...answer,
          freelancer_id: freelancerId,
          job_category_id: jobCategoryId
        }))

        console.log('🔍 [DBA V2 DEBUG] Freelancer answers to save:', freelancerAnswers)
        console.log('🔍 [DBA V2 DEBUG] Sample answer structure:', freelancerAnswers[0])
        console.log('🔍 [DBA V2 DEBUG] Current user ID:', user.id)
        console.log('🔍 [DBA V2 DEBUG] Freelancer ID:', freelancerId)
        console.log('🔍 [DBA V2 DEBUG] User ID matches freelancer ID:', user.id === freelancerId)

        try {
          const { data, error } = await supabase
            .from('dba_freelancer_answers')
            .upsert(freelancerAnswers, { 
              onConflict: 'freelancer_id,job_category_id,question_group_id'
            })
            .select()

          console.log('🔍 [DBA V2 DEBUG] Freelancer save result:', { data, error })
          console.log('🔍 [DBA V2 DEBUG] Raw error object:', error)
          console.log('🔍 [DBA V2 DEBUG] Error JSON stringify:', JSON.stringify(error, null, 2))
          
          if (error) {
            console.error('🚨 [DBA V2 DEBUG] Freelancer save error details:', {
              message: error?.message || 'No message',
              details: error?.details || 'No details',
              hint: error?.hint || 'No hint',
              code: error?.code || 'No code',
              fullError: error
            })
            throw new Error(`Supabase error: ${error.message || 'Unknown error'}`)
          }
        } catch (supabaseError) {
          console.error('🚨 [DBA V2 DEBUG] Caught Supabase error:', supabaseError)
          throw supabaseError
        }
      } else if (userType === 'client' && bookingId) {
        // Save client answers
        const clientAnswers = answersArray.map(answer => ({
          ...answer,
          booking_id: bookingId,
          client_id: clientId,
          freelancer_id: freelancerId
        }))

        console.log('🔍 [DBA V2 DEBUG] Client answers to save:', clientAnswers)

        const { data, error } = await supabase
          .from('dba_booking_answers')
          .upsert(clientAnswers, { 
            onConflict: 'booking_id,question_group_id'
          })
          .select()

        console.log('🔍 [DBA V2 DEBUG] Client save result:', { data, error })
        if (error) {
          console.error('🚨 [DBA V2 DEBUG] Client save error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          })
          throw error
        }
      } else {
        console.error('🚨 [DBA V2 DEBUG] Invalid save conditions:', {
          userType,
          hasBookingId: !!bookingId,
          hasJobCategoryId: !!jobCategoryId
        })
        throw new Error(`Invalid save conditions: userType=${userType}, bookingId=${!!bookingId}, jobCategoryId=${!!jobCategoryId}`)
      }

      toast({
        title: t('dba.save.success.title'),
        description: t('dba.save.success.description')
      })

      onSave?.(answers)

      // Auto-advance to next category
      const currentIndex = categories.indexOf(currentCategory)
      if (currentIndex < categories.length - 1) {
        setCurrentCategory(categories[currentIndex + 1])
      }
    } catch (error) {
      console.error('🚨 [DBA V2 DEBUG] Full error object:', error)
      console.error('🚨 [DBA V2 DEBUG] Error type:', typeof error)
      console.error('🚨 [DBA V2 DEBUG] Error constructor:', error?.constructor?.name)
      
      // Try to extract useful error information
      let errorMessage = 'Unknown error occurred'
      let errorDetails = 'No additional details available'
      
      if (error && typeof error === 'object') {
        console.error('🚨 [DBA V2 DEBUG] Error properties:', Object.keys(error))
        
        if ('message' in error) {
          errorMessage = error.message || errorMessage
          console.error('🚨 [DBA V2 DEBUG] Error message:', error.message)
        }
        
        if ('details' in error) {
          errorDetails = error.details || errorDetails
          console.error('🚨 [DBA V2 DEBUG] Error details:', error.details)
        }
        
        if ('hint' in error) {
          console.error('🚨 [DBA V2 DEBUG] Error hint:', error.hint)
        }
        
        if ('code' in error) {
          console.error('🚨 [DBA V2 DEBUG] Error code:', error.code)
        }
      }
      
      console.error('🚨 [DBA V2 DEBUG] Processed error info:', { errorMessage, errorDetails })
      
      toast({
        title: t('dba.save.error.title'),
        description: `${t('dba.save.error.description')} Details: ${errorMessage}`,
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const getQuestionText = (question: DBAQuestionGroup, userType: 'freelancer' | 'client') => {
    const baseText = locale === 'nl' ? question.base_question_nl : question.base_question_en
    
    // For "both" questions, we might need to adapt the phrasing
    if (question.audience === 'both') {
      // This is where we'd implement perspective-based phrasing
      // For now, we'll use the base question text
      return baseText
    }
    
    return baseText
  }

  const getCategoryLabel = (category: string) => {
    const labels = categoryLabels[category as keyof typeof categoryLabels]
    return locale === "nl" ? labels?.nl : labels?.en
  }

  const getProgress = () => {
    const totalQuestions = relevantQuestions.length
    const answeredQuestions = Object.keys(answers).length
    return totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0
  }

  const getAudienceIcon = (audience: string) => {
    switch (audience) {
      case 'both': return <Users className="h-4 w-4" />
      case 'freelancer': return <User className="h-4 w-4" />
      case 'client': return <User className="h-4 w-4" />
      default: return <User className="h-4 w-4" />
    }
  }

  const getAudienceColor = (audience: string) => {
    switch (audience) {
      case 'both': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'freelancer': return 'bg-blue-100 text-blue-800 border-blue-200'  
      case 'client': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <Loader className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const totalQuestions = relevantQuestions.length
  const answeredQuestions = Object.keys(answers).length
  const progress = getProgress()

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-black text-lg">
            <CheckCircle className="h-5 w-5 text-primary" />
            {userType === 'freelancer' ? t("dba.freelancer.title") : t("dba.client.title")}
            <Badge variant="secondary" className="ml-2">
              Dutch Compliant v2
            </Badge>
          </CardTitle>
          <CardDescription className="text-xs text-black">
            {userType === 'freelancer' 
              ? t("dba.freelancer.description", { category: "Current Job Category" })
              : t("dba.client.description")
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showProgress && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-black">
                <span>{answeredQuestions} of {totalQuestions} questions completed</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Methodology Info */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="text-xs">
          <strong>New Dutch Compliant Methodology:</strong> Some questions will be answered by both you and the other party. 
          Conflicting answers will be flagged for review and may affect the final compliance assessment.
        </AlertDescription>
      </Alert>

      {/* Category Navigation */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <Button
            key={category}
            variant={currentCategory === category ? "default" : "outline"}
            size="sm"
            onClick={() => setCurrentCategory(category)}
            className="flex items-center gap-2 rounded-full"
          >
            <span>{getCategoryLabel(category)}</span>
          </Button>
        ))}
      </div>

      {/* Questions for Current Category */}
      {currentCategory && questionsByCategory[currentCategory] && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-black text-lg">
              {getCategoryLabel(currentCategory)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {questionsByCategory[currentCategory].map((question) => (
              <div key={question.id} className="space-y-3">
                <div className="flex items-start gap-3">
                  <Badge 
                    variant="outline" 
                    className={`mt-1 flex items-center gap-1 ${getAudienceColor(question.audience)}`}
                  >
                    {getAudienceIcon(question.audience)}
                    {question.audience === 'both' ? 'Both Parties' : 
                     question.audience === 'freelancer' ? 'Freelancer' : 'Client'}
                  </Badge>
                  <div className="flex-1">
                    <Label className="text-sm text-black font-medium">
                      {getQuestionText(question, userType)}
                    </Label>
                    {question.audience === 'both' && (
                      <p className="text-xs text-orange-600 mt-1">
                        ⚠️ This question will also be answered by the other party. 
                        Conflicting answers will be flagged.
                      </p>
                    )}
                  </div>
                </div>
                
                <RadioGroup
                  value={answers[question.id] ?? ""}
                  onValueChange={(value) => handleAnswerChange(question.id, value)}
                  className="ml-12"
                >
                  {question.options_json.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <RadioGroupItem value={index.toString()} id={`${question.id}-${index}`} />
                      <Label htmlFor={`${question.id}-${index}`} className="cursor-pointer text-xs text-black">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Navigation and Actions */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          {categories.map((category, index) => (
            <Button
              key={category}
              variant={currentCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentCategory(category)}
              className={`flex bg-white text-black items-center gap-2 hover:bg-white ${
                currentCategory === category ? "ring-none border border-brand-green rounded-lg" : ""
              }`}
            >
              <span className="font-medium">{index + 1}</span>
            </Button>
          ))}
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={saveAnswers}
            disabled={saving}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? t("dba.save.saving") : t("dba.save.button")}
          </Button>
          
          {progress === 100 && (
            <Button
              onClick={async () => {
                await saveAnswers()
                onComplete?.(answers)
              }}
              className="flex items-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              {t("dba.complete.button")}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
