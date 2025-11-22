"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useOptimizedUser } from "@/components/optimized-user-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "@/lib/toast"
import { useTranslation } from "@/lib/i18n"
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarInset,
  useSidebar
} from "@/components/ui/sidebar"
import ModernSidebarNav from "@/components/modern-sidebar-nav"
import OptimizedHeader from "@/components/optimized-header"
import { 
  Bug, 
  Sparkles, 
  Lightbulb, 
  MessageSquare, 
  HelpCircle,
  CheckCircle2,
  Loader2,
  Send
} from "lucide-react"

function MobileHeader() {
  const { openMobile, setOpenMobile } = useSidebar()
  
  return (
    <OptimizedHeader 
      isMobileMenuOpen={openMobile}
      setIsMobileMenuOpen={setOpenMobile}
    />
  )
}

type FeedbackType = 'bug' | 'feature' | 'improvement' | 'general' | 'other'
type Priority = 'low' | 'medium' | 'high'

const feedbackTypeConfig: Record<FeedbackType, { icon: typeof Bug; color: string }> = {
  bug: { icon: Bug, color: 'text-red-500' },
  feature: { icon: Sparkles, color: 'text-blue-500' },
  improvement: { icon: Lightbulb, color: 'text-yellow-500' },
  general: { icon: MessageSquare, color: 'text-green-500' },
  other: { icon: HelpCircle, color: 'text-slate-500' }
}

export default function FeedbackPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { profile, isLoading: isProfileLoading } = useOptimizedUser()
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    feedback_type: '' as FeedbackType | '',
    title: '',
    description: '',
    priority: 'medium' as Priority
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!profile) {
      toast.error(t("feedback.error.notLoggedIn") || "Please log in to submit feedback")
      return
    }

    if (!formData.feedback_type || !formData.title || !formData.description) {
      toast.error(t("feedback.error.missingFields") || "Please fill in all required fields")
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feedback_type: formData.feedback_type,
          title: formData.title,
          description: formData.description,
          priority: formData.priority
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit feedback')
      }

      setSubmitted(true)
      toast.success(t("feedback.success.submitted") || "Thank you for your feedback!")
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setFormData({
          feedback_type: '' as FeedbackType | '',
          title: '',
          description: '',
          priority: 'medium'
        })
        setSubmitted(false)
      }, 3000)

    } catch (error: any) {
      console.error('Error submitting feedback:', error)
      toast.error(error.message || t("feedback.error.submitFailed") || "Failed to submit feedback. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (isProfileLoading) {
    return (
      <SidebarProvider className="w-full">
        <div className="flex min-h-screen bg-slate-50 w-full">
          <Sidebar>
            <ModernSidebarNav profile={null} />
          </Sidebar>
          <SidebarInset className="w-full">
            <div className="flex items-center justify-center h-screen">
              <Loader2 className="h-6 w-6 animate-spin text-[#15dda9]" />
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider className="w-full">
      <div className="flex min-h-screen bg-slate-50 w-full">
        <Sidebar>
          {profile && <ModernSidebarNav profile={profile} />}
        </Sidebar>

        <SidebarInset className="w-full">
          <MobileHeader />
          
          <div className="w-full px-6 pb-20 pt-6 md:px-10">
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
              {/* Header */}
              <header className="space-y-3">
                <Badge variant="secondary" className="rounded-full bg-slate-200/70 px-3 py-1 text-xs text-slate-700">
                  {t("feedback.badge") || "Feedback"}
                </Badge>
                <div className="space-y-2">
                  <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                    {t("feedback.title") || "Share Your Feedback"}
                  </h1>
                  <p className="text-sm text-slate-500 md:text-base">
                    {t("feedback.description") || "Help us improve by sharing your thoughts, reporting bugs, or suggesting new features."}
                  </p>
                </div>
              </header>

              {/* Success State */}
              {submitted ? (
                <Card className="rounded-3xl border border-slate-200/70 bg-white shadow-sm">
                  <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                      <CheckCircle2 className="h-8 w-8 text-green-600" />
                    </div>
                    <h2 className="mb-2 text-2xl font-semibold text-slate-900">
                      {t("feedback.success.title") || "Thank You!"}
                    </h2>
                    <p className="text-slate-600">
                      {t("feedback.success.message") || "Your feedback has been submitted successfully. We appreciate your input!"}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                /* Feedback Form */
                <Card className="rounded-3xl border border-slate-200/70 bg-white shadow-sm">
                  <CardHeader className="border-b border-slate-200/80 bg-slate-50/80 px-6 py-6">
                    <CardTitle className="text-xl">{t("feedback.form.title") || "Tell us what's on your mind"}</CardTitle>
                    <CardDescription>
                      {t("feedback.form.description") || "Select a category and provide details about your feedback"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 md:p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* Feedback Type Selection */}
                      <div className="space-y-3">
                        <Label className="text-sm font-medium text-slate-900">
                          {t("feedback.form.typeLabel") || "What type of feedback is this?"} <span className="text-red-500">*</span>
                        </Label>
                        <RadioGroup
                          value={formData.feedback_type}
                          onValueChange={(value) => setFormData({ ...formData, feedback_type: value as FeedbackType })}
                          className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
                        >
                          {(Object.keys(feedbackTypeConfig) as FeedbackType[]).map((type) => {
                            const config = feedbackTypeConfig[type]
                            const Icon = config.icon
                            return (
                              <div key={type}>
                                <RadioGroupItem
                                  value={type}
                                  id={type}
                                  className="peer sr-only"
                                />
                                <Label
                                  htmlFor={type}
                                  className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-slate-200 bg-white p-4 text-center transition-all hover:border-[#15dda9] hover:bg-slate-50 peer-data-[state=checked]:border-[#15dda9] peer-data-[state=checked]:bg-[#d0f8ee]"
                                >
                                  <Icon className={`h-6 w-6 ${config.color}`} />
                                  <span className="text-sm font-medium text-slate-900">
                                    {t(`feedback.types.${type}`) || type.charAt(0).toUpperCase() + type.slice(1)}
                                  </span>
                                </Label>
                              </div>
                            )
                          })}
                        </RadioGroup>
                      </div>

                      {/* Title */}
                      <div className="space-y-2">
                        <Label htmlFor="title" className="text-sm font-medium text-slate-900">
                          {t("feedback.form.titleLabel") || "Title"} <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="title"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          placeholder={t("feedback.form.titlePlaceholder") || "Brief summary of your feedback"}
                          className="rounded-lg border-slate-200 focus:border-[#15dda9] focus:ring-[#15dda9]"
                          required
                          maxLength={200}
                        />
                      </div>

                      {/* Description */}
                      <div className="space-y-2">
                        <Label htmlFor="description" className="text-sm font-medium text-slate-900">
                          {t("feedback.form.descriptionLabel") || "Description"} <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          placeholder={t("feedback.form.descriptionPlaceholder") || "Provide detailed information about your feedback..."}
                          className="min-h-[150px] rounded-lg border-slate-200 focus:border-[#15dda9] focus:ring-[#15dda9] resize-none"
                          required
                          maxLength={2000}
                        />
                        <p className="text-xs text-slate-500">
                          {formData.description.length}/2000 {t("feedback.form.characters") || "characters"}
                        </p>
                      </div>

                      {/* Priority */}
                      <div className="space-y-2">
                        <Label htmlFor="priority" className="text-sm font-medium text-slate-900">
                          {t("feedback.form.priorityLabel") || "Priority"}
                        </Label>
                        <Select
                          value={formData.priority}
                          onValueChange={(value) => setFormData({ ...formData, priority: value as Priority })}
                        >
                          <SelectTrigger className="rounded-lg border-slate-200 focus:border-[#15dda9] focus:ring-[#15dda9]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">
                              {t("feedback.priority.low") || "Low"} - {t("feedback.priority.lowDescription") || "Nice to have"}
                            </SelectItem>
                            <SelectItem value="medium">
                              {t("feedback.priority.medium") || "Medium"} - {t("feedback.priority.mediumDescription") || "Would be helpful"}
                            </SelectItem>
                            <SelectItem value="high">
                              {t("feedback.priority.high") || "High"} - {t("feedback.priority.highDescription") || "Important"}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Submit Button */}
                      <div className="flex justify-end gap-3 pt-4">
                        <Button
                          type="submit"
                          disabled={loading || !formData.feedback_type || !formData.title || !formData.description}
                          className="rounded-lg bg-[#15dda9] px-6 text-white hover:bg-[#12c89a] disabled:opacity-50"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              {t("feedback.form.submitting") || "Submitting..."}
                            </>
                          ) : (
                            <>
                              <Send className="mr-2 h-4 w-4" />
                              {t("feedback.form.submit") || "Submit Feedback"}
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}


