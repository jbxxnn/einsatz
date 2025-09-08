"use client"

import { useEffect, useState, useRef } from 'react'
import { useTranslation } from '@/lib/i18n'
import { Send, Paperclip, Smile } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useOptimizedUser } from '@/components/optimized-user-provider'
import { useOptimizedSupabase } from '@/components/optimized-supabase-provider'
import { formatDistanceToNow } from 'date-fns'

interface ChatInterfaceProps {
  conversationId: string
}

interface Message {
  id: string
  content: string
  sender_id: string
  created_at: string
  read: boolean
}

interface Sender {
  id: string
  first_name: string
  last_name: string
  avatar_url: string | null
}

export default function ChatInterface({ conversationId }: ChatInterfaceProps) {
  const { t } = useTranslation()
  const { user } = useOptimizedUser()
  const { supabase } = useOptimizedSupabase()
  const [messages, setMessages] = useState<Message[]>([])
  const [senders, setSenders] = useState<Record<string, Sender>>({})
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true)
  const [isUserScrolling, setIsUserScrolling] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user) return

    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true })

        if (error) throw error

        setMessages(data || [])
        
        // Fetch sender information for all messages
        const senderIds = [...new Set(data?.map(m => m.sender_id) || [])]
        const { data: senderData, error: senderError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar_url')
          .in('id', senderIds)

        if (!senderError && senderData) {
          const senderMap: Record<string, Sender> = {}
          senderData.forEach(sender => {
            senderMap[sender.id] = sender
          })
          setSenders(senderMap)
        }

        // Mark messages as read when they're fetched (user is viewing them)
        if (data && data.length > 0) {
          markMessagesAsRead(data.filter(m => m.sender_id !== user.id && !m.read).map(m => m.id))
        }
      } catch (error) {
        console.error('Error fetching messages:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMessages()

    // Set up real-time subscription for new messages
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, (payload) => {
        const newMessage = payload.new as Message
        setMessages(prev => [...prev, newMessage])
        
        // Mark new message as read if it's from someone else and user is viewing the chat
        if (newMessage.sender_id !== user?.id) {
          markMessagesAsRead([newMessage.id])
        }
        
        // Fetch sender info for new message if not already cached
        if (!senders[newMessage.sender_id]) {
          supabase
            .from('profiles')
            .select('id, first_name, last_name, avatar_url')
            .eq('id', newMessage.sender_id)
            .single()
            .then(({ data }) => {
              if (data) {
                setSenders(prev => ({ ...prev, [data.id]: data }))
              }
            })
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId, user, supabase, senders])

  // Function to mark messages as read
  const markMessagesAsRead = async (messageIds: string[]) => {
    if (!messageIds.length || !user) return

    try {
      const { error } = await supabase
        .from('messages')
        .update({ read: true })
        .in('id', messageIds)
        .eq('conversation_id', conversationId)
        .neq('sender_id', user.id)

      if (error) {
        console.error('Error marking messages as read:', error)
        return
      }

      // Update local state to reflect read status
      setMessages(prev => prev.map(msg => 
        messageIds.includes(msg.id) && msg.sender_id !== user.id 
          ? { ...msg, read: true }
          : msg
      ))

      // Trigger a custom event to update unread counts in other components
      window.dispatchEvent(new CustomEvent('messages-read', {
        detail: { conversationId, messageIds }
      }))
    } catch (error) {
      console.error('Error marking messages as read:', error)
    }
  }

  // Function to mark all unread messages in conversation as read
  const markAllMessagesAsRead = async () => {
    if (!user) return

    try {
      // Get all unread messages from other users in this conversation
      const unreadMessages = messages.filter(m => m.sender_id !== user.id && !m.read)
      
      if (unreadMessages.length === 0) return

      const { error } = await supabase
        .from('messages')
        .update({ read: true })
        .in('id', unreadMessages.map(m => m.id))
        .eq('conversation_id', conversationId)
        .neq('sender_id', user.id)

      if (error) {
        console.error('Error marking all messages as read:', error)
        return
      }

      // Update local state
      setMessages(prev => prev.map(msg => 
        msg.sender_id !== user.id && !msg.read 
          ? { ...msg, read: true }
          : msg
      ))

      // Trigger event to update unread counts
      window.dispatchEvent(new CustomEvent('messages-read', {
        detail: { conversationId, messageIds: unreadMessages.map(m => m.id) }
      }))
    } catch (error) {
      console.error('Error marking all messages as read:', error)
    }
  }

  // Mark all messages as read when component mounts or conversation changes
  useEffect(() => {
    if (messages.length > 0 && !loading) {
      markAllMessagesAsRead()
    }
  }, [conversationId, messages.length, loading])

  // Initial scroll to bottom when messages are first loaded
  useEffect(() => {
    if (messages.length > 0 && !loading) {
      // Always scroll to bottom on initial load, regardless of auto-scroll state
      setTimeout(() => {
        scrollToBottom()
      }, 100)
    }
  }, [conversationId, messages.length, loading])

  // Handle scroll events to determine if we should auto-scroll
  useEffect(() => {
    const messagesContainer = messagesContainerRef.current
    if (!messagesContainer) return

    let scrollTimeout: NodeJS.Timeout
    let userScrollTimeout: NodeJS.Timeout

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainer
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 50 // Reduced threshold for better accuracy
      
      // Mark that user is actively scrolling
      setIsUserScrolling(true)
      clearTimeout(userScrollTimeout)
      
      // Clear previous timeout
      clearTimeout(scrollTimeout)
      
      // Set a small delay to avoid flickering during active scrolling
      scrollTimeout = setTimeout(() => {
        setShouldAutoScroll(isAtBottom)
      }, 150)
      
      // Reset user scrolling state after a delay
      userScrollTimeout = setTimeout(() => {
        setIsUserScrolling(false)
      }, 500)
    }

    messagesContainer.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      messagesContainer.removeEventListener('scroll', handleScroll)
      clearTimeout(scrollTimeout)
      clearTimeout(userScrollTimeout)
    }
  }, [])

  // Only auto-scroll for new messages from others when user is at bottom
  useEffect(() => {
    if (messages.length === 0) return
    
    const lastMessage = messages[messages.length - 1]
    const isNewMessageFromOther = lastMessage && lastMessage.sender_id !== user?.id
    
    // Only auto-scroll if:
    // 1. User is at bottom AND
    // 2. This is a new message from someone else AND
    // 3. We have more than 1 message (to avoid initial scroll) AND
    // 4. User is not actively scrolling
    if (shouldAutoScroll && isNewMessageFromOther && messages.length > 1 && !isUserScrolling) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        scrollToBottom()
      }, 100)
    }
  }, [messages.length, shouldAutoScroll, user?.id, isUserScrolling])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return

    setSending(true)
    try {
      const { error } = await supabase
        .rpc('add_message', {
          p_conversation_id: conversationId,
          p_sender_id: user.id,
          p_content: newMessage.trim()
        })

      if (error) throw error

      setNewMessage('')
      textareaRef.current?.focus()
      
      // Always scroll to bottom when user sends a message
      setTimeout(() => {
        scrollToBottom()
      }, 100)
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleAttachment = () => {
    // TODO: Implement file attachment
    console.log('Attachment clicked')
  }

  const handleEmoji = () => {
    // TODO: Implement emoji picker
    console.log('Emoji clicked')
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 relative" ref={messagesContainerRef}>
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium mb-2">{t('noMessages')}</h3>
            <p className="text-muted-foreground">{t('startConversation')}</p>
          </div>
        ) : (
          messages.map((message) => {
            const sender = senders[message.sender_id]
            const isOwnMessage = message.sender_id === user?.id

            return (
              <div
                key={message.id}
                className={`flex space-x-3 ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}
              >
                <Avatar className="h-8 w-8 flex-shrink-0 rounded-full">
                  <AvatarImage src={sender?.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {sender?.first_name?.[0]}{sender?.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>

                <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                  <div className={`rounded-md px-3 py-2 ${
                    isOwnMessage 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted'
                  }`}>
                    <p className="text-sm">{message.content}</p>
                  </div>
                  <div className={`text-xs text-muted-foreground mt-1 ${
                    isOwnMessage ? 'text-right' : 'text-left'
                  }`}>
                    {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                    {isOwnMessage && (
                      <span className="ml-2">
                        {message.read ? '✓✓' : '✓'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
        
        {/* Scroll to bottom button */}
        {!shouldAutoScroll && (
          <Button
            onClick={() => {
              setShouldAutoScroll(true)
              scrollToBottom()
            }}
            className="absolute bottom-4 right-4 rounded-full w-12 h-12 p-0 shadow-lg bg-primary hover:bg-primary/90 text-white"
            size="sm"
            title="Scroll to latest messages"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </Button>
        )}
        
        {/* Scroll position indicator */}
        {/* <div className="absolute top-4 right-4 text-xs bg-black/50 text-white px-2 py-1 rounded">
          {shouldAutoScroll ? '📍 At bottom' : '⬆️ Scrolled up'}
        </div> */}
        
        {/* Auto-scroll indicator (for debugging)
            {process.env.NODE_ENV === 'development' && (
              <div className="absolute top-12 right-4 text-xs bg-black/50 text-white px-2 py-1 rounded">
                Auto-scroll: {shouldAutoScroll ? 'ON' : 'OFF'}
              </div>
            )} */}
      </div>

      {/* Message Input */}
      <div className="border-t p-4">
        <div className="flex space-x-2">
          {/* <Button
            variant="ghost"
            size="sm"
            onClick={handleAttachment}
            className="flex-shrink-0"
          >
            <Paperclip className="h-4 w-4" />
          </Button> */}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEmoji}
            className="flex-shrink-0"
          >
            <Smile className="h-4 w-4" />
          </Button>

          <div className="flex-1">
            <Textarea
              ref={textareaRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={t('typeMessage')}
              className="min-h-[44px] max-h-32 resize-none"
              rows={1}
            />
          </div>

          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sending}
            className="flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

