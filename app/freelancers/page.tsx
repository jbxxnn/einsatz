import { Suspense } from "react"
import FreelancersList from "@/components/freelancers-list"
import FreelancerFilters from "@/components/freelancer-filters"
import { Skeleton } from "@/components/ui/skeleton"

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
  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Find Freelancers</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1">
          <FreelancerFilters />
        </div>

        <div className="md:col-span-3">
          <Suspense fallback={<FreelancersListSkeleton />}>
            <FreelancersList />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
