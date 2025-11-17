"use client"

import { useState, useEffect, useCallback } from "react"
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
import { 
  Calendar, 
  MapPin, 
  Euro, 
  Clock, 
  FileText, 
  CheckCircle, 
  X, 
  MessageSquare,
  AlertCircle,
  Loader2
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import Image from "next/image"
import BookingRequestCard from "@/components/booking-request-card"

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
        <Card key={i} className="rounded-2xl border border-slate-200/70 shadow-sm">
          <CardContent className="p-6 space-y-5">
            <Skeleton className="h-5 w-48" />
            <div className="grid gap-3 md:grid-cols-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <Skeleton className="h-24 w-full rounded-xl" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon
  title: string
  description?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-slate-200 bg-white px-10 py-14 text-center shadow-sm">
      <span className="rounded-full bg-slate-100 p-3 text-slate-500">
        <Icon className="h-6 w-6" />
      </span>
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      {description && (
        <p className="text-sm text-slate-500 max-w-sm">{description}</p>
      )}
    </div>
  )
}

export default function BookingRequestsPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { supabase } = useOptimizedSupabase()
  const { profile, isLoading: isProfileLoading } = useOptimizedUser()
  const [loading, setLoading] = useState(true)
  const [tabLoading, setTabLoading] = useState(false)
  const [requests, setRequests] = useState<BookingRequest[]>([])
  const [filter, setFilter] = useState<'all' | 'pending' | 'counter_offered' | 'accepted' | 'rejected'>('all')

  // Redirect if not freelancer
  useEffect(() => {
    if (!isProfileLoading && profile && profile.user_type !== "freelancer") {
      toast.error("Access denied")
      router.push("/dashboard")
    }
  }, [profile, isProfileLoading, router])

  useEffect(() => {
    if (!profile || profile.user_type !== "freelancer") {
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
        const url = `/api/booking-requests?role=freelancer${statusParam ? `&status=${statusParam}` : ''}`
        
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error('Failed to fetch booking requests')
        }

        const data = await response.json()
        const fetchedRequests = data.requests || []
        setRequests(fetchedRequests)

        // Mark pending requests as viewed when page loads (only on initial load)
        if (isInitialLoad) {
          const unviewedPendingRequests = fetchedRequests.filter(
            (req: BookingRequest) => req.status === 'pending' && !req.viewed_by_freelancer
          )

          if (unviewedPendingRequests.length > 0) {
            // Mark all unviewed pending requests as viewed
            const updatePromises = unviewedPendingRequests.map((req: BookingRequest) =>
              supabase
                .from('booking_requests')
                .update({ 
                  viewed_by_freelancer: true, 
                  viewed_at: new Date().toISOString() 
                })
                .eq('id', req.id)
            )

            await Promise.all(updatePromises)
          }
        }
      } catch (error: any) {
        console.error("Error fetching booking requests:", error)
        toast.error(error.message || t("bookingRequests.error.failedToLoad"))
        setRequests([]) // Clear requests on error
      } finally {
        if (isInitialLoad) {
          setLoading(false)
        }
        setTabLoading(false)
      }
    }

    fetchRequests()
  }, [profile, filter, supabase]) // Removed 't' from dependencies to prevent unnecessary re-renders

  const refreshRequests = useCallback(async (statusOverride: typeof filter | 'all') => {
    if (!profile || profile.user_type !== "freelancer") return

    try {
      setTabLoading(true)
      const effectiveStatus = statusOverride === 'all' ? null : statusOverride
      const url = `/api/booking-requests?role=freelancer${effectiveStatus ? `&status=${effectiveStatus}` : ''}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error('Failed to refresh booking requests')
      }

      const data = await response.json()
      setRequests(data.requests || [])
    } catch (error) {
      console.error("Error refreshing booking requests:", error)
    } finally {
      setTabLoading(false)
    }
  }, [profile])

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

  if (profile.user_type !== "freelancer") {
    return null
  }

  const pendingRequests = requests.filter(r => r.status === 'pending')
  const counterOffered = requests.filter(r => r.status === 'counter_offered')
  const acceptedRequests = requests.filter(r => r.status === 'accepted')
  const rejectedRequests = requests.filter(r => r.status === 'rejected')

  const renderTabPanel = (
    list: BookingRequest[],
    statusOverride: typeof filter | 'all',
    icon: LucideIcon,
    title: string,
    description?: string
  ) => {
    if (list.length === 0) {
      return (
        <EmptyState
          icon={icon}
          title={title}
          description={description}
        />
      )
    }

    return (
      <div className="space-y-5">
        {list.map((request) => (
          <BookingRequestCard
            key={request.id}
            request={request}
            onUpdate={() => refreshRequests(statusOverride)}
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
                  {t("sidebar.bookingRequests")}
                </Badge>
                <div className="space-y-2">
                  <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{t("bookingRequests.title")}</h1>
                  <p className="text-sm text-slate-500 md:text-base">{t("bookingRequests.description")}</p>
                </div>
              </header>

              <Card className="rounded-3xl border border-slate-200/70 bg-white shadow-sm" key={filter}>
                <CardContent className="p-0">
                  <Tabs
                    value={filter}
                    onValueChange={(value) => {
                      setFilter(value as any)
                      setTabLoading(true)
                    }}
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
                      {tabLoading ? (
                        <BookingRequestsSkeleton />
                      ) : (
                        <>
                          <TabsContent value="all" className="mt-0 space-y-5">
                            {renderTabPanel(
                              requests,
                              'all',
                              FileText,
                              t("bookingRequests.noRequests"),
                              t("bookingRequests.noRequestsDescription")
                            )}
                          </TabsContent>

                          <TabsContent value="pending" className="mt-0 space-y-5">
                            {renderTabPanel(
                              pendingRequests,
                              'pending',
                              Clock,
                              t("bookingRequests.noPendingRequests")
                            )}
                          </TabsContent>

                          <TabsContent value="counter_offered" className="mt-0 space-y-5">
                            {renderTabPanel(
                              counterOffered,
                              'counter_offered',
                              MessageSquare,
                              t("bookingRequests.noCounterOffered")
                            )}
                          </TabsContent>

                          <TabsContent value="accepted" className="mt-0 space-y-5">
                            {renderTabPanel(
                              acceptedRequests,
                              'accepted',
                              CheckCircle,
                              t("bookingRequests.noAcceptedRequests")
                            )}
                          </TabsContent>

                          <TabsContent value="rejected" className="mt-0 space-y-5">
                            {renderTabPanel(
                              rejectedRequests,
                              'rejected',
                              X,
                              t("bookingRequests.noRejectedRequests")
                            )}
                          </TabsContent>
                        </>
                      )}
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

