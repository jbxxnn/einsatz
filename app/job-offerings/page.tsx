"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { useOptimizedSupabase } from "@/components/optimized-supabase-provider"
import { useOptimizedUser } from "@/components/optimized-user-provider"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/lib/toast"
import type { Database } from "@/lib/database.types"
import JobOfferingsManager from "@/components/job-offerings-manager"
import { useTranslation } from "@/lib/i18n"
import WildcardCategoriesForm from "@/components/wildcard-categories-form"
import FreelancerOnboardingProgress from "@/components/freelancer-onboarding-progress"
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarInset
} from "@/components/ui/sidebar"
import ModernSidebarNav from "@/components/modern-sidebar-nav"
import OptimizedHeader from "@/components/optimized-header"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]

// Skeleton components for immediate loading
function JobOfferingsSkeleton() {
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

export default function JobOfferingsPage() { 
  const { t } = useTranslation()
  const router = useRouter()
  const { supabase } = useOptimizedSupabase()
  const { profile, isLoading: isProfileLoading } = useOptimizedUser()

  // Redirect to login if no profile found - must be at top level
  React.useEffect(() => {
    if (!isProfileLoading && !profile) {
      router.push("/login");
    }
  }, [isProfileLoading, profile, router]);

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
              <JobOfferingsSkeleton />
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    )
  }

  if (!profile) {
    return (
      <div className="container py-10 text-center">
        <h1 className="text-2xl font-bold mb-4">{t("jobOfferings.redirectingToLogin")}</h1>
        <p className="text-gray-600">{t("jobOfferings.pleaseWait")}</p>
      </div>
    );
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
          <div className="lg:col-span-3 space-y-6 p-6 pb-20 bg-[#f7f7f7]">
            <div className="flex items-center justify-between">
              <div>
                {/* <h1 className="text-3xl font-bold">{t("jobOfferings.title")}</h1> */}
                {/* <p className="text-muted-foreground mt-1">
                  {t("jobOfferings.description")}
                </p> */}
              </div>
            </div>
            {profile.user_type === "freelancer" && (
              <FreelancerOnboardingProgress profile={profile} />
            )}

            {/* <Card> */}
              {/* <CardHeader> */}
                {/* <CardTitle>Your Services</CardTitle> */}
                {/* <CardDescription>
                  Add and manage the services you offer to clients
                </CardDescription> */}
              {/* </CardHeader> */}
              {/* <CardContent> */}
                <JobOfferingsManager freelancerId={profile.id} />
                <div className="mt-6">
                  <WildcardCategoriesForm profile={profile} />
                </div>
              {/* </CardContent> */}
            {/* </Card> */}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
} 