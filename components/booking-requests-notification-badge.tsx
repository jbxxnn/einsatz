"use client"

import { useEffect, useState } from 'react'
import { useOptimizedUser } from '@/components/optimized-user-provider'
import { useOptimizedSupabase } from '@/components/optimized-supabase-provider'

export default function BookingRequestsNotificationBadge() {
  const { user } = useOptimizedUser()
  const { supabase } = useOptimizedSupabase()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!user) return

    const fetchUnreadCount = async () => {
      try {
        // Count:
        // 1. Pending requests that haven't been viewed by the freelancer
        // 2. Accepted requests that haven't been converted to bookings (client accepted counter offer)
        const [pendingData, acceptedData] = await Promise.all([
          // Pending requests not yet viewed
          supabase
            .from('booking_requests')
            .select('id')
            .eq('freelancer_id', user.id)
            .eq('status', 'pending')
            .eq('viewed_by_freelancer', false),
          // Accepted requests not yet converted (client accepted counter offer)
          supabase
            .from('booking_requests')
            .select('id')
            .eq('freelancer_id', user.id)
            .eq('status', 'accepted')
            .is('converted_booking_id', null)
        ])

        if (pendingData.error || acceptedData.error) {
          console.error('Error fetching unread booking requests:', pendingData.error || acceptedData.error)
          return
        }

        const totalCount = (pendingData.data?.length || 0) + (acceptedData.data?.length || 0)
        setUnreadCount(totalCount)
      } catch (error) {
        console.error('Error fetching unread count:', error)
      }
    }

    fetchUnreadCount()

    // Set up real-time subscription for new booking requests
    const channel = supabase
      .channel('booking_requests_updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'booking_requests',
        filter: `freelancer_id=eq.${user.id}`
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

