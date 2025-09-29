"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useOptimizedSupabase } from "@/components/optimized-supabase-provider"
import { useOptimizedUser } from "@/components/optimized-user-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/lib/toast"
import { Calendar, Clock, MapPin, CheckCircle, XCircle, User, Euro } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { format } from "date-fns"
import type { Database } from "@/lib/database.types"
import { useTranslation } from "@/lib/i18n"
import FreelancerOnboardingProgress from "@/components/freelancer-onboarding-progress"
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarInset,
  useSidebar
} from "@/components/ui/sidebar"
import ModernSidebarNav from "@/components/modern-sidebar-nav"
import OptimizedHeader from "@/components/optimized-header"

// Custom header component that uses sidebar's mobile state
function MobileHeader() {
  const { openMobile, setOpenMobile } = useSidebar()
  
  return (
    <OptimizedHeader 
      isMobileMenuOpen={openMobile}
      setIsMobileMenuOpen={setOpenMobile}
    />
  )
}

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

const CustomCalendarIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg 
  className={props.className}
  xmlns="http://www.w3.org/2000/svg" 
  width="24" 
  height="24" 
  viewBox="0 0 24 24" 
  fill="none">
    <path d="M16.75 3.56V2c0-.41-.34-.75-.75-.75s-.75.34-.75.75v1.5h-6.5V2c0-.41-.34-.75-.75-.75s-.75.34-.75.75v1.56c-2.7.25-4.01 1.86-4.21 4.25-.02.29.22.53.5.53h16.92c.29 0 .53-.25.5-.53-.2-2.39-1.51-4-4.21-4.25Z" 
    fill="currentColor">
      </path>
      <path opacity=".4" d="M20 9.84c.55 0 1 .45 1 1V17c0 3-1.5 5-5 5H8c-3.5 0-5-2-5-5v-6.16c0-.55.45-1 1-1h16Z" 
      fill="currentColor">
        </path>
        <path d="M8.5 14.999c-.26 0-.52-.11-.71-.29-.18-.19-.29-.45-.29-.71 0-.26.11-.52.29-.71.28-.28.72-.37 1.09-.21.13.05.24.12.33.21.18.19.29.45.29.71 0 .26-.11.52-.29.71-.19.18-.45.29-.71.29ZM12 14.999c-.26 0-.52-.11-.71-.29-.18-.19-.29-.45-.29-.71 0-.26.11-.52.29-.71.09-.09.2-.16.33-.21.37-.16.81-.07 1.09.21.18.19.29.45.29.71 0 .26-.11.52-.29.71l-.15.12c-.06.04-.12.07-.18.09-.06.03-.12.05-.18.06-.07.01-.13.02-.2.02ZM15.5 15c-.26 0-.52-.11-.71-.29-.18-.19-.29-.45-.29-.71 0-.26.11-.52.29-.71.1-.09.2-.16.33-.21.18-.08.38-.1.58-.06.06.01.12.03.18.06.06.02.12.05.18.09l.15.12c.18.19.29.45.29.71 0 .26-.11.52-.29.71l-.15.12c-.06.04-.12.07-.18.09-.06.03-.12.05-.18.06-.07.01-.14.02-.2.02ZM8.5 18.5c-.13 0-.26-.03-.38-.08-.13-.05-.23-.12-.33-.21-.18-.19-.29-.45-.29-.71 0-.26.11-.52.29-.71.1-.09.2-.16.33-.21.18-.08.38-.1.58-.06.06.01.12.03.18.06.06.02.12.05.18.09l.15.12c.18.19.29.45.29.71 0 .26-.11.52-.29.71-.05.04-.1.09-.15.12-.06.04-.12.07-.18.09-.06.03-.12.05-.18.06-.07.01-.13.02-.2.02ZM12 18.5c-.26 0-.52-.11-.71-.29-.18-.19-.29-.45-.29-.71 0-.26.11-.52.29-.71.37-.37 1.05-.37 1.42 0 .18.19.29.45.29.71 0 .26-.11.52-.29.71-.19.18-.45.29-.71.29ZM15.5 18.5c-.26 0-.52-.11-.71-.29-.18-.19-.29-.45-.29-.71 0-.26.11-.52.29-.71.37-.37 1.05-.37 1.42 0 .18.19.29.45.29.71 0 .26-.11.52-.29.71-.19.18-.45.29-.71.29Z" 
        fill="currentColor">
          </path>
          </svg>
)

// Skeleton for immediate loading
function BookingsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex gap-4">
          <div className="h-8 w-32 bg-muted rounded animate-pulse" />
          <div className="h-8 w-32 bg-muted rounded animate-pulse" />
        </div>
        <div className="h-4 w-48 bg-muted rounded animate-pulse mt-2" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="h-[400px] w-full bg-muted rounded animate-pulse" />
        <div className="h-[400px] w-full bg-muted rounded animate-pulse" />
      </div>
    </div>
  )
}

type Booking = Database["public"]["Tables"]["bookings"]["Row"] & {
  freelancer: Database["public"]["Tables"]["profiles"]["Row"]
  client: Database["public"]["Tables"]["profiles"]["Row"]
}

export default function BookingsPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { supabase } = useOptimizedSupabase()
  const { profile, isLoading: isProfileLoading } = useOptimizedUser()
  const [bookings, setBookings] = useState<Booking[]>([])

  // Redirect to login if no profile found - with more patient logic
  useEffect(() => {
    // Don't redirect if we're still loading
    if (isProfileLoading) {
      return;
    }

    // Don't redirect if we have a profile
    if (profile) {
      return;
    }

    // Add a small delay to prevent race conditions during session restoration
    const redirectTimeout = setTimeout(() => {
      // Double-check loading states before redirecting
      if (!isProfileLoading && !profile) {
        console.log("Redirecting to login - no profile found after loading completed");
        router.push("/login");
      }
    }, 100); // 100ms delay to allow for session restoration

    return () => clearTimeout(redirectTimeout);
  }, [isProfileLoading, profile, router]);

  useEffect(() => {
    if (!profile) return;
    const fetchBookings = async () => {
      try {
        let query
        if (profile.user_type === "client") {
          query = supabase
            .from("bookings")
            .select(`*,freelancer:freelancer_id(id, first_name, last_name, avatar_url, hourly_rate)`)
            .eq("client_id", profile.id)
            .order("start_time", { ascending: false })
        } else {
          query = supabase
            .from("bookings")
            .select(`*,client:client_id(id, first_name, last_name, avatar_url)`)
            .eq("freelancer_id", profile.id)
            .order("start_time", { ascending: false })
        }
        const { data: bookingsData, error: bookingsError } = await query
        if (bookingsError) throw bookingsError
        setBookings(bookingsData as Booking[])
      } catch (error) {
        console.error("Error fetching bookings:", error)
        toast.error(t("bookings.error"))
      }
    }
    fetchBookings()
  }, [supabase, profile, t])

  const handleBookingAction = async (bookingId: string, action: "confirm" | "complete" | "cancel") => {
    try {
      let updateData = {}
      if (action === "confirm") {
        updateData = { status: "confirmed" }
      } else if (action === "complete") {
        updateData = { status: "completed" }
      } else if (action === "cancel") {
        updateData = { status: "cancelled" }
      }
      const { error } = await supabase.from("bookings").update(updateData).eq("id", bookingId)
      if (error) throw error
      setBookings(bookings.map((booking) => (booking.id === bookingId ? { ...booking, ...updateData } : booking)))
      toast.success(t("bookings.success"))
    } catch (error: any) {
      toast.error(error.message || t("bookings.error"))
    }
  }

  const getStatusBadge = (status: string, paymentMethod: string | null = "online") => {
    switch (status) {
      case "pending":
        return (
          <div className="flex gap-1 flex-wrap">
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            {t("bookings.pending")}
          </Badge>
          {paymentMethod === "offline" && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                {t("bookings.offline")}
              </Badge>
            )}
          </div>
        )
      case "confirmed":
        return (
          <div className="flex gap-1 flex-wrap">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            {t("bookings.confirmed")}
          </Badge>
          {paymentMethod === "offline" && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                {t("bookings.offline")}
              </Badge>
            )}
          </div>
        )
      case "completed":
        return (
          <div className="flex gap-1 flex-wrap">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            {t("bookings.completed")}
          </Badge>
          {paymentMethod === "offline" && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                {t("bookings.offline")}
              </Badge>
            )}
          </div>
        )
      case "cancelled":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            {t("bookings.cancelled")}
          </Badge>
        )
      case "disputed":
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            {t("bookings.disputed")}
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (isProfileLoading) {
    return (
      <SidebarProvider className="w-full">
        <div className="flex min-h-screen bg-muted/30 w-full">
          <Sidebar>
            <ModernSidebarNav profile={null} />
          </Sidebar>
          <SidebarInset className="w-full">
            <MobileHeader />
            <div className="p-6">
              <BookingsSkeleton />
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    )
  }

  if (!profile) {
    return (
      <SidebarProvider className="w-full">
        <div className="flex min-h-screen bg-muted/30 w-full">
          <Sidebar>
            <ModernSidebarNav profile={null} />
          </Sidebar>
          
          <SidebarInset className="w-full">
            <div className="flex flex-col justify-center items-center min-h-screen">
              <div className="text-center">
                <h1 className="text-xl font-semibold mb-2">{t("bookings.redirectingToLogin")}</h1>
                <p className="text-muted-foreground">{t("bookings.pleaseWait")}</p>
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider className="w-full">
    <div className="flex min-h-screen bg-muted/30 w-full">
      <Sidebar>
        {profile && <ModernSidebarNav profile={profile} />}
      </Sidebar>
      <SidebarInset className="w-full">
        <MobileHeader />
        <div className="lg:col-span-3 space-y-6 p-6 pb-20 bg-[#f7f7f7] h-full">
          {profile.user_type === "freelancer" && (
            <FreelancerOnboardingProgress profile={profile} />
          )}
                      <Tabs defaultValue="upcoming" className="space-y-4">
              <TabsList>
                <TabsTrigger value="upcoming">{t("bookings.upcoming")}</TabsTrigger>
                <TabsTrigger value="past">{t("bookings.past")}</TabsTrigger>
              </TabsList>
            <TabsContent value="upcoming" className="space-y-4">
              {bookings.filter(
                (b) => new Date(b.start_time) > new Date() && ["pending", "confirmed"].includes(b.status),
              ).length === 0 ? (
                <div className="bg-background rounded-lg overflow-hidden">
                  <div className="p-6 flex flex-col items-center justify-center">
                      <CustomNoBookingsIcon className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg text-black font-medium mb-2">{t("bookings.noUpcomingBookings")}</h3>
                    <p className="text-black text-xs text-center max-w-md mb-4">
                      {profile.user_type === "client"
                        ? t("bookings.noUpcomingBookingsDescription")
                        : t("bookings.noUpcomingBookingsFreelancer")}
                    </p>
                    {profile.user_type === "client" ? (
                      <Link href="/freelancers">
                        <Button>{t("bookings.findFreelancers")}</Button>
                      </Link>
                    ) : (
                      <Link href="/profile">
                        <Button>{t("bookings.updateProfile")}</Button>
                      </Link>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-background rounded-lg overflow-hidden">
                  <div className="p-6">
                    <h2 className="text-lg text-black font-semibold mb-1">{t("bookings.upcomingBookings")}</h2>
                  </div>
                  <div className="p-6">
                    <Table>
                      <TableHeader>
                        <TableRow >
                          <TableHead className="text-xs text-black">{profile.user_type === "client" ? t("bookings.freelancer") : t("bookings.client")}</TableHead>
                          <TableHead className="text-xs text-black">{t("bookings.dateTime")}</TableHead>
                          <TableHead className="text-xs text-black">{t("bookings.location")}</TableHead>
                          <TableHead className="text-xs text-black">{t("bookings.status")}</TableHead>
                          <TableHead className="text-xs text-black">{t("bookings.amount")}</TableHead>
                          <TableHead className="text-right text-xs text-black">{t("bookings.actions")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bookings
                          .filter((b) => new Date(b.start_time) > new Date() && ["pending", "confirmed"].includes(b.status))
                          .map((booking) => (
                            <TableRow 
                            key={booking.id}
                            onClick={() => router.push(`/bookings/${booking.id}`)}
                            className="cursor-pointer hover:bg-muted/50 transition-colors"
                            >
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="relative h-10 w-10 rounded-full overflow-hidden">
                                    <Image
                                      src={
                                        profile.user_type === "client"
                                          ? booking.freelancer?.avatar_url || `/placeholder.svg?height=40&width=40`
                                          : booking.client?.avatar_url || `/placeholder.svg?height=40&width=40`
                                      }
                                      alt="Profile"
                                      fill
                                      className="object-cover"
                                    />
                                  </div>
                                  <div>
                                    <p className="font-medium text-xs text-black">
                                      {profile.user_type === "client"
                                        ? `${booking.freelancer?.first_name} ${booking.freelancer?.last_name}`
                                        : `${booking.client?.first_name} ${booking.client?.last_name}`}
                                    </p>
                                    <p className="text-xs text-black">
                                      {profile.user_type === "client" ? t("bookings.freelancer") : t("bookings.client")}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <CustomCalendarIcon className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium text-xs text-black">
                                      {format(new Date(booking.start_time), "MMM d, yyyy")}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-xs text-black">
                                      {format(new Date(booking.start_time), "h:mm a")} - {format(new Date(booking.end_time), "h:mm a")}
                                    </span>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                {booking.location ? (
                                  <div className="flex items-center gap-2">
                                    <CustomMapIcon className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-xs text-black">{booking.location}</span>
                                  </div>
                                ) : (
                                  <span className="text-sm text-muted-foreground">{t("bookings.notSpecified")}</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {getStatusBadge(booking.status, booking.payment_method)}
                              </TableCell>
                              <TableCell>
                                {booking.total_amount > 0 ? (
                                  <div className="flex items-center gap-2">
                                    <Euro className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium text-xs text-black">€{booking.total_amount.toFixed(2)}</span>
                                  </div>
                                ) : (
                                  <span className="text-sm text-muted-foreground">{t("bookings.notSet")}</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex gap-2 justify-end">
                                  {profile.user_type === "client" && booking.status === "pending" && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-red-500 hover:text-red-600"
                                      onClick={() => handleBookingAction(booking.id, "cancel")}
                                    >
                                      <XCircle className="h-4 w-4 mr-1" />
                                      {t("bookings.cancel")}
                                    </Button>
                                  )}

                                  {profile.user_type === "freelancer" && booking.status === "pending" && (
                                    <>
                                      <Button size="sm" onClick={() => handleBookingAction(booking.id, "confirm")}>
                                        <CheckCircle className="h-4 w-4 mr-1" />
                                        {t("bookings.accept")}
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-red-500 hover:text-red-600"
                                        onClick={() => handleBookingAction(booking.id, "cancel")}
                                      >
                                                                              <XCircle className="h-4 w-4 mr-1" />
                                      {t("bookings.decline")}
                                      </Button>
                                    </>
                                  )}

                                  {booking.status === "confirmed" && (
                                    <Link href={`/bookings/${booking.id}`}>
                                      <Button size="sm" variant="outline">
                                        {t("bookings.viewDetails")}
                                      </Button>
                                    </Link>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="past" className="space-y-4">
              {bookings.filter(
                (b) =>
                  new Date(b.start_time) < new Date() || ["completed", "cancelled", "disputed"].includes(b.status),
              ).length === 0 ? (
                <div className="bg-background rounded-lg overflow-hidden">
                  <div className="p-6 flex flex-col items-center justify-center">
                    <CustomNoBookingsIcon className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg text-black font-medium mb-2">{t("bookings.noPastBookings")}</h3>
                    <p className="text-black text-xs text-center max-w-md mb-4">{t("bookings.noPastBookingsDescription")}</p>
                  </div>
                </div>
              ) : (
                <div className="bg-background rounded-lg overflow-hidden">
                  <div className="p-6">
                    <h2 className="text-lg text-black font-semibold mb-1">{t("bookings.pastBookings")}</h2>
                  </div>
                  <div className="p-6">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs text-black">{profile.user_type === "client" ? t("bookings.freelancer") : t("bookings.client")}</TableHead>
                          <TableHead className="text-xs text-black">{t("bookings.dateTime")}</TableHead>
                          <TableHead className="text-xs text-black">{t("bookings.location")}</TableHead>
                          <TableHead className="text-xs text-black">{t("bookings.status")}</TableHead>
                          <TableHead className="text-xs text-black">{t("bookings.amount")}</TableHead>
                          <TableHead className="text-right text-xs text-black">{t("bookings.actions")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bookings
                          .filter(
                            (b) =>
                              new Date(b.start_time) < new Date() ||
                              ["completed", "cancelled", "disputed"].includes(b.status),
                          )
                          .map((booking) => (
                            <TableRow key={booking.id}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="relative h-10 w-10 rounded-full overflow-hidden">
                                    <Image
                                      src={
                                        profile.user_type === "client"
                                          ? booking.freelancer?.avatar_url || `/placeholder.svg?height=40&width=40`
                                          : booking.client?.avatar_url || `/placeholder.svg?height=40&width=40`
                                      }
                                      alt="Profile"
                                      fill
                                      className="object-cover"
                                    />
                                  </div>
                                  <div>
                                    <p className="font-medium text-xs text-black">
                                      {profile.user_type === "client"
                                        ? `${booking.freelancer?.first_name} ${booking.freelancer?.last_name}`
                                        : `${booking.client?.first_name} ${booking.client?.last_name}`}
                                    </p>
                                    <p className="text-xs text-black">
                                      {profile.user_type === "client" ? t("bookings.freelancer") : t("bookings.client")}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <CustomCalendarIcon className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium text-xs text-black">
                                      {format(new Date(booking.start_time), "MMM d, yyyy")}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-xs text-black">
                                      {format(new Date(booking.start_time), "h:mm a")} - {format(new Date(booking.end_time), "h:mm a")}
                                    </span>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                {booking.location ? (
                                  <div className="flex items-center gap-2">
                                    <CustomMapIcon className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-xs text-black">{booking.location}</span>
                                  </div>
                                ) : (
                                  <span className="text-xs text-black">{t("bookings.notSpecified")}</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {getStatusBadge(booking.status, booking.payment_method)}
                              </TableCell>
                              <TableCell>
                                {booking.total_amount > 0 ? (
                                  <div className="flex items-center gap-2">
                                    <Euro className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium text-xs text-black">€{booking.total_amount.toFixed(2)}</span>
                                  </div>
                                ) : (
                                  <span className="text-xs text-black">{t("bookings.notSet")}</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex gap-2 justify-end">
                                  {booking.status === "completed" && (
                                    <Link href={`/bookings/${booking.id}`}>
                                      <Button size="sm" variant="outline">
                                        {t("bookings.viewDetails")}
                                      </Button>
                                    </Link>
                                  )}

                                  {profile.user_type === "client" && booking.status === "confirmed" && (
                                    <Button size="sm" onClick={() => handleBookingAction(booking.id, "complete")}>
                                      <CheckCircle className="h-4 w-4 mr-1" />
                                      {t("bookings.markAsCompleted")}
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </SidebarInset>
    </div>
    </SidebarProvider>
  )
}

