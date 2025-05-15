"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useOptimizedSupabase } from "@/components/optimized-supabase-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Calendar, CheckCircle, Clock, Loader2, MapPin, Star, XCircle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { format } from "date-fns"
import type { Database } from "@/lib/database.types"
import { toast } from "@/lib/toast"
import { useTranslation } from "@/lib/i18n"
// import MessageButton from "@/components/message-button"

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
        .select(`
          *,
          freelancer:freelancer_id(id, first_name, last_name, avatar_url, hourly_rate),
          client:client_id(id, first_name, last_name, avatar_url)
        `)
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
      <div className="container py-10 flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
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
    <div className="container py-10">
      <Link href="/dashboard" className="flex items-center text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        {t("booking.id.backToDashboard")}
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{t("booking.id.bookingDetails")}</CardTitle>
                  <CardDescription>{t("booking.id.bookingId")}: {booking.id.substring(0, 8)}</CardDescription>
                </div>
                <div>{getStatusBadge(booking.status, booking.payment_method || 'online')}</div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="md:w-1/3">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
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
                      <p className="font-medium">
                        {userType === "client"
                          ? `${booking.freelancer?.first_name} ${booking.freelancer?.last_name}`
                          : `${booking.client?.first_name} ${booking.client?.last_name}`}
                      </p>
                      <p className="text-sm text-muted-foreground">{userType === "client" ? "Freelancer" : "Client"}</p>
                    </div>
                  </div>
                </div>

                <div className="md:w-2/3 space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">{t("booking.id.schedule")}</h3>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{format(new Date(booking.start_time), "EEEE, MMMM d, yyyy")}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>
                          {format(new Date(booking.start_time), "h:mm a")} -{" "}
                          {format(new Date(booking.end_time), "h:mm a")}
                        </span>
                      </div>
                      {booking.location && (
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{booking.location}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">{t("booking.id.description")}</h3>
                    <p className="text-sm">{booking.description || t("booking.id.noDescription")}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">{t("booking.id.paymentDetails")}</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{t("booking.id.hourlyRate")}</span>
                    <span className="text-sm">€{booking.hourly_rate.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{t("booking.id.duration")}</span>
                    <span className="text-sm">
                      {(
                        (new Date(booking.end_time).getTime() - new Date(booking.start_time).getTime()) /
                        3600000
                      ).toFixed(1)}{" "}
                      {t("booking.id.hours")}
                    </span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>{t("booking.id.total")}</span>
                    <span>€{booking.total_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("booking.id.paymentStatus")}</span>
                    <span className={booking.payment_status === "paid" ? "text-green-600" : "text-yellow-600"}>
                      {booking.payment_status === "paid" ? t("booking.id.paid") : t("booking.id.unpaid")}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("booking.id.paymentMethod")}</span>
                    <span>{booking.payment_method === "offline" ? t("booking.id.offlinePayment") : t("booking.id.onlinePayment")}</span>
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
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("booking.id.submitting")}
                    </>
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
        </div>

        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>{t("booking.id.actions")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full justify-start">
                {/* <MessageSquare className="h-4 w-4 mr-2" /> */}
                {t("booking.id.sendMessage")}
              </Button>

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
                <Button variant="outline" className="w-full justify-start text-red-500">
                  <XCircle className="h-4 w-4 mr-2" />
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
  )
}

