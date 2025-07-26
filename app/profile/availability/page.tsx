"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { useOptimizedSupabase } from "@/components/optimized-supabase-provider"
import { useOptimizedUser } from "@/components/optimized-user-provider"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { toast } from "@/lib/toast"
import type { Database } from "@/lib/database.types"
import AvailabilityCalendar from "@/components/availability-calendar"
import FreelancerOnboardingProgress from "@/components/freelancer-onboarding-progress"
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarInset
} from "@/components/ui/sidebar"
import ModernSidebarNav from "@/components/modern-sidebar-nav"
import OptimizedHeader from "@/components/optimized-header"
import { useTranslation } from "@/lib/i18n"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]

// Skeleton for immediate loading
function AvailabilitySkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-[300px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Skeleton className="h-[400px] w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    </div>
  )
}

export default function AvailabilityPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const { profile, isLoading: isProfileLoading } = useOptimizedUser()

  // Check if user is freelancer and redirect if not
  React.useEffect(() => {
    if (profile && profile.user_type !== "freelancer") {
      toast.error("Access denied")
      router.push("/dashboard")
    }
  }, [profile, router])

  if (isProfileLoading) {
    return (
      <SidebarProvider className="w-full">
        <div className="flex min-h-screen bg-muted/30 w-full">
          <Sidebar>
            {/* Show minimal sidebar during loading */}
            <div className="p-4">
              <div className="h-8 w-8 rounded-lg bg-muted animate-pulse" />
            </div>
          </Sidebar>
          <SidebarInset className="w-full">
            <OptimizedHeader />
            <div className="p-6">
              <AvailabilitySkeleton />
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    )
  }

  if (!profile) {
    return (
      <div className="container py-10 text-center">
        <h1 className="text-2xl font-bold mb-4">{t("availability.profileNotFound")}</h1>
        <Button onClick={() => router.push("/")}>{t("availability.goToHome")}</Button>
      </div>
    )
  }

  return (
    <SidebarProvider className="w-full">
      <div className="flex min-h-screen bg-muted/30 w-full">
        <Sidebar>
          {profile && <ModernSidebarNav profile={profile} />}
        </Sidebar>
        {/* Main Content */}
        <SidebarInset className="w-full">
          <OptimizedHeader />
          <div className="lg:col-span-3 space-y-6 h-full p-6 pb-20 bg-[#f7f7f7]">
            <div className="flex items-center justify-between">
              <div>
                {/* <h1 className="text-3xl font-bold">{t("availability.calendar.title")}</h1> */}
                {/* <p className="text-muted-foreground mt-1">
                  {t("availability.calendar.description")}
                </p> */}
              </div>
            </div>
            {profile.user_type === "freelancer" && (
              <FreelancerOnboardingProgress profile={profile} />
            )}
            <div className="bg-background rounded-lg overflow-hidden">
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-1">{t("availability.calendar.title")}</h2>
                <p className="text-xs text-black">{t("availability.calendar.description")}</p>
              </div>
              <div className="p-6">
                <AvailabilityCalendar freelancerId={profile.id} />
              </div>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}

