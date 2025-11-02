"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useOptimizedSupabase } from "@/components/optimized-supabase-provider"
import { useOptimizedUser } from "@/components/optimized-user-provider"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/lib/toast"
import { useTranslation } from "@/lib/i18n"
import type { Database } from "@/lib/database.types"
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarInset,
  useSidebar
} from "@/components/ui/sidebar"
import ModernSidebarNav from "@/components/modern-sidebar-nav"
import OptimizedHeader from "@/components/optimized-header"
import { FileText } from "lucide-react"
import ClientBookingRequestCard from "@/components/client-booking-request-card"

type BookingRequest = Database["public"]["Tables"]["booking_requests"]["Row"] & {
  profiles?: Database["public"]["Tables"]["profiles"]["Row"]
  job_categories?: {
    id: string
    name: string
    icon: string | null
  }
}

function MobileHeader() {
  const { openMobile, setOpenMobile } = useSidebar()
  
  return (
    <OptimizedHeader 
      isMobileMenuOpen={openMobile}
      setIsMobileMenuOpen={setOpenMobile}
    />
  )
}

function BookingRequestsSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-6 w-64" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-20 w-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function MyBookingRequestsPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { supabase } = useOptimizedSupabase()
  const { profile, isLoading: isProfileLoading } = useOptimizedUser()
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState<BookingRequest[]>([])
  const [filter, setFilter] = useState<'all' | 'pending' | 'counter_offered' | 'accepted' | 'rejected'>('all')

  // Redirect if not client
  useEffect(() => {
    if (!isProfileLoading && profile && profile.user_type !== "client") {
      toast.error("Access denied")
      router.push("/dashboard")
    }
  }, [profile, isProfileLoading, router])

  useEffect(() => {
    if (!profile || profile.user_type !== "client") {
      setLoading(false)
      return
    }

    const fetchRequests = async () => {
      setLoading(true)
      try {
        const statusParam = filter === 'all' ? null : filter
        const url = `/api/booking-requests?role=client${statusParam ? `&status=${statusParam}` : ''}`
        
        const response = await fetch(url)
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Failed to fetch booking requests')
        }

        const data = await response.json()
        setRequests(data.requests || [])
      } catch (error: any) {
        console.error("Error fetching booking requests:", error)
        toast.error(error.message || t("bookingRequests.error.failedToLoad"))
        // Still set requests to empty array on error
        setRequests([])
      } finally {
        setLoading(false)
      }
    }

    fetchRequests()
  }, [profile, filter])

  const refetchRequests = async () => {
    if (!profile || profile.user_type !== "client") return
    
    try {
      const statusParam = filter === 'all' ? null : filter
      const url = `/api/booking-requests?role=client${statusParam ? `&status=${statusParam}` : ''}`
      const response = await fetch(url)
      const data = await response.json()
      setRequests(data.requests || [])
    } catch (error) {
      console.error("Error refetching requests:", error)
    }
  }

  if (isProfileLoading || loading) {
    return (
      <SidebarProvider className="w-full">
        <div className="flex min-h-screen bg-muted/30 w-full">
          <Sidebar>
            <ModernSidebarNav profile={null} />
          </Sidebar>
          
          <SidebarInset className="w-full">
            <MobileHeader />
            <div className="p-6">
              <BookingRequestsSkeleton />
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    )
  }

  if (!profile) {
    return (
      <div className="container py-10 text-center">
        <h1 className="text-2xl font-bold mb-4">{t("bookingRequests.error.notFound")}</h1>
        <Button onClick={() => router.push("/login")}>{t("bookingRequests.error.backToLogin")}</Button>
      </div>
    )
  }

  if (profile.user_type !== "client") {
    return null
  }

  const pendingRequests = requests.filter(r => r.status === 'pending')
  const counterOffered = requests.filter(r => r.status === 'counter_offered')
  const acceptedRequests = requests.filter(r => r.status === 'accepted')
  const rejectedRequests = requests.filter(r => r.status === 'rejected')

  return (
    <SidebarProvider className="w-full">
      <div className="flex min-h-screen bg-muted/30 w-full">
        <Sidebar>
          {profile && <ModernSidebarNav profile={profile} />}
        </Sidebar>

        <SidebarInset className="w-full">
          <MobileHeader />
          
          <div className="p-6 pb-20 bg-[#f7f7f7]">
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold mb-2">{t("bookingRequests.myRequests.title")}</h1>
                <p className="text-muted-foreground">{t("bookingRequests.myRequests.description")}</p>
              </div>

              <Tabs defaultValue="all" onValueChange={(value) => setFilter(value as any)}>
                <TabsList>
                  <TabsTrigger value="all">
                    {t("bookingRequests.all")} ({requests.length})
                  </TabsTrigger>
                  <TabsTrigger value="pending">
                    {t("bookingRequests.pending")} ({pendingRequests.length})
                  </TabsTrigger>
                  <TabsTrigger value="counter_offered">
                    {t("bookingRequests.counterOffered")} ({counterOffered.length})
                  </TabsTrigger>
                  <TabsTrigger value="accepted">
                    {t("bookingRequests.accepted")} ({acceptedRequests.length})
                  </TabsTrigger>
                  <TabsTrigger value="rejected">
                    {t("bookingRequests.rejected")} ({rejectedRequests.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-6">
                  {requests.length > 0 ? (
                    <div className="space-y-4">
                      {requests.map((request) => (
                        <ClientBookingRequestCard
                          key={request.id}
                          request={request}
                          onUpdate={refetchRequests}
                        />
                      ))}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-lg font-medium mb-2">{t("bookingRequests.myRequests.noRequests")}</p>
                        <p className="text-sm text-muted-foreground">{t("bookingRequests.myRequests.noRequestsDescription")}</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="pending" className="mt-6">
                  {pendingRequests.length > 0 ? (
                    <div className="space-y-4">
                      {pendingRequests.map((request) => (
                        <ClientBookingRequestCard
                          key={request.id}
                          request={request}
                          onUpdate={refetchRequests}
                        />
                      ))}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <p className="text-muted-foreground">{t("bookingRequests.noPendingRequests")}</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="counter_offered" className="mt-6">
                  {counterOffered.length > 0 ? (
                    <div className="space-y-4">
                      {counterOffered.map((request) => (
                        <ClientBookingRequestCard
                          key={request.id}
                          request={request}
                          onUpdate={refetchRequests}
                        />
                      ))}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <p className="text-muted-foreground">{t("bookingRequests.noCounterOffered")}</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="accepted" className="mt-6">
                  {acceptedRequests.length > 0 ? (
                    <div className="space-y-4">
                      {acceptedRequests.map((request) => (
                        <ClientBookingRequestCard
                          key={request.id}
                          request={request}
                          onUpdate={refetchRequests}
                        />
                      ))}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <p className="text-muted-foreground">{t("bookingRequests.noAcceptedRequests")}</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="rejected" className="mt-6">
                  {rejectedRequests.length > 0 ? (
                    <div className="space-y-4">
                      {rejectedRequests.map((request) => (
                        <ClientBookingRequestCard
                          key={request.id}
                          request={request}
                          onUpdate={refetchRequests}
                        />
                      ))}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <p className="text-muted-foreground">{t("bookingRequests.noRejectedRequests")}</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}

