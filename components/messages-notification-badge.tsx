"use client"

import { useEffect, useState } from 'react'
import { useOptimizedUser } from '@/components/optimized-user-provider'
import { useOptimizedSupabase } from '@/components/optimized-supabase-provider'

export default function MessagesNotificationBadge() {
  const { user } = useOptimizedUser()
  const { supabase } = useOptimizedSupabase()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!user) return

    const fetchUnreadCount = async () => {
      try {
        // Check if the table exists first
        const { data: tableCheck, error: tableError } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .limit(1)
        
        if (tableError) {
          console.error('Table access error:', tableError)
          console.error('This might mean the messaging tables are not created yet')
          return
        }

        // First get the conversation IDs for the current user
        const { data: conversationData, error: conversationError } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('profile_id', user.id)

        if (conversationError) {
          console.error('Error fetching conversations:', conversationError)
          console.error('Error details:', {
            message: conversationError.message,
            details: conversationError.details,
            hint: conversationError.hint,
            code: conversationError.code
          })
          return
        }

        const conversationIds = conversationData?.map(c => c.conversation_id) || []

        if (conversationIds.length === 0) {
          setUnreadCount(0)
          return
        }

        const { data, error } = await supabase
          .from('messages')
          .select('id')
          .eq('read', false)
          .neq('sender_id', user.id)
          .in('conversation_id', conversationIds)

        if (!error && data) {
          setUnreadCount(data.length)
        }
      } catch (error) {
        console.error('Error fetching unread count:', error)
      }
    }

    fetchUnreadCount()

    // Set up real-time subscription for new messages
    const channel = supabase
      .channel('unread_messages')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages'
      }, () => {
        // Refresh unread count when messages change
        fetchUnreadCount()
      })
      .subscribe()

    // Listen for messages-read events to update unread count immediately
    const handleMessagesRead = (event: CustomEvent) => {
      const { messageIds } = event.detail
      
      // Reduce unread count by the number of messages marked as read
      setUnreadCount(prev => Math.max(0, prev - messageIds.length))
    }

    window.addEventListener('messages-read', handleMessagesRead as EventListener)

    return () => {
      supabase.removeChannel(channel)
      window.removeEventListener('messages-read', handleMessagesRead as EventListener)
    }
  }, [user, supabase])

  if (unreadCount === 0) return null

  return (
    <span className="absolute -top-1 -right-0 h-2 w-2 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
      {/* {unreadCount > 99 ? '99+' : unreadCount} */}
    </span>
  )
}
