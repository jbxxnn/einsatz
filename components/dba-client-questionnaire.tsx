'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from '@/lib/i18n'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { CheckCircle, Circle, Save, FileText, AlertCircle } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/database.types'


const CustomNoBookingsIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg 
  className={props.className}
  xmlns="http://www.w3.org/2000/svg" 
  width="50" 
  height="50" 
  viewBox="0 0 24 24" 
  fill="none">
    <path opacity=".4" d="M21.08 8.58v6.84c0 1.12-.6 2.16-1.57 2.73l-5.94 3.43c-.97.56-2.17.56-3.15 0l-5.94-3.43a3.15 3.15 0 0 1-1.57-2.73V8.58c0-1.12.6-2.16 1.57-2.73l5.94-3.43c.97-.56 2.17-.56 3.15 0l5.94 3.43c.97.57 1.57 1.6 1.57 2.73Z" 
    fill="currentColor">
      </path>
      <path d="M12 13.75c-.41 0-.75-.34-.75-.75V7.75c0-.41.34-.75.75-.75s.75.34.75.75V13c0 .41-.34.75-.75.75ZM12 17.249c-.13 0-.26-.03-.38-.08-.13-.05-.23-.12-.33-.21-.09-.1-.16-.21-.22-.33a.986.986 0 0 1-.07-.38c0-.26.1-.52.29-.71.1-.09.2-.16.33-.21.37-.16.81-.07 1.09.21.09.1.16.2.21.33.05.12.08.25.08.38s-.03.26-.08.38-.12.23-.21.33a.99.99 0 0 1-.71.29Z" 
      fill="currentColor">
        </path>
        </svg>
)

type DBAQuestion = Database['public']['Tables']['dba_questions']['Row']
type DBAAnswer = {
  question_id: string
  answer_value: string
}

interface DBAClientQuestionnaireProps {
  bookingId: string
  clientId: string
  freelancerId: string
  onComplete?: (answers: DBAAnswer[]) => void
  onSave?: (answers: DBAAnswer[]) => void
  initialAnswers?: DBAAnswer[]
  readOnly?: boolean
}

const categories = [
  { key: 'control', label: 'Control', description: 'Questions about work supervision and control' },
  { key: 'substitution', label: 'Substitution', description: 'Questions about worker substitution rights' },
  { key: 'tools', label: 'Tools & Equipment', description: 'Questions about tools and equipment provision' },
  { key: 'risk', label: 'Financial Risk', description: 'Questions about financial risk bearing' },
  { key: 'economic_independence', label: 'Economic Independence', description: 'Questions about business independence' }
]

export default function DBAClientQuestionnaire({
  bookingId,
  clientId,
  freelancerId,
  onComplete,
  onSave,
  initialAnswers = [],
  readOnly = false
}: DBAClientQuestionnaireProps) {
  const { t } = useTranslation()
  const supabase = createClientComponentClient<Database>()
  
  const [questions, setQuestions] = useState<DBAQuestion[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [currentCategory, setCurrentCategory] = useState('control')
  const [completedCategories, setCompletedCategories] = useState<Set<string>>(new Set())

  // Load questions
  useEffect(() => {
    loadQuestions()
  }, [])

  // Initialize answers from props
  useEffect(() => {
    if (initialAnswers.length > 0) {
      const answersMap: Record<string, string> = {}
      initialAnswers.forEach(answer => {
        answersMap[answer.question_id] = answer.answer_value
      })
      setAnswers(answersMap)
    }
  }, [initialAnswers])

  const loadQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('dba_questions')
        .select('*')
        .eq('is_freelancer_question', false)
        .order('order_index')

      if (error) throw error
      setQuestions(data || [])
    } catch (error) {
      console.error('Error loading DBA questions:', error)
      toast({
        title: t('dba.error.loading.title'),
        description: t('dba.error.loading.description'),
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerChange = useCallback((questionId: string, value: string) => {
    if (readOnly) return
    
    setAnswers(prev => {
      const newAnswers = { ...prev, [questionId]: value }
      
      // Check if current category is completed
      const categoryQuestions = questions.filter(q => q.category === currentCategory)
      const categoryAnswers = categoryQuestions.filter(q => newAnswers[q.id])
      
      if (categoryAnswers.length === categoryQuestions.length) {
        setCompletedCategories(prev => new Set([...prev, currentCategory]))
      } else {
        setCompletedCategories(prev => {
          const newSet = new Set(prev)
          newSet.delete(currentCategory)
          return newSet
        })
      }
      
      return newAnswers
    })
  }, [readOnly, currentCategory, questions])

  const saveAnswers = async () => {
    if (readOnly) return
    
    setSaving(true)
    try {
      const answersArray = Object.entries(answers).map(([question_id, answer_value]) => ({
        question_id,
        answer_value
      }))

      // Delete existing answers for this booking
      await supabase
        .from('dba_booking_answers')
        .delete()
        .eq('booking_id', bookingId)

      // Insert new answers
      if (answersArray.length > 0) {
        const { error } = await supabase
          .from('dba_booking_answers')
          .insert(answersArray.map(answer => ({
            ...answer,
            booking_id: bookingId,
            client_id: clientId,
            freelancer_id: freelancerId
          })))

        if (error) throw error
      }

      toast({
        title: t('dba.save.success.title'),
        description: t('dba.save.success.description')
      })

      onSave?.(answersArray)

      // Auto-advance to next incomplete category
      const nextCategory = getNextIncompleteCategory()
      if (nextCategory) {
        setCurrentCategory(nextCategory)
        toast({
          title: t('dba.save.advance.title'),
          description: t('dba.save.advance.description', { category: categories.find(c => c.key === nextCategory)?.label })
        })
      }
    } catch (error) {
      console.error('Error saving answers:', error)
      toast({
        title: t('dba.save.error.title'),
        description: t('dba.save.error.description'),
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleComplete = async () => {
    if (readOnly) return
    
    await saveAnswers()
    const answersArray = Object.entries(answers).map(([question_id, answer_value]) => ({
      question_id,
      answer_value
    }))
    onComplete?.(answersArray)
  }

  const getCategoryQuestions = (category: string) => {
    return questions.filter(q => q.category === category)
  }

  const getProgress = () => {
    const totalQuestions = questions.length
    const answeredQuestions = Object.keys(answers).length
    return totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0
  }

  const isCategoryCompleted = (category: string) => {
    const categoryQuestions = getCategoryQuestions(category)
    return categoryQuestions.every(q => answers[q.id])
  }

  const getNextIncompleteCategory = () => {
    const currentIndex = categories.findIndex(c => c.key === currentCategory)
    
    // Look for the next incomplete category after the current one
    for (let i = currentIndex + 1; i < categories.length; i++) {
      const category = categories[i]
      if (!isCategoryCompleted(category.key)) {
        return category.key
      }
    }
    
    // If no incomplete category found after current, look from the beginning
    for (let i = 0; i < categories.length; i++) {
      const category = categories[i]
      if (!isCategoryCompleted(category.key)) {
        return category.key
      }
    }
    
    // All categories are completed
    return null
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CustomNoBookingsIcon className="h-5 w-5 text-primary" />
            <CardTitle className="text-sm text-black">{t('dba.client.title')}</CardTitle>
          </div>
          <CardDescription className="text-xs text-black">
            {t('dba.client.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">{t('dba.progress.label')}</span>
              <span className="text-xs text-black">
                {Object.keys(answers).length} / {questions.length} {t('dba.progress.questions')}
              </span>
            </div>
            <Progress value={getProgress()} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Category Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category.key}
                variant={currentCategory === category.key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentCategory(category.key)}
                className="flex items-center gap-2 text-xs text-black "
                disabled={readOnly}
              >
                {isCategoryCompleted(category.key) ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <Circle className="h-4 w-4" />
                )}
                {category.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current Category Questions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-black">
            {categories.find(c => c.key === currentCategory)?.label}
            {isCategoryCompleted(currentCategory) && (
              <Badge variant="secondary" className="text-sm">
                {t('dba.category.completed')}
              </Badge>
            )}
          </CardTitle>
          <CardDescription className="text-xs text-black">
            {categories.find(c => c.key === currentCategory)?.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-xs text-black"> 
          {getCategoryQuestions(currentCategory).map((question, index) => (
            <div key={question.id} className="space-y-3">
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="mt-1 text-xs text-black">
                  {index + 1}
                </Badge>
                <div className="flex-1 space-y-2">
                  <p className="font-medium text-sm text-black">
                    {question.question_text_en}
                  </p>
                  <p className="text-sm text-black">
                    {question.question_text_nl}
                  </p>
                </div>
              </div>
              
              <div className="ml-8 space-y-2">
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-black">
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      value="true"
                      checked={answers[question.id] === 'true'}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      disabled={readOnly}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      answers[question.id] === 'true' 
                        ? 'border-primary bg-primary' 
                        : 'border-gray-300'
                    }`}>
                      {answers[question.id] === 'true' && (
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      )}
                    </div>
                    <span className="text-xs font-medium">{t('dba.answer.yes')}</span>
                  </label>
                  
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-black">
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      value="false"
                      checked={answers[question.id] === 'false'}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      disabled={readOnly}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      answers[question.id] === 'false' 
                        ? 'border-primary bg-primary' 
                        : 'border-gray-300'
                    }`}>
                      {answers[question.id] === 'false' && (
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      )}
                    </div>
                    <span className="text-xs font-medium">{t('dba.answer.no')}</span>
                  </label>
                </div>
              </div>
              
              {index < getCategoryQuestions(currentCategory).length - 1 && (
                <Separator className="my-4" />
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {!readOnly && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-3">
              <Button
                onClick={saveAnswers}
                disabled={saving || Object.keys(answers).length === 0}
                variant="outline"
                className="flex items-center gap-2 text-xs text-black"
              >
                <Save className="h-4 w-4" />
                {saving ? t('dba.save.saving') : (
                  getNextIncompleteCategory() ? 
                    `${t('dba.save.button')} & Continue` : 
                    t('dba.save.button')
                )}
              </Button>
              
              <Button
                onClick={handleComplete}
                disabled={saving || Object.keys(answers).length < questions.length}
                className="flex items-center gap-2 text-xs text-black"
              >
                <CheckCircle className="h-4 w-4" />
                {t('dba.complete.button')}
              </Button>
            </div>
            
            {Object.keys(answers).length < questions.length && (
                <div className="mt-3 flex items-center gap-2 text-xs text-black">
                <AlertCircle className="h-4 w-4" />
                {t('dba.complete.warning')}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
} 