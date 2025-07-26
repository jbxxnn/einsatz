"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useOptimizedUser } from "@/components/optimized-user-provider"
import { useDashboardStats } from "@/hooks/use-dashboard-stats"
import { Calendar, Clock, DollarSign } from "lucide-react"
import { useTranslation } from "@/lib/i18n"

export default function DashboardStats() {
  const { user } = useOptimizedUser()
  const { data: stats, isLoading } = useDashboardStats()
  const { t } = useTranslation()

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
          <div className="text-2xl font-bold">{stats?.totalBookings || 0}</div>
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
          <div className="text-2xl font-bold">{stats?.upcomingBookings || 0}</div>
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
          <div className="text-2xl font-bold">{stats?.completedBookings || 0}</div>
        </CardContent>
      </Card>
    </div>
  )
}
