"use client"

import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { useFreelancers } from "@/hooks/use-freelancers"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { MapPin, Star, CheckCircle, AlertCircle, RefreshCw, BadgeCheck, ChevronLeft, ChevronRight, Zap } from "lucide-react"
import Link from "next/link"
import type { Database } from "@/lib/database.types"
import { useTranslation } from "@/lib/i18n"

type Freelancer = Database["public"]["Tables"]["profiles"]["Row"] & {
  job_offerings?: Array<{
    id: string
    category_name: string
    subcategory_name?: string
  }>
  rating?: number
  distance?: number
  is_available_now?: boolean
  is_verified?: boolean
  completed_bookings?: number
}

export default function FreelancersList() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const { t } = useTranslation()
  
  // Get pagination parameters from URL
  const currentPage = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "12")
  
  // Get all filter parameters from URL
  const filters = {
    search: searchParams.get("search") || undefined,
    categories: searchParams.get("categories")?.split(",").filter(Boolean) || undefined,
    minPrice: searchParams.get("minPrice") || undefined,
    maxPrice: searchParams.get("maxPrice") || undefined,
    availableNow: searchParams.get("availableNow") === "true",
    location: searchParams.get("location") || undefined,
    latitude: searchParams.get("latitude") || undefined,
    longitude: searchParams.get("longitude") || undefined,
    radius: searchParams.get("radius") || undefined,
    wildcards: searchParams.get("wildcards")?.split(",").filter(Boolean) || undefined,
    wildcardOnly: searchParams.get("wildcardOnly") === "true",
    page: currentPage,
    limit: limit,
  }

  const { data, error, isLoading, isFetching, refetch } = useFreelancers(filters)
  const freelancers = data?.freelancers || []
  const pagination = data?.pagination || { page: 1, limit: 12, total: 0, hasMore: false }

  // Navigation functions
  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    if (page === 1) {
      params.delete("page")
    } else {
      params.set("page", page.toString())
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  const goToNextPage = () => {
    if (pagination.hasMore) {
      goToPage(currentPage + 1)
    }
  }

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1)
    }
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(6)].map((_, i) => (
          <FreelancerSkeleton key={i} />
        ))}
      </div>
    )
  }

  // Show error state with retry option
  if (error) {
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
              <Button onClick={() => refetch()} variant="outline" disabled={isFetching}>
                {isFetching ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try Again
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show empty state
  if (freelancers.length === 0) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
              <MapPin className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t("freelancers.empty.title") || "No freelancers found"}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t("freelancers.empty.description") || "Try adjusting your filters to find more freelancers."}
              </p>
              <Button 
                onClick={() => refetch()} 
                variant="outline" 
                disabled={isFetching}
              >
                {isFetching ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Results header with count and refresh indicator */}
      <div className="flex items-center justify-between ">
        <div className="text-xs text-black">
          {t("freelancers.results.found", { count: freelancers.length }) || 
           `${freelancers.length} freelancer${freelancers.length !== 1 ? 's' : ''} found`}
        </div>
        {isFetching && (
          <div className="flex items-center gap-2 text-xs text-black">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Updating...
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1 gap-4">
        {/* Freelancers list */}
      {freelancers.map((freelancer: Freelancer) => (
        <FreelancerCard key={freelancer.id} freelancer={freelancer} />
      ))}
      </div>

      {/* Pagination Controls */}
      {pagination.total > 0 && (
        <div className="flex items-center justify-between pt-6">
          <div className="text-xs text-black">
            {t("pagination.showing", { 
              from: (currentPage - 1) * limit + 1, 
              to: Math.min(currentPage * limit, pagination.total),
              total: pagination.total 
            }) || `Showing ${(currentPage - 1) * limit + 1}-${Math.min(currentPage * limit, pagination.total)} of ${pagination.total} freelancers`}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousPage}
              disabled={currentPage <= 1}
              className="text-xs text-black bg-transparent"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              {t("pagination.previous") || "Previous"}
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, Math.ceil(pagination.total / limit)) }, (_, i) => {
                const pageNum = i + 1
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => goToPage(pageNum)}
                    className="w-8 h-8 p-0"
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPage}
              disabled={!pagination.hasMore}
              className="text-xs text-black bg-transparent"
            >
              {t("pagination.next") || "Next"}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function FreelancerCard({ freelancer }: { freelancer: Freelancer }) {
  const { t } = useTranslation()
  const initials = `${freelancer.first_name?.[0] || ""}${freelancer.last_name?.[0] || ""}`.toUpperCase()

  // Function to get category color based on category name
  const getCategoryColor = (categoryName: string) => {
    const colors = [
      'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200',
      'bg-green-100 text-green-800 border-green-200 hover:bg-green-200',
      'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200',
      'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200',
      'bg-pink-100 text-pink-800 border-pink-200 hover:bg-pink-200',
      'bg-indigo-100 text-indigo-800 border-indigo-200 hover:bg-indigo-200',
      'bg-teal-100 text-teal-800 border-teal-200 hover:bg-teal-200',
      'bg-red-100 text-red-800 border-red-200 hover:bg-red-200',
      'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200',
      'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200',
    ]
    
    // Use the category name to determine color (hash-based for consistency)
    const hash = categoryName.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0)
      return a & a
    }, 0)
    
    return colors[Math.abs(hash) % colors.length]
  }

  return (
    <Card className="transition-all duration-200 hover:shadow-md hover:border-primary/20 hover:scale-[1.01] rounded-xl">
      <a href={`/freelancers/${freelancer.id}`}>
              <CardContent className="h-full flex flex-col justify-between pt-6 px-4">
                    <div className="flex flex-col md:flex-row gap-6 justify-between items-start">
            <div className="w-1/6">
             <Avatar className="h-32 w-32 rounded-md">
              <AvatarImage 
                src={freelancer.avatar_url || "/placeholder.svg"}
                alt={`${freelancer.first_name} ${freelancer.last_name}`}
              />
              <AvatarFallback>{initials}</AvatarFallback>
             </Avatar>
              </div>
              <div className="w-5/6">
              <div className="flex gap-2 mb-1 flex-col ">
                <div className="flex items-center gap-1">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const rating = freelancer.rating || 0;
                      const isFilled = star <= rating;
                      const isHalfFilled = star > rating && star - rating < 1;
                      
                      return (
                        <Star 
                          key={star}
                          className={`h-4 w-4 ${
                            isFilled 
                              ? 'fill-yellow-400 text-yellow-400' 
                              : isHalfFilled 
                                ? 'fill-yellow-400/50 text-yellow-400' 
                                : 'text-gray-300'
                          }`}
                        />
                      );
                    })}
                  </div>
                  <span className="text-xs font-medium ml-1">{freelancer.completed_bookings || "0"} {t("freelancer.completedJobs") || "jobs"}</span>
                </div>
               <h3 className="text-md font-bold font-sans group-hover:text-primary transition-colors text-black">
                    {freelancer.first_name} {freelancer.last_name}
                  </h3>
                  {/* {freelancer.is_verified && (
                    <BadgeCheck className="h-3 w-3 mr-1 text-green-500" />
                  )} */}
              </div>
              <div className="flex items-center gap-2 mb-6">
               {/* <div className="text-xs">€{freelancer.hourly_rate}/hr</div> */}
              <MapPin className="h-3 w-3 text-black" />
               <div className="text-xs" style={{ borderStyle: 'dashed', borderWidth: '0 0 1px 0', borderImage: 'repeating-linear-gradient(to right, #9ca3af 0, #9ca3af 4px, transparent 4px, transparent 8px) 1' }}>{freelancer.location}</div>
               </div>
              <div className="flex gap-2">
                {freelancer.job_offerings?.map((offering) => (
                  <div key={offering.id} className="flex flex-col gap-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge 
                            className={`text-xs cursor-help flex flex-col items-start justify-center rounded-md border transition-colors ${getCategoryColor(offering.category_name)}`}
                          >
                            {offering.category_name.length > 105 
                              ? `${offering.category_name.substring(0, 105)}...` 
                              : offering.category_name}

                    {offering.subcategory_name && (
                      <div className="ml-2">
                        <span className="text-xs text-gray-600 font-light">
                          {offering.subcategory_name}
                        </span>
                      </div>
                    )}
                          </Badge>
                        </TooltipTrigger>
                        {/* <TooltipContent>
                          <p>{offering.category_name}</p>
                        </TooltipContent> */}
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* <div className="flex flex-col md:flex-row gap-4"> */}
            {/* <Avatar className="h-16 w-16"> */}
              {/* <AvatarImage */}
                {/* // src={freelancer.avatar_url || "/placeholder.svg"} */}
                {/* // alt={`${freelancer.first_name} ${freelancer.last_name}`} */}
              {/* /> */}
              {/* <AvatarFallback>{initials}</AvatarFallback> */}
            {/* </Avatar> */}

            {/* <div className="flex-1"> */}
              {/* <div className="flex flex-col md:flex-row md:items-center justify-between gap-2"> */}
                {/* <div className="flex items-center gap-2">
                  <h3 className="text-lg font-medium group-hover:text-primary transition-colors">
                  {freelancer.first_name} {freelancer.last_name}
                </h3>
                {freelancer.is_verified && (
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {t("freelancer.verified")}
                  </Badge>
                )}
                  {freelancer.is_available_now && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100">
                      {t("freelancer.availableNow") || "Available Now"}
                    </Badge>
                  )}
                </div> */}
                {/* <div className="flex items-center gap-1"> */}
                  {/* <div className="text-sm font-bold">€{freelancer.hourly_rate}/hr</div> */}
                  {/* <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" /> */}
                  {/* <span className="text-sm font-medium">{freelancer.rating || "0"}</span> */}
                {/* </div> */}
              {/* </div> */}

              {/* <div className="flex flex-wrap gap-2 mt-2">
              {freelancer.job_offerings?.slice(0, 3).map((offering) => (
                  <Badge key={offering.id} variant="secondary" className="text-xs">
                  {offering.category_name}
                </Badge>
              ))}
                {freelancer.job_offerings && freelancer.job_offerings.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{freelancer.job_offerings.length - 3} more
                  </Badge>
                )}
              </div> */}

              {/* {freelancer.location && (
              <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>{freelancer.location}</span>
                {typeof freelancer.distance === 'number' && (
                    <span className="ml-1 text-green-500">
                      ({Math.round(freelancer.distance * 10) / 10} {t("freelancer.filters.milesAway") || "km away"})
                    </span>
                )}
              </div>
              )} */}

              {/* Additional info */}
              {/* <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                {freelancer.completed_bookings && freelancer.completed_bookings > 0 && (
                  <span>{freelancer.completed_bookings} {t("freelancer.completedBookings") || "completed bookings"}</span>
                )}
          </div> */}
            {/* </div> */}
                    {/* </div> */}
          <div className="flex justify-between bg-gray-50 border border-gray-200 rounded-md p-2 gap-2 mt-4">
         <div className="flex gap-2"> 
          {freelancer.is_verified && (
                  <Badge variant="secondary" className="bg-green-50 text-green-700 border border-green-200 hover:bg-green-100">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {t("freelancer.verified")}
                  </Badge>
                )}
                {freelancer.wildcard_enabled && (
                  <Badge variant="secondary" className="bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100">
                    <Zap className="h-3 w-3 mr-1" />
                    {t("freelancer.wildcard") || "Wildcard"}
                  </Badge>
                )}
                </div>
                <div className="flex gap-4 items-center">
                  <p className="text-xs text-gray-600 font-medium">{t("freelancer.rateStart") || "Rate starts at"}</p>
                <div className="text-lg font-bold">€{freelancer.hourly_rate}/hr</div>
                </div>
          </div>
        </CardContent>
      </a>
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
            <div className="flex items-center justify-between mb-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-6 w-20" />
            </div>

            <div className="flex gap-2 mb-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-16" />
          </div>

            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
