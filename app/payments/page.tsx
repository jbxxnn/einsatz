"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useOptimizedSupabase } from "@/components/optimized-supabase-provider"
import { useOptimizedUser } from "@/components/optimized-user-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { CreditCard, Download, CheckCircle, Clock } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import type { Database } from "@/lib/database.types"
import { toast } from "@/lib/toast"
import { useTranslation } from "@/lib/i18n"
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarInset,
  useSidebar
} from "@/components/ui/sidebar"
import ModernSidebarNav from "@/components/modern-sidebar-nav"
import OptimizedHeader from "@/components/optimized-header"

// Custom header component that uses sidebar's mobile state
function MobileHeader() {
  const { openMobile, setOpenMobile } = useSidebar()
  
  return (
    <OptimizedHeader 
      isMobileMenuOpen={openMobile}
      setIsMobileMenuOpen={setOpenMobile}
    />
  )
}

// Skeleton for immediate loading
function PaymentsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex gap-4">
          <div className="h-8 w-32 bg-muted rounded animate-pulse" />
          <div className="h-8 w-32 bg-muted rounded animate-pulse" />
        </div>
        <div className="h-4 w-48 bg-muted rounded animate-pulse mt-2" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="h-[400px] w-full bg-muted rounded animate-pulse" />
        <div className="h-[400px] w-full bg-muted rounded animate-pulse" />
      </div>
    </div>
  )
}

type Invoice = Database["public"]["Tables"]["invoices"]["Row"] & {
  booking: {
    title: string
    start_time: string
  }
}

export default function PaymentsPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { supabase } = useOptimizedSupabase()
  const { profile, isLoading: isProfileLoading } = useOptimizedUser()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [activeTab, setActiveTab] = useState("invoices")

  // Redirect to login if no profile found - with more patient logic
  useEffect(() => {
    // Don't redirect if we're still loading
    if (isProfileLoading) {
      return;
    }

    // Don't redirect if we have a profile
    if (profile) {
      return;
    }

    // Add a small delay to prevent race conditions during session restoration
    const redirectTimeout = setTimeout(() => {
      // Double-check loading states before redirecting
      if (!isProfileLoading && !profile) {
        console.log("Redirecting to login - no profile found after loading completed");
        window.location.href = "/login";
      }
    }, 100); // 100ms delay to allow for session restoration

    return () => clearTimeout(redirectTimeout);
  }, [isProfileLoading, profile]);

  useEffect(() => {
    if (!profile) return;
    const fetchInvoices = async () => {
      try {
        let query
        if (profile.user_type === "client") {
          query = supabase
            .from("invoices")
            .select(`*,booking:booking_id(title, start_time)`)
            .eq("client_id", profile.id)
            .order("created_at", { ascending: false })
        } else {
          query = supabase
            .from("invoices")
            .select(`*,booking:booking_id(title, start_time)`)
            .eq("freelancer_id", profile.id)
            .order("created_at", { ascending: false })
        }
        const { data: invoicesData, error: invoicesError } = await query
        if (invoicesError) throw invoicesError
        setInvoices(invoicesData as Invoice[])
      } catch (error) {
        console.error("Error fetching invoices:", error)
        toast.error(t("payments.failedToLoadPaymentsData"))
      }
    }
    fetchInvoices()
  }, [supabase, profile])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            {t("payments.draft")}
          </Badge>
        )
      case "sent":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            {t("payments.sent")}
          </Badge>
        )
      case "paid":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            {t("payments.paid")}
          </Badge>
        )
      case "cancelled":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            {t("payments.cancelled")}
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (isProfileLoading) {
    return (
      <SidebarProvider className="w-full">
        <div className="flex min-h-screen bg-muted/30 w-full">
          <Sidebar>
            <ModernSidebarNav profile={null} />
          </Sidebar>
          <SidebarInset className="w-full">
            <MobileHeader />
            <div className="p-6">
              <PaymentsSkeleton />
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    )
  }

  if (!profile) {
    return (
      <div className="container py-10 text-center">
        <h1 className="text-2xl font-bold mb-4">{t("payments.profileNotFound")}</h1>
        <Button onClick={() => router.push("/")}>{t("payments.goToHome")}</Button>
      </div>
    )
  }

  return (
    <SidebarProvider className="w-full">
    <div className="flex min-h-screen bg-muted/30 w-full">
      <Sidebar>
        {profile && <ModernSidebarNav profile={profile} />}
      </Sidebar>
      <SidebarInset className="w-full">
        <MobileHeader />
        <div className="lg:col-span-3 space-y-6 p-6 pb-20 bg-[#f7f7f7] h-full">
          {/* <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 bg-background px-6"> */}
            {/* <SidebarTrigger className="-ml-1" /> */}
            <div className="flex items-center gap-2">
              {/* <h1 className="text-lg font-semibold">Payments</h1> */}
          </div>
              {profile.user_type === "freelancer" && (
              <Button className="ml-auto">
                  <CreditCard className="h-4 w-4 mr-2" />
{t("payments.setUpPaymentMethod")}
                </Button>
              )}
          {/* </header> */}

          <div className="flex flex-1 flex-col gap-6 p-6 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-6 bg-background rounded-lg overflow-hidden">
                <div className="flex flex-col items-center justify-center">
                  <div className="text-xs font-medium text-black">
                    {profile.user_type === "client" ? t("payments.totalSpent") : t("payments.totalEarned")}
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center">
                  <div className="text-xl font-bold">
                    €
                    {invoices
                      .filter((i) => i.status === "paid")
                      .reduce((sum, invoice) => sum + invoice.amount, 0)
                      .toFixed(2)}
                  </div>
                </div>
              </div>
              <div className="p-6 bg-background rounded-lg overflow-hidden">
                <div className="flex flex-col items-center justify-center">
                  <div className="text-xs font-medium text-black">
                  {profile.user_type === "client" ? t("payments.pendingPayments") : t("payments.pendingEarnings")}
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center">
                  <div className="text-xl font-bold">
                    €
                    {invoices
                      .filter((i) => i.status === "sent")
                      .reduce((sum, invoice) => sum + invoice.amount, 0)
                      .toFixed(2)}
                  </div>
                </div>
              </div>
              <div className="p-6 bg-background rounded-lg overflow-hidden">
                <div className="flex flex-col items-center justify-center">
                  <div className="text-xs font-medium text-black">
                  <CardTitle className="text-sm font-medium text-black">{t("payments.totalInvoices")}</CardTitle>
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center">
                  <div className="text-xl font-bold">
                  <div className="text-2xl font-bold">{invoices.length}</div>
                  </div>
                </div>
              </div>
            </div>

            <Tabs defaultValue="invoices" className="space-y-4">
                <TabsList>
                <TabsTrigger value="invoices">{t("payments.invoices")}</TabsTrigger>
                <TabsTrigger value="transactions">{t("payments.transactions")}</TabsTrigger>
                </TabsList>

              <TabsContent value="invoices" className="space-y-4">
                {invoices.length === 0 ? (
                 <div className="p-6 bg-background rounded-lg overflow-hidden">
                 <div className="flex flex-col items-center justify-center">
                      <h3 className="text-lg text-black font-medium mb-1">{t("payments.noInvoicesYet")}</h3>
                      <p className="text-black text-xs text-center max-w-md">
                        {profile.user_type === "client"
                          ? t("payments.yourInvoicesWillAppearHereOnceYouMakeBookings")
                          : t("payments.yourInvoicesWillAppearHereOnceYouCompleteJobs")}
                      </p>
                 </div>
                </div>
                ) : (
                  <div className="space-y-4">
                            {invoices.map((invoice) => (
                      <div className="p-6 bg-background rounded-lg overflow-hidden" key={invoice.id}>
                        <div className="p-6">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="text-lg text-black font-semibold">
                                  Invoice #{invoice.id}
                                </h3>
                                {getStatusBadge(invoice.status)}
                              </div>
                              <p className="text-xs text-black mb-2">
                                {invoice.booking?.title || t("payments.booking")}
                              </p>
                              <div className="flex items-center text-xs text-black">
                                <Clock className="h-4 w-4 mr-1" />
                                <span>
                                  {format(new Date(invoice.created_at), "MMM d, yyyy")}
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <div className="text-right">
                                <p className="text-xl font-bold">€{invoice.amount.toFixed(2)}</p>
                                <p className="text-xs text-black">
                                  {invoice.status === "paid" ? t("payments.paid") : t("payments.due")}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm">
                                  <Download className="h-4 w-4 mr-1" />
{t("payments.download")}
                                </Button>
                                {invoice.status === "sent" && profile.user_type === "client" && (
                                  <Button size="sm">
                                    <CheckCircle className="h-4 w-4 mr-1" />
{t("payments.payNow")}
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                      </div>
                    </div>
                    ))}
                      </div>
                )}
              </TabsContent>

              <TabsContent value="transactions" className="space-y-4">
                  <div className="p-6 bg-background rounded-lg overflow-hidden">
                    <div className="flex flex-col items-center justify-center">
                    <CreditCard className="h-12 w-12 text-black mb-4" />
                    <h3 className="text-lg text-black font-medium mb-2">{t("payments.transactionHistory")}</h3>
                    <p className="text-black text-center max-w-md text-xs">
                      {t("payments.yourTransactionHistoryWillAppearHereOnceYouHaveCompletedPayments")}
                    </p>
                    </div>
                  </div>
              </TabsContent>
            </Tabs>
          </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}

