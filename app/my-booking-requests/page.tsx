"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useOptimizedUser } from "@/components/optimized-user-provider"
import { Card, CardContent } from "@/components/ui/card"
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
import { FileText, MessageCircle, Clock, CheckCircle, X } from "lucide-react"
import type { LucideIcon } from "lucide-react"
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
    <div className="space-y-3">
      <Skeleton className="h-10 w-64" />
      <div className="rounded-3xl border border-border/40 bg-white/60 shadow-sm p-6 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border border-border/40 bg-white/80 p-6 shadow-sm space-y-4">
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-32 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

function EmptyState({
  icon: Icon,
  title,
  description
}: {
  icon: LucideIcon
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/30 px-6 py-16 text-center">
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </span>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

export default function MyBookingRequestsPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { profile, isLoading: isProfileLoading } = useOptimizedUser()
  const [loading, setLoading] = useState(true)
  const [tabLoading, setTabLoading] = useState(false)
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

    const isInitialLoad = loading

    const fetchRequests = async () => {
      if (isInitialLoad) {
        setLoading(true)
      } else {
        setTabLoading(true)
      }
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
        if (isInitialLoad) {
          setLoading(false)
        }
        setTabLoading(false)
      }
    }

    fetchRequests()
  }, [profile, filter])

  const refetchRequests = async () => {
    if (!profile || profile.user_type !== "client") return
    
    try {
      setTabLoading(true)
      const statusParam = filter === 'all' ? null : filter
      const url = `/api/booking-requests?role=client${statusParam ? `&status=${statusParam}` : ''}`
      const response = await fetch(url)
      const data = await response.json()
      setRequests(data.requests || [])
    } catch (error) {
      console.error("Error refetching requests:", error)
    } finally {
      setTabLoading(false)
    }
  }

  if (isProfileLoading || loading) {
    return (
      <SidebarProvider className="w-full">
        <div className="flex min-h-screen bg-slate-50 w-full">
          <Sidebar>
            <ModernSidebarNav profile={null} />
          </Sidebar>
          
          <SidebarInset className="w-full">
            <MobileHeader />
            <div className="w-full px-6 pb-20 pt-6 md:px-10">
              <div className="mx-auto w-full max-w-5xl">
                <BookingRequestsSkeleton />
              </div>
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

  const renderTabPanel = (
    list: BookingRequest[],
    icon: LucideIcon,
    title: string,
    description: string
  ) => {
    if (tabLoading) {
      return <BookingRequestsSkeleton />
    }

    if (list.length === 0) {
      return <EmptyState icon={icon} title={title} description={description} />
    }

    return (
      <div className="space-y-4">
        {list.map((request) => (
          <ClientBookingRequestCard
            key={request.id}
            request={request}
            onUpdate={refetchRequests}
          />
        ))}
      </div>
    )
  }

  return (
    <SidebarProvider className="w-full">
      <div className="flex min-h-screen bg-slate-50 w-full">
        <Sidebar>
          {profile && <ModernSidebarNav profile={profile} />}
        </Sidebar>

        <SidebarInset className="w-full">
          <MobileHeader />
          
          <div className="w-full px-6 pb-20 pt-6 md:px-10">
            <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
              <header className="space-y-3">
                <Badge variant="secondary" className="rounded-full bg-slate-200/70 px-3 py-1 text-xs text-slate-700">
                  {t("sidebar.myBookingRequests")}
                </Badge>
                <div className="space-y-2">
                  <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{t("bookingRequests.myRequests.title")}</h1>
                  <p className="text-sm text-slate-500 md:text-base">{t("bookingRequests.myRequests.description")}</p>
                </div>
              </header>

              <Card className="rounded-3xl border border-slate-200/70 bg-white shadow-sm">
                <CardContent className="p-0">
                  <Tabs
                    value={filter}
                    onValueChange={(value) => setFilter(value as any)}
                    className="w-full"
                  >
                    <div className="border-b border-slate-200/80 bg-slate-50/80 px-4 py-4 md:px-6">
                      <TabsList className="flex flex-wrap gap-2 bg-transparent p-0">
                        <TabsTrigger
                          value="all"
                          className="rounded-full border border-transparent bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:text-slate-900 data-[state=active]:border-slate-200 data-[state=active]:bg-slate-900 data-[state=active]:text-white"
                        >
                          {t("bookingRequests.all")} ({requests.length})
                        </TabsTrigger>
                        <TabsTrigger
                          value="pending"
                          className="rounded-full border border-transparent bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:text-slate-900 data-[state=active]:border-slate-200 data-[state=active]:bg-slate-900 data-[state=active]:text-white"
                        >
                          {t("bookingRequests.pending")} ({pendingRequests.length})
                        </TabsTrigger>
                        <TabsTrigger
                          value="counter_offered"
                          className="rounded-full border border-transparent bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:text-slate-900 data-[state=active]:border-slate-200 data-[state=active]:bg-slate-900 data-[state=active]:text-white"
                        >
                          {t("bookingRequests.counterOffered")} ({counterOffered.length})
                        </TabsTrigger>
                        <TabsTrigger
                          value="accepted"
                          className="rounded-full border border-transparent bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:text-slate-900 data-[state=active]:border-slate-200 data-[state=active]:bg-slate-900 data-[state=active]:text-white"
                        >
                          {t("bookingRequests.accepted")} ({acceptedRequests.length})
                        </TabsTrigger>
                        <TabsTrigger
                          value="rejected"
                          className="rounded-full border border-transparent bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:text-slate-900 data-[state=active]:border-slate-200 data-[state=active]:bg-slate-900 data-[state=active]:text-white"
                        >
                          {t("bookingRequests.rejected")} ({rejectedRequests.length})
                        </TabsTrigger>
                      </TabsList>
                    </div>

                    <div className="border-t border-slate-200/80 bg-white px-4 py-6 md:px-6 md:py-8">
                      <TabsContent value="all" className="mt-0">
                        {renderTabPanel(
                          requests,
                          FileText,
                          t("bookingRequests.myRequests.noRequests"),
                          t("bookingRequests.myRequests.noRequestsDescription")
                        )}
                      </TabsContent>

                      <TabsContent value="pending" className="mt-0">
                        {renderTabPanel(
                          pendingRequests,
                          Clock,
                          t("bookingRequests.noPendingRequests"),
                          t("bookingRequests.noRequestsDescription")
                        )}
                      </TabsContent>

                      <TabsContent value="counter_offered" className="mt-0">
                        {renderTabPanel(
                          counterOffered,
                          MessageCircle,
                          t("bookingRequests.noCounterOffered"),
                          t("bookingRequests.noRequestsDescription")
                        )}
                      </TabsContent>

                      <TabsContent value="accepted" className="mt-0">
                        {renderTabPanel(
                          acceptedRequests,
                          CheckCircle,
                          t("bookingRequests.noAcceptedRequests"),
                          t("bookingRequests.noRequestsDescription")
                        )}
                      </TabsContent>

                      <TabsContent value="rejected" className="mt-0">
                        {renderTabPanel(
                          rejectedRequests,
                          X,
                          t("bookingRequests.noRejectedRequests"),
                          t("bookingRequests.noRequestsDescription")
                        )}
                      </TabsContent>
                    </div>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}

