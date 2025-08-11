"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/lib/i18n'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'
import { useOptimizedUser } from '@/components/optimized-user-provider'
import { useOptimizedSupabase } from '@/components/optimized-supabase-provider'

interface Conversation {
  id: string
  last_message: {
    content: string
    created_at: string
    sender_id: string
  } | null
  other_user: {
    id: string
    first_name: string
    last_name: string
    avatar_url: string | null
    user_type: string
  }
  unread_count: number
  booking_id: string | null
}

interface ConversationsListProps {
  onConversationSelect?: (conversationId: string) => void
  selectedConversationId?: string | null
}

export default function ConversationsList({ onConversationSelect, selectedConversationId }: ConversationsListProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const { user } = useOptimizedUser()
  const { supabase } = useOptimizedSupabase()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const fetchConversations = async () => {
      try {
        const response = await fetch('/api/messages')
        if (response.ok) {
          const data = await response.json()
          setConversations(data.conversations || [])
        }
      } catch (error) {
        console.error('Error fetching conversations:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchConversations()

    // Set up real-time subscription for new messages
    const channel = supabase
      .channel('conversations')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages'
      }, () => {
        // Refresh conversations when messages change
        fetchConversations()
      })
      .subscribe()

    // Listen for messages-read events to update unread counts
    const handleMessagesRead = (event: CustomEvent) => {
      const { conversationId, messageIds } = event.detail
      
      setConversations(prev => prev.map(conv => {
        if (conv.id === conversationId) {
          // Reduce unread count by the number of messages marked as read
          const newUnreadCount = Math.max(0, conv.unread_count - messageIds.length)
          return { ...conv, unread_count: newUnreadCount }
        }
        return conv
      }))
    }

    window.addEventListener('messages-read', handleMessagesRead as EventListener)

    return () => {
      supabase.removeChannel(channel)
      window.removeEventListener('messages-read', handleMessagesRead as EventListener)
    }
  }, [user, supabase])

  const handleConversationClick = (conversationId: string) => {
    if (onConversationSelect) {
      onConversationSelect(conversationId)
      
      // Immediately mark all unread messages in this conversation as read
      const conversation = conversations.find(c => c.id === conversationId)
      if (conversation && conversation.unread_count > 0) {
        // Update local state immediately for better UX
        setConversations(prev => prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, unread_count: 0 }
            : conv
        ))
        
        // Trigger the messages-read event to update other components
        window.dispatchEvent(new CustomEvent('messages-read', {
          detail: { conversationId, messageIds: Array(conversation.unread_count).fill('temp') }
        }))
      }
    } else {
      // Fallback to navigation if no callback provided
      router.push(`/messages?conversation=${conversationId}`)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-20 bg-gray-200 rounded-lg"></div>
          </div>
        ))}
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium mb-2">{t('noConversations')}</h3>
        <p className="text-muted-foreground">{t('noConversationsDescription')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {conversations.map((conversation) => (
        <div
          key={conversation.id}
          onClick={() => handleConversationClick(conversation.id)}
          className={`flex items-center space-x-4 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors ${
            selectedConversationId === conversation.id ? 'bg-muted/70 border-primary/20' : ''
          }`}
        >
          <Avatar className="h-12 w-12">
            <AvatarImage src={conversation.other_user.avatar_url || undefined} />
            <AvatarFallback>
              {conversation.other_user.first_name?.[0]}{conversation.other_user.last_name?.[0]}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between flex-col">
              <h3 className={`font-medium text-sm truncate ${
                selectedConversationId === conversation.id ? 'text-primary' : ''
              }`}>
                {conversation.other_user.first_name} {conversation.other_user.last_name}
              </h3>
              {conversation.last_message && (
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(conversation.last_message.created_at), { addSuffix: true })}
                </span>
              )}
            </div>
            
            {/* <div className="flex items-center space-x-2 mt-1">
              {conversation.booking_id && (
                <Badge variant="secondary" className="text-xs">
                  {t('booking')}
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                {conversation.other_user.user_type}
              </Badge>
            </div> */}

            {conversation.last_message && (
              <p className="text-xs font-medium text-muted-foreground mt-1 truncate">
                {conversation.last_message.sender_id === user?.id ? t('me') : conversation.other_user.first_name}: {conversation.last_message.content}
              </p>
            )}
          </div>

          {conversation.unread_count > 0 && (
            <div className="ml-auto text-xs w-4 h-4 text-white rounded-full bg-red-500 flex items-center justify-center">
              {conversation.unread_count > 99 ? '99+' : conversation.unread_count}  
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

