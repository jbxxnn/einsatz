"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, Clock, Save, Loader } from "lucide-react"
import { useOptimizedSupabase } from "./optimized-supabase-provider"
import { toast } from "@/lib/toast"
import { useTranslation } from "@/lib/i18n"
import type { Database } from "@/lib/database.types"

type DBAQuestion = Database["public"]["Tables"]["dba_questions"]["Row"]
type DBAAnswer = Database["public"]["Tables"]["dba_freelancer_answers"]["Row"] & {
  dba_questions: DBAQuestion
}

interface DBAFreelancerQuestionnaireProps {
  jobCategoryId: string
  jobCategoryName: string
  onComplete?: (answers: DBAAnswer[]) => void
  onSave?: (answers: DBAAnswer[]) => void
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

const categoryIcons = {
  control: "🎯",
  substitution: "🔄",
  tools: "🔧",
  risk: "💰",
  economic_independence: "🏢"
}

export default function DBAFreelancerQuestionnaire({
  jobCategoryId,
  jobCategoryName,
  onComplete,
  onSave,
  showProgress = true,
  className = ""
}: DBAFreelancerQuestionnaireProps) {
  const { t, locale } = useTranslation()
  const { supabase } = useOptimizedSupabase()
  const [questions, setQuestions] = useState<Record<string, DBAQuestion[]>>({})
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [existingAnswers, setExistingAnswers] = useState<DBAAnswer[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [currentCategory, setCurrentCategory] = useState<string>("")
  const [progress, setProgress] = useState(0)

  // Fetch questions and existing answers
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch questions
        const questionsResponse = await fetch(`/api/dba/questions?isFreelancer=true`)
        const questionsData = await questionsResponse.json()
        
        if (questionsData.error) {
          throw new Error(questionsData.error)
        }

        setQuestions(questionsData.questions)
        
        // Set first category as current
        const categories = Object.keys(questionsData.questions)
        if (categories.length > 0) {
          setCurrentCategory(categories[0])
        }

        // Fetch existing answers
        const answersResponse = await fetch(`/api/dba/freelancer-answers?jobCategoryId=${jobCategoryId}`)
        const answersData = await answersResponse.json()
        
        if (answersData.answers) {
          setExistingAnswers(answersData.answers)
          
          // Pre-populate answers
          const answerMap: Record<string, string> = {}
          answersData.answers.forEach((answer: DBAAnswer) => {
            answerMap[answer.question_id] = answer.answer_value
          })
          setAnswers(answerMap)
          
          // Calculate progress
          const totalQuestions = Object.values(questionsData.questions).flat().length
          const answeredQuestions = Object.keys(answerMap).length
          setProgress((answeredQuestions / totalQuestions) * 100)
        }
      } catch (error) {
        console.error("Error fetching DBA data:", error)
        toast.error(t("dba.error.fetchingData"))
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [jobCategoryId])

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => {
      const newAnswers = {
        ...prev,
        [questionId]: value
      }
      
      // Update progress with the new answers only if we have questions data
      const totalQuestions = Object.values(questions).flat().length
      if (totalQuestions > 0) {
        const answeredQuestions = Object.keys(newAnswers).length
        setProgress((answeredQuestions / totalQuestions) * 100)
      }
      
      return newAnswers
    })
  }

  const saveAnswers = async () => {
    setSaving(true)
    try {
      const answersArray = Object.entries(answers).map(([questionId, value]) => ({
        questionId,
        value
      }))

      const response = await fetch("/api/dba/freelancer-answers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          jobCategoryId,
          answers: answersArray
        })
      })

      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }

      toast.success(t("dba.save.success.title"))
      
      // Auto-navigate to next section after saving
      const currentIndex = categories.indexOf(currentCategory)
      if (currentIndex < categories.length - 1) {
        setCurrentCategory(categories[currentIndex + 1])
      }
      
      if (onSave) {
        onSave(existingAnswers)
      }
    } catch (error) {
      console.error("Error saving DBA answers:", error)
      toast.error(t("dba.error.savingAnswers"))
    } finally {
      setSaving(false)
    }
  }

  const getQuestionText = (question: DBAQuestion) => {
    return locale === "nl" ? question.question_text_nl : question.question_text_en
  }

  const getCategoryLabel = (category: string) => {
    const labels = categoryLabels[category as keyof typeof categoryLabels]
    return locale === "nl" ? labels.nl : labels.en
  }

  const getCategoryIcon = (category: string) => {
    return categoryIcons[category as keyof typeof categoryIcons] || "❓"
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

  const categories = Object.keys(questions)
  const totalQuestions = Object.values(questions).flat().length
  const answeredQuestions = Object.keys(answers).length

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-black text-lg">
            <CheckCircle className="h-5 w-5 text-primary" />
            {t("dba.freelancer.title")}
          </CardTitle>
          <p className="text-xs text-black">
            {t("dba.freelancer.description", { category: jobCategoryName })}
          </p>
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
            <span>{getCategoryIcon(category)}</span>
            <span>{getCategoryLabel(category)}</span>
          </Button>
        ))}
      </div>

      {/* Questions for Current Category */}
      {currentCategory && questions[currentCategory] && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-black text-lg">
              <span>{getCategoryIcon(currentCategory)}</span>
              {getCategoryLabel(currentCategory)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {questions[currentCategory].map((question) => (
              <div key={question.id} className="space-y-3">
                <div className="flex items-start gap-3">
                  {/* <Badge variant="outline" className="mt-1">
                    {question.weight > 1 ? `${question.weight}x` : "1x"}
                  </Badge> */}
                  <div className="flex-1">
                    <Label className="text-sm text-black font-medium">
                      {getQuestionText(question)}
                    </Label>
                    {question.is_required && (
                      <span className="text-red-500 ml-1 text-xs">*</span>
                    )}
                  </div>
                </div>
                
                <RadioGroup
                  value={answers[question.id] ?? ""}
                  onValueChange={(value) => handleAnswerChange(question.id, value)}
                  className="ml-8"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="true" id={`${question.id}-true`} />
                    <Label htmlFor={`${question.id}-true`} className="cursor-pointer text-xs text-black">
                      {t("dba.answer.yes")}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="false" id={`${question.id}-false`} />
                    <Label htmlFor={`${question.id}-false`} className="cursor-pointer text-xs text-black">
                      {t("dba.answer.no")}
                    </Label>
                  </div>
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
              {/* <span className="text-xs hidden sm:inline"> */}
                {/* {getCategoryLabel(category)} */}
              {/* </span> */}
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
            {saving ? t("dba.save.saving") : (
              currentCategory && categories.indexOf(currentCategory) < categories.length - 1 
                ? `${t("dba.save.button")} & Continue` 
                : t("dba.save.button")
            )}
          </Button>
          
          {progress === 100 && (
            <Button
              onClick={async () => {
                try {
                  await saveAnswers()
                  onComplete?.(existingAnswers)
                } catch (error) {
                  // Error is already handled in saveAnswers function
                  console.error("Error completing questionnaire:", error)
                }
              }}
              className="flex items-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              {t("dba.complete.button")}
            </Button>
          )}
        </div>
      </div>

      {/* Info Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
                      {t("dba.freelancer.info")}
        </AlertDescription>
      </Alert>
    </div>
  )
} 