"use client"

import { useEffect, useState } from 'react'
import { useOptimizedUser } from '@/components/optimized-user-provider'
import { useOptimizedSupabase } from '@/components/optimized-supabase-provider'

export default function MyBookingRequestsNotificationBadge() {
  const { user } = useOptimizedUser()
  const { supabase } = useOptimizedSupabase()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!user) return

    const fetchUnreadCount = async () => {
      try {
        // Count counter-offered requests waiting for client response
        const { data, error } = await supabase
          .from('booking_requests')
          .select('id')
          .eq('client_id', user.id)
          .eq('status', 'counter_offered')

        if (error) {
          console.error('Error fetching unread booking requests:', error)
          return
        }

        if (data) {
          setUnreadCount(data.length)
        }
      } catch (error) {
        console.error('Error fetching unread count:', error)
      }
    }

    fetchUnreadCount()

    // Set up real-time subscription for booking request updates
    const channel = supabase
      .channel('my_booking_requests_updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'booking_requests',
        filter: `client_id=eq.${user.id}`
      }, () => {
        // Refresh unread count when booking requests change
        fetchUnreadCount()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, supabase])

  if (unreadCount === 0) return null

  return (
    <span className="absolute -right-3 h-5 w-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-medium">
      {unreadCount > 99 ? '99+' : unreadCount}
    </span>
  )
}

