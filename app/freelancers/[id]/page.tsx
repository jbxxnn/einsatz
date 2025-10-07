"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useOptimizedSupabase } from "@/components/optimized-supabase-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import FreelancerAvailabilityCalendar from "@/components/freelancer-availability-calendar"
import { toast } from "@/lib/toast"
import { MapPin, Star, Clock, CheckCircle, Info, MessageCircle, Shield, Award, Zap, Globe, User, Loader, ShieldCheck } from "lucide-react"
import Image from "next/image"
import type { Database } from "@/lib/database.types"
import BookingForm from "@/components/booking-form"
import LeftPackageSelection from "@/components/left-package-selection"
import { useTranslation } from "@/lib/i18n"
import { getCoverTemplate } from "@/lib/cover-templates"
import OptimizedHeader from "@/components/optimized-header"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]
type JobOffering = Database["public"]["Tables"]["freelancer_job_offerings"]["Row"] & {
  category_name: string
  subcategory_name?: string
  icon?: string
  is_wildcard?: boolean
  dba_status?: {
    is_completed: boolean
    risk_level: string
    risk_percentage: number
  } | null
  job_offering_packages?: Array<{
    id: string
    package_name: string
    short_description: string | null
    price: number
    display_order: number
    is_active: boolean
  }>
}


const CustomProfileIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg 
  className={props.className}
  xmlns="http://www.w3.org/2000/svg" 
  width="18" 
  height="18" 
  viewBox="0 0 24 24" 
  fill="none">
    <path opacity=".4" d="M12 2C9.38 2 7.25 4.13 7.25 6.75c0 2.57 2.01 4.65 4.63 4.74.08-.01.16-.01.22 0h.07a4.738 4.738 0 0 0 4.58-4.74C16.75 4.13 14.62 2 12 2Z" 
    fill="currentColor"
    ></path>
    <path d="M17.08 14.149c-2.79-1.86-7.34-1.86-10.15 0-1.27.85-1.97 2-1.97 3.23s.7 2.37 1.96 3.21c1.4.94 3.24 1.41 5.08 1.41 1.84 0 3.68-.47 5.08-1.41 1.26-.85 1.96-1.99 1.96-3.23-.01-1.23-.7-2.37-1.96-3.21Z" 
    fill="currentColor"
    ></path>
    </svg>
)
const CustomViewDetailsIcon = (props: React.SVGProps<SVGSVGElement>) => (
  
  <svg 
  className={props.className}
  xmlns="http://www.w3.org/2000/svg" 
  width="18" 
  height="18" 
  viewBox="0 0 24 24" 
  fill="none">
    <path opacity=".4" d="M16.19 2H7.81C4.17 2 2 4.17 2 7.81v8.37C2 19.83 4.17 22 7.81 22h8.37c3.64 0 5.81-2.17 5.81-5.81V7.81C22 4.17 19.83 2 16.19 2Z" 
    fill="currentColor">
      </path>
      <path d="M16 11.25h-3.25V8c0-.41-.34-.75-.75-.75s-.75.34-.75.75v3.25H8c-.41 0-.75.34-.75.75s.34.75.75.75h3.25V16c0 .41.34.75.75.75s.75-.34.75-.75v-3.25H16c.41 0 .75-.34.75-.75s-.34-.75-.75-.75Z" 
      fill="currentColor">
        </path>
        </svg>
  )
const CustomResponseIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg 
  className={props.className}
  xmlns="http://www.w3.org/2000/svg" 
  width="18" 
  height="18" 
  viewBox="0 0 24 24" 
  fill="none">
    <path d="M15.2347 9.35222C14.7986 8.3708 14.1647 7.48993 13.3727 6.76472L12.719 6.16501C12.6968 6.14521 12.6701 6.13115 12.6412 6.12408C12.6124 6.11701 12.5822 6.11714 12.5533 6.12446C12.5245 6.13178 12.4979 6.14606 12.4759 6.16606C12.4539 6.18605 12.4371 6.21114 12.427 6.23913L12.1351 7.07693C11.9531 7.60251 11.6185 8.13933 11.1445 8.66716C11.1131 8.70085 11.0771 8.70984 11.0524 8.71208C11.0277 8.71433 10.9895 8.70984 10.9559 8.67839C10.9244 8.65144 10.9087 8.61101 10.9109 8.57058C10.994 7.21843 10.5897 5.69333 9.70478 4.03347C8.97256 2.65437 7.95508 1.57849 6.68379 0.828294L5.75615 0.282493C5.63486 0.210618 5.47988 0.304954 5.48662 0.446458L5.53603 1.52458C5.56973 2.2613 5.48437 2.91267 5.28223 3.45398C5.03516 4.11657 4.68027 4.732 4.22656 5.28454C3.91081 5.66854 3.55294 6.01587 3.15967 6.31999C2.2125 7.0481 1.44233 7.98105 0.906836 9.049C0.372656 10.1263 0.0944017 11.3123 0.09375 12.5147C0.09375 13.5749 0.302637 14.6013 0.715918 15.5694C1.11497 16.5015 1.69085 17.3474 2.41172 18.0603C3.13945 18.7791 3.98398 19.3451 4.9251 19.7382C5.8999 20.1469 6.9331 20.3536 8 20.3536C9.06689 20.3536 10.1001 20.1469 11.0749 19.7404C12.0137 19.3496 12.8674 18.7797 13.5883 18.0626C14.316 17.3438 14.8865 16.5038 15.2841 15.5717C15.6967 14.6062 15.9084 13.5669 15.9062 12.517C15.9062 11.4209 15.6816 10.3562 15.2347 9.35222Z" 
    fill="currentColor">
      </path>
      </svg>
)
const CustomPaymentsIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg 
  className={props.className}
  xmlns="http://www.w3.org/2000/svg" 
  width="18" 
  height="18" 
  viewBox="0 0 24 24" 
  fill="none">
    <path opacity=".4" d="M19.3 7.92v5.15c0 3.08-1.76 4.4-4.4 4.4H6.11c-.45 0-.88-.04-1.28-.13-.25-.04-.49-.11-.71-.19-1.5-.56-2.41-1.86-2.41-4.08V7.92c0-3.08 1.76-4.4 4.4-4.4h8.79c2.24 0 3.85.95 4.28 3.12.07.4.12.81.12 1.28Z" 
    fill="currentColor">
      </path>
      <path d="M22.298 10.92v5.15c0 3.08-1.76 4.4-4.4 4.4h-8.79c-.74 0-1.41-.1-1.99-.32-1.19-.44-2-1.35-2.29-2.81.4.09.83.13 1.28.13h8.79c2.64 0 4.4-1.32 4.4-4.4V7.92c0-.47-.04-.89-.12-1.28 1.9.4 3.12 1.74 3.12 4.28Z" 
      fill="currentColor">
        </path>
        <path d="M10.5 13.14a2.64 2.64 0 1 0 0-5.28 2.64 2.64 0 0 0 0 5.28ZM4.781 8.25c-.41 0-.75.34-.75.75v3c0 .41.34.75.75.75s.75-.34.75-.75V9c0-.41-.33-.75-.75-.75ZM16.21 8.25c-.41 0-.75.34-.75.75v3c0 .41.34.75.75.75s.75-.34.75-.75V9c0-.41-.33-.75-.75-.75Z" 
        fill="currentColor">
          </path>
          </svg>
)
const CustomNoBookingsIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg 
  className={props.className}
  xmlns="http://www.w3.org/2000/svg" 
  width="50" 
  height="50" 
  viewBox="0 0 24 24" 
  fill="none">
    <path opacity=".4" d="M21.08 8.58v6.84c0 1.12-.6 2.16-1.57 2.73l-5.94 3.43c-.97.56-2.17.56-3.15 0l-5.94-3.43a3.15 3.15 0 0 1-1.57-2.73V8.58c0-1.12.6-2.16 1.57-2.73l5.94-3.43c.97-.56 2.17-.56 3.15 0l5.94 3.43c.97.57 1.57 1.6 1.57 2.73Z" 
    fill="currentColor">
      </path>
      <path d="M12 13.75c-.41 0-.75-.34-.75-.75V7.75c0-.41.34-.75.75-.75s.75.34.75.75V13c0 .41-.34.75-.75.75ZM12 17.249c-.13 0-.26-.03-.38-.08-.13-.05-.23-.12-.33-.21-.09-.1-.16-.21-.22-.33a.986.986 0 0 1-.07-.38c0-.26.1-.52.29-.71.1-.09.2-.16.33-.21.37-.16.81-.07 1.09.21.09.1.16.2.21.33.05.12.08.25.08.38s-.03.26-.08.38-.12.23-.21.33a.99.99 0 0 1-.71.29Z" 
      fill="currentColor">
        </path>
        </svg>
)
const CustomMapIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg 
  className={props.className}
  xmlns="http://www.w3.org/2000/svg" 
  width="24" 
  height="24" 
  viewBox="0 0 24 24" 
  fill="none">
    <path opacity=".4" d="M20.621 8.45c-1.05-4.62-5.08-6.7-8.62-6.7h-.01c-3.53 0-7.57 2.07-8.62 6.69-1.17 5.16 1.99 9.53 4.85 12.28a5.436 5.436 0 0 0 3.78 1.53c1.36 0 2.72-.51 3.77-1.53 2.86-2.75 6.02-7.11 4.85-12.27Z" 
    fill="currentColor">
      </path>
      <path d="M12.002 13.46a3.15 3.15 0 1 0 0-6.3 3.15 3.15 0 0 0 0 6.3Z" 
      fill="currentColor">
        </path>
        </svg>
)
const CustomMessagesIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg 
  className={props.className}
  xmlns="http://www.w3.org/2000/svg" 
  width="24" 
  height="24" 
  viewBox="0 0 24 24" 
  fill="none">
    <path opacity=".4" d="M2 12.97V6.99C2 4.23 4.24 2 7 2h10c2.76 0 5 2.23 5 4.99v6.98c0 2.75-2.24 4.98-5 4.98h-1.5c-.31 0-.61.15-.8.4l-1.5 1.99c-.66.88-1.74.88-2.4 0l-1.5-1.99c-.16-.22-.52-.4-.8-.4H7c-2.76 0-5-2.23-5-4.98v-1Z" 
    fill="currentColor">
      </path>
      <path d="M12 12c-.56 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.44 1-1 1ZM16 12c-.56 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.44 1-1 1ZM8 12c-.56 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.44 1-1 1Z" 
      fill="currentColor">
        </path>
        </svg>
)

interface FreelancerWithOfferings extends Profile {
  job_offerings: JobOffering[]
  is_available_now: boolean
}

// Skeleton for immediate loading
function FreelancerProfileSkeleton() {
  return (
    <div className="container py-10">
      <div className="relative mb-8">
        <div className="h-64 rounded-2xl bg-muted animate-pulse" />
        <div className="absolute -bottom-16 left-8">
          <div className="w-32 h-32 rounded-full border-8 border-white shadow-lg bg-muted animate-pulse" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mt-20">
        <div className="lg:col-span-1 space-y-6">
          <div className="space-y-4">
            <div className="h-8 w-48 bg-muted rounded animate-pulse" />
            <div className="flex gap-2">
              <div className="h-6 w-20 bg-muted rounded animate-pulse" />
              <div className="h-6 w-20 bg-muted rounded animate-pulse" />
            </div>
            <div className="h-4 w-32 bg-muted rounded animate-pulse" />
            <div className="h-10 w-full bg-muted rounded animate-pulse" />
            <div className="h-10 w-full bg-muted rounded animate-pulse" />
          </div>
        </div>
        <div className="lg:col-span-3 space-y-8">
          <div className="h-10 w-40 bg-muted rounded animate-pulse" />
          <div className="h-64 w-full bg-muted rounded animate-pulse" />
        </div>
      </div>
    </div>
  )
}

export default function FreelancerProfile() {
  const { t } = useTranslation()
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { supabase } = useOptimizedSupabase()
  const [freelancer, setFreelancer] = useState<FreelancerWithOfferings | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | null>(null)
  const [selectedPackageData, setSelectedPackageData] = useState<{
    package: any
    items: Array<{
      item: any
      quantity: number
      total: number
    }>
    totalPrice: number
  } | null>(null)
  const [reviews, setReviews] = useState<any[]>([])
  const [completedJobs, setCompletedJobs] = useState<number>(0)
  const [activeTab, setActiveTab] = useState<'services' | 'reviews'>('services')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalReviews, setTotalReviews] = useState(0)
  const reviewsPerPage = 20
  const [conversationId, setConversationId] = useState<string | null>(null)

  // Clear selected date when category changes
  useEffect(() => {
    setSelectedDate(undefined)
  }, [selectedCategoryId, selectedSubcategoryId])

  useEffect(() => {
    const fetchFreelancer = async () => {
      setLoading(true)

      try {
        // Fetch freelancer profile
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", params.id)
          .eq("user_type", "freelancer")
          .single()

        if (error) {
          throw error
        }

        // Fetch job offerings with packages
        const { data: offeringsData, error: offeringsError } = await supabase
          .from("freelancer_job_offerings")
          .select(`
          *,
          job_categories (id, name, icon),
          job_subcategories (id, name),
          job_offering_packages (
            id,
            package_name,
            short_description,
            price,
            display_order,
            is_active
          )
        `)
          .eq("freelancer_id", params.id)
          .order("display_order", { ascending: true, nullsFirst: false })

        if (offeringsError) {
          throw offeringsError
        }

        // Fetch DBA status for this freelancer
        const { data: dbaData } = await supabase
          .from('freelancer_dba_completions')
          .select('job_category_id, risk_level, risk_percentage, is_completed')
          .eq('freelancer_id', params.id)

        // Create DBA status map
        const dbaMap = new Map()
        dbaData?.forEach(dba => {
          dbaMap.set(dba.job_category_id, {
            is_completed: dba.is_completed,
            risk_level: dba.risk_level,
            risk_percentage: dba.risk_percentage
          })
        })

        // Format job offerings with DBA status and packages
        const formattedOfferings = offeringsData.map((offering) => ({
          ...offering,
          category_name: offering.job_categories?.name || "Wildcard Services",
          icon: offering.job_categories?.icon || "🎯",
          subcategory_name: offering.job_subcategories?.name || null,
          dba_status: dbaMap.get(offering.category_id) || null,
          job_offering_packages: offering.job_offering_packages?.filter((pkg: any) => pkg.is_active) || []
        }))

        // Check real-time availability
        const { data: availabilityData } = await supabase
          .from("real_time_availability")
          .select("*")
          .eq("freelancer_id", params.id)
          .eq("is_available_now", true)

        const isAvailableNow = availabilityData && availabilityData.length > 0

        // Set the freelancer with offerings
        setFreelancer({
          ...data,
          job_offerings: formattedOfferings,
          is_available_now: isAvailableNow,
        })
        
        // No automatic selection - user must choose a service
        // if (formattedOfferings.length > 0) {
        //   setSelectedCategoryId(formattedOfferings[0].category_id)
        // }

        // Fetch total reviews count
        const { count: totalReviewsCount } = await supabase
          .from("reviews")
          .select("*", { count: "exact", head: true })
          .eq("reviewee_id", params.id)

        setTotalReviews(totalReviewsCount || 0)

        // Fetch or create conversation for this freelancer
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          // Always create or get conversation using the RPC function
          const { data: conversationData } = await supabase
            .rpc('create_or_get_conversation', {
              p_user_id: user.id,
              p_recipient_id: params.id,
              p_booking_id: null
            })
          
          if (conversationData && conversationData.conversation_id) {
            console.log('Conversation created/found:', conversationData.conversation_id)
            setConversationId(conversationData.conversation_id)
          } else {
            console.log('No conversation data received:', conversationData)
          }
        }
        
        // Fetch reviews with service information (paginated)
        const from = (currentPage - 1) * reviewsPerPage
        const to = from + reviewsPerPage - 1

        const { data: reviewsData } = await supabase
          .from("reviews")
          .select(`
            *,
            profiles!reviewer_id(first_name, last_name, avatar_url),
            bookings!inner(
              category_id,
              job_categories(name),
              job_subcategories(name)
            )
          `)
          .eq("reviewee_id", params.id)
          .order("created_at", { ascending: false })
          .range(from, to)

        setReviews(reviewsData || [])

        // Fetch completed jobs count
        const { count: completedJobsCount } = await supabase
          .from("bookings")
          .select("*", { count: "exact", head: true })
          .eq("freelancer_id", params.id)
          .eq("status", "completed")

        setCompletedJobs(completedJobsCount || 0)
      } catch (error) {
        console.error("Error fetching freelancer:", error)
        toast.error(t("freelancer.id.error.failedToLoadProfile"))
        router.push("/freelancers")
      } finally {
        setLoading(false)
      }
    }

    fetchFreelancer()
  }, [supabase, params.id, router, currentPage])

  // Handle URL synchronization for category selection
  useEffect(() => {
    // Read category from URL on page load
    const categoryFromUrl = searchParams.get('category')
    if (categoryFromUrl && freelancer) {
      // Check if the category exists in the freelancer's offerings
      const categoryExists = freelancer.job_offerings.some(offering => offering.category_id === categoryFromUrl)
      if (categoryExists) {
        setSelectedCategoryId(categoryFromUrl)
      }
    }
  }, [searchParams, freelancer])

  // Update URL when category is selected
  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategoryId(categoryId)
    // Update URL with category parameter
    const newSearchParams = new URLSearchParams(searchParams.toString())
    newSearchParams.set('category', categoryId)
    router.push(`/freelancers/${params.id}?${newSearchParams.toString()}`, { scroll: false })
  }

  // Clear category from URL when deselected
  const handleCategoryDeselect = () => {
    setSelectedCategoryId(null)
    setSelectedPackageData(null)
    // Remove category from URL
    const newSearchParams = new URLSearchParams(searchParams.toString())
    newSearchParams.delete('category')
    const newUrl = newSearchParams.toString() 
      ? `/freelancers/${params.id}?${newSearchParams.toString()}`
      : `/freelancers/${params.id}`
    router.push(newUrl, { scroll: false })
  }

  const handlePackageSelect = (packageData: {
    package: any
    items: Array<{
      item: any
      quantity: number
      total: number
    }>
    totalPrice: number
  }) => {
    setSelectedPackageData(packageData)
  }
  
  const getSelectedOffering = () => {
    if (!freelancer || !selectedCategoryId) return null
    // First try to find exact match with subcategory
    if (selectedSubcategoryId) {
    return freelancer.job_offerings.find((offering) => offering.category_id === selectedCategoryId && offering.subcategory_id === selectedSubcategoryId)
    }
    // If no subcategory selected, return the first offering for this category
    return freelancer.job_offerings.find((offering) => offering.category_id === selectedCategoryId)
  }
  const getSelectedSubcategory = () => {
    if (!freelancer || !selectedCategoryId) return null
    return freelancer.job_offerings.find((offering) => offering.category_id === selectedCategoryId && offering.subcategory_id === selectedSubcategoryId)
  }

  if (loading) {
    return <FreelancerProfileSkeleton />
  }

  if (!freelancer) {
    return (
      <div className="container py-10 text-center">
        <h1 className="text-2xl font-bold mb-4">{t("freelancer.id.error.freelancerNotFound")}</h1>
        <Button onClick={() => router.push("/freelancers")}>{t("freelancer.id.error.backToFreelancers")}</Button>
      </div>
    )
  }
  
  const selectedOffering = getSelectedOffering()
  const selectedSubcategory = getSelectedSubcategory()
  return (
    <>
    <OptimizedHeader />
    <div className="min-h-screen w-full bg-[#f7f7f7]">
      <div className="py-8 px-8 container">

      {/* New Behance-style Layout */}
      <div className="mx-auto">
        {/* Hero Section with Banner */}
        <div className="relative mb-8">
          {/* Banner Background */}
          <div 
            className="h-64 rounded-2xl relative overflow-hidden"
            style={{
              background: getCoverTemplate((freelancer.metadata as any)?.coverTemplate)?.pattern || "linear-gradient(135deg, #1e293b 0%, #334155 50%, #64748b 100%)",
              backgroundSize: "cover"
            }}
          >
            <div className="absolute inset-0 opacity-20">
              <div className="w-full h-full" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
              }}></div>
            </div>
          </div>
          
          {/* Profile Picture Overlay */}
          <div className="absolute -bottom-16 left-8">
            <div className="relative">
              <div className="w-32 h-32 rounded-full border-8 border-white shadow-lg bg-white">
                <div className="w-full h-full rounded-full overflow-hidden">
                  <Image
                    src={freelancer.avatar_url || `/placeholder.svg?height=128&width=128&text=${freelancer.first_name || "F"}`}
                    alt={`${freelancer.first_name} ${freelancer.last_name}`}
                    fill
                    className="object-cover rounded-full"
                  />
                </div>
              </div>
              {freelancer.is_verified && (
                <div className="absolute -bottom-1 -right-1">
                  <Badge className="bg-[#33CC99] hover:bg-[#2BB88A] text-white font-light text-xs">
                      <ShieldCheck className="h-3 w-3 mr-1" />
                      {t("freelancer.id.verified")}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mt-20">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto space-y-8 bg-white rounded-lg p-4">
              {/* Profile Information */}
              <div className="space-y-8">
                <div className="space-y-4">
                <h1 className="text-3xl font-bold tracking-tight">
                  {freelancer.first_name} {freelancer.last_name}
                </h1>

                {/* Status Badges */}
                <div className="flex flex-wrap gap-2">
                  {freelancer.is_available_now && (
                    <Badge className="bg-green-500 hover:bg-green-600 text-white">
                      <div className="w-2 h-2 bg-white rounded-full mr-1"></div>
                      {t("freelancer.id.availableNow")}
                    </Badge>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-2 text-sm text-black">
                  <div className="flex items-center">
                    <CustomProfileIcon className="h-4 w-4 mr-2 text-black" />
                    <span className="text-xs text-black">
                      {freelancer.metadata && typeof freelancer.metadata === 'object' && 'role' in freelancer.metadata 
                        ? freelancer.metadata.role as string 
                        : t("freelancer.id.freelancer")
                      }
                    </span>
                  </div>
                  {freelancer.location && (
                    <div className="flex items-center">
                      <CustomMapIcon className="h-6 w-6 mr-2 text-black" />
                      <span className="underline text-xs text-black">{freelancer.location}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Message Button */}
              <div className="flex justify-center mt-4">
                <div className="w-full">
                  <Link href={conversationId ? `/messages?conversation=${conversationId}` : `/messages`}>
                    <Button 
                      variant="outline" 
                      className="w-full bg-[#33CC99] hover:bg-[#2BB88A] text-white"
                      disabled={!conversationId}
                    >
                      <CustomMessagesIcon className="h-4 w-4 mr-2" />
                      {conversationId ? t("freelancer.id.messageFreelancer") : t("freelancer.id.loading")}
                    </Button>
                  </Link>
                </div>
              </div>

                {/* Action Buttons */}
               

            

                <div className="flex flex-col justify-between space-y-4">
                  <div className="flex flex-col mb-4">
                    <span className="font-semibold text-black text-sm mb-2">{t("freelancer.id.aboutMe")}</span>
                    <span className="text-black text-xs">{freelancer.bio}</span>
                  </div>
                  <div className="flex flex-col mb-4">
                    <span className="font-semibold text-black text-sm mb-2 mr-2">{t("freelancer.id.memberSince")}</span>
                    <span className="text-black text-xs">{new Date(freelancer.created_at).toLocaleDateString('en-US', { 
                       year: 'numeric', 
                       month: 'long', 
                       day: 'numeric' 
                     })}</span>
                   </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Navigation Tabs */}
            <div className="border-b">
              <div className="flex space-x-8">
                <button 
                  className={`pb-2 border-b-2 text-black text-sm font-medium transition-colors ${
                    activeTab === 'services' 
                      ? 'border-primary text-primary' 
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setActiveTab('services')}
                >
                  {t("freelancer.id.services")}
                </button>
                <button 
                  className={`pb-2 border-b-2 text-black text-sm font-medium transition-colors ${
                    activeTab === 'reviews' 
                      ? 'border-primary text-primary' 
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setActiveTab('reviews')}
                >
                  {t("freelancer.id.reviews")}
                </button>
              </div>
            </div>

            {/* Services Tab */}
            {activeTab === 'services' && (
              <div className="space-y-6 bg-white rounded-lg p-8">
                
                {/* Step 1: Service Categories Selection */}
                <div className="space-y-4">
                  {/* Show categories only when none is selected */}
                  {!selectedCategoryId && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                      {freelancer.job_offerings.map((offering) => (
                        <div 
                          key={offering.category_id} 
                          className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-md hover:border-[#33CC99]"
                          onClick={() => handleCategorySelect(offering.category_id)}
                        >
                          {/* Top gradient bar */}
                          <div className="h-2 bg-gradient-to-r from-pink-300 to-red-400 rounded-full mb-3"></div>
                          
                          {/* Service details */}
                          <div className="space-y-3">
                            {/* Category name */}
                            <div className="flex items-center space-x-2">
                              {offering.is_wildcard ? (
                                <>
                                  <span className="text-orange-600 text-lg">🎯</span>
                                  <h4 className="font-bold text-black text-sm">{offering.category_name}</h4>
                                </>
                              ) : (
                                <>
                                  <CustomResponseIcon className="h-4 w-4 text-[#33CC99]" />
                                  <h4 className="font-bold text-black text-sm">{offering.subcategory_name}</h4>
                                </>
                              )}
                            </div>
                            
                            {/* Wildcard Work Types */}
                            {offering.is_wildcard && offering.description && (
                              <div className="flex flex-wrap gap-1">
                                {offering.description.split('\n\nWork Types: ')[1]?.split(', ').slice(0, 3).map((workType, index) => (
                                  <span key={index} className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                                    {workType}
                                  </span>
                                ))}
                                {(offering.description.split('\n\nWork Types: ')[1]?.split(', ').length || 0) > 3 && (
                                  <span className="text-xs text-orange-600">+{(offering.description.split('\n\nWork Types: ')[1]?.split(', ').length || 0) - 3} more</span>
                                )}
                              </div>
                            )}
                            
                            {/* Pricing */}
                            <div className="flex items-center space-x-2">
                              <CustomPaymentsIcon className="h-4 w-4 text-[#33CC99]" />
                              {offering.pricing_type === "packages" ? (
                                // Package pricing display
                                (() => {
                                  const activePackages = offering.job_offering_packages?.filter(p => p.is_active) || []
                                  return activePackages.length > 0 ? (
                                    <span className="font-bold text-black text-sm">
                                      {activePackages.length === 1 
                                        ? `€${activePackages[0].price} ${t("freelancer.id.package")}`
                                        : t("freelancer.id.fromPrice", { price: Math.min(...activePackages.map(p => p.price)) }) + ` ${t("freelancer.id.packages")}`
                                      }
                                    </span>
                                  ) : (
                                    <span className="font-bold text-black text-sm text-gray-500">
                                      {t("freelancers.packagesAvailable")}
                                    </span>
                                  )
                                })()
                              ) : (
                                // Hourly pricing display
                                <span className="font-bold text-black text-sm">€{offering.hourly_rate} p/hr</span>
                              )}
                            </div>
                            
                            {/* Description (exclude work types for wildcard) */}
                            {offering.description && (
                              <div className="flex items-start space-x-2">
                                <CustomNoBookingsIcon className="h-4 w-4 text-[#33CC99] mt-0.5" />
                                <span className="text-black text-xs">
                                  {offering.is_wildcard 
                                    ? offering.description.split('\n\nWork Types: ')[0]
                                    : offering.description
                                  }
                                </span>
                              </div>
                            )}
                            
                            {/* Experience years */}
                            {offering.experience_years && (
                              <div className="flex items-center space-x-2">
                                <CustomViewDetailsIcon className="h-4 w-4 text-[#33CC99]" />
                                <span className="text-black text-xs">{t("freelancer.id.yearsOfExperience", { years: offering.experience_years })}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Step 2: Booking Section (only shown after category selection) */}
                  {selectedCategoryId && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Left Side: Category Information Card */}
                      <div className="space-y-4">
                        <Card className="h-fit">
                          <CardHeader>
                            <div className="flex justify-between items-center w-full mb-4">
                      <Button
                        variant="outline"
                        size="sm"
                                onClick={handleCategoryDeselect}
                                className="text-xs w-full"
                      >
                                {t("freelancer.id.changeFreelancerService")}
                      </Button>
                            </div>
                            <div className="space-y-3">
                              <div className="flex items-center gap-3 bg-gray-50 rounded-md p-3">
                                <div>
                                  <CardTitle className="text-lg">{getSelectedOffering()?.subcategory_name}</CardTitle>
                                  <CardDescription className="text-sm text-muted-foreground">{getSelectedOffering()?.category_name}</CardDescription>
                                </div>
                              </div>
                            </div>

                             {/* Service Description */}
                             {getSelectedOffering()?.description && (
                              <div className="pt-4">
                                <h4 className="text-sm font-medium mb-2">{t("freelancer.serviceDetails.serviceDescription")}</h4>
                                <p className="text-sm text-muted-foreground">{getSelectedOffering()?.description}</p>
                    </div>
                  )}
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {/* Package Selection or Service Details */}
                            {getSelectedOffering()?.pricing_type === "packages" ? (
                              <LeftPackageSelection
                                freelancerId={params.id as string}
                                categoryId={selectedCategoryId!}
                                categoryName={getSelectedOffering()?.category_name || ""}
                                onPackageSelect={handlePackageSelect}
                                selectedPackageData={selectedPackageData}
                              />
                            ) : (
                              <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium">{t("freelancer.serviceDetails.hourlyRate")}</span>
                                  <span className="text-lg font-bold text-primary">
                                    €{getSelectedOffering()?.hourly_rate || freelancer.hourly_rate}
                                  </span>
                                </div>
                                
                                {getSelectedOffering()?.experience_years && (
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">{t("freelancer.serviceDetails.experience")}</span>
                                    <span className="text-sm">{getSelectedOffering()?.experience_years} {getSelectedOffering()?.experience_years === 1 ? t("freelancer.year") : t("freelancer.years")}</span>
                                  </div>
                                )}

                                {getSelectedOffering()?.dba_status?.is_completed && (
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">{t("freelancer.serviceDetails.dbaStatus")}</span>
                                    <Badge variant="default" className="text-xs">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      {t("freelancer.serviceDetails.completed")}
                                    </Badge>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Booking Process Guide */}
                            <div className="border-t pt-4">
                              <h4 className="text-sm font-medium mb-3">{t("freelancer.bookingProcess.title")}</h4>
                              <div className="space-y-2">
                                {getSelectedOffering()?.pricing_type === "packages" ? (
                                  <>
                                    <div className="flex items-start gap-2">
                                      <div className="w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center font-medium">1</div>
                                      <p className="text-xs text-muted-foreground">{t("freelancer.id.selectAndCustomizePackage")}</p>
                                    </div>
                                    <div className="flex items-start gap-2">
                                      <div className="w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center font-medium">2</div>
                                      <p className="text-xs text-muted-foreground">{t("freelancer.bookingProcess.step2Calendar")}</p>
                                    </div>
                                    <div className="flex items-start gap-2">
                                      <div className="w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center font-medium">3</div>
                                      <p className="text-xs text-muted-foreground">{t("freelancer.bookingProcess.step3DBA")}</p>
                                    </div>
                                    <div className="flex items-start gap-2">
                                      <div className="w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center font-medium">4</div>
                                      <p className="text-xs text-muted-foreground">{t("freelancer.bookingProcess.step4Review")}</p>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div className="flex items-start gap-2">
                                      <div className="w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center font-medium">1</div>
                                      <p className="text-xs text-muted-foreground">{t("freelancer.bookingProcess.step1")}</p>
                                    </div>
                                    <div className="flex items-start gap-2">
                                      <div className="w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center font-medium">2</div>
                                      <p className="text-xs text-muted-foreground">{t("freelancer.bookingProcess.step2")}</p>
                                    </div>
                                    <div className="flex items-start gap-2">
                                      <div className="w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center font-medium">3</div>
                                      <p className="text-xs text-muted-foreground">{t("freelancer.bookingProcess.step3")}</p>
                                    </div>
                                    <div className="flex items-start gap-2">
                                      <div className="w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center font-medium">4</div>
                                      <p className="text-xs text-muted-foreground">{t("freelancer.bookingProcess.step4")}</p>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Important Notes */}
                            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                              <div className="flex items-start gap-2">
                                <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-xs font-medium text-blue-800">{t("freelancer.importantNotes.title")}</p>
                                  <ul className="text-xs text-blue-700 mt-1 space-y-1">
                                    <li>• {t("freelancer.importantNotes.paymentDirect")}</li>
                                    <li>• {t("freelancer.importantNotes.dbaCompliance")}</li>
                                    <li>• {t("freelancer.importantNotes.imageUpload")}</li>
                                    <li>• {t("freelancer.importantNotes.cancellationPolicy")}</li>
                                  </ul>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Right Side: Calendar and Booking Form */}
                      <div className="space-y-4">
                        <Card>
                          <CardContent className="p-6">
                            {!showBookingForm ? (
                              <div className="space-y-4">
                                <div>
                                  <FreelancerAvailabilityCalendar
                                    freelancerId={params.id as string}
                                    categoryId={selectedCategoryId}
                                    onSelectDate={setSelectedDate}
                                  />
                                </div>

                                <Button
                                  className="w-full bg-[#33CC99] hover:bg-[#2BB88A] text-white"
                                  disabled={
                                    !selectedDate || 
                                    (getSelectedOffering()?.pricing_type === "packages" && !selectedPackageData)
                                  }
                                  onClick={() => setShowBookingForm(true)}
                                >
                                  {getSelectedOffering()?.pricing_type === "packages" && !selectedPackageData
                                    ? t("freelancer.id.pleaseSelectPackageFirst")
                                    : t("freelancer.continueToBooking")
                                  }
                                </Button>
                              </div>
                            ) : (
                              <BookingForm
                                freelancer={freelancer}
                                selectedDate={selectedDate}
                                onBack={() => setShowBookingForm(false)}
                                selectedCategoryId={selectedCategoryId}
                                selectedPackageData={selectedPackageData}
                              />
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  )}

                  {/* Show message when no category is selected */}
                  {!selectedCategoryId && (
                    <div className="text-center py-8">
                      <p className="text-black text-sm">{t("freelancer.id.pleaseSelectServiceFirst")}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

                        {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  {reviews.length > 0 ? (
                    <>
                      {reviews.map((review) => (
                        <Card key={review.id}>
                          <CardContent className="p-6">
                            <div className="flex items-start space-x-4">
                              <div className="flex-shrink-0">
                                <div className="w-10 h-10 rounded-full overflow-hidden relative">
                                   <Image
                                     src={review.profiles?.avatar_url || `/placeholder.svg?height=40&width=40&text=${review.profiles?.first_name?.charAt(0) || "U"}`}
                                     alt={review.profiles?.first_name || t("freelancer.id.user")}
                                     fill
                                     className="rounded-full object-cover"
                                   />
                                </div>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <h4 className="font-medium">
                                    {review.profiles?.first_name} {review.profiles?.last_name}
                                  </h4>
                                  <div className="flex items-center">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`h-4 w-4 ${
                                          i < review.rating
                                            ? 'fill-yellow-400 text-yellow-400'
                                            : 'text-gray-300'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                </div>
                                {review.bookings?.job_categories?.name && (
                                  <div className="mb-2">
                                    <Badge variant="outline" className="text-xs">
                                      {review.bookings.job_categories.name}
                                    </Badge>
                                  </div>
                                )}
                                {review.comment && (
                                  <p className="text-sm text-muted-foreground">{review.comment}</p>
                                )}
                                <p className="text-xs text-muted-foreground mt-2">
                                  {new Date(review.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      
                      {/* Pagination Controls */}
                      {totalReviews > reviewsPerPage && (
                        <div className="flex items-center justify-between mt-6">
                          <div className="text-sm text-muted-foreground">
                            {t("freelancer.id.showingReviews", { 
                              from: ((currentPage - 1) * reviewsPerPage) + 1, 
                              to: Math.min(currentPage * reviewsPerPage, totalReviews),
                              total: totalReviews 
                            })}
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                              disabled={currentPage === 1}
                            >
                              {t("freelancer.id.previous")}
                            </Button>
                            <span className="text-sm">
                              {t("freelancer.id.pageOf", { current: currentPage, total: Math.ceil(totalReviews / reviewsPerPage) })}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage(prev => Math.min(Math.ceil(totalReviews / reviewsPerPage), prev + 1))}
                              disabled={currentPage >= Math.ceil(totalReviews / reviewsPerPage)}
                            >
                              {t("freelancer.id.next")}
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <Card>
                      <CardContent className="p-6 text-center">
                        <p className="text-muted-foreground">{t("freelancer.id.noReviewsYet")}</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Persistent Availability Pop-up */}
        {freelancer.is_available_now && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
            <div className="bg-black text-white rounded-lg px-4 py-3 flex items-center space-x-3 shadow-lg gap-12">
              <div className="w-8 h-8 overflow-hidden relative">
                <Image
                  src={freelancer.avatar_url || `/placeholder.svg?height=32&width=32&text=${freelancer.first_name || "F"}`}
                  alt={`${freelancer.first_name} ${freelancer.last_name}`}
                  fill
                  className="object-cover rounded-full"
                />
              </div>
              <div>
                <div className="font-medium">{t("freelancer.id.isAvailableForHire", { name: freelancer.first_name })}</div>
                {/* <div className="text-sm text-slate-300">Availability: Now</div> */}
              </div>
              <Button size="sm" className="bg-blue-500 hover:bg-blue-600">
                {t("freelancer.id.hire")} {freelancer.first_name}
              </Button>
              {/* <button className="text-slate-400 hover:text-white">
                <div className="w-4 h-4">×</div>
              </button> */}
            </div>
          </div>
        )}
      </div>
    </div>
    </div>
    </>
  )
}

