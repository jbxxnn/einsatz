import { useOptimizedSupabase } from "@/components/optimized-supabase-provider"
import { useOptimizedUser } from "@/components/optimized-user-provider"
import { useState, useEffect } from "react"

interface DashboardStats {
  // Freelancer stats
  totalEarnings?: number
  activeBookings?: number
  totalClients?: number
  averageResponseTime?: number
  earningsTrend?: number
  bookingsTrend?: number
  clientsTrend?: number
  responseTimeTrend?: number
  // Client stats
  totalSpent?: number
  activeProjects?: number
  freelancersUsed?: number
  projectsCompleted?: number
}

export function useDashboardStats() {
  const { supabase } = useOptimizedSupabase()
  const { profile } = useOptimizedUser()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!profile) {
      setLoading(false)
      return
    }

    async function fetchDashboardStats() {
      // Create AbortController for timeout protection
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

      try {
        setLoading(true)
        setError(null)

        const userId = profile.id
        const userType = profile.user_type

        if (userType === 'freelancer') {
          // Freelancer-specific stats
          const freelancerId = userId

        // 1. Fetch total earnings (sum of paid bookings)
        const { data: earningsData, error: earningsError } = await supabase
          .from('bookings')
          .select('total_amount, created_at')
          .eq('freelancer_id', freelancerId)
          .eq('payment_status', 'paid')

        if (earningsError) throw earningsError

        const totalEarnings = earningsData?.reduce((sum, booking) => sum + Number(booking.total_amount), 0) || 0

        // 2. Fetch active bookings count
        const { data: activeBookingsData, error: activeBookingsError } = await supabase
          .from('bookings')
          .select('id')
          .eq('freelancer_id', freelancerId)
          .in('status', ['confirmed', 'pending'])

        if (activeBookingsError) throw activeBookingsError

        const activeBookings = activeBookingsData?.length || 0

        // 3. Fetch total unique clients
        const { data: clientsData, error: clientsError } = await supabase
          .from('bookings')
          .select('client_id')
          .eq('freelancer_id', freelancerId)

        if (clientsError) throw clientsError

        const uniqueClients = new Set(clientsData?.map(booking => booking.client_id)).size

        // 4. Calculate average response time (simplified - time between booking creation and first update)
        const { data: responseTimeData, error: responseTimeError } = await supabase
          .from('bookings')
          .select('created_at, updated_at')
          .eq('freelancer_id', freelancerId)
          .limit(50) // Limit for performance

        if (responseTimeError) throw responseTimeError

        let totalResponseTime = 0
        let responseCount = 0

        responseTimeData?.forEach(booking => {
          const created = new Date(booking.created_at)
          const updated = new Date(booking.updated_at)
          const diffHours = (updated.getTime() - created.getTime()) / (1000 * 60 * 60)
          // Only count if there's a reasonable time difference (not same timestamp)
          if (diffHours > 0.1 && diffHours < 168) { // Between 6 minutes and 1 week
            totalResponseTime += diffHours
            responseCount++
          }
        })

        const averageResponseTime = responseCount > 0 ? totalResponseTime / responseCount : 0

        // 5. Calculate trends (current month vs previous month)
        const now = new Date()
        const currentYear = now.getFullYear()
        const currentMonth = now.getMonth()
        const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear
        const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1

        // Current month earnings
        const { data: currentMonthEarnings, error: currentMonthError } = await supabase
          .from('bookings')
          .select('total_amount')
          .eq('freelancer_id', freelancerId)
          .eq('payment_status', 'paid')
          .gte('created_at', new Date(currentYear, currentMonth, 1).toISOString())
          .lt('created_at', new Date(currentYear, currentMonth + 1, 1).toISOString())

        if (currentMonthError) throw currentMonthError

        // Previous month earnings
        const { data: previousMonthEarnings, error: previousMonthError } = await supabase
          .from('bookings')
          .select('total_amount')
          .eq('freelancer_id', freelancerId)
          .eq('payment_status', 'paid')
          .gte('created_at', new Date(previousYear, previousMonth, 1).toISOString())
          .lt('created_at', new Date(previousYear, previousMonth + 1, 1).toISOString())

        if (previousMonthError) throw previousMonthError

        const currentMonthTotal = currentMonthEarnings?.reduce((sum, booking) => sum + Number(booking.total_amount), 0) || 0
        const previousMonthTotal = previousMonthEarnings?.reduce((sum, booking) => sum + Number(booking.total_amount), 0) || 0

        const earningsTrend = previousMonthTotal > 0 ? ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100 : 0

        // Calculate other trends (simplified for now)
        const bookingsTrend = 0 // Will be calculated similarly
        const clientsTrend = 0 // Will be calculated similarly
        const responseTimeTrend = 0 // Will be calculated similarly

          setStats({
            totalEarnings,
            activeBookings,
            totalClients: uniqueClients,
            averageResponseTime,
            earningsTrend,
            bookingsTrend,
            clientsTrend,
            responseTimeTrend
          })
        } else {
          // Client-specific stats
          const clientId = userId

          // 1. Fetch total spent (sum of paid bookings)
          const { data: spendingData, error: spendingError } = await supabase
            .from('bookings')
            .select('total_amount')
            .eq('client_id', clientId)
            .eq('payment_status', 'paid')

          if (spendingError) throw spendingError

          const totalSpent = spendingData?.reduce((sum, booking) => sum + Number(booking.total_amount), 0) || 0

          // 2. Fetch active projects count
          const { data: activeProjectsData, error: activeProjectsError } = await supabase
            .from('bookings')
            .select('id')
            .eq('client_id', clientId)
            .in('status', ['confirmed', 'pending'])

          if (activeProjectsError) throw activeProjectsError

          const activeProjects = activeProjectsData?.length || 0

          // 3. Fetch unique freelancers used
          const { data: freelancersData, error: freelancersError } = await supabase
            .from('bookings')
            .select('freelancer_id')
            .eq('client_id', clientId)

          if (freelancersError) throw freelancersError

          const freelancersUsed = new Set(freelancersData?.map(booking => booking.freelancer_id)).size

          // 4. Fetch completed projects
          const { data: completedProjectsData, error: completedProjectsError } = await supabase
            .from('bookings')
            .select('id')
            .eq('client_id', clientId)
            .eq('status', 'completed')

          if (completedProjectsError) throw completedProjectsError

          const projectsCompleted = completedProjectsData?.length || 0

          setStats({
            totalSpent,
            activeProjects,
            freelancersUsed,
            projectsCompleted
          })
        }

      } catch (err: any) {
        console.error('Error fetching dashboard stats:', err)
        
        // Handle timeout errors specifically
        if (err.name === 'AbortError' || err.message?.includes('timeout') || err.message?.includes('aborted')) {
          console.warn('Dashboard stats request timed out')
          setError('Request timed out. Please try again.')
        } else {
          console.error('Error details:', {
            message: err.message,
            code: err.code,
            details: err.details,
            hint: err.hint
          })
          setError(err.message || 'Failed to fetch dashboard statistics')
        }
      } finally {
        setLoading(false)
        clearTimeout(timeoutId)
      }
    }

    fetchDashboardStats()
  }, [profile, supabase])

  return { stats, loading, error }
} 