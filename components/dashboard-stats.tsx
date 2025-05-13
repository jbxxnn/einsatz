"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useOptimizedUser } from "@/components/optimized-user-provider"
import { useOptimizedSupabase } from "@/components/optimized-supabase-provider"
import useSWR from "swr"
import { Calendar, Clock, DollarSign } from "lucide-react"
import { useTranslation } from "@/lib/i18n"

export default function DashboardStats() {
  const { user } = useOptimizedUser()
  const { supabase } = useOptimizedSupabase()
  const { t } = useTranslation()

  // Fetch stats with SWR for caching and revalidation
  const { data: stats, isLoading } = useSWR(
    user ? "dashboard-stats" : null,
    async () => {
      // Fetch bookings count
      const { count: bookingsCount } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .or(`client_id.eq.${user!.id},freelancer_id.eq.${user!.id}`)

      // Fetch upcoming bookings count
      const { count: upcomingCount } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .or(`client_id.eq.${user!.id},freelancer_id.eq.${user!.id}`)
        .gt("start_time", new Date().toISOString())
        .in("status", ["pending", "confirmed"])

      // Fetch completed bookings count
      const { count: completedCount } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .or(`client_id.eq.${user!.id},freelancer_id.eq.${user!.id}`)
        .eq("status", "completed")

      return {
        bookingsCount: bookingsCount || 0,
        upcomingCount: upcomingCount || 0,
        completedCount: completedCount || 0,
      }
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minute
    },
  )

  // Show skeleton while loading
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                <div className="h-4 w-24 bg-muted rounded"></div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-8 w-12 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            {t("dashboard.stats.bookings")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.bookingsCount || 0}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
            <Clock className="h-4 w-4 mr-2" />
            {t("dashboard.stats.upcoming")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.upcomingCount || 0}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
            <DollarSign className="h-4 w-4 mr-2" />
            {t("dashboard.stats.completed")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.completedCount || 0}</div>
        </CardContent>
      </Card>
    </div>
  )
}
