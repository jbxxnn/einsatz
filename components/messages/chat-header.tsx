"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/lib/i18n'
import { ArrowLeft, MoreVertical, Phone, Video } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useOptimizedUser } from '@/components/optimized-user-provider'
import { useOptimizedSupabase } from '@/components/optimized-supabase-provider'
import { formatDistanceToNow } from 'date-fns'

interface ChatHeaderProps {
  conversationId: string
}

interface ConversationParticipant {
  id: string
  first_name: string
  last_name: string
  avatar_url: string | null
  user_type: string
  is_online?: boolean
  last_seen?: string
}

export default function ChatHeader({ conversationId }: ChatHeaderProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const { user } = useOptimizedUser()
  const { supabase } = useOptimizedSupabase()
  const [participant, setParticipant] = useState<ConversationParticipant | null>(null)
  const [loading, setLoading] = useState(true)
  const [isOnline, setIsOnline] = useState(false)
  const [lastSeen, setLastSeen] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    const fetchParticipant = async () => {
      try {
        // First get the profile_id of the other participant
        const { data: participantData, error: participantError } = await supabase
          .from('conversation_participants')
          .select('profile_id')
          .eq('conversation_id', conversationId)
          .neq('profile_id', user.id)
          .single()

        if (participantError) throw participantError

        if (!participantData?.profile_id) {
          throw new Error('Participant not found')
        }

        // Then fetch the profile data separately
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar_url, user_type')
          .eq('id', participantData.profile_id)
          .single()

        if (profileError) throw profileError

        if (!profileData) {
          throw new Error('Profile data not found')
        }

        // Get the last message from this participant to determine last seen
        const { data: lastMessageData, error: lastMessageError } = await supabase
          .from('messages')
          .select('created_at')
          .eq('conversation_id', conversationId)
          .eq('sender_id', participantData.profile_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        const lastSeen = lastMessageData?.created_at || null

        setParticipant({
          id: profileData.id,
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          avatar_url: profileData.avatar_url,
          user_type: profileData.user_type,
          is_online: false, // Will be updated by activity tracking
          last_seen: lastSeen
        })

        setLastSeen(lastSeen)
      } catch (error) {
        console.error('Error fetching participant:', error)
        // Set a fallback participant to prevent the component from crashing
        setParticipant({
          id: 'unknown',
          first_name: 'Unknown',
          last_name: 'User',
          avatar_url: null,
          user_type: 'unknown',
          is_online: false
        })
      } finally {
        setLoading(false)
      }
    }

    fetchParticipant()

    // Set up basic online status tracking
    const channel = supabase
      .channel(`online_status:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, (payload) => {
        const newMessage = payload.new as any
        
        // If the participant sent a message, they're online
        if (participant && newMessage.sender_id === participant.id) {
          setIsOnline(true)
          setLastSeen(newMessage.created_at)
          setParticipant(prev => prev ? { ...prev, is_online: true, last_seen: newMessage.created_at } : null)
          
          // Set offline after 2 minutes of inactivity
          setTimeout(() => {
            setIsOnline(false)
            setParticipant(prev => prev ? { ...prev, is_online: false } : null)
          }, 2 * 60 * 1000)
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId, user, supabase, participant?.id])

  const handleBack = () => {
    router.push('/messages')
  }

  const handleCall = () => {
    // TODO: Implement call functionality
    console.log('Calling participant')
  }

  const handleVideoCall = () => {
    // TODO: Implement video call functionality
    console.log('Video calling participant')
  }

  const handleBlock = () => {
    // TODO: Implement block functionality
    console.log('Blocking participant')
  }

  const handleReport = () => {
    // TODO: Implement report functionality
    console.log('Reporting participant')
  }

  const formatLastSeen = (lastSeen: string) => {
    const now = new Date()
    const lastSeenDate = new Date(lastSeen)
    const diffInMinutes = Math.floor((now.getTime() - lastSeenDate.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  if (loading || !participant) {
    return (
      <div className="border-b p-4">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse"></div>
          <div className="space-y-2">
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="border-b p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {/* <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button> */}
          
          {/* <Avatar className="h-10 w-10">
            <AvatarImage src={participant.avatar_url || undefined} />
            <AvatarFallback>
              {participant.first_name?.[0]}{participant.last_name?.[0]}
            </AvatarFallback>
          </Avatar> */}

          <div>
            <h2 className="font-semibold">
              {participant.first_name} {participant.last_name}
            </h2>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                {participant.user_type}
              </Badge>
              <div className="flex items-center space-x-1">
                {/* <div className={`w-2 h-2 rounded-full ${participant.is_online ? 'bg-green-500' : 'bg-gray-400'}`} /> */}
                {/* <span className="text-xs text-muted-foreground">
                  {participant.is_online ? 'Online' : 'Offline'}
                </span> */}
                {participant.last_seen && !participant.is_online && (
                  <span className="text-xs text-muted-foreground ml-1">
                    • Last seen {formatLastSeen(participant.last_seen)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={handleCall}>
            <Phone className="h-4 w-4" />
          </Button>
          
          <Button variant="ghost" size="sm" onClick={handleVideoCall}>
            <Video className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleBlock}>
                {t('block')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleReport}>
                {t('report')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
