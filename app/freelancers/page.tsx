"use client"

import { Suspense, useMemo } from "react"
import FreelancersList from "@/components/freelancers-list"
import FreelancerFilters from "@/components/freelancer-filters"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, AlertCircle } from "lucide-react"
import { useOptimizedUser } from "@/components/optimized-user-provider"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { useTranslation } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import OptimizedHeader from "@/components/optimized-header"

// Skeleton loader for freelancers list
function FreelancersListSkeleton() {
  return (
    <div className="space-y-6">
      {[...Array(6)].map((_, i) => (
        <Card key={i} className="transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-6 w-20" />
                </div>
                <Skeleton className="h-4 w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-16" />
            </div>
                <Skeleton className="h-4 w-32" />
          </div>
        </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// Error boundary component for freelancers list
function FreelancersListError({ error, retry }: { error: Error; retry: () => void }) {
  const { t } = useTranslation()
  
  return (
    <Card>
      <CardContent className="p-8">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t("freelancers.error.title") || "Error loading freelancers"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t("freelancers.error.description") || "There was a problem loading the freelancer list. Please try again."}
            </p>
            <Button onClick={retry} variant="outline">
              {t("common.retry") || "Try Again"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function FreelancersPage() {
  const { userType, isLoading: isUserLoading } = useOptimizedUser()
  const router = useRouter()
  const { t } = useTranslation()

  // Memoized redirect logic to prevent unnecessary re-renders
  const shouldRedirect = useMemo(() => {
    return !isUserLoading && userType === "freelancer"
  }, [isUserLoading, userType])

  // Redirect freelancers away from this page
  useEffect(() => {
    if (shouldRedirect) {
      router.push("/dashboard")
    }
  }, [shouldRedirect, router])

  // Show loading state while checking user type
  if (isUserLoading) {
  return (
    <div className="bg-muted/30 min-h-screen">
      <div className="container py-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-1">
                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      <Skeleton className="h-6 w-24" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-6 w-32" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="md:col-span-3">
                <FreelancersListSkeleton />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Don't render anything if redirecting
  if (shouldRedirect) {
    return null
  }

  return (
    <>
    <OptimizedHeader />
    <div className="min-h-screen w-full bg-[#f7f7f7]">
      <div className="py-8 px-8 container">
        <div className="space-y-6">
          {/* Header Section */}
          <div className="mb-4">
            <h1 className="text-lg text-black font-bold">{t("common.findFreelancers")}</h1>
            <p className="text-black text-sm">
              {t("common.browseAndConnect")}
            </p>
          </div>

         

          {/* Main Content */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 w-full">
            {/* Filters Sidebar */}
            <div className="md:col-span-1">
              {/* <Card> */}
                {/* <CardContent className="p-4"> */}
                  <FreelancerFilters />
                {/* </CardContent> */}
              {/* </Card> */}
            </div>

            {/* Freelancers List */}
            <div className="md:col-span-3">
              <Suspense fallback={<FreelancersListSkeleton />}>
                <FreelancersList />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}
