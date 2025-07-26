import { useOptimizedSupabase } from "@/components/optimized-supabase-provider"
import { useOptimizedUser } from "@/components/optimized-user-provider"
import { useState, useEffect } from "react"

interface Booking {
  id: string
  title: string
  description: string | null
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  start_time: string
  end_time: string
  location: string | null
  hourly_rate: number
  total_amount: number
  payment_status: 'unpaid' | 'paid' | 'pending'
  created_at: string
  updated_at: string
  client: {
    id: string
    first_name: string | null
    last_name: string | null
    avatar_url: string | null
  }
  freelancer: {
    id: string
    first_name: string | null
    last_name: string | null
    avatar_url: string | null
  }
}

interface BookingsData {
  upcoming: Booking[]
  completed: Booking[]
  cancelled: Booking[]
}

export function useBookings() {
  const { supabase } = useOptimizedSupabase()
  const { profile } = useOptimizedUser()
  const [bookings, setBookings] = useState<BookingsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!profile) {
      setLoading(false)
      return
    }

    async function fetchBookings() {
      // Create AbortController for timeout protection
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

      try {
        setLoading(true)
        setError(null)

        const userId = profile.id
        const userType = profile.user_type

        let query

        if (userType === 'freelancer') {
          // Fetch bookings for freelancer
          query = supabase
            .from('bookings')
            .select(`
              id,
              title,
              description,
              status,
              start_time,
              end_time,
              location,
              hourly_rate,
              total_amount,
              payment_status,
              created_at,
              updated_at,
              client:profiles!bookings_client_id_fkey(
                id,
                first_name,
                last_name,
                avatar_url
              )
            `)
            .eq('freelancer_id', userId)
        } else {
          // Fetch bookings for client
          query = supabase
            .from('bookings')
            .select(`
              id,
              title,
              description,
              status,
              start_time,
              end_time,
              location,
              hourly_rate,
              total_amount,
              payment_status,
              created_at,
              updated_at,
              freelancer:profiles!bookings_freelancer_id_fkey(
                id,
                first_name,
                last_name,
                avatar_url
              )
            `)
            .eq('client_id', userId)
        }

        const { data: bookingsData, error: bookingsError } = await query

        if (bookingsError) throw bookingsError

        if (bookingsData) {
          const now = new Date()
          
          // Upcoming: pending/confirmed bookings that haven't ended yet
          const upcoming = bookingsData.filter(booking => {
            const endTime = new Date(booking.end_time)
            return (booking.status === 'pending' || booking.status === 'confirmed') && endTime > now
          }).sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())

          // Completed: bookings with completed status or past confirmed/pending bookings
          const completed = bookingsData.filter(booking => {
            const endTime = new Date(booking.end_time)
            return booking.status === 'completed' || 
                   ((booking.status === 'confirmed' || booking.status === 'pending') && endTime <= now)
          }).sort((a, b) => new Date(b.end_time).getTime() - new Date(a.end_time).getTime())

          // Cancelled: only cancelled bookings
          const cancelled = bookingsData.filter(booking => 
            booking.status === 'cancelled'
          ).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())

          setBookings({
            upcoming,
            completed,
            cancelled
          })
        }

      } catch (err: any) {
        console.error('Error fetching bookings:', err)
        
        // Handle timeout errors specifically
        if (err.name === 'AbortError' || err.message?.includes('timeout') || err.message?.includes('aborted')) {
          console.warn('Bookings request timed out')
          setError('Request timed out. Please try again.')
        } else {
          setError(err.message || 'Failed to fetch bookings')
        }
      } finally {
        setLoading(false)
        clearTimeout(timeoutId)
      }
    }

    fetchBookings()
  }, [profile, supabase])

  return { bookings, loading, error }
} 