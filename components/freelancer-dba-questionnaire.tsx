'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, AlertCircle, Save, Loader, ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'
import { toast } from '@/hooks/use-toast'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/database.types'

type DBAQuestion = {
  id: number
  question_text: string
  respondent_type: string
  options_json: string[]
  score_mapping: Record<string, number>
  category: string
  display_order: number
}

type DBAAnswer = {
  questionId: number
  selectedOptionIndex: number
}

interface FreelancerDBAQuestionnaireProps {
  jobCategoryId: string
  jobCategoryName: string
  freelancerId: string
  onComplete?: () => void
  onSave?: () => void
  className?: string
}

const categoryLabels = {
  work_relationship: "dbaQuestionnaire.workRelationship",
  financial_risk: "dbaQuestionnaire.financialRisk",
  work_environment: "dbaQuestionnaire.workEnvironment",
  professional_risk: "dbaQuestionnaire.professionalRisk"
}

const categoryDescriptions = {
  work_relationship: "dbaQuestionnaire.workRelationshipDescription",
  financial_risk: "dbaQuestionnaire.financialRiskDescription",
  work_environment: "dbaQuestionnaire.workEnvironmentDescription",
  professional_risk: "dbaQuestionnaire.professionalRiskDescription"
}

export default function FreelancerDBAQuestionnaire({
  jobCategoryId,
  jobCategoryName,
  freelancerId,
  onComplete,
  onSave,
  className = ""
}: FreelancerDBAQuestionnaireProps) {
  const { t, locale } = useTranslation()
  const supabase = createClientComponentClient<Database>()
  
  const [questions, setQuestions] = useState<Record<string, DBAQuestion[]>>({})
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [currentCategory, setCurrentCategory] = useState<string>("")
  const [completion, setCompletion] = useState<any>(null)

  const categories = Object.keys(questions)
  const totalQuestions = Object.values(questions).flat().length
  const answeredQuestions = Object.keys(answers).length
  const progress = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0

  // Ensure we only count answers for questions that actually exist in the current category
  const validAnsweredQuestions = Object.keys(answers).filter(answerId => {
    const questionId = parseInt(answerId)
    return Object.values(questions).flat().some(q => q.id === questionId)
  }).length
  
  const validProgress = totalQuestions > 0 ? (validAnsweredQuestions / totalQuestions) * 100 : 0

  useEffect(() => {
    // Reset answers when job category changes
    setAnswers({})
    fetchData()
  }, [jobCategoryId])

  useEffect(() => {
    if (categories.length > 0 && !currentCategory) {
      setCurrentCategory(categories[0])
    }
  }, [categories, currentCategory])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch questions and existing answers
      const questionsResponse = await fetch(
        `/api/freelancer-dba/questions?jobCategoryId=${jobCategoryId}`
      )
      const questionsData = await questionsResponse.json()

      if (questionsData.error) {
        throw new Error(questionsData.error)
      }

      setQuestions(questionsData.questions)

      // Pre-populate existing answers
      if (questionsData.existingAnswers) {
        const answerMap: Record<number, number> = {}
        questionsData.existingAnswers.forEach((answer: any) => {
          answerMap[answer.question_id] = answer.selected_option_index
        })
        setAnswers(answerMap)
      }

      // Get completion status
      const statusResponse = await fetch(
        `/api/freelancer-dba/answers?jobCategoryId=${jobCategoryId}`
      )
      const statusData = await statusResponse.json()
      
      if (!statusData.error) {
        setCompletion(statusData.completion)
      }

    } catch (error) {
      console.error('Error fetching DBA data:', error)
      toast({
        title: t("dbaQuestionnaire.errorTitle"),
        description: t("dbaQuestionnaire.failedToLoadQuestionnaire"),
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerChange = (questionId: number, optionIndex: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }))
  }

  const saveAnswers = async () => {
    try {
      setSaving(true)

      const answersArray: DBAAnswer[] = Object.entries(answers).map(([questionId, optionIndex]) => ({
        questionId: parseInt(questionId),
        selectedOptionIndex: optionIndex
      }))

      const response = await fetch('/api/freelancer-dba/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobCategoryId,
          answers: answersArray
        })
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      toast({
        title: t("dbaQuestionnaire.successTitle"),
        description: t("dbaQuestionnaire.answersSavedSuccessfully")
      })

      // Refresh completion status
      await fetchData()
      onSave?.()

    } catch (error) {
      console.error('Error saving answers:', error)
      toast({
        title: t("dbaQuestionnaire.errorTitle"), 
        description: t("dbaQuestionnaire.failedToSaveAnswers"),
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const completeQuestionnaire = async () => {
    await saveAnswers()
    
    if (validProgress === 100) {
      toast({
        title: t("dbaQuestionnaire.dbaCompleteTitle"),
        description: t("dbaQuestionnaire.assessmentCompleteMessage", { jobCategoryName })
      })
      onComplete?.()
    }
  }

  const getCategoryLabel = (category: string) => {
    const labelKey = categoryLabels[category as keyof typeof categoryLabels]
    return labelKey ? t(labelKey) : category
  }

  const getCategoryDescription = (category: string) => {
    const descriptionKey = categoryDescriptions[category as keyof typeof categoryDescriptions]
    return descriptionKey ? t(descriptionKey) : ""
  }

  const navigateCategory = (direction: 'prev' | 'next') => {
    const currentIndex = categories.indexOf(currentCategory)
    if (direction === 'prev' && currentIndex > 0) {
      setCurrentCategory(categories[currentIndex - 1])
    } else if (direction === 'next' && currentIndex < categories.length - 1) {
      setCurrentCategory(categories[currentIndex + 1])
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

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CheckCircle className="h-5 w-5 text-primary" />
            {t("dbaQuestionnaire.title")} - {jobCategoryName}
          </CardTitle>
          <CardDescription>
            {t("dbaQuestionnaire.subtitle")}
            {t("dbaQuestionnaire.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{validAnsweredQuestions} of {totalQuestions} {t("dbaQuestionnaire.questionsCompleted")}</span>
              <span>{Math.round(validProgress)}%</span>
            </div>
            <Progress value={validProgress} className="h-2" />
            
            {/* {completion?.is_completed && (
              <div className="flex items-center gap-2 mt-4">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600 font-medium">
                  Assessment Complete - Risk Level: {completion.risk_level}
                </span>
                <Badge variant={
                  completion.risk_level === 'safe' ? 'default' : 
                  completion.risk_level === 'doubtful' ? 'secondary' : 'destructive'
                }>
                  {completion.risk_percentage?.toFixed(1)}%
                </Badge>
              </div>
            )} */}
          </div>
        </CardContent>
      </Card>

      {/* Category Navigation */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => {
          const categoryQuestions = questions[category] || []
          const answeredInCategory = categoryQuestions.filter(q => answers[q.id] !== undefined).length
          const isComplete = answeredInCategory === categoryQuestions.length

          return (
            <Button
              key={category}
              variant={currentCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentCategory(category)}
              className="flex items-center gap-2"
            >
              <span>{getCategoryLabel(category)}</span>
              {isComplete && <CheckCircle className="h-3 w-3" />}
              <Badge variant="secondary" className="ml-1">
                {answeredInCategory}/{categoryQuestions.length}
              </Badge>
            </Button>
          )
        })}
      </div>

      {/* Current Category Questions */}
      {currentCategory && questions[currentCategory] && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {getCategoryLabel(currentCategory)}
            </CardTitle>
            <CardDescription>
              {getCategoryDescription(currentCategory)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {questions[currentCategory].map((question) => (
              <div key={question.id} className="space-y-3">
                <Label className="text-sm font-medium">
                  {question.question_text}
                </Label>
                
                <RadioGroup
                  value={answers[question.id]?.toString() || ""}
                  onValueChange={(value) => handleAnswerChange(question.id, parseInt(value))}
                >
                  {question.options_json.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <RadioGroupItem value={index.toString()} id={`${question.id}-${index}`} />
                      <Label htmlFor={`${question.id}-${index}`} className="cursor-pointer text-sm">
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
        <Button
          variant="outline"
          onClick={() => navigateCategory('prev')}
          disabled={categories.indexOf(currentCategory) === 0}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          {t("dbaQuestionnaire.previous")}
        </Button>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={saveAnswers}
            disabled={saving}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? t("dbaQuestionnaire.saving") : t("dbaQuestionnaire.saveProgress")}
          </Button>

          {validProgress === 100 && (
            <Button
              onClick={completeQuestionnaire}
              disabled={saving}
              className="flex items-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              {t("dbaQuestionnaire.completeAssessment")}
            </Button>
          )}
        </div>

        <Button
          onClick={() => navigateCategory('next')}
          disabled={categories.indexOf(currentCategory) === categories.length - 1}
          className="flex items-center gap-2"
        >
          {t("dbaQuestionnaire.next")}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Info */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {t("dbaQuestionnaire.alertDescription")}
        </AlertDescription>
      </Alert>
    </div>
  )
}
