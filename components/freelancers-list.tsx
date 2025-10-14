"use client"

import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { useFreelancers } from "@/hooks/use-freelancers"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { MapPin, Star, CheckCircle, AlertCircle, RefreshCw, BadgeCheck, ChevronLeft, ChevronRight, MessageCircle, Shield } from "lucide-react"
import Link from "next/link"
import type { Database } from "@/lib/database.types"
import { useTranslation } from "@/lib/i18n"

type Freelancer = Database["public"]["Tables"]["profiles"]["Row"] & {
  job_offerings?: Array<{
    id: string
    category_id?: string
    category_name: string
    subcategory_name?: string
    is_wildcard?: boolean
    pricing_type: "hourly" | "packages"
    hourly_rate?: number
    experience_years?: number
    description?: string
    job_offering_packages?: Array<{
      id: string
      package_name: string
      short_description: string | null
      price: number
      display_order: number
      is_active: boolean
    }>
    dba_status?: {
      risk_level: string
      risk_percentage: number
      is_completed: boolean
    } | null
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
    subcategories: searchParams.get("subcategories")?.split(",").filter(Boolean) || undefined,
    minPrice: searchParams.get("minPrice") || undefined,
    maxPrice: searchParams.get("maxPrice") || undefined,
    availableNow: searchParams.get("availableNow") === "true",
    location: searchParams.get("location") || undefined,
    latitude: searchParams.get("latitude") || undefined,
    longitude: searchParams.get("longitude") || undefined,
    radius: searchParams.get("radius") || undefined,
    wildcardWorkTypes: searchParams.get("wildcardWorkTypes")?.split(",").filter(Boolean) || undefined,
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
                {t("freelancers.error.title") || t("freelancers.error.fallbackTitle")}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t("freelancers.error.description") || t("freelancers.error.fallbackDescription")}
            </p>
              <Button onClick={() => refetch()} variant="outline" disabled={isFetching}>
                {isFetching ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    {t("freelancers.loading.retrying")}
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    {t("freelancers.loading.tryAgain")}
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
                {t("freelancers.empty.title") || t("freelancers.empty.fallbackTitle")}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t("freelancers.empty.description") || t("freelancers.empty.fallbackDescription")}
              </p>
              <Button 
                onClick={() => refetch()} 
                variant="outline" 
                disabled={isFetching}
              >
                {isFetching ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    {t("freelancers.loading.refreshing")}
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    {t("freelancers.loading.refresh")}
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
        <div className="flex flex-col gap-1">
          <div className="text-xs text-black">
            {t("freelancers.results.found", { count: freelancers.length }) || 
             t("freelancers.results.fallbackFound", { count: freelancers.length })}
          </div>
          
          {/* Cache status indicator */}
          <div className="text-xs text-gray-500">
            {t("freelancers.cache.lastUpdated")}:
            {isFetching ? (
              <span className="text-blue-600 ml-1">{t("freelancers.loading.updating")}</span>
            ) : (
              <span className="text-green-600 ml-1">
                {new Date().toLocaleTimeString()}
              </span>
            )}
          </div>
          
          {/* Location search info */}
          {filters.latitude && filters.longitude && filters.radius && (
            <div className="text-xs text-gray-600">
              {t("freelancers.results.locationSearch", { radius: filters.radius })}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Manual refresh button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="text-xs"
          >
            {isFetching ? (
              <>
                <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                {t("freelancers.loading.updating")}
              </>
            ) : (
              <>
                <RefreshCw className="h-3 w-3 mr-1" />
                {t("freelancers.loading.refresh")}
              </>
            )}
          </Button>
          
          {/* Auto-update indicator */}
          {isFetching && (
            <div className="flex items-center gap-2 text-xs text-black">
              <RefreshCw className="h-4 w-4 animate-spin" />
              {t("freelancers.loading.updating")}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1 gap-4">
        {/* Freelancers list */}
      {freelancers.map((freelancer: Freelancer) => (
        <FreelancerCard 
          key={freelancer.id} 
          freelancer={freelancer}
        />
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
            }) || t("pagination.fallbackShowing", { 
              from: (currentPage - 1) * limit + 1, 
              to: Math.min(currentPage * limit, pagination.total),
              total: pagination.total 
            })}
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
              {t("pagination.previous") || t("pagination.fallbackPrevious")}
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
              {t("pagination.next") || t("pagination.fallbackNext")}
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
      'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200',
      'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200',
      'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200',
      'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200',
      'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200',
      'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200',
      'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200',
      'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200',
      'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200',
      'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200',
    ]
    
    // Use the category name to determine color (hash-based for consistency)
    const hash = categoryName.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0)
      return a & a
    }, 0)
    
    return colors[Math.abs(hash) % colors.length]
  }

  // Function to extract city from full location string
  const getCityFromLocation = (location: string | null): string => {
    if (!location) return ''
    
    // Split by common separators (comma, dash, etc.)
    const parts = location.split(/[,;\-–—]/).map(part => part.trim()).filter(Boolean)
    
    // If we have multiple parts, the first part is usually the city
    if (parts.length > 1) {
      // Sometimes the first part might be a street number, so check if it's numeric
      const firstPart = parts[0]
      if (/^\d+$/.test(firstPart) && parts.length > 2) {
        // If first part is numeric (street number), take the second part
        return parts[1]
      }
      return firstPart
    }
    
    // If only one part, return as is (might already be just city)
    return parts[0] || ''
  }

  return (
    <Card className="transition-all duration-200 hover:shadow-md hover:border-primary/20 hover:scale-[1.01] rounded-xl">
      <a href={`/freelancers/${freelancer.id}`}>
              <CardContent className="h-full flex flex-col justify-between pt-6 px-4">
                    <div className="flex flex-col md:flex-row gap-6 justify-between items-start">
            <div className="w-1/6">
             <div className="flex flex-col items-center gap-2">
               <Avatar className="h-32 w-32 rounded-md">
                <AvatarImage 
                  src={freelancer.avatar_url || "/placeholder.svg"}
                  alt={`${freelancer.first_name} ${freelancer.last_name}`}
                />
                <AvatarFallback>{initials}</AvatarFallback>
               </Avatar>
               
               {/* Verified Status Badge */}
               {freelancer.is_verified && (
                 <Badge variant="secondary" className="bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 text-xs">
                   <CheckCircle className="h-3 w-3 mr-1" />
                   {t("freelancer.verified")}
                 </Badge>
               )}
             </div>
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
                  <span className="text-xs font-medium ml-1">{freelancer.completed_bookings || "0"} {t("freelancer.completedJobs") || t("freelancer.fallbackCompletedJobs")}</span>
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
               <div className="flex items-center gap-2">
                 <TooltipProvider>
                   <Tooltip>
                     <TooltipTrigger asChild>
                       <div className="text-xs cursor-help" style={{ borderStyle: 'dashed', borderWidth: '0 0 1px 0', borderImage: 'repeating-linear-gradient(to right, #9ca3af 0, #9ca3af 4px, transparent 4px, transparent 8px) 1' }}>
                         {getCityFromLocation(freelancer.location)}
                       </div>
                     </TooltipTrigger>
                     <TooltipContent>
                       <p className="text-sm">{freelancer.location || t("freelancers.tooltips.noLocation")}</p>
                     </TooltipContent>
                   </Tooltip>
                 </TooltipProvider>
                 
                 {/* Distance Display */}
                 {freelancer.distance !== null && freelancer.distance !== undefined && (
                   <span className="text-xs text-green-600 font-medium">
                     ({freelancer.distance.toFixed(1)} {t("freelancers.distance.away")})
                   </span>
                 )}
               </div>
               </div>
              {/* Job Offerings */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-2 auto-rows-fr">
                  {freelancer.job_offerings?.map((offering) => (
                    <div key={offering.id} className="flex flex-col gap-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link href={`/freelancers/${freelancer.id}${offering.category_id ? `?category=${offering.category_id}` : ''}`}>
                              <Badge 
                                className={`text-xs cursor-pointer flex flex-col items-start justify-start rounded-md border transition-colors h-full hover:shadow-md hover:scale-105 ${
                                  offering.is_wildcard 
                                    ? 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200'
                                    : getCategoryColor(offering.category_name)
                                }`}
                                onClick={(e) => e.stopPropagation()}
                              >
                            <div className="flex flex-col items-start justify-start gap-1 p-1 w-full h-full relative">
                              {/* DBA Status - Positioned at top right (not shown for wildcard) */}
                              {!offering.is_wildcard && offering.dba_status?.is_completed && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="absolute top-1 right-1 text-xxs px-1 py-0.5 rounded-full font-medium bg-green-100 text-green-800 z-10 cursor-help">
                                        <Shield className="h-3 w-3" />
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="text-sm">{t("freelancers.dba.completedTooltip")}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                              
                              {/* Title - show category_name for wildcard, subcategory_name for regular */}
                              <span className="font-bold flex items-center gap-1">
                                {offering.is_wildcard && <span className="text-orange-600">🎯</span>}
                                {offering.is_wildcard ? offering.category_name : offering.subcategory_name}
                              </span>
                              
                              {/* Wildcard Work Types */}
                              {offering.is_wildcard && offering.description && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {offering.description.split('\n\nWork Types: ')[1]?.split(', ').slice(0, 2).map((workType, index) => (
                                    <span key={index} className="text-xs bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded">
                                      {workType}
                                    </span>
                                  ))}
                                  {(offering.description.split('\n\nWork Types: ')[1]?.split(', ').length || 0) > 2 && (
                                    <span className="text-xs text-orange-600">+{(offering.description.split('\n\nWork Types: ')[1]?.split(', ').length || 0) - 2}</span>
                                  )}
                                </div>
                              )}
                              
                              {/* Pricing and Experience */}
                              <div className="flex gap-4 mt-1">
                                {offering.pricing_type === "packages" ? (
                                  // Package pricing display
                                  (() => {
                                    const activePackages = offering.job_offering_packages?.filter(p => p.is_active) || []
                                    return activePackages.length > 0 ? (
                                      <span className="text-xs font-normal">
                                        {activePackages.length === 1 
                                          ? `€${activePackages[0].price} ${t("freelancers.package")}`
                                          : t("freelancers.fromPrice", { price: Math.min(...activePackages.map(p => p.price)) }) + ` ${t("freelancers.packages")}`
                                        }
                                      </span>
                                    ) : (
                                      <span className="text-xs font-normal text-gray-500">
                                        {t("freelancers.packagesAvailable")}
                                      </span>
                                    )
                                  })()
                                ) : (
                                  // Hourly pricing display
                                  offering.hourly_rate && (
                                    <span className="text-xs font-normal">
                                      {t("freelancers.tooltips.rate", { rate: offering.hourly_rate })}
                                    </span>
                                  )
                                )}
                                {offering.experience_years && (
                                  <span className="text-xs">
                                    {t("freelancers.tooltips.yearsExp", { years: offering.experience_years })}
                                  </span>
                                )}
                              </div>
                              
                              {/* Description (exclude work types for wildcard) */}
                              {offering.description && (
                                <div className="flex items-center gap-1 mt-1 font-normal">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="line-clamp-2 text-xs cursor-help">
                                          {offering.is_wildcard 
                                            ? offering.description.split('\n\nWork Types: ')[0]
                                            : offering.description
                                          }
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent className="max-w-xs">
                                        <p className="text-sm whitespace-pre-wrap">
                                          {offering.is_wildcard 
                                            ? offering.description.split('\n\nWork Types: ')[0]
                                            : offering.description
                                          }
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                              )}
                              </div>
                            </Badge>
                            </Link>
                          </TooltipTrigger>
                          {/* <TooltipContent className="max-w-xs">
                            <div className="space-y-2">
                              <p className="font-medium">{offering.category_name}</p>
                              {offering.subcategory_name && (
                                <p className="text-sm text-gray-600">{offering.subcategory_name}</p>
                              )}
                              {offering.hourly_rate && (
                                <p className="text-sm">{t("freelancers.tooltips.rate", { rate: offering.hourly_rate })}</p>
                              )}
                              {offering.experience_years && (
                                <p className="text-sm">{t("freelancers.tooltips.experience", { years: offering.experience_years })}</p>
                              )}
                              {offering.dba_status ? (
                                <div className="text-sm">
                                  <p>{t("freelancers.dba.status")}: {offering.dba_status.is_completed ? t("freelancers.dba.completed") : t("freelancers.dba.incomplete")}</p>
                                  {offering.dba_status.risk_level && (
                                    <p>{t("freelancers.dba.riskLevel")}: {offering.dba_status.risk_level}</p>
                                  )}
                                  {offering.dba_status.risk_percentage > 0 && (
                                    <p>{t("freelancers.dba.risk")}: {offering.dba_status.risk_percentage}%</p>
                                  )}
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500">{t("freelancers.dba.status")}: {t("freelancers.dba.notAvailable")}</p>
                              )}
                            </div>
                          </TooltipContent> */}
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  ))}
                </div>
            </div>
          </div>
          
          {/* Message Button */}
          {/* <div className="flex justify-center mt-3">
            <Link href={`/freelancers/${freelancer.id}`}>
              <Button size="sm" variant="outline" className="w-full">
                <MessageCircle className="h-4 w-4 mr-2" />
                {t("freelancer.message") || t("freelancer.fallbackMessage")}
              </Button>
            </Link>
          </div> */}
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
