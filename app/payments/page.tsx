"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/supabase-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { CreditCard, Download, CheckCircle, Clock } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import type { Database } from "@/lib/database.types"
import LoadingSpinner from "@/components/loading-spinner"
import SidebarNav from "@/components/sidebar-nav"

type Invoice = Database["public"]["Tables"]["invoices"]["Row"] & {
  booking: {
    title: string
    start_time: string
  }
}

export default function PaymentsPage() {
  const router = useRouter()
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [profile, setProfile] = useState<Database["public"]["Tables"]["profiles"]["Row"] | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)

      try {
        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push("/login")
          return
        }

        // Get profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()

        if (profileError) {
          throw profileError
        }

        setProfile(profileData)

        // Fetch invoices
        let query

        if (profileData.user_type === "client") {
          query = supabase
            .from("invoices")
            .select(`
              *,
              booking:booking_id(title, start_time)
            `)
            .eq("client_id", user.id)
            .order("created_at", { ascending: false })
        } else {
          query = supabase
            .from("invoices")
            .select(`
              *,
              booking:booking_id(title, start_time)
            `)
            .eq("freelancer_id", user.id)
            .order("created_at", { ascending: false })
        }

        const { data: invoicesData, error: invoicesError } = await query

        if (invoicesError) {
          throw invoicesError
        }

        setInvoices(invoicesData as Invoice[])
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error",
          description: "Failed to load payments data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase, router, toast])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            Draft
          </Badge>
        )
      case "sent":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Sent
          </Badge>
        )
      case "paid":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Paid
          </Badge>
        )
      case "cancelled":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Cancelled
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="container py-10 flex justify-center items-center min-h-[50vh]">
        <LoadingSpinner />
      </div>
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
    <div className="bg-muted/30 min-h-screen">
      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <SidebarNav profile={profile} />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">Payments</h1>
              {profile.user_type === "freelancer" && (
                <Button>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Set Up Payment Method
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {profile.user_type === "client" ? "Total Spent" : "Total Earned"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    €
                    {invoices
                      .filter((i) => i.status === "paid")
                      .reduce((sum, invoice) => sum + invoice.amount, 0)
                      .toFixed(2)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {profile.user_type === "client" ? "Pending Payments" : "Pending Earnings"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    €
                    {invoices
                      .filter((i) => i.status === "sent")
                      .reduce((sum, invoice) => sum + invoice.amount, 0)
                      .toFixed(2)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Invoices</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{invoices.length}</div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="all">
              <div className="flex justify-between items-center mb-4">
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="paid">Paid</TabsTrigger>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="all" className="space-y-4">
                {invoices.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-10">
                      <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-xl font-medium mb-2">No invoices yet</h3>
                      <p className="text-muted-foreground text-center max-w-md mb-4">
                        {profile.user_type === "client"
                          ? "You haven't made any payments yet. Book a freelancer to get started."
                          : "You haven't received any payments yet. Complete jobs to get paid."}
                      </p>
                      {profile.user_type === "client" && (
                        <Link href="/freelancers">
                          <Button>Find Freelancers</Button>
                        </Link>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-4">Invoice</th>
                              <th className="text-left p-4">Date</th>
                              <th className="text-left p-4">Service</th>
                              <th className="text-left p-4">Amount</th>
                              <th className="text-left p-4">Status</th>
                              <th className="text-right p-4">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {invoices.map((invoice) => (
                              <tr key={invoice.id} className="border-b hover:bg-muted/50">
                                <td className="p-4">#{invoice.id.substring(0, 8)}</td>
                                <td className="p-4">{format(new Date(invoice.created_at), "MMM d, yyyy")}</td>
                                <td className="p-4">{invoice.booking.title}</td>
                                <td className="p-4 font-medium">€{invoice.amount.toFixed(2)}</td>
                                <td className="p-4">{getStatusBadge(invoice.status)}</td>
                                <td className="p-4 text-right">
                                  <Button variant="ghost" size="sm">
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="paid" className="space-y-4">
                {invoices.filter((i) => i.status === "paid").length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-10">
                      <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-xl font-medium mb-2">No paid invoices</h3>
                      <p className="text-muted-foreground text-center max-w-md">Paid invoices will appear here.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-4">Invoice</th>
                              <th className="text-left p-4">Date</th>
                              <th className="text-left p-4">Service</th>
                              <th className="text-left p-4">Amount</th>
                              <th className="text-left p-4">Status</th>
                              <th className="text-right p-4">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {invoices
                              .filter((i) => i.status === "paid")
                              .map((invoice) => (
                                <tr key={invoice.id} className="border-b hover:bg-muted/50">
                                  <td className="p-4">#{invoice.id.substring(0, 8)}</td>
                                  <td className="p-4">{format(new Date(invoice.created_at), "MMM d, yyyy")}</td>
                                  <td className="p-4">{invoice.booking.title}</td>
                                  <td className="p-4 font-medium">€{invoice.amount.toFixed(2)}</td>
                                  <td className="p-4">{getStatusBadge(invoice.status)}</td>
                                  <td className="p-4 text-right">
                                    <Button variant="ghost" size="sm">
                                      <Download className="h-4 w-4" />
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="pending" className="space-y-4">
                {invoices.filter((i) => i.status === "sent").length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-10">
                      <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-xl font-medium mb-2">No pending invoices</h3>
                      <p className="text-muted-foreground text-center max-w-md">Pending invoices will appear here.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-4">Invoice</th>
                              <th className="text-left p-4">Date</th>
                              <th className="text-left p-4">Service</th>
                              <th className="text-left p-4">Amount</th>
                              <th className="text-left p-4">Status</th>
                              <th className="text-right p-4">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {invoices
                              .filter((i) => i.status === "sent")
                              .map((invoice) => (
                                <tr key={invoice.id} className="border-b hover:bg-muted/50">
                                  <td className="p-4">#{invoice.id.substring(0, 8)}</td>
                                  <td className="p-4">{format(new Date(invoice.created_at), "MMM d, yyyy")}</td>
                                  <td className="p-4">{invoice.booking.title}</td>
                                  <td className="p-4 font-medium">€{invoice.amount.toFixed(2)}</td>
                                  <td className="p-4">{getStatusBadge(invoice.status)}</td>
                                  <td className="p-4 text-right">
                                    {profile.user_type === "client" && <Button size="sm">Pay Now</Button>}
                                    {profile.user_type === "freelancer" && (
                                      <Button variant="ghost" size="sm">
                                        <Download className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}

