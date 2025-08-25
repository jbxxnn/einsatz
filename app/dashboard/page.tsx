"use client"

import { Suspense } from "react"
import { useState, useEffect } from "react"
import type { Database } from "@/lib/database.types"
import DashboardStats from "@/components/dashboard-stats"
import UpcomingBookings from "@/components/upcoming-bookings"
import { useOptimizedUser } from "@/components/optimized-user-provider"
import { useOptimizedSupabase } from "@/components/optimized-supabase-provider"
import { useDashboardStats } from "@/hooks/use-dashboard-stats"
import { useBookings } from "@/hooks/use-bookings"
import { usePerformanceMetrics } from "@/hooks/use-performance-metrics"
// import RecentMessages from "@/components/recent-messages"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { toast } from "@/lib/toast"
import { useRouter } from "next/navigation"
// import LoadingSpinner from "@/components/loading-spinner"
import { useTranslation } from "@/lib/i18n"
import FreelancerOnboardingProgress from "@/components/freelancer-onboarding-progress"

import { 
  SidebarProvider, 
  Sidebar, 
  SidebarHeader, 
  SidebarContent, 
  SidebarFooter,
  SidebarTrigger,
  SidebarInset
} from "@/components/ui/sidebar"
import ModernSidebarNav from "@/components/modern-sidebar-nav"
import { Loader, Calendar, TrendingUp, Users, Clock, MessageSquare, User, Download, Settings, Star, MapPin, Clock as ClockIcon, MoreHorizontal, Target, Award, TrendingDown, Euro, CheckCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import OptimizedHeader from "@/components/optimized-header"

type Booking = Database["public"]["Tables"]["bookings"]["Row"] & {
  freelancer: Database["public"]["Tables"]["profiles"]["Row"]
  client: Database["public"]["Tables"]["profiles"]["Row"]
}

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
const CustomBookingsIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg 
  className={props.className}
  xmlns="http://www.w3.org/2000/svg" 
  width="18" 
  height="18" 
  viewBox="0 0 24 24" 
  fill="none">
    <path opacity=".4" d="M17.53 7.77a.739.739 0 0 0-.21 0 2.874 2.874 0 0 1-2.78-2.88C14.54 3.3 15.83 2 17.43 2c1.59 0 2.89 1.29 2.89 2.89a2.89 2.89 0 0 1-2.79 2.88ZM20.792 14.7c-1.12.75-2.69 1.03-4.14.84.38-.82.58-1.73.59-2.69 0-1-.22-1.95-.64-2.78 1.48-.2 3.05.08 4.18.83 1.58 1.04 1.58 2.75.01 3.8ZM6.438 7.77c.07-.01.14-.01.21 0a2.874 2.874 0 0 0 2.78-2.88C9.428 3.3 8.138 2 6.538 2c-1.59 0-2.89 1.29-2.89 2.89a2.89 2.89 0 0 0 2.79 2.88ZM6.551 12.85c0 .97.21 1.89.59 2.72-1.41.15-2.88-.15-3.96-.86-1.58-1.05-1.58-2.76 0-3.81 1.07-.72 2.58-1.01 4-.85-.41.84-.63 1.79-.63 2.8Z" 
    fill="currentColor"
    ></path>
    <path d="M12.12 15.87a1.13 1.13 0 0 0-.26 0 3.425 3.425 0 0 1-3.31-3.43c0-1.9 1.53-3.44 3.44-3.44 1.9 0 3.44 1.54 3.44 3.44 0 1.86-1.46 3.37-3.31 3.43ZM8.87 17.94c-1.51 1.01-1.51 2.67 0 3.67 1.72 1.15 4.54 1.15 6.26 0 1.51-1.01 1.51-2.67 0-3.67-1.71-1.15-4.53-1.15-6.26 0Z" 
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
const CustomJobOfferingsIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg 
  className={props.className}
  xmlns="http://www.w3.org/2000/svg" 
  width="18" 
  height="18" 
  viewBox="0 0 24 24" 
  fill="none">
    <path fill="currentColor" d="M22 10.76a.86.86 0 00-.86-.86H2.86c-.48 0-.86.38-.86.86 0 5.89 4.11 10 10 10s10-4.12 10-10z" 
    opacity=".4">
      </path>
      <path fill="currentColor" d="M12.53 3.46l2.85 2.84c.29.29.29.77 0 1.06-.29.29-.77.29-1.06 0L12.75 5.8v9.57c0 .41-.34.75-.75.75s-.75-.34-.75-.75V5.8L9.69 7.37c-.29.29-.77.29-1.06 0a.753.753 0 01-.23-.53c0-.19.07-.38.22-.53l2.85-2.84c.29-.3.77-.3 1.06-.01z">
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

const CustomRescheduleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg 
  xmlns="http://www.w3.org/2000/svg" 
  width="24" 
  height="24" 
  viewBox="0 0 24 24" 
  fill="none">
    <path 
    opacity=".4" d="M16 12.692v5.39c0 2.34-1.56 3.89-3.89 3.89H5.89c-2.33 0-3.89-1.55-3.89-3.89v-7.77c0-2.34 1.56-3.89 3.89-3.89h3.83c1.03 0 2.02.41 2.75 1.14l2.39 2.38c.73.73 1.14 1.72 1.14 2.75Z" 
    fill="currentColor">
      </path>
      <path d="M22 8.249v5.39c0 2.33-1.56 3.89-3.89 3.89H16v-4.84c0-1.03-.41-2.02-1.14-2.75l-2.39-2.38a3.89 3.89 0 0 0-2.75-1.14H8v-.56c0-2.33 1.56-3.89 3.89-3.89h3.83c1.03 0 2.02.41 2.75 1.14l2.39 2.39A3.89 3.89 0 0 1 22 8.249Z" 
      fill="currentColor">
        </path>
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



function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[...Array(3)].map((_, i) => (
        <Skeleton key={i} className="h-24" />
      ))}
    </div>
  )
}



function BookingsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-40" />
      {[...Array(3)].map((_, i) => (
        <Skeleton key={i} className="h-32" />
      ))}
    </div>
  )
}

function MessagesSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-40" />
      {[...Array(3)].map((_, i) => (
        <Skeleton key={i} className="h-20" />
      ))}
    </div>
  )
}

function DashboardHeader({ profile }: { profile: any }) {
  const { t, locale } = useTranslation()
  const { stats, loading, error } = useDashboardStats()
  const currentDate = new Date().toLocaleDateString(locale === 'nl' ? 'nl-NL' : 'en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })

  const getTrendIcon = (trend: number) => {
    if (trend > 0) {
      return <TrendingUp className="h-4 w-4 text-green-600" />
    } else if (trend < 0) {
      return <TrendingDown className="h-4 w-4 text-red-600" />
    }
    return <TrendingUp className="h-4 w-4 text-gray-400" />
  }

  const getTrendColor = (trend: number) => {
    if (trend > 0) return "text-green-600"
    if (trend < 0) return "text-red-600"
    return "text-gray-600"
  }

  const getTrendText = (trend: number) => {
    if (trend > 0) return `${t("dashboard.trendUp", { trend: trend.toFixed(1) })}`
    if (trend < 0) return `${t("dashboard.trendDown", { trend: trend.toFixed(1) })}`
    return t("dashboard.trendNoChange")
  }

  // Client-specific stats
  if (profile.user_type === "client") {
    return (
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            {t("dashboard.welcome", { name: profile.first_name })}
          </h1>
          <p className="text-black text-sm">
            {currentDate} • {t("dashboard.hereIsWhatIsHappening")}
          </p>
        </div>

        {/* Client Quick Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[#ecfdf3] border border-[#15dda9] rounded-lg overflow-hidden">
            <div className="px-6 pt-6 flex items-center justify-between">
              <h2 className="text-sm font-semibold mb-1">{t("dashboard.totalSpent")}</h2>
              <CustomPaymentsIcon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="p-6 pt-0">
              <div className="text-2xl font-bold">€{stats?.totalSpent?.toLocaleString() || '0'}</div>
              <p className="text-xs text-black font-light">{t("dashboard.allTimeSpending")}</p>
            </div>
          </div>

          <div className="bg-[#ecfdf3] border border-[#15dda9] rounded-lg overflow-hidden">
            <div className="px-6 pt-6 flex items-center justify-between">
              <h2 className="text-sm font-semibold mb-1">{t("dashboard.activeProjects")}</h2>
              <CustomJobOfferingsIcon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="p-6 pt-0">
              <div className="text-2xl font-bold">{stats?.activeProjects || 0}</div>
              <div className="flex items-center space-x-1 text-xs text-black font-light">
                <span>{t("dashboard.ongoingProjects")}</span>
              </div>
            </div>
          </div>

          <div className="bg-[#ecfdf3] border border-[#15dda9] rounded-lg overflow-hidden">
            <div className="px-6 pt-6 flex items-center justify-between">
              <h2 className="text-sm font-semibold mb-1">{t("dashboard.freelancersUsed")}</h2>
              <CustomProfileIcon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="p-6 pt-0">
              <div className="text-2xl font-bold">{stats?.freelancersUsed || 0}</div>
              <div className="flex items-center space-x-1 text-xs text-black font-light">
                <span>{t("dashboard.uniqueFreelancers")}</span>
              </div>
            </div>
          </div>

          <div className="bg-[#ecfdf3] border border-[#15dda9] rounded-lg overflow-hidden">
            <div className="px-6 pt-6 flex items-center justify-between">
              <h2 className="text-sm font-semibold mb-1">{t("dashboard.projectsCompleted")}</h2>
              <CustomResponseIcon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="p-6 pt-0 ">
              <div className="text-2xl font-bold">{stats?.projectsCompleted || 0}</div>
              <div className="flex items-center space-x-1 text-xs text-black font-light">
                <span>{t("dashboard.successfulProjects")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            {t("dashboard.welcome", { name: profile.first_name })}
          </h1>
          <p className="text-black text-sm">
            {currentDate} • {t("dashboard.hereIsWhatIsHappening")}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-[#ecfdf3] border border-[#15dda9] rounded-lg overflow-hidden">
              <CardContent className="p-6">
                <Skeleton className="h-8 w-20 mb-2 bg-[#15dda9]" />
                <Skeleton className="h-4 w-32 bg-[#15dda9]" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            {t("dashboard.welcome", { name: profile.first_name })}
          </h1>
          <p className="text-black text-sm">
            {currentDate} • {t("dashboard.hereIsWhatIsHappening")}
          </p>
        </div>
        <div className="text-center p-8">
          <p className="text-black text-sm">{t("dashboard.unableToLoadDashboardStatistics")}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          {t("dashboard.welcome", { name: profile.first_name })}
        </h1>
        <p className="text-black text-sm">
          {currentDate} • {t("dashboard.hereIsWhatIsHappening")}
        </p>
      </div>

      {/* Quick Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 rounded-lg overflow-hidden p-6">
        <div className="bg-[#ecfdf3] border border-[#15dda9] rounded-lg overflow-hidden">
          <div className="px-6 pt-6 flex items-center justify-between">
            <h2 className="text-sm font-semibold mb-1">{t("dashboard.totalEarnings")}</h2>
            <CustomPaymentsIcon className="h-4 w-4 text-black" />

          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">€{stats?.totalEarnings?.toLocaleString() || '0'}</div>
            <div className="flex items-center space-x-1 text-xs text-black font-light">
              {getTrendIcon(stats?.earningsTrend || 0)}
              <span className={getTrendColor(stats?.earningsTrend || 0)}>
                {getTrendText(stats?.earningsTrend || 0)}
              </span>
          </div>
          </div>
        </div>

        <div className="bg-[#ecfdf3] border border-[#15dda9] rounded-lg overflow-hidden">
          <div className="px-6 pt-6 flex items-center justify-between">
            <h2 className="text-sm font-semibold mb-1"> {t("dashboard.activeBookings")}</h2>
            <CustomJobOfferingsIcon className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">{stats?.activeBookings || 0}</div>
            <div className="flex items-center space-x-1 text-xs text-black font-light">
              {getTrendIcon(stats?.bookingsTrend || 0)}
              <span className={getTrendColor(stats?.bookingsTrend || 0)}>
                {getTrendText(stats?.bookingsTrend || 0)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-[#ecfdf3] border border-[#15dda9] rounded-lg overflow-hidden">
          <div className="px-6 pt-6 flex items-center justify-between">
            <h2 className="text-sm font-semibold mb-1">{t("dashboard.totalClients")}</h2>
            <CustomBookingsIcon className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">{stats?.totalClients || 0}</div>
            <div className="flex items-center space-x-1 text-xs text-black font-light">
              {getTrendIcon(stats?.clientsTrend || 0)}
              <span className={getTrendColor(stats?.clientsTrend || 0)}>
                {getTrendText(stats?.clientsTrend || 0)}
              </span>
          </div>
          </div>
        </div>

        <div className="bg-[#ecfdf3] border border-[#15dda9] rounded-lg overflow-hidden">
          <div className="px-6 pt-6 flex items-center justify-between">
            <h2 className="text-sm font-semibold mb-1">{t("dashboard.avgResponseTime")}</h2>
            <CustomResponseIcon className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">{stats?.averageResponseTime?.toFixed(1) || '0'}h</div>
            <div className="flex items-center space-x-1 text-xs text-black font-light">
              {getTrendIcon(stats?.responseTimeTrend || 0)}
              <span className={getTrendColor(stats?.responseTimeTrend || 0)}>
                {getTrendText(stats?.responseTimeTrend || 0)}
              </span>
          </div>
          </div>
        </div>
    </div>
    </div>
  )
}



function EnhancedBookingsSection() {
  const { t } = useTranslation()
  const router = useRouter()
  const { profile } = useOptimizedUser()
  const { bookings, loading, error } = useBookings()

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      confirmed: { color: "bg-green-100 text-green-800 hover:bg-green-200", text: t("dashboard.confirmed") },
      pending: { color: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200", text: t("dashboard.pending") },
      completed: { color: "bg-blue-100 text-blue-800 hover:bg-blue-200", text: t("dashboard.completed") },
      cancelled: { color: "bg-red-100 text-red-800 hover:bg-red-200", text: t("dashboard.cancelled") }
    }
    const config = statusConfig[status as keyof typeof statusConfig]
    return <Badge className={config.color}>{config.text}</Badge>
  }

  const BookingTable = ({ bookingList }: { bookingList: any[] }) => (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow className="text-sm text-black">
            <TableHead>{profile?.user_type === 'freelancer' ? t("dashboard.client") : t("dashboard.freelancer")}</TableHead>
            <TableHead className="text-xs text-black">{t("dashboard.service")}</TableHead>
            <TableHead className="text-xs text-black">{t("dashboard.dateAndTime")}</TableHead>
            <TableHead className="text-xs text-black">{t("dashboard.duration")}</TableHead>
            <TableHead className="text-xs text-black">{t("dashboard.price")}</TableHead>
            <TableHead className="text-xs text-black">{t("dashboard.status")}</TableHead>
            <TableHead className="text-right text-xs text-black">{t("dashboard.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookingList.map((booking) => {
            const startDate = new Date(booking.start_time)
            const endDate = new Date(booking.end_time)
            const durationHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)
            
            // Handle both user types
            const otherParty = profile?.user_type === 'freelancer' ? booking.client : booking.freelancer
            const otherPartyName = `${otherParty?.first_name || 'Unknown'} ${otherParty?.last_name || ''}`.trim()
            const otherPartyInitials = otherPartyName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)
            const otherPartyRole = profile?.user_type === 'freelancer' ? t("dashboard.client") : t("dashboard.freelancer")
            
            return (
              <TableRow 
                key={booking.id} 
                className="cursor-pointer hover:bg-muted/50 transition-colors text-sm text-black"
                onClick={() => router.push(`/bookings/${booking.id}`)}
              >
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={otherParty?.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {otherPartyInitials || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-black text-sm ">{otherPartyName || `Unknown ${otherPartyRole}`}</div>
                        <div className="text-xs text-black text-sm flex items-center space-x-1">
                        <CustomMapIcon className="h-3 w-3" />
                        <span>{booking.location || t("dashboard.noLocation")}</span>
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium text-black text-xs">{booking.title}</div>
                  {booking.description && (
                    <div className="text-xs text-black text-xs">
                      {booking.description}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="font-medium text-black text-xs">
                    {startDate.toLocaleDateString()}
                  </div>
                  <div className="text-xs text-black text-xs">
                    {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-black">{durationHours.toFixed(1)}h</span>
                </TableCell>
                <TableCell>
                  <span className="font-semibold text-black text-xs">€{booking.total_amount}</span>
                </TableCell>
                <TableCell>
                  {getStatusBadge(booking.status)}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        className="h-8 w-8 p-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="sr-only">{t("dashboard.openMenu")}</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push(`/bookings/${booking.id}`)} className="text-xs text-black">
                      <CustomViewDetailsIcon className="h-4 w-4 mr-2" />
                        {t("dashboard.viewDetails")}
                      </DropdownMenuItem>
                      {booking.status === 'confirmed' && (
                        <>
                          <DropdownMenuItem className="text-xs text-black">
                            <CustomMessagesIcon className="h-4 w-4 mr-2" />
                            {t("dashboard.message", { role: profile?.user_type === 'freelancer' ? t("dashboard.client") : t("dashboard.freelancer") })}
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-xs text-black">
                            <CustomRescheduleIcon className="h-4 w-4 mr-2" />
                            {t("dashboard.reschedule")}
                          </DropdownMenuItem>
                        </>
                      )}
                      {booking.status === 'pending' && profile?.user_type === 'freelancer' && (
                        <DropdownMenuItem className="text-xs text-black">
                          {t("dashboard.acceptBooking")}
                        </DropdownMenuItem>
                      )}
                      {booking.status === 'pending' && profile?.user_type === 'client' && (
                        <DropdownMenuItem className="text-xs text-black">
                          {t("dashboard.cancelBooking")}
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{t("dashboard.bookings.title")} </h2>
          <Button onClick={() => router.push("/bookings")}>
            {t("dashboard.viewAllBookings")}
          </Button>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-32 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg text-black font-semibold">{t("dashboard.bookings.title")}</h2>
          <Button onClick={() => router.push("/bookings")}>
            {t("dashboard.viewAllBookings")}
          </Button>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-black text-sm mb-2">{t("dashboard.unableToLoadBookings")}</h3>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!bookings) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg text-black font-semibold">{t("dashboard.bookings.title")}</h2>
          <Button onClick={() => router.push("/bookings")}>
            {t("dashboard.viewAllBookings")}
          </Button>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-black text-sm mb-2">{t("dashboard.noBookingsData")}</h3>
            <p className="text-black text-sm">{t("dashboard.unableToLoadBookings")}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm text-black font-semibold">{t("dashboard.bookings.title")}</h2>
        <Button onClick={() => router.push("/bookings")}>
          {t("dashboard.viewAllBookings")}
        </Button>
      </div>
      
      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming" className="text-xs text-black font-semibold">
            {t("dashboard.upcoming")} ({bookings.upcoming.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="text-xs text-black font-semibold">
            {t("dashboard.completed")} ({bookings.completed.length})
          </TabsTrigger>
          <TabsTrigger value="cancelled" className="text-xs text-black font-semibold">
            {t("dashboard.cancelled")} ({bookings.cancelled.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="upcoming" className="space-y-4">
          {bookings.upcoming.length > 0 ? (
            <BookingTable bookingList={bookings.upcoming} />
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <CustomNoBookingsIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold text-black text-sm mb-2">{t("dashboard.noUpcomingBookings")}</h3>
                <p className="text-black text-sm">{t("dashboard.noUpcomingBookingsDescription")}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="completed" className="space-y-4">
          {bookings.completed.length > 0 ? (
            <BookingTable bookingList={bookings.completed} />
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <CustomNoBookingsIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold text-black text-sm mb-2">{t("dashboard.noCompletedBookings")}</h3>
                <p className="text-black text-sm">{t("dashboard.noCompletedBookingsDescription")}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="cancelled" className="space-y-4">
          {bookings.cancelled.length > 0 ? (
            <BookingTable bookingList={bookings.cancelled} />
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <CustomNoBookingsIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold text-black text-sm mb-2">{t("dashboard.noCancelledBookings")}</h3>
                <p className="text-black text-sm">{t("dashboard.noCancelledBookingsDescription")}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function PerformanceMetrics({ userType }: { userType: string }) {
  const { t } = useTranslation()
  const { metrics, loading, error } = usePerformanceMetrics()

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) {
      return <TrendingUp className="h-4 w-4 text-green-600" />
    } else if (current < previous) {
      return <TrendingDown className="h-4 w-4 text-red-600" />
    }
    return <TrendingUp className="h-4 w-4 text-gray-400" />
  }

  const getTrendColor = (current: number, previous: number) => {
    if (current > previous) return "text-green-600"
    if (current < previous) return "text-red-600"
    return "text-gray-600"
  }

  if (loading) {
        return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {userType === "freelancer" ? t("dashboard.performanceMetrics") : t("dashboard.projectAnalytics")}
          </h2>
          {userType === "freelancer" && (
            <Badge variant="outline" className="flex items-center space-x-1">
              <Award className="h-3 w-3" />
              <span>{t("dashboard.topPerformer")}</span>
              </Badge>
            )}
          </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-8 w-20 mb-2" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))}
          </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[200px] w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
          </div>
        )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {userType === "freelancer" ? t("dashboard.performanceMetrics") : t("dashboard.projectAnalytics")}
          </h2>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">
              {t("dashboard.unableToLoadPerformanceMetrics")}
            </h3>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {userType === "freelancer" ? t("dashboard.performanceMetrics") : t("dashboard.projectAnalytics")}
          </h2>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">
              {t("dashboard.noPerformanceData")}
            </h3>
            <p className="text-muted-foreground">
              {t("dashboard.unableToLoadPerformanceMetrics")}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Freelancer Metrics
  if (userType === "freelancer") {
  return (
      <div className="space-y-6">
            <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{t("dashboard.performanceMetrics")}</h2>
          <Badge variant="outline" className="flex items-center space-x-1">
            <Award className="h-3 w-3" />
            <span>{t("dashboard.topPerformer")}</span>
          </Badge>
            </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("dashboard.averageRating")}</CardTitle>
              <Star className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
              <div className="text-2xl font-bold">{metrics.kpis.averageRating.toFixed(1)}</div>
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <span>{t("dashboard.from")} {metrics.kpis.averageRating > 0 ? t("dashboard.reviews") : t("dashboard.noReviewsYet")}</span>
              </div>
                </CardContent>
              </Card>

              <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("dashboard.responseTime")}</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
              <div className="text-2xl font-bold">{metrics.kpis.responseTime.toFixed(1)}h</div>
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <span>{t("dashboard.averageResponseTime")}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("dashboard.completionRate")}</CardTitle>
              <Target className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
              <div className="text-2xl font-bold">{metrics.kpis.completionRate.toFixed(0)}%</div>
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <span>{t("dashboard.ofTotalBookings")}</span>
              </div>
                </CardContent>
              </Card>

                  <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("dashboard.totalClients")}</CardTitle>
              <Users className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.kpis.clientRetention}</div>
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <span>{t("dashboard.uniqueClients")}</span>
              </div>
                    </CardContent>
                  </Card>
                            </div>


                                  </div>
    )
  }

  // Client Metrics
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{t("dashboard.projectAnalytics")}</h2>
        <Badge variant="outline" className="flex items-center space-x-1">
          <Users className="h-3 w-3" />
          <span>{t("dashboard.activeClient")}</span>
        </Badge>
                              </div>

      {/* Client KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("dashboard.totalSpent")}</CardTitle>
            <Euro className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{metrics.kpis.totalSpent?.toLocaleString() || '0'}</div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <span>{t("dashboard.allTimeSpending")}</span>
                                </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("dashboard.projectsCompleted")}</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.kpis.projectsCompleted || 0}</div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <span>{t("dashboard.successfulProjects")}</span>
                                </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("dashboard.avgProjectCost")}</CardTitle>
            <Target className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{metrics.kpis.averageProjectCost?.toFixed(0) || '0'}</div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <span>{t("dashboard.perProject")}</span>
                          </div>
                        </CardContent>
                      </Card>

                  <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("dashboard.freelancersUsed")}</CardTitle>
            <Users className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.kpis.freelancersUsed || 0}</div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <span>{t("dashboard.uniqueFreelancers")}</span>
            </div>
                    </CardContent>
                  </Card>
                            </div>


                                  </div>
  )
}

export default function DashboardPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { profile, isLoading, isProfileLoading } = useOptimizedUser()
  const { supabase } = useOptimizedSupabase()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [saving, setSaving] = useState(false)
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
  })

  // Redirect to login if no profile found - must be at top level
  useEffect(() => {
    if (!isLoading && !isProfileLoading && !profile) {
      router.push("/login");
    }
  }, [isLoading, isProfileLoading, profile, router]);

  // Load notification settings from profile metadata
  useEffect(() => {
    if (profile?.metadata && typeof profile.metadata === "object" && (profile.metadata as any).notifications) {
      setNotifications({
        ...notifications,
        ...(profile.metadata as any).notifications,
      })
    }
  }, [profile])

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      toast.error(t("dashboard.settings.newPasswordsDoNotMatch"))
      return
    }

    setSaving(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) throw error

      toast.success(t("dashboard.settings.passwordUpdated"))

      // Clear form
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error: any) {
      toast.error(error.message || t("dashboard.settings.failedToUpdatePassword"))
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateNotifications = async () => {
    if (!profile) return

    setSaving(true)

    try {
      // Update profile metadata with notification settings
      const metadata = {
        ...(typeof profile.metadata === 'object' && profile.metadata !== null ? profile.metadata : {}),
        notifications: notifications,
      }

      const { error } = await supabase.from("profiles").update({ metadata }).eq("id", profile.id)

      if (error) throw error

      toast.success(t("dashboard.settings.notificationSettingsUpdated"))

      // Update local state
      setNotifications({
        ...notifications,
        ...metadata.notifications,
      })
    } catch (error: any) {
      toast.error(error.message || t("dashboard.settings.failedToUpdateNotificationSettings"))
    } finally {
      setSaving(false)
    }
  }

  if (isLoading || isProfileLoading) {
      return (
        <SidebarProvider className="w-full">
          <div className="flex min-h-screen bg-muted/30 w-full">
            <Sidebar>
              {profile && <ModernSidebarNav profile={profile} />}
            </Sidebar>
            
            <SidebarInset className="w-full">
              <div className="flex justify-center items-center min-h-screen w-full">
                <Loader className="h-8 w-8 animate-spin" />
                                </div>
            </SidebarInset>
                              </div>
        </SidebarProvider>
      )
  }

  // Show loading or redirect message if no profile
  if (!profile) {
    return (
      <div className="container py-10 text-center">
        <h1 className="text-2xl font-bold mb-4">{t("dashboard.redirectingToLogin")}</h1>
        <p className="text-gray-600">{t("dashboard.pleaseWait")}</p>
      </div>
    );
  }

  return (
    
    <SidebarProvider className="w-full">
      
      <div className="flex min-h-screen bg-muted/30 w-full">

        <Sidebar>
          <ModernSidebarNav profile={profile} />
        </Sidebar>
        
        <SidebarInset className="w-full">
          <OptimizedHeader />
          <div className="flex flex-col gap-6 p-6 pb-20 bg-[#f7f7f7] h-full">
                    {profile.user_type === "freelancer" && (
                <FreelancerOnboardingProgress profile={profile} />
              )}

                        {/* Enhanced Dashboard Header */}
            <DashboardHeader profile={profile} />

      <div className="space-y-8">
              {/* Performance Metrics */}
              {/* <PerformanceMetrics userType={profile.user_type} /> */}

        {/* Stats section - loads first */}
        {/* <Suspense fallback={<StatsSkeleton />}>
          <DashboardStats />
        </Suspense> */}

              <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
          {/* Bookings section - loads in parallel */}
                {/* <div className="lg:col-span-2"> */}
            <Suspense fallback={<BookingsSkeleton />}>
              <EnhancedBookingsSection />
            </Suspense>
                {/* </div> */}

          {/* Messages section - loads in parallel */}
          <div className="lg:col-span-1">
            <Suspense fallback={<MessagesSkeleton />}>
              {/* <RecentMessages /> */}
            </Suspense>
                              </div>
                            </div>
                          </div>
          </div>
        </SidebarInset>
        </div>
    </SidebarProvider>
  )
}
