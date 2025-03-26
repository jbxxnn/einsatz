"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/supabase-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { Calendar, Clock, MapPin, User, Briefcase, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { format } from "date-fns"
import type { Database } from "@/lib/database.types"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]
type Booking = Database["public"]["Tables"]["bookings"]["Row"] & {
  freelancer: Profile
  client: Profile
}

export default function Dashboard() {
  const router = useRouter()
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login")
        return
      }

      setUser(user)

      // Fetch profile
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

      setProfile(profile)

      // Fetch bookings
      let query

      if (profile?.user_type === "client") {
        query = supabase
          .from("bookings")
          .select(`
            *,
            freelancer:freelancer_id(id, first_name, last_name, avatar_url, hourly_rate)
          `)
          .eq("client_id", user.id)
          .order("start_time", { ascending: false })
      } else {
        query = supabase
          .from("bookings")
          .select(`
            *,
            client:client_id(id, first_name, last_name, avatar_url)
          `)
          .eq("freelancer_id", user.id)
          .order("start_time", { ascending: false })
      }

      const { data: bookingsData, error } = await query

      if (error) {
        console.error("Error fetching bookings:", error)
      } else {
        setBookings(bookingsData as Booking[])
      }

      setLoading(false)
    }

    fetchUserData()
  }, [supabase, router])

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

      if (error) {
        throw error
      }

      // Update local state
      setBookings(bookings.map((booking) => (booking.id === bookingId ? { ...booking, ...updateData } : booking)))

      toast({
        title: "Success",
        description: `Booking ${action}ed successfully`,
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            Pending
          </Badge>
        )
      case "confirmed":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Confirmed
          </Badge>
        )
      case "completed":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Completed
          </Badge>
        )
      case "cancelled":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Cancelled
          </Badge>
        )
      case "disputed":
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            Disputed
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

  if (!profile) {
    return (
      <div className="container py-10 text-center">
        <h1 className="text-2xl font-bold mb-4">Profile not found</h1>
        <Button onClick={() => router.push("/")}>Go to Home</Button>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center text-center">
              <div className="relative h-24 w-24 rounded-full overflow-hidden mb-4">
                <Image
                  src={
                    profile.avatar_url ||
                    `/placeholder.svg?height=96&width=96&text=${profile.first_name?.charAt(0) || "U"}`
                  }
                  alt={profile.first_name || "User"}
                  fill
                  className="object-cover"
                />
              </div>
              <h2 className="text-xl font-semibold">
                {profile.first_name} {profile.last_name}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {profile.user_type === "client" ? "Client" : "Freelancer"}
              </p>

              {profile.location && (
                <div className="flex items-center mt-2 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3 mr-1" />
                  <span>{profile.location}</span>
                </div>
              )}

              <div className="mt-4 w-full">
                <Link href="/profile">
                  <Button variant="outline" className="w-full">
                    Edit Profile
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Quick Links</CardTitle>
            </CardHeader>
            <CardContent>
              <nav className="space-y-2">
                <Link href="/dashboard" className="flex items-center text-primary font-medium">
                  <Briefcase className="h-4 w-4 mr-2" />
                  Bookings
                </Link>
                {profile.user_type === "client" && (
                  <Link href="/freelancers" className="flex items-center text-muted-foreground hover:text-primary">
                    <User className="h-4 w-4 mr-2" />
                    Find Freelancers
                  </Link>
                )}
                <Link href="/messages" className="flex items-center text-muted-foreground hover:text-primary">
                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                    />
                  </svg>
                  Messages
                </Link>
                <Link href="/payments" className="flex items-center text-muted-foreground hover:text-primary">
                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    />
                  </svg>
                  Payments
                </Link>
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="md:col-span-3">
          <Tabs defaultValue="upcoming">
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="past">Past</TabsTrigger>
              </TabsList>

              {profile.user_type === "client" && (
                <Link href="/freelancers">
                  <Button>Book a Freelancer</Button>
                </Link>
              )}
            </div>

            <TabsContent value="upcoming" className="space-y-4">
              {bookings.filter(
                (b) => new Date(b.start_time) > new Date() && ["pending", "confirmed"].includes(b.status),
              ).length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-10">
                    <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-medium mb-2">No upcoming bookings</h3>
                    <p className="text-muted-foreground text-center max-w-md mb-4">
                      {profile.user_type === "client"
                        ? "You don't have any upcoming bookings. Book a freelancer to get started."
                        : "You don't have any upcoming jobs. Update your profile to attract more clients."}
                    </p>
                    {profile.user_type === "client" ? (
                      <Link href="/freelancers">
                        <Button>Find Freelancers</Button>
                      </Link>
                    ) : (
                      <Link href="/profile">
                        <Button>Update Profile</Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              ) : (
                bookings
                  .filter((b) => new Date(b.start_time) > new Date() && ["pending", "confirmed"].includes(b.status))
                  .map((booking) => (
                    <Card key={booking.id}>
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row gap-4">
                          <div className="md:w-1/4">
                            <div className="relative h-20 w-20 rounded-lg overflow-hidden">
                              <Image
                                src={
                                  profile.user_type === "client"
                                    ? booking.freelancer?.avatar_url || `/placeholder.svg?height=80&width=80`
                                    : booking.client?.avatar_url || `/placeholder.svg?height=80&width=80`
                                }
                                alt="Profile"
                                fill
                                className="object-cover"
                              />
                            </div>
                          </div>

                          <div className="md:w-3/4">
                            <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                              <div>
                                <h3 className="text-lg font-semibold">
                                  {profile.user_type === "client"
                                    ? `Booking with ${booking.freelancer?.first_name} ${booking.freelancer?.last_name}`
                                    : `Booking from ${booking.client?.first_name} ${booking.client?.last_name}`}
                                </h3>

                                <div className="flex items-center mt-1">{getStatusBadge(booking.status)}</div>
                              </div>

                              <div className="mt-2 md:mt-0">
                                {booking.total_amount > 0 && (
                                  <p className="font-semibold text-right">€{booking.total_amount.toFixed(2)}</p>
                                )}
                              </div>
                            </div>

                            <div className="mt-4 space-y-2">
                              <div className="flex items-center text-sm">
                                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                                <span>{format(new Date(booking.start_time), "EEEE, MMMM d, yyyy")}</span>
                              </div>

                              <div className="flex items-center text-sm">
                                <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                                <span>
                                  {format(new Date(booking.start_time), "h:mm a")} -{" "}
                                  {format(new Date(booking.end_time), "h:mm a")}
                                </span>
                              </div>

                              {booking.location && (
                                <div className="flex items-center text-sm">
                                  <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                                  <span>{booking.location}</span>
                                </div>
                              )}
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                              {profile.user_type === "client" && booking.status === "pending" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-500"
                                  onClick={() => handleBookingAction(booking.id, "cancel")}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Cancel
                                </Button>
                              )}

                              {profile.user_type === "freelancer" && booking.status === "pending" && (
                                <>
                                  <Button size="sm" onClick={() => handleBookingAction(booking.id, "confirm")}>
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Accept
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-500"
                                    onClick={() => handleBookingAction(booking.id, "cancel")}
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Decline
                                  </Button>
                                </>
                              )}

                              {booking.status === "confirmed" && (
                                <Link href={`/bookings/${booking.id}`}>
                                  <Button size="sm" variant="outline">
                                    View Details
                                  </Button>
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
              )}
            </TabsContent>

            <TabsContent value="past" className="space-y-4">
              {bookings.filter(
                (b) => new Date(b.start_time) < new Date() || ["completed", "cancelled", "disputed"].includes(b.status),
              ).length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-10">
                    <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-medium mb-2">No past bookings</h3>
                    <p className="text-muted-foreground text-center max-w-md">Your past bookings will appear here.</p>
                  </CardContent>
                </Card>
              ) : (
                bookings
                  .filter(
                    (b) =>
                      new Date(b.start_time) < new Date() || ["completed", "cancelled", "disputed"].includes(b.status),
                  )
                  .map((booking) => (
                    <Card key={booking.id}>
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row gap-4">
                          <div className="md:w-1/4">
                            <div className="relative h-20 w-20 rounded-lg overflow-hidden">
                              <Image
                                src={
                                  profile.user_type === "client"
                                    ? booking.freelancer?.avatar_url || `/placeholder.svg?height=80&width=80`
                                    : booking.client?.avatar_url || `/placeholder.svg?height=80&width=80`
                                }
                                alt="Profile"
                                fill
                                className="object-cover"
                              />
                            </div>
                          </div>

                          <div className="md:w-3/4">
                            <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                              <div>
                                <h3 className="text-lg font-semibold">
                                  {profile.user_type === "client"
                                    ? `Booking with ${booking.freelancer?.first_name} ${booking.freelancer?.last_name}`
                                    : `Booking from ${booking.client?.first_name} ${booking.client?.last_name}`}
                                </h3>

                                <div className="flex items-center mt-1">{getStatusBadge(booking.status)}</div>
                              </div>

                              <div className="mt-2 md:mt-0">
                                {booking.total_amount > 0 && (
                                  <p className="font-semibold text-right">€{booking.total_amount.toFixed(2)}</p>
                                )}
                              </div>
                            </div>

                            <div className="mt-4 space-y-2">
                              <div className="flex items-center text-sm">
                                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                                <span>{format(new Date(booking.start_time), "EEEE, MMMM d, yyyy")}</span>
                              </div>

                              <div className="flex items-center text-sm">
                                <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                                <span>
                                  {format(new Date(booking.start_time), "h:mm a")} -{" "}
                                  {format(new Date(booking.end_time), "h:mm a")}
                                </span>
                              </div>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                              {booking.status === "completed" && (
                                <Link href={`/bookings/${booking.id}`}>
                                  <Button size="sm" variant="outline">
                                    View Details
                                  </Button>
                                </Link>
                              )}

                              {profile.user_type === "client" && booking.status === "confirmed" && (
                                <Button size="sm" onClick={() => handleBookingAction(booking.id, "complete")}>
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Mark as Completed
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

