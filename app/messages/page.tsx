"use client"

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useOptimizedUser } from '@/components/optimized-user-provider'
import { useOptimizedSupabase } from '@/components/optimized-supabase-provider'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/lib/toast'
import ConversationsList from '@/components/messages/conversations-list'
import MessagesHeader from '@/components/messages/messages-header'
import ChatInterface from '@/components/messages/chat-interface'
import ChatHeader from '@/components/messages/chat-header'
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarInset
} from '@/components/ui/sidebar'
import ModernSidebarNav from '@/components/modern-sidebar-nav'
import OptimizedHeader from '@/components/optimized-header'
import { ArrowLeftIcon } from 'lucide-react'



const CustomMessagesIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg 
  className={props.className}
  xmlns="http://www.w3.org/2000/svg" 
  width="24" 
  height="24" 
  viewBox="0 0 24 24" 
  fill="none">
    <path opacity=".4" d="M2 12.97V6.99C2 4.23 4.24 2 7 2h10c2.76 0 5 2.23 5 4.99v6.98c0 2.75-2.24 4.98-5 4.98h-1.5c-.31 0-.61.15-.8.4l-1.5 1.99c-.66.88-1.74.88-2.4 0l-1.5-1.99c-.16-.22-.52-.4-.8-.4H7c-2.76 0-5-2.23-5-4.98v-1Z" 
    fill="currentColor">
      </path>
      <path d="M12 12c-.56 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.44 1-1 1ZM16 12c-.56 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.44 1-1 1ZM8 12c-.56 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.44 1-1 1Z" 
      fill="currentColor">
        </path>
        </svg>
)

// Skeleton components for immediate loading
function MessagesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-[300px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}

function ChatSkeleton() {
  return (
    <div className="h-full flex flex-col">
      <div className="border-b p-4">
        <div className="flex items-center space-x-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </div>
      <div className="flex-1 p-4 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex space-x-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-16 w-64 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
      <div className="border-t p-4">
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>
    </div>
  )
}

function ParticipantDetailsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  )
}

export default function MessagesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { profile, isLoading: isProfileLoading } = useOptimizedUser()
  const { supabase } = useOptimizedSupabase()
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)

  // Get conversation ID from URL params if available
  useEffect(() => {
    const conversationId = searchParams.get('conversation')
    if (conversationId) {
      setSelectedConversationId(conversationId)
    }
  }, [searchParams])

  // Check if user is authenticated and redirect if not
  useEffect(() => {
    // Don't do anything while still loading
    if (isProfileLoading) {
      return
    }
    
    // If we have a profile, user is authenticated
    if (profile) {
      return
    }
    
    // Only redirect if we're definitely done loading and have no profile
    // Add a small delay to ensure authentication state is stable
    const timeoutId = setTimeout(() => {
      // Double-check that we're still not loading and still don't have a profile
      if (!isProfileLoading && !profile) {
        toast.error("Please log in to view messages")
        router.push("/login")
      }
    }, 1000) // 1 second delay for stability
    
    return () => clearTimeout(timeoutId)
  }, [profile, isProfileLoading, router])

  const handleConversationSelect = (conversationId: string) => {
    setSelectedConversationId(conversationId)
    // Update URL without navigation
    const url = new URL(window.location.href)
    url.searchParams.set('conversation', conversationId)
    window.history.pushState({}, '', url.toString())
  }

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const conversationId = new URLSearchParams(window.location.search).get('conversation')
      setSelectedConversationId(conversationId)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  if (isProfileLoading) {
    return (
      <SidebarProvider className="w-full">
        <div className="flex min-h-screen bg-muted/30 w-full">
          <Sidebar>
            <ModernSidebarNav profile={null} />
          </Sidebar>
          
          <SidebarInset className="w-full">
            {/* <OptimizedHeader /> */}
            <div className="p-6">
              <MessagesSkeleton />
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    )
  }

  if (!profile) {
    return (
      <div className="container py-10 text-center">
        <h1 className="text-2xl font-bold mb-4">Profile not found</h1>  
        <Button onClick={() => router.push("/")}>Go to Home</Button>
      </div>
    )
  }

  return (
    <SidebarProvider className="w-full">
      <div className="flex min-h-screen bg-muted/30 w-full">
        <Sidebar>
          {profile && <ModernSidebarNav profile={profile} />}
        </Sidebar>

        {/* Main Content */}
        <SidebarInset className="w-full">
          {/* <OptimizedHeader /> */}
          <div className="flex h-screen bg-[#f7f7f7]">
            {/* Left Column - Conversations List */}
            <div className="w-80 border-r bg-white flex flex-col">
              <div className="p-4 border-b">
                <MessagesHeader />
              </div>
              <div className="flex-1 overflow-y-auto">
                <Suspense fallback={<MessagesSkeleton />}>
                  <ConversationsList 
                    onConversationSelect={handleConversationSelect}
                    selectedConversationId={selectedConversationId}
                  />
                </Suspense>
              </div>
            </div>

            {/* Middle Column - Chat Interface */}
            <div className="flex-1 flex flex-col bg-white">
              {selectedConversationId ? (
                <>
                  <div className="border-b p-4">
                    <div className="flex items-center space-x-3">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          setSelectedConversationId(null)
                          const url = new URL(window.location.href)
                          url.searchParams.delete('conversation')
                          window.history.pushState({}, '', url.toString())
                        }}
                        className="mr-2"
                      >
                        <ArrowLeftIcon className="w-4 h-4" />
                        Back to conversations
                      </Button>
                    </div>
                  </div>
                  <Suspense fallback={<ChatHeaderSkeleton />}>
                    <ChatHeader conversationId={selectedConversationId} />
                  </Suspense>
                  <div className="flex-1 overflow-hidden">
                    <Suspense fallback={<ChatSkeleton />}>
                      <ChatInterface conversationId={selectedConversationId} />
                    </Suspense>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                      <CustomMessagesIcon className="w-12 h-12 text-gray-400" />

                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Pick up where you left off</h3>
                      <p className="text-gray-500 text-sm">Select a conversation and chat away.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Participant Details */}
            <div className="w-80 border-l bg-white p-4">
              {selectedConversationId ? (
                <Suspense fallback={<ParticipantDetailsSkeleton />}>
                  <ParticipantDetails conversationId={selectedConversationId} />
                </Suspense>
              ) : (
                <div className="text-center text-sm text-gray-500 mt-8">
                  <p>Select a conversation to see participant details</p>
                </div>
              )}
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}

// Participant Details Component
function ParticipantDetails({ conversationId }: { conversationId: string }) {
  const { user } = useOptimizedUser()
  const { supabase } = useOptimizedSupabase()
  const [participant, setParticipant] = useState<any>(null)
  const [loading, setLoading] = useState(true)

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
          .select('id, first_name, last_name, avatar_url, user_type, location, created_at')
          .eq('id', participantData.profile_id)
          .single()

        if (profileError) throw profileError

        if (!profileData) {
          throw new Error('Profile data not found')
        }

        setParticipant(profileData)
      } catch (error) {
        console.error('Error fetching participant:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchParticipant()
  }, [conversationId, user, supabase])

  if (loading) {
    return <ParticipantDetailsSkeleton />
  }

  if (!participant) {
    return (
      <div className="text-center text-sm text-gray-500 mt-8">
        <p>Participant not found</p>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short' 
    })
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto bg-gray-200 rounded-full flex items-center justify-center mb-3">
          {participant.avatar_url ? (
            <img 
              src={participant.avatar_url} 
              alt={`${participant.first_name} ${participant.last_name}`}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <span className="text-xl font-semibold text-gray-600">
              {participant.first_name?.[0]}{participant.last_name?.[0]}
            </span>
          )}
        </div>
        <h3 className="font-semibold text-lg">{participant.first_name} {participant.last_name}</h3>
        <p className="text-sm text-gray-500 capitalize">{participant.user_type}</p>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">About {participant.first_name}</h4>
        <div className="space-y-2 text-sm text-gray-600">
          {participant.location && (
            <div>
              <span className="font-medium">From:</span> {participant.location}
            </div>
          )}
          <div>
            <span className="font-medium">On platform since:</span> {formatDate(participant.created_at)}
          </div>
        </div>
      </div>
    </div>
  )
}

function ChatHeaderSkeleton() {
  return (
    <div className="border-b p-4">
      <div className="flex items-center space-x-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    </div>
  )
}
