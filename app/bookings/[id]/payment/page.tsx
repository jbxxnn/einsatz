"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useOptimizedSupabase } from "@/components/optimized-supabase-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, CheckCircle, CreditCard, Loader } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"
import Image from "next/image"
import type { Database } from "@/lib/database.types"
import { toast } from "sonner"
import { useTranslation } from "@/lib/i18n"
import OptimizedHeader from "@/components/optimized-header"

type Booking = Database["public"]["Tables"]["bookings"]["Row"] & {
  freelancer: Database["public"]["Tables"]["profiles"]["Row"]
}

export default function PaymentPage() {
  const { t } = useTranslation()
  const params = useParams()
  const router = useRouter()
  const { supabase } = useOptimizedSupabase()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)

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

      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
           freelancer:freelancer_id(id, first_name, last_name, avatar_url, hourly_rate, email)
        `)
        .eq("id", params.id)
        .eq("client_id", user.id)
        .single()

      if (error) {
        console.error("Error fetching booking:", error)
        toast.error(t("payments.couldNotLoadBookingDetails"))
        router.push("/dashboard")
      } else {
        setBooking(data as Booking)

        // If already paid, show success
        if (data.payment_status === "paid") {
          setPaymentSuccess(true)
        }
        
        // Fetch or create conversation for this booking
        let { data: conversationData } = await supabase
          .from("conversations")
          .select("id")
          .eq("booking_id", params.id)
          .single()
        
        if (!conversationData) {
          // Create conversation if it doesn't exist
          const { data: newConversationData } = await supabase
            .rpc('create_or_get_conversation', {
              p_user_id: user.id,
              p_recipient_id: data.freelancer_id,
              p_booking_id: params.id
            })
          
          if (newConversationData) {
            conversationData = { id: newConversationData.conversation_id }
          }
        }
        
        if (conversationData) {
          setConversationId(conversationData.id)
        }
      }

      setLoading(false)
    }

    fetchBooking()
  }, [supabase, params.id, router, toast])

  const handlePayment = async () => {
    setProcessing(true)

    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Update booking payment status
      const { error } = await supabase
        .from("bookings")
        .update({
          payment_status: "paid",
          status: "confirmed",
        })
        .eq("id", booking?.id)

      if (error) throw error

      setPaymentSuccess(true)

      toast.success(t("payments.paymentSuccessful"))
    } catch (error: any) {
      toast.error(error.message || t("payments.error"))
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen w-full">
        <Loader className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="container py-10 text-center">
        <h1 className="text-2xl font-bold mb-4">{t("payments.bookingNotFound")}</h1>
        <Button onClick={() => router.push("/dashboard")}>{t("payments.goToDashboard")}</Button>
      </div>
    )
  }

  return (
    <>
    <OptimizedHeader />
    <div className="container py-10">
      <Link href="/dashboard" className="flex items-center text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        {t("payments.goToDashboard")}
      </Link>

      <div className="max-w-2xl mx-auto">
        {paymentSuccess ? (
          <Card>
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">{t("payments.paymentSuccessful")}</h2>
              <p className="text-muted-foreground mb-6">
                {t("payments.paymentSuccessfulMessage")}
              </p>
              <div className="w-full max-w-md p-4 border rounded-lg mb-6">
                <div className="flex justify-between mb-2">
                  <span className="text-muted-foreground">{t("payments.bookingId")}</span>
                  <span className="font-medium">{booking.id.substring(0, 8)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-muted-foreground">{t("payments.date")}</span>
                  <span className="font-medium">{format(new Date(booking.start_time), "MMMM d, yyyy")}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-muted-foreground">{t("payments.time")}</span>
                  <span className="font-medium">
                    {format(new Date(booking.start_time), "h:mm a")} - {format(new Date(booking.end_time), "h:mm a")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("payments.total")}</span>
                  <span className="font-bold">€{booking.total_amount.toFixed(2)}</span>
                </div>
              </div>
              <div className="flex gap-4">
                <Link href={`/bookings/${booking.id}`}>
                  <Button>{t("payments.viewBookingDetails")}</Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="outline">{t("payments.goToDashboard")}</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
            ) : booking.payment_method === "offline" ? (
              <Card>
                <CardHeader>
                  <CardTitle>{t("payments.offlinePaymentInstructions")}</CardTitle>
                  <CardDescription>
                    {t("payments.offlinePaymentInstructionsMessage")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="border rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="relative h-12 w-12 rounded-full overflow-hidden">
                        <Image
                          src={booking.freelancer?.avatar_url || `/placeholder.svg?height=48&width=48`}
                          alt={`${booking.freelancer?.first_name} ${booking.freelancer?.last_name}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="font-semibold">
                          {booking.freelancer?.first_name} {booking.freelancer?.last_name}
                        </h3>
                        <p className="text-sm text-muted-foreground">{t("payments.freelancer")}</p>
                      </div>
                    </div>
    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t("payments.date")}</span>
                        <span>{format(new Date(booking.start_time), "MMMM d, yyyy")}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t("payments.time")}</span>
                        <span>
                          {format(new Date(booking.start_time), "h:mm a")} - {format(new Date(booking.end_time), "h:mm a")}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t("payments.location")}</span>
                        <span>{booking.location || t("payments.notSpecified")}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t("payments.total")}</span>
                        <span className="font-bold">€{booking.total_amount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
    
                  <div className="space-y-4">
                    <h3 className="font-semibold">{t("payments.paymentInstructions")}</h3>
                    <div className="bg-muted/30 p-4 rounded-md space-y-4">
                      <div>
                        <h4 className="font-medium mb-1">{t("payments.contactFreelancer")}</h4>
                        <p className="text-sm text-muted-foreground">
                          {t("payments.useOurMessagingSystemToCoordinatePaymentDetailsWithTheFreelancer")}
                        </p>
                        <Button variant="outline" className="mt-2" asChild disabled={!conversationId}>
                          <Link href={conversationId ? `/messages?conversation=${conversationId}` : `/messages`}>
                            {conversationId ? t("payments.messageFreelancer") : t("loading")}
                          </Link>
                        </Button>
                      </div>
    
                      <div>
                        <h4 className="font-medium mb-1">{t("payments.agreeOnPaymentMethod")}</h4>
                        <p className="text-sm text-muted-foreground">
                          {t("payments.discussAndAgreeOnPaymentMethod")}
                        </p>
                      </div>
    
                      <div>
                        <h4 className="font-medium mb-1">{t("payments.completePayment")}</h4>
                        <p className="text-sm text-muted-foreground">
                          {t("payments.makePaymentAsAgreedAndAskFreelancerToMarkBookingAsPaidOnThePlatform")}
                        </p>
                      </div>
    
                      <div className="pt-2 border-t">
                        <p className="text-sm font-medium">{t("payments.importantNotes")}</p>
                        <ul className="text-xs text-muted-foreground list-disc pl-4 mt-1 space-y-1">
                          <li>{t("payments.platformDoesNotHandleOfflinePayments")}</li>
                          <li>{t("payments.alwaysKeepRecordsOfPayments")}</li>
                          <li>{t("payments.freelancerNeedsToConfirmPayment")}</li>
                          <li>{t("payments.disputesContactSupport")}</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={() => router.push("/dashboard")}>
                    {t("payments.goToDashboard")}
                  </Button>
                  <Link href={`/bookings/${booking.id}`}>
                    <Button>{t("payments.viewBookingDetails")}</Button>
                  </Link>
                </CardFooter>
              </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>{t("payments.paymentDetails")}</CardTitle>
                  <CardDescription>{t("payments.completePaymentToConfirmBooking")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="relative h-12 w-12 rounded-full overflow-hidden">
                        <Image
                          src={booking.freelancer?.avatar_url || `/placeholder.svg?height=48&width=48`}
                          alt={`${booking.freelancer?.first_name} ${booking.freelancer?.last_name}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="font-semibold">
                          {booking.freelancer?.first_name} {booking.freelancer?.last_name}
                        </h3>
                        <p className="text-sm text-muted-foreground">{t("payments.freelancer")}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t("payments.date")}</span>
                        <span>{format(new Date(booking.start_time), "MMMM d, yyyy")}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t("payments.time")}</span>
                        <span>
                          {format(new Date(booking.start_time), "h:mm a")} -{" "}
                          {format(new Date(booking.end_time), "h:mm a")}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t("payments.location")}</span>
                        <span>{booking.location || t("payments.notSpecified")}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold">{t("payments.paymentMethod")}</h3>

                    <div className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">{t("payments.creditCard")}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <label className="text-sm text-muted-foreground mb-1 block">{t("payments.cardNumber")}</label>
                          <input
                            type="text"
                            className="w-full p-2 border rounded-md"
                            placeholder={t("payments.cardNumberPlaceholder")}
                          />
                        </div>
                        <div>
                          <label className="text-sm text-muted-foreground mb-1 block">{t("payments.expiryDate")}</label>
                          <input type="text" className="w-full p-2 border rounded-md" placeholder={t("payments.expiryDatePlaceholder")} />
                        </div>
                        <div>
                          <label className="text-sm text-muted-foreground mb-1 block">{t("payments.cvc")}</label>
                          <input type="text" className="w-full p-2 border rounded-md" placeholder={t("payments.cvcPlaceholder")} />
                        </div>
                        <div className="col-span-2">
                          <label className="text-sm text-muted-foreground mb-1 block">{t("payments.nameOnCard")}</label>
                          <input type="text" className="w-full p-2 border rounded-md" placeholder={t("payments.nameOnCardPlaceholder")} />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={() => router.push("/dashboard")}>
                    {t("payments.cancel")}
                  </Button>
                  <Button onClick={handlePayment} disabled={processing}>
                    {processing ? (
                      <div className="flex justify-center items-center min-h-screen w-full">
                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                        {t("payments.processing")}
                      </div>
                    ) : (
                      `${t("payments.pay")} €${booking.total_amount.toFixed(2)}`
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </div>

            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>{t("payments.orderSummary")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {booking.package_id ? (
                    // Package pricing display
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("payments.servicePackage")}</span>
                        <span>{booking.package_name}</span>
                      </div>
                      {booking.package_description && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t("payments.packageDetails")}</span>
                          <span className="text-sm">{booking.package_description}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    // Hourly pricing display
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("payments.hourlyRate")}</span>
                        <span>€{booking.hourly_rate?.toFixed(2) || '0.00'}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("payments.duration")}</span>
                        <span>
                          {(
                            (new Date(booking.end_time).getTime() - new Date(booking.start_time).getTime()) /
                            3600000
                          ).toFixed(1)}{" "}
                          {t("payments.hours")}
                        </span>
                      </div>
                    </>
                  )}

                  <div className="border-t pt-4">
                    <div className="flex justify-between font-bold">
                      <span>{t("payments.total")}</span>
                      <span>€{booking.total_amount.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    <p>{t("payments.paymentHeldSecurelyUntilJobIsComplete")}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  )
}

