"use client"

import React, { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useOptimizedSupabase } from "@/components/optimized-supabase-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Calendar, CheckCircle, Clock, MapPin, Star, XCircle, FileText } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { format } from "date-fns"
import type { Database } from "@/lib/database.types"
import { toast } from "@/lib/toast"
import { useTranslation } from "@/lib/i18n"
import ContractDisplay from "@/components/contract-display"
import DBAWaiverDisplay from "@/components/dba-waiver-display"
import OptimizedHeader from "@/components/optimized-header"
import ModernSidebarNav from "@/components/modern-sidebar-nav"
import { SidebarProvider, Sidebar, SidebarInset } from "@/components/ui/sidebar"

// Skeleton for immediate loading
function BookingDetailsSkeleton() {
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

type Booking = Database["public"]["Tables"]["bookings"]["Row"] & {
  freelancer: Database["public"]["Tables"]["profiles"]["Row"]
  client: Database["public"]["Tables"]["profiles"]["Row"]
}

export default function BookingDetailsPage() {
  const { t } = useTranslation()
  const params = useParams()
  const router = useRouter()
  const { supabase } = useOptimizedSupabase()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [userType, setUserType] = useState<"client" | "freelancer" | null>(null)
  const [reviewText, setReviewText] = useState("")
  const [rating, setRating] = useState(5)
  const [submittingReview, setSubmittingReview] = useState(false)
  const [hasReviewed, setHasReviewed] = useState(false)
  const [profile, setProfile] = useState<Database["public"]["Tables"]["profiles"]["Row"] | null>(null)
  useEffect(() => {
    const fetchBooking = async () => {
      setLoading(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login")
        return
      }
      // Fetch booking with both client and freelancer profiles
      const { data, error } = await supabase
        .from("bookings")
        .select(`*,freelancer:freelancer_id(id, first_name, last_name, avatar_url, hourly_rate),client:client_id(id, first_name, last_name, avatar_url)`)
        .eq("id", params.id)
        .single()
      if (error) {
        console.error("Error fetching booking:", error)
        toast.error(t("booking.id.error"))
        router.push("/dashboard")
        return
      }
      setBooking(data as Booking)
      // Determine if user is client or freelancer
      if (data.client_id === user.id) {
        setUserType("client")
      } else if (data.freelancer_id === user.id) {
        setUserType("freelancer")
      } else {
        // User is not authorized to view this booking
        toast.error(t("booking.id.unauthorized"))
        router.push("/dashboard")
        return
      }
      // Check if user has already reviewed
      const { data: reviewData } = await supabase
        .from("reviews")
        .select("*")
        .eq("booking_id", params.id)
        .eq("reviewer_id", user.id)
        .single()
      if (reviewData) {
        setHasReviewed(true)
      }
      // Fetch user profile for sidebar
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()
      setProfile(profileData)
      setLoading(false)
    }
    fetchBooking()
  }, [supabase, params.id, router, toast])

  const handleBookingAction = async (action: "confirm" | "complete" | "cancel") => {
    try {
      let updateData = {}

      if (action === "confirm") {
        updateData = { status: "confirmed" }
      } else if (action === "complete") {
        updateData = { status: "completed" }
      } else if (action === "cancel") {
        updateData = { status: "cancelled" }
      }

      const { error } = await supabase.from("bookings").update(updateData).eq("id", booking?.id)

      if (error) {
        throw error
      }

      // Update local state
      setBooking({
        ...booking!,
        ...updateData,
      } as Booking)

      toast.success(`Booking ${action}ed successfully`)
    } catch (error: any) {
      toast.error(error.message || t("booking.id.error"))
    }
  }

  const handleSubmitReview = async () => {
    if (!booking || !userType) return

    setSubmittingReview(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error("User not found")

      const revieweeId = userType === "client" ? booking.freelancer_id : booking.client_id

      const { error } = await supabase.from("reviews").insert({
        booking_id: booking.id,
        reviewer_id: user.id,
        reviewee_id: revieweeId,
        rating,
        comment: reviewText,
      })

      if (error) throw error

      setHasReviewed(true)

      toast.success(t("booking.id.reviewSubmitted"))
    } catch (error: any) {
      toast.error(error.message || t("booking.id.error"))
    } finally {
      setSubmittingReview(false)
    }
  }

  const getStatusBadge = (status: string, paymentMethod = "online") => {
    switch (status) {
      case "pending":
        return (
          <div className="flex gap-2">
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            {t("booking.id.pending")}
          </Badge>
          {paymentMethod === "offline" && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {t("booking.id.offlinePayment")}
              </Badge>
            )}
          </div>
        )
      case "confirmed":
        return (
          <div className="flex gap-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            {t("booking.id.confirmed")}
          </Badge>
          {paymentMethod === "offline" && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {t("booking.id.offlinePayment")}
              </Badge>
            )}
          </div>
        )
      case "completed":
        return (
          <div className="flex gap-2">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            {t("booking.id.completed")}
          </Badge>
          {paymentMethod === "offline" && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {t("booking.id.offlinePayment")}
              </Badge>
            )}
          </div>
        )
      case "cancelled":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            {t("booking.id.cancelled")}
          </Badge>
        )
      case "disputed":
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            {t("booking.id.disputed")}
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
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
              <BookingDetailsSkeleton />
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    )
  }

  if (!booking) {
    return (
      <div className="container py-10 text-center">
        <h1 className="text-2xl font-bold mb-4">{t("booking.id.notFound")}</h1>
        <Button onClick={() => router.push("/dashboard")}>{t("booking.id.goToDashboard")}</Button>
      </div>
    )
  }

  return (
    <SidebarProvider className="w-full">
    <div className="flex min-h-screen bg-muted/30 w-full">
      <Sidebar>
        {profile && <ModernSidebarNav profile={profile} />}
      </Sidebar>
      <SidebarInset className="w-full">
        <OptimizedHeader />
          <div className="lg:col-span-3 space-y-6 p-6 pb-20 bg-[#f7f7f7]">
      {/* <Link href="/bookings" className="flex items-center text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        {t("booking.id.backToDashboard")}
      </Link> */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 ">
        <div className="md:col-span-2 space-y-6">
          <Card className="border-none shadow-none">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg font-bold text-black">{t("booking.id.bookingDetails")}</CardTitle>
                  <CardDescription className="text-xs text-black">{t("booking.id.bookingId")}: {booking.id.substring(0, 8)}</CardDescription>
                </div>
                <div>{getStatusBadge(booking.status, booking.payment_method || 'online')}</div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="md:w-1/3">
                  <h3 className="text-sm font-medium text-black mb-2">
                    {userType === "client" ? t("booking.id.freelancer") : t("booking.id.client")}
                  </h3>
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 rounded-full overflow-hidden">
                      <Image
                        src={
                          userType === "client"
                            ? booking.freelancer?.avatar_url || `/placeholder.svg?height=48&width=48`
                            : booking.client?.avatar_url || `/placeholder.svg?height=48&width=48`
                        }
                        alt="Profile"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-medium text-black">
                        {userType === "client"
                          ? `${booking.freelancer?.first_name} ${booking.freelancer?.last_name}`
                          : `${booking.client?.first_name} ${booking.client?.last_name}`}
                      </p>
                      <p className="text-xs text-black">{userType === "client" ? "Freelancer" : "Client"}</p>
                    </div>
                  </div>
                </div>

                <div className="md:w-2/3 space-y-4">
                  <div>
                    <h3 className="text-xs font-medium text-black mb-2">{t("booking.id.schedule")}</h3>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <CustomCalendarIcon className="h-4 w-4 mr-2 text-black" />
                        <span className="text-xs text-black">{format(new Date(booking.start_time), "EEEE, MMMM d, yyyy")}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-black" />
                        <span className="text-xs text-black">
                          {format(new Date(booking.start_time), "h:mm a")} -{" "}
                          {format(new Date(booking.end_time), "h:mm a")}
                        </span>
                      </div>
                      {booking.location && (
                        <div className="flex items-center">
                          <CustomMapIcon className="h-4 w-4 mr-2 text-black" />
                          <span className="text-xs text-black">{booking.location}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-medium text-black mb-2">{t("booking.id.description")}</h3>
                    <p className="text-xs text-black">{booking.description || t("booking.id.noDescription")}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-xs font-medium text-black mb-2">{t("booking.id.paymentDetails")}</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-black">{t("booking.id.hourlyRate")}</span>
                    <span className="text-xs text-black">€{booking.hourly_rate.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-black">{t("booking.id.duration")}</span>
                    <span className="text-xs text-black">
                      {(
                        (new Date(booking.end_time).getTime() - new Date(booking.start_time).getTime()) /
                        3600000
                      ).toFixed(1)}{" "}
                      {t("booking.id.hours")}
                    </span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span className="text-xs text-black">{t("booking.id.total")}</span>
                    <span className="text-xs text-black">€{booking.total_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-xs text-black">{t("booking.id.paymentStatus")}</span>
                    <span className={booking.payment_status === "paid" ? "text-green-600" : "text-yellow-600"}>
                      {booking.payment_status === "paid" ? t("booking.id.paid") : t("booking.id.unpaid")}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-xs text-black">{t("booking.id.paymentMethod")}</span>
                    <span className="text-xs text-black">{booking.payment_method === "offline" ? t("booking.id.offlinePayment") : t("booking.id.onlinePayment")}</span>
                  </div>
                </div>
              </div>
              
              {booking.payment_method === "offline" &&
                userType === "freelancer" &&
                booking.payment_status !== "paid" && (
                  <div className="mt-4 border-t pt-4">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">{t("booking.id.offlinePaymentManagement")}</h3>
                    <div className="bg-muted/30 p-4 rounded-md">
                      <p className="text-sm mb-3">
                        {t("booking.id.offlinePaymentManagementDescription")}
                      </p>
                      <Button
                        size="sm"
                        onClick={async () => {
                          try {
                            const { error } = await supabase
                              .from("bookings")
                              .update({
                                payment_status: "paid",
                                status: "confirmed",
                              })
                              .eq("id", booking.id)

                            if (error) throw error

                            // Update local state
                            setBooking({
                              ...booking,
                              payment_status: "paid",
                              status: "confirmed",
                            } as Booking)

                            toast.success("Payment marked as received")
                          } catch (error: any) {
                            toast.error(error.message || t("booking.id.error"))
                          }
                        }}
                      >
                        {t("booking.id.markPaymentAsReceived")}
                      </Button>
                    </div>
                  </div>
                )}
            </CardContent>
            <CardFooter className="flex flex-wrap gap-2">
              {userType === "client" && booking.status === "pending" && (
                <Button variant="outline" className="text-red-500" onClick={() => handleBookingAction("cancel")}>
                  <XCircle className="h-4 w-4 mr-1" />
                  {t("booking.id.cancelBooking")}
                </Button>
              )}

              {userType === "freelancer" && booking.status === "pending" && (
                <>
                  <Button onClick={() => handleBookingAction("confirm")}>
                    <CheckCircle className="h-4 w-4 mr-1" />
                    {t("booking.id.acceptBooking")}
                  </Button>
                  <Button variant="outline" className="text-red-500" onClick={() => handleBookingAction("cancel")}>
                    <XCircle className="h-4 w-4 mr-1" />
                    {t("booking.id.declineBooking")}
                  </Button>
                </>
              )}

              {userType === "client" && booking.status === "confirmed" && (
                <Button onClick={() => handleBookingAction("complete")}>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  {t("booking.id.markAsCompleted")}
                </Button>
              )}

                {booking.payment_method === "offline" &&
                userType === "client" &&
                booking.payment_status !== "paid" &&
                booking.status !== "cancelled" && (
                  <Link href={`/bookings/${booking.id}/payment`}>
                    <Button variant="outline">{t("booking.id.viewPaymentInstructions")}</Button>
                  </Link>
                )}

              {/* <MessageButton bookingId={booking.id} clientId={booking.client_id} freelancerId={booking.freelancer_id} /> */}
            </CardFooter>
          </Card>

          {booking.status === "completed" && !hasReviewed && (
            <Card>
              <CardHeader>
                <CardTitle>{t("booking.id.leaveAReview")}</CardTitle>
                <CardDescription>
                  {t("booking.id.shareYourExperience", { freelancer: userType === "client" ? "the freelancer" : "the client" })}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">{t("booking.id.rating")}</h3>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="focus:outline-none"
                        title={`${t("booking.id.rate", { count: star })} ${star > 1 ? t("booking.id.stars") : t("booking.id.star")}`}
                      >
                        <Star
                          className={`h-6 w-6 ${
                            star <= rating ? "fill-primary text-primary" : "text-muted-foreground"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-2">{t("booking.id.comments")}</h3>
                  <Textarea
                    placeholder={t("booking.id.shareYourExperience")}
                    rows={4}
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSubmitReview} disabled={submittingReview || !reviewText.trim()}>
                  {submittingReview ? (
                    <div className="flex items-center justify-center w-full">
                      {/* <Loader className="mr-2 h-4 w-4 animate-spin" /> */}
                      {t("booking.id.submitting")}
                    </div>
                  ) : (
                    t("booking.id.submitReview")
                  )}
                </Button>
              </CardFooter>
            </Card>
          )}

          {hasReviewed && (
            <Card>
              <CardHeader>
                <CardTitle>{t("booking.id.reviewSubmitted")}</CardTitle>
                <CardDescription>{t("booking.id.thankYouForSharingYourFeedback")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-5 w-5 ${star <= rating ? "fill-primary text-primary" : "text-muted-foreground"}`}
                    />
                  ))}
                </div>
                <p className="text-muted-foreground">{t("booking.id.yourReviewHelpsOthersMakeInformedDecisions")}</p>
              </CardContent>
            </Card>
          )}

         

          {/* DBA Waiver Section */}
          {booking.status === "confirmed" && (
            <DBAWaiverDisplay
              bookingId={booking.id}
              userType={userType || 'client'}
              onWaiverCreated={() => {
                // Refresh the page to show updated status
                window.location.reload()
              }}
            />
          )}
        </div>

        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>{t("booking.id.actions")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full justify-start">
                <CustomMessagesIcon className="h-4 w-4 mr-2" />
                {t("booking.id.sendMessage")}
              </Button>

              {booking.status === "confirmed" && (
                <Button variant="outline" className="w-full justify-start">
                  <CustomNoBookingsIcon className="h-4 w-4 mr-2" />
                  {t("contract.view")}
                </Button>
              )}

              {booking.status === "completed" && (
                <Button variant="outline" className="w-full justify-start">
                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  {t("booking.id.viewInvoice")}
                </Button>
              )}

              {booking.status === "confirmed" && userType === "client" && (
                <Button variant="outline" className="w-full justify-start">
                  <CustomRescheduleIcon className="h-4 w-4 mr-2" />
                  {t("booking.id.requestCancellation")}
                </Button>
              )}

              {booking.status === "completed" && (
                <Button variant="outline" className="w-full justify-start">
                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {t("booking.id.reportAnIssue")}
                </Button>
              )}
            </CardContent>
          </Card>

           {/* Contract Section */}
           {booking.status === "confirmed" && (
            <ContractDisplay 
              booking={booking}
              onContractGenerated={(contractNumber) => {
                toast.success(`Contract ${contractNumber} generated successfully`)
              }}
            />
          )}

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>{t("booking.id.needHelp")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t("booking.id.needHelpDescription")}
              </p>
              <Button variant="outline" className="w-full">
                {t("booking.id.contactSupport")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}

