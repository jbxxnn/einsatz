"use client"

import { useBookings } from "@/lib/data-fetching"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"
import Image from "next/image"
import { useOptimizedUser } from "@/components/optimized-user-provider"
import type { Database } from "@/lib/database.types"
import { useTranslation } from "@/lib/i18n"

type Booking = Database["public"]["Tables"]["bookings"]["Row"] & {
  freelancer?: Database["public"]["Tables"]["profiles"]["Row"]
  client?: Database["public"]["Tables"]["profiles"]["Row"]
}

export default function UpcomingBookings() {
  const { profile } = useOptimizedUser()
  const { data: bookings, error, isLoading } = useBookings()
  const { t } = useTranslation()

  // Filter for upcoming bookings
  const upcomingBookings = bookings
    ?.filter((b: Booking) => new Date(b.start_time) > new Date() && ["pending", "confirmed"].includes(b.status))
    .slice(0, 3) // Show only 3 most recent

  if (isLoading) {
    return (
      <div>
        <h2 className="text-xl font-semibold mb-4">{t("dashboard.bookings.title")}</h2>
        <div className="space-y-4 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-0">
                <div className="h-32 bg-muted"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <h2 className="text-xl font-semibold mb-4">{t("dashboard.bookings.title")}</h2>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-500">{t("dashboard.bookings.error")}</p>
            <Button variant="outline" className="mt-2" onClick={() => window.location.reload()}>
              {t("dashboard.bookings.tryAgain")}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!upcomingBookings || upcomingBookings.length === 0) {
    return (
      <div>
        <h2 className="text-xl font-semibold mb-4">{t("dashboard.bookings.title")}</h2>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">{t("dashboard.bookings.noBookings")}</p>
            {profile?.user_type === "client" ? (
              <Link href="/freelancers">
                <Button className="mt-4">{t("dashboard.bookings.findFreelancers")}</Button>
              </Link>
            ) : (
              <p className="mt-2 text-sm">{t("dashboard.bookings.bookingsWillAppear")}</p>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">{t("dashboard.bookings.title")}</h2>
      <div className="space-y-4">
        {upcomingBookings.map((booking: Booking) => (
          <Card key={booking.id}>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="md:w-1/4">
                  <div className="relative h-20 w-20 rounded-lg overflow-hidden">
                    <Image
                      src={
                        profile?.user_type === "client"
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
                        {profile?.user_type === "client"
                          ? ` ${t("dashboard.bookings.bookingWith")} ${booking.freelancer?.first_name} ${booking.freelancer?.last_name}`
                          : ` ${t("dashboard.bookings.bookingFrom")} ${booking.client?.first_name} ${booking.client?.last_name}`}
                      </h3>

                      <div className="flex items-center mt-1">
                        <Badge
                          variant="outline"
                          className={
                            booking.status === "pending"
                              ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                              : "bg-blue-50 text-blue-700 border-blue-200"
                          }
                        >
                          {booking.status === "pending" ? t("dashboard.bookings.pending") : t("dashboard.bookings.confirmed")}
                        </Badge>
                      </div>
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

                  <div className="mt-4">
                    <Link href={`/bookings/${booking.id}`}>
                      <Button size="sm" variant="outline">
                        {t("dashboard.bookings.viewDetails")}
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        <div className="text-center">
          <Link href="/bookings">
            <Button variant="outline">{t("dashboard.bookings.viewAllBookings")}</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
