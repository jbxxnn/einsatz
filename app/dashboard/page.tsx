"use client"

import { Suspense } from "react"

import { useState, useEffect } from "react"
import type { Database } from "@/lib/database.types"
import DashboardStats from "@/components/dashboard-stats"
import UpcomingBookings from "@/components/upcoming-bookings"
import { useOptimizedSupabase } from "@/components/optimized-supabase-provider"
// import RecentMessages from "@/components/recent-messages"
import { Skeleton } from "@/components/ui/skeleton"
import SidebarNav from "@/components/sidebar-nav"
import { Button } from "@/components/ui/button"
import { toast } from "@/lib/toast"
import { useRouter } from "next/navigation"
import LoadingSpinner from "@/components/loading-spinner"
import { useTranslation } from "@/lib/i18n"
import FreelancerOnboardingProgress from "@/components/freelancer-onboarding-progress"

type Booking = Database["public"]["Tables"]["bookings"]["Row"] & {
  freelancer: Database["public"]["Tables"]["profiles"]["Row"]
  client: Database["public"]["Tables"]["profiles"]["Row"]
}

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

export default function DashboardPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { supabase } = useOptimizedSupabase()
  const [profile, setProfile] = useState<Database["public"]["Tables"]["profiles"]["Row"] | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [saving, setSaving] = useState(false)
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
  })


  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true)

      try {
        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push("/login")
          return
        }

        // Get profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()

        if (profileError) {
          throw profileError
        }

        setProfile(profileData)

        // Load notification settings from metadata if available
        if (profileData.metadata && typeof profileData.metadata === "object" && profileData.metadata.notifications) {
          setNotifications({
            ...notifications,
            ...profileData.metadata.notifications,
          })
        }
      } catch (error) {
        console.error("Error fetching profile:", error)
        toast.error(t("dashboard.settings.error"))
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [supabase, router, toast])

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
      setProfile({
        ...profile,
        metadata,
      })
    } catch (error: any) {
      toast.error(error.message || t("dashboard.settings.failedToUpdateNotificationSettings"))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container py-10 flex justify-center items-center min-h-[50vh]">
        <LoadingSpinner />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="container py-10 text-center">
        <h1 className="text-2xl font-bold mb-4">{t("dashboard.profileNotFound")}</h1>
        <Button onClick={() => router.push("/")}>{t("dashboard.goToHome")}</Button>
      </div>
    )
  }


  return (

    <div className="bg-muted/30 min-h-screen">
      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <SidebarNav profile={profile} />
          </div>


          <div className="lg:col-span-3 space-y-6">
      <h1 className="text-3xl font-bold mb-6">{t("dashboard.title")}</h1>
      {profile.user_type === "freelancer" && (
        <FreelancerOnboardingProgress profile={profile} />
      )}

      <div className="space-y-8">
        {/* Stats section - loads first */}
        <Suspense fallback={<StatsSkeleton />}>
          <DashboardStats />
        </Suspense>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Bookings section - loads in parallel */}
          <div className="lg:col-span-2">
            <Suspense fallback={<BookingsSkeleton />}>
              <UpcomingBookings />
            </Suspense>
          </div>

          {/* Messages section - loads in parallel */}
          <div className="lg:col-span-1">
            <Suspense fallback={<MessagesSkeleton />}>
              {/* <RecentMessages /> */}
            </Suspense>
          </div>
        </div>
      </div>
    </div>
    </div>
    </div>
    </div>
  )
}
/*
export default function Dashboard() {
  const router = useRouter()
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [profile, setProfile] = useState<Database["public"]["Tables"]["profiles"]["Row"] | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)

      try {
        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push("/login")
          return
        }

        // Get profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()

        if (profileError) {
          throw profileError
        }

        setProfile(profileData)

        // Fetch bookings
        let query

        if (profileData.user_type === "client") {
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

        const { data: bookingsData, error: bookingsError } = await query

        if (bookingsError) {
          throw bookingsError
        }

        setBookings(bookingsData as Booking[])
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error",
          description: "Failed to load dashboard data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase, router, toast])

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

  const getStatusBadge = (status: string, paymentMethod = "online") => {
    switch (status) {
      case "pending":
        return (
          <div className="flex gap-1 flex-wrap">
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
              Pending
            </Badge>
            {paymentMethod === "offline" && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                Offline
              </Badge>
            )}
          </div>
        )
      case "confirmed":
        return (
          <div className="flex gap-1 flex-wrap">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              Confirmed
            </Badge>
            {paymentMethod === "offline" && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                Offline
              </Badge>
            )}
          </div>
        )
      case "completed":
        return (
          <div className="flex gap-1 flex-wrap">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Completed
            </Badge>
            {paymentMethod === "offline" && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                Offline
              </Badge>
            )}
          </div>
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
        <LoadingSpinner />
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
    <div className="bg-muted/30 min-h-screen">
      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar }
          <div className="lg:col-span-1">
            <SidebarNav profile={profile} />
          </div>

          {/* Main Content }
          <div className="lg:col-span-3 space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">Dashboard</h1>
              {profile.user_type === "client" && (
                <Link href="/freelancers">
                  <Button>Book a Freelancer</Button>
                </Link>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Bookings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{bookings.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {
                      bookings.filter(
                        (b) => new Date(b.start_time) > new Date() && ["pending", "confirmed"].includes(b.status),
                      ).length
                    }
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{bookings.filter((b) => b.status === "completed").length}</div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="upcoming">
              <div className="flex justify-between items-center mb-4">
                <TabsList>
                  <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                  <TabsTrigger value="past">Past</TabsTrigger>
                </TabsList>
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

                                  <div className="flex items-center mt-1">
                                    {getStatusBadge(booking.status, booking.payment_method)}
                                  </div>
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
                  (b) =>
                    new Date(b.start_time) < new Date() || ["completed", "cancelled", "disputed"].includes(b.status),
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
                        new Date(b.start_time) < new Date() ||
                        ["completed", "cancelled", "disputed"].includes(b.status),
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

                                  <div className="flex items-center mt-1">
                                    {getStatusBadge(booking.status, booking.payment_method)}
                                  </div>
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
    </div>
  )
}
*/
