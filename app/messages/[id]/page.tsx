"use client"

import { Suspense, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useOptimizedUser } from '@/components/optimized-user-provider'
import { useOptimizedSupabase } from '@/components/optimized-supabase-provider'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/lib/toast'
import ChatInterface from '@/components/messages/chat-interface'
import ChatHeader from '@/components/messages/chat-header'
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarInset
} from '@/components/ui/sidebar'
import ModernSidebarNav from '@/components/modern-sidebar-nav'
import OptimizedHeader from '@/components/optimized-header'

interface ConversationPageProps {
  params: Promise<{
    id: string
  }>
}

// Skeleton components for immediate loading
function ConversationSkeleton() {
  return (
    <div className="space-y-6">
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

export default function ConversationPage({ params }: ConversationPageProps) {
  const router = useRouter()
  const { profile, isLoading: isProfileLoading } = useOptimizedUser()
  const { supabase } = useOptimizedSupabase()
  const [conversationId, setConversationId] = useState<string>('')

  // Check if user is authenticated and redirect if not
  useEffect(() => {
    if (!isProfileLoading && !profile) {
      toast.error("Please log in to view messages")
      router.push("/login")
    }
  }, [profile, isProfileLoading, router])

  // Get conversation ID from params
  useEffect(() => {
    const getParams = async () => {
      const { id } = await params
      setConversationId(id)
    }
    getParams()
  }, [params])

  if (isProfileLoading) {
    return (
      <SidebarProvider className="w-full">
        <div className="flex min-h-screen bg-muted/30 w-full">
          <Sidebar>
            {/* Show minimal sidebar during loading */}
            <div className="p-4">
              <div className="h-8 w-8 rounded-lg bg-muted animate-pulse" />
            </div>
          </Sidebar>
          
          <SidebarInset className="w-full">
            <OptimizedHeader />
            <div className="p-6">
              <ConversationSkeleton />
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

  if (!conversationId) {
    return (
      <SidebarProvider className="w-full">
        <div className="flex min-h-screen bg-muted/30 w-full">
          <Sidebar>
            {profile && <ModernSidebarNav profile={profile} />}
          </Sidebar>
          
          <SidebarInset className="w-full">
            <OptimizedHeader />
            <div className="p-6">
              <div className="text-center">
                <Skeleton className="h-8 w-32 mx-auto mb-4" />
                <Skeleton className="h-4 w-48 mx-auto" />
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
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
          <OptimizedHeader />
          <div className="h-screen flex flex-col bg-[#f7f7f7]">
            <Suspense fallback={<ChatHeaderSkeleton />}>
              <ChatHeader conversationId={conversationId} />
            </Suspense>
            
            <div className="flex-1 overflow-hidden">
              <Suspense fallback={<ChatInterfaceSkeleton />}>
                <ChatInterface conversationId={conversationId} />
              </Suspense>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
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

function ChatInterfaceSkeleton() {
  return (
    <div className="h-full flex flex-col">
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
