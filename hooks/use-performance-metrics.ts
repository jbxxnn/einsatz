import { useOptimizedSupabase } from "@/components/optimized-supabase-provider"
import { useOptimizedUser } from "@/components/optimized-user-provider"
import { useState, useEffect } from "react"

interface MonthlyData {
  month: string
  earnings: number
  bookings: number
}

interface MonthlySpendingData {
  month: string
  spending: number
}

interface ProjectCategoryData {
  category: string
  count: number
}

interface PerformanceMetrics {
  monthlyEarnings: MonthlyData[]
  monthlyBookings: MonthlyData[]
  monthlySpending?: MonthlySpendingData[]
  projectCategories?: ProjectCategoryData[]
  kpis: {
    averageRating: number
    responseTime: number
    completionRate: number
    clientRetention: number
    // Client-specific KPIs
    totalSpent?: number
    projectsCompleted?: number
    averageProjectCost?: number
    freelancersUsed?: number
  }
}

export function usePerformanceMetrics() {
  const { supabase } = useOptimizedSupabase()
  const { profile } = useOptimizedUser()
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!profile) {
      setLoading(false)
      return
    }

    async function fetchPerformanceMetrics() {
      try {
        setLoading(true)
        setError(null)

        const userId = profile.id
        const userType = profile.user_type

        // Generate last 12 months
        const months = []
        const now = new Date()
        for (let i = 11; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
          months.push({
            year: date.getFullYear(),
            month: date.getMonth(),
            label: date.toLocaleDateString('en-US', { month: 'short' })
          })
        }

        if (userType === 'freelancer') {
          // Freelancer-specific metrics
          // Fetch earnings data for each month
          const earningsPromises = months.map(async ({ year, month, label }) => {
            const startDate = new Date(year, month, 1).toISOString()
            const endDate = new Date(year, month + 1, 1).toISOString()
            
            const { data, error } = await supabase
              .from('bookings')
              .select('total_amount')
              .eq('freelancer_id', userId)
              .eq('payment_status', 'paid')
              .gte('created_at', startDate)
              .lt('created_at', endDate)

            if (error) throw error

            const totalEarnings = data?.reduce((sum, booking) => sum + Number(booking.total_amount), 0) || 0
            return { month: label, earnings: totalEarnings }
          })

          // Fetch bookings data for each month
          const bookingsPromises = months.map(async ({ year, month, label }) => {
            const startDate = new Date(year, month, 1).toISOString()
            const endDate = new Date(year, month + 1, 1).toISOString()
            
            const { data, error } = await supabase
              .from('bookings')
              .select('id')
              .eq('freelancer_id', userId)
              .gte('created_at', startDate)
              .lt('created_at', endDate)

            if (error) throw error

            const totalBookings = data?.length || 0
            return { month: label, bookings: totalBookings }
          })

          // Wait for all promises to resolve
          const [earningsResults, bookingsResults] = await Promise.all([
            Promise.all(earningsPromises),
            Promise.all(bookingsPromises)
          ])

          // Calculate KPIs
          // Average rating from reviews
          const { data: reviewsData } = await supabase
            .from('reviews')
            .select('rating')
            .eq('reviewee_id', userId)

          const averageRating = reviewsData && reviewsData.length > 0 
            ? reviewsData.reduce((sum, review) => sum + review.rating, 0) / reviewsData.length 
            : 0

          // Response time (simplified calculation)
          const { data: responseTimeData } = await supabase
            .from('bookings')
            .select('created_at, updated_at')
            .eq('freelancer_id', userId)
            .limit(50)

          let totalResponseTime = 0
          let responseCount = 0

          responseTimeData?.forEach(booking => {
            const created = new Date(booking.created_at)
            const updated = new Date(booking.updated_at)
            const diffHours = (updated.getTime() - created.getTime()) / (1000 * 60 * 60)
            if (diffHours > 0.1 && diffHours < 168) {
              totalResponseTime += diffHours
              responseCount++
            }
          })

          const responseTime = responseCount > 0 ? totalResponseTime / responseCount : 0

          // Completion rate (completed vs total bookings)
          const { data: totalBookingsData } = await supabase
            .from('bookings')
            .select('status')
            .eq('freelancer_id', userId)

          const totalBookings = totalBookingsData?.length || 0
          const completedBookings = totalBookingsData?.filter(b => b.status === 'completed').length || 0
          const completionRate = totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0

          // Client retention (unique clients)
          const { data: clientsData } = await supabase
            .from('bookings')
            .select('client_id')
            .eq('freelancer_id', userId)

          const uniqueClients = new Set(clientsData?.map(booking => booking.client_id)).size
          const clientRetention = uniqueClients // Simplified for now

          setMetrics({
            monthlyEarnings: earningsResults,
            monthlyBookings: bookingsResults,
            kpis: {
              averageRating,
              responseTime,
              completionRate,
              clientRetention
            }
          })
        } else {
          // Client-specific metrics
          // Fetch spending data for each month
          const spendingPromises = months.map(async ({ year, month, label }) => {
            const startDate = new Date(year, month, 1).toISOString()
            const endDate = new Date(year, month + 1, 1).toISOString()
            
            const { data, error } = await supabase
              .from('bookings')
              .select('total_amount')
              .eq('client_id', userId)
              .eq('payment_status', 'paid')
              .gte('created_at', startDate)
              .lt('created_at', endDate)

            if (error) throw error

            const totalSpending = data?.reduce((sum, booking) => sum + Number(booking.total_amount), 0) || 0
            return { month: label, spending: totalSpending }
          })

          // Fetch project categories
          const { data: categoryData } = await supabase
            .from('bookings')
            .select(`
              category_id,
              job_categories(name)
            `)
            .eq('client_id', userId)

          const categoryCounts: { [key: string]: number } = {}
          categoryData?.forEach(booking => {
            const categoryName = (booking.job_categories as any)?.name || 'Unknown'
            categoryCounts[categoryName] = (categoryCounts[categoryName] || 0) + 1
          })

          const projectCategories = Object.entries(categoryCounts).map(([category, count]) => ({
            category,
            count
          }))

          // Calculate client KPIs
          const { data: allBookingsData } = await supabase
            .from('bookings')
            .select('total_amount, status, freelancer_id')
            .eq('client_id', userId)

          const totalSpent = allBookingsData?.reduce((sum, booking) => sum + Number(booking.total_amount), 0) || 0
          const projectsCompleted = allBookingsData?.filter(b => b.status === 'completed').length || 0
          const averageProjectCost = allBookingsData && allBookingsData.length > 0 
            ? totalSpent / allBookingsData.length 
            : 0
          const freelancersUsed = new Set(allBookingsData?.map(booking => booking.freelancer_id)).size

          const spendingResults = await Promise.all(spendingPromises)

          setMetrics({
            monthlyEarnings: [], // Not applicable for clients
            monthlyBookings: [], // Not applicable for clients
            monthlySpending: spendingResults,
            projectCategories,
            kpis: {
              averageRating: 0, // Not applicable for clients
              responseTime: 0, // Not applicable for clients
              completionRate: 0, // Not applicable for clients
              clientRetention: 0, // Not applicable for clients
              totalSpent,
              projectsCompleted,
              averageProjectCost,
              freelancersUsed
            }
          })
        }

      } catch (err: any) {
        console.error('Error fetching performance metrics:', err)
        setError(err.message || 'Failed to fetch performance metrics')
      } finally {
        setLoading(false)
      }
    }

    fetchPerformanceMetrics()
  }, [profile, supabase])

  return { metrics, loading, error }
} 