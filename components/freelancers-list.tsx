"use client"

import { useSearchParams } from "next/navigation"
import { useFreelancers } from "@/lib/data-fetching"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { MapPin, Star } from "lucide-react"
import Link from "next/link"
import type { Database } from "@/lib/database.types"

type Freelancer = Database["public"]["Tables"]["profiles"]["Row"] & {
  job_offerings?: Array<{
    id: string
    category_name: string
  }>
  rating?: number
  distance?: number
  is_available_now?: boolean
}

export default function FreelancersList() {
  const searchParams = useSearchParams()

  // Get all filter parameters from URL
  const filters = {
    search: searchParams.get("search") || undefined,
    categories: searchParams.get("categories") || undefined,
    minPrice: searchParams.get("minPrice") || undefined,
    maxPrice: searchParams.get("maxPrice") || undefined,
    availableNow: searchParams.get("availableNow") === "true",
    location: searchParams.get("location") || undefined,
    latitude: searchParams.get("latitude") || undefined,
    longitude: searchParams.get("longitude") || undefined,
    radius: searchParams.get("radius") || undefined,
  }

  const { data, error, isLoading } = useFreelancers(filters)
  const freelancers = data?.freelancers || []

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(5)].map((_, i) => (
          <FreelancerSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <h3 className="text-lg font-medium">Error loading freelancers</h3>
            <p className="text-sm text-muted-foreground mt-1">
              There was a problem loading the freelancer list. Please try again.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (freelancers.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <h3 className="text-lg font-medium">No freelancers found</h3>
            <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters to find more freelancers.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {freelancers.map((freelancer: Freelancer) => (
        <FreelancerCard key={freelancer.id} freelancer={freelancer} />
      ))}
    </div>
  )
}

function FreelancerCard({ freelancer }: { freelancer: Freelancer }) {
  const initials = `${freelancer.first_name?.[0] || ""}${freelancer.last_name?.[0] || ""}`.toUpperCase()

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage
              src={freelancer.avatar_url || "/placeholder.svg"}
              alt={`${freelancer.first_name} ${freelancer.last_name}`}
            />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <h3 className="text-lg font-medium">
                {freelancer.first_name} {freelancer.last_name}
              </h3>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium">{freelancer.rating || "New"}</span>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{freelancer.bio}</p>

            <div className="flex flex-wrap gap-2 mt-2">
              {freelancer.job_offerings?.slice(0, 3).map((offering) => (
                <Badge key={offering.id} variant="secondary">
                  {offering.category_name}
                </Badge>
              ))}
            </div>

            {freelancer.location && (
              <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>{freelancer.location}</span>
                {typeof freelancer.distance === 'number' && (
                  <span className="ml-1">({Math.round(freelancer.distance * 10) / 10} miles away)</span>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 items-center md:items-end justify-center">
            <div className="text-lg font-bold">€{freelancer.hourly_rate}/hr</div>
            {freelancer.is_available_now && (
              <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-200">
                Available Now
              </Badge>
            )}
            <Link href={`/freelancers/${freelancer.id}`} passHref>
              <Button>View Profile</Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function FreelancerSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />

          <div className="flex-1">
            <Skeleton className="h-6 w-40 mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />

            <div className="flex gap-2 mt-3">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-16" />
            </div>
          </div>

          <div className="flex flex-col gap-2 items-center md:items-end">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
