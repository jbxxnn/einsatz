"use client"

import { Suspense } from "react"
import FreelancersList from "@/components/freelancers-list"
import FreelancerFilters from "@/components/freelancer-filters"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { useOptimizedUser } from "@/components/optimized-user-provider"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

// Skeleton loader for freelancers list
function FreelancersListSkeleton() {
  return (
    <div className="space-y-6">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="border rounded-lg p-4">
          <div className="flex gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-2/3" />
            </div>
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function FreelancersPage() {
  const { userType } = useOptimizedUser()
  const router = useRouter()

  // Redirect freelancers away from this page
  useEffect(() => {
    if (userType === "freelancer") {
      router.push("/dashboard")
    }
  }, [userType, router])

  return (
    <div className="bg-muted/30 min-h-screen">
      <div className="container py-8">
        <div className="space-y-6">
          {/* Header Section */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Find Freelancers</h1>
            <p className="text-muted-foreground">
              Browse and connect with skilled freelancers in your area
            </p>
          </div>

          {/* Search Bar
          <Card>
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search freelancers by name, skills, or location..."
                  className="pl-9"
                />
              </div>
            </CardContent>
          </Card> */}

          {/* Main Content */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Filters Sidebar */}
            <div className="md:col-span-1">
              <Card>
                <CardContent className="p-4">
                  <FreelancerFilters />
                </CardContent>
              </Card>
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
  )
}
