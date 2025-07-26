import { useState, useEffect } from "react"
import { useOptimizedSupabase } from "@/components/optimized-supabase-provider"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useTranslation } from "@/lib/i18n"
import { ArrowRight, CheckCircle2, AlertCircle } from "lucide-react"
import Link from "next/link"
import type { Database } from "@/lib/database.types"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]

interface OnboardingStep {
  id: string
  title: string
  description: string
  link: string
  isCompleted: boolean
  isRequired: boolean
  progress?: {
    current: number
    total: number
  }
}

export default function FreelancerOnboardingProgress({ profile }: { profile: Profile }) {
  const { t } = useTranslation()
  const { supabase } = useOptimizedSupabase()
  const [steps, setSteps] = useState<OnboardingStep[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkOnboardingProgress = async () => {
      if (!profile) return

      // Check profile completion - match the profile page calculation
      const fields = [
        profile.first_name,
        profile.last_name,
        profile.email,
        profile.phone,
        profile.bio,
        profile.location,
        profile.avatar_url,
      ]

      // Add freelancer-specific fields
      if (profile.user_type === 'freelancer') {
        fields.push(
          profile.hourly_rate?.toString() || null,
          (profile.metadata as any)?.role || null,
          profile.latitude?.toString() || null,
          profile.longitude?.toString() || null
        )
      }

      const completedFields = fields.filter(field => field && field.toString().trim() !== '').length
      const profileCompletion = Math.round((completedFields / fields.length) * 100)

      // Check job offerings
      const { data: jobOfferings } = await supabase
        .from("freelancer_job_offerings")
        .select("id")
        .eq("freelancer_id", profile.id)
      const jobOfferingsCount = jobOfferings?.length || 0
      const MAX_JOB_OFFERINGS = 3
      const hasJobOfferings = jobOfferingsCount >= MAX_JOB_OFFERINGS

      // Check availability - consider complete if at least one availability entry exists
      const { data: availability } = await supabase
        .from("freelancer_availability")
        .select("id")
        .eq("freelancer_id", profile.id)
      const hasAvailability = (availability?.length || 0) > 0

      const onboardingSteps: OnboardingStep[] = [
        {
          id: "profile",
          title: t("onboarding.profile.title"),
          description: t("onboarding.profile.description"),
          link: "/profile",
          isCompleted: profileCompletion >= 100,
          isRequired: true,
          progress: {
            current: profileCompletion,
            total: 100
          }
        },
        {
          id: "job-offerings",
          title: t("onboarding.jobOfferings.title"),
          description: t("onboarding.jobOfferings.description"),
          link: "/job-offerings",
          isCompleted: hasJobOfferings,
          isRequired: true,
          progress: {
            current: jobOfferingsCount,
            total: MAX_JOB_OFFERINGS
          }
        },
        {
          id: "availability",
          title: t("onboarding.availability.title"),
          description: t("onboarding.availability.description"),
          link: "/profile/availability",
          isCompleted: hasAvailability,
          isRequired: true,
          progress: {
            current: availability?.length || 0,
            total: 1
          }
        },
      ]

      setSteps(onboardingSteps)
      setLoading(false)
    }

    checkOnboardingProgress()
  }, [profile, supabase, t])

  if (loading) return null

  const completedSteps = steps.filter(step => step.isCompleted).length
  const totalSteps = steps.filter(step => step.isRequired).length
  const progress = Math.round((completedSteps / totalSteps) * 100)

  // Only hide the component if ALL steps are completed
  const allStepsCompleted = steps.every(step => step.isCompleted)
  if (allStepsCompleted) return null

  const nextIncompleteStep = steps.find(step => !step.isCompleted && step.isRequired)

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">{t("onboarding.title")}</h3>
              <Progress value={progress} className="w-24" />
              <span className="text-sm text-muted-foreground">{progress}%</span>
            </div>
            {nextIncompleteStep && (
              <p className="text-sm text-muted-foreground">
                {t("onboarding.nextStep")}: {nextIncompleteStep.title}
              </p>
            )}
          </div>
          {nextIncompleteStep && (
            <Link href={nextIncompleteStep.link}>
              <Button className="gap-2">
                {t("onboarding.completeStep")}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`flex items-start gap-3 p-3 rounded-lg ${
                step.isCompleted ? "bg-muted/50" : "bg-muted/30"
              }`}
            >
              {step.isCompleted ? (
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
              )}
              <div>
                <h4 className="font-medium text-sm">{step.title}</h4>
                <p className="text-xs text-muted-foreground">{step.description}</p>
                {step.progress && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {step.id === "availability" 
                      ? (step.progress.current > 0 ? t("onboarding.availability.availabilitySet") : t("onboarding.availability.noAvailabilitySet"))
                      : step.id === "profile"
                      ? `${step.progress.current}% ${t("onboarding.profile.complete")}`
                      : `${step.progress.current} ${t("onboarding.of")} ${step.progress.total} ${t("onboarding.completed")}`}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 