"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSupabase } from "@/components/supabase-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, CheckCircle, CreditCard, Loader2 } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"
import Image from "next/image"
import type { Database } from "@/lib/database.types"

type Booking = Database["public"]["Tables"]["bookings"]["Row"] & {
  freelancer: Database["public"]["Tables"]["profiles"]["Row"]
}

export default function PaymentPage() {
  const params = useParams()
  const router = useRouter()
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)

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
          freelancer:freelancer_id(id, first_name, last_name, avatar_url, hourly_rate)
        `)
        .eq("id", params.id)
        .eq("client_id", user.id)
        .single()

      if (error) {
        console.error("Error fetching booking:", error)
        toast({
          title: "Error",
          description: "Could not load booking details",
          variant: "destructive",
        })
        router.push("/dashboard")
      } else {
        setBooking(data as Booking)

        // If already paid, show success
        if (data.payment_status === "paid") {
          setPaymentSuccess(true)
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

      toast({
        title: "Payment successful",
        description: "Your booking has been confirmed",
      })
    } catch (error: any) {
      toast({
        title: "Payment failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
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
        <h1 className="text-2xl font-bold mb-4">Booking not found</h1>
        <Button onClick={() => router.push("/dashboard")}>Go to Dashboard</Button>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <Link href="/dashboard" className="flex items-center text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Dashboard
      </Link>

      <div className="max-w-2xl mx-auto">
        {paymentSuccess ? (
          <Card>
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
              <p className="text-muted-foreground mb-6">
                Your booking has been confirmed. We've sent a confirmation email with all the details.
              </p>
              <div className="w-full max-w-md p-4 border rounded-lg mb-6">
                <div className="flex justify-between mb-2">
                  <span className="text-muted-foreground">Booking ID</span>
                  <span className="font-medium">{booking.id.substring(0, 8)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium">{format(new Date(booking.start_time), "MMMM d, yyyy")}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-muted-foreground">Time</span>
                  <span className="font-medium">
                    {format(new Date(booking.start_time), "h:mm a")} - {format(new Date(booking.end_time), "h:mm a")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Amount</span>
                  <span className="font-bold">€{booking.total_amount.toFixed(2)}</span>
                </div>
              </div>
              <div className="flex gap-4">
                <Link href={`/bookings/${booking.id}`}>
                  <Button>View Booking Details</Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="outline">Go to Dashboard</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Payment Details</CardTitle>
                  <CardDescription>Complete your payment to confirm the booking</CardDescription>
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
                        <p className="text-sm text-muted-foreground">Freelancer</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Date</span>
                        <span>{format(new Date(booking.start_time), "MMMM d, yyyy")}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Time</span>
                        <span>
                          {format(new Date(booking.start_time), "h:mm a")} -{" "}
                          {format(new Date(booking.end_time), "h:mm a")}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Location</span>
                        <span>{booking.location || "Not specified"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold">Payment Method</h3>

                    <div className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">Credit Card</span>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <label className="text-sm text-muted-foreground mb-1 block">Card Number</label>
                          <input
                            type="text"
                            className="w-full p-2 border rounded-md"
                            placeholder="4242 4242 4242 4242"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-muted-foreground mb-1 block">Expiry Date</label>
                          <input type="text" className="w-full p-2 border rounded-md" placeholder="MM/YY" />
                        </div>
                        <div>
                          <label className="text-sm text-muted-foreground mb-1 block">CVC</label>
                          <input type="text" className="w-full p-2 border rounded-md" placeholder="123" />
                        </div>
                        <div className="col-span-2">
                          <label className="text-sm text-muted-foreground mb-1 block">Name on Card</label>
                          <input type="text" className="w-full p-2 border rounded-md" placeholder="John Doe" />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={() => router.push("/dashboard")}>
                    Cancel
                  </Button>
                  <Button onClick={handlePayment} disabled={processing}>
                    {processing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      `Pay €${booking.total_amount.toFixed(2)}`
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </div>

            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Hourly Rate</span>
                    <span>€{booking.hourly_rate.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration</span>
                    <span>
                      {(
                        (new Date(booking.end_time).getTime() - new Date(booking.start_time).getTime()) /
                        3600000
                      ).toFixed(1)}{" "}
                      hours
                    </span>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span>€{booking.total_amount.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    <p>Payment is held securely until you confirm the job is complete.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

