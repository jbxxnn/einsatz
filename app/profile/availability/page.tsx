"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useOptimizedSupabase } from "@/components/optimized-supabase-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { toast } from "@/lib/toast"
import { Loader2, Calendar } from "lucide-react"
import type { Database } from "@/lib/database.types"
import SidebarNav from "@/components/sidebar-nav"
import AvailabilityCalendar from "@/components/availability-calendar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]
type JobOffering = Database["public"]["Tables"]["freelancer_job_offerings"]["Row"] & {
  job_categories: {
    id: string
    name: string
  }
}

export default function AvailabilityPage() {
  const router = useRouter()
  const { supabase } = useOptimizedSupabase()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [offerings, setOfferings] = useState<JobOffering[]>([])
  const [selectedOffering, setSelectedOffering] = useState<JobOffering | null>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login")
        return
      }

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (profileError) {
        console.error("Error fetching profile:", profileError)
        toast.error("Failed to load profile")
        router.push("/dashboard")
        return
      }

      setProfile(profileData)

      // If not a freelancer, redirect
      if (profileData.user_type !== "freelancer") {
        toast.error("Access denied")
        router.push("/dashboard")
        return
      }

      // Fetch job offerings
      const { data: offeringsData, error: offeringsError } = await supabase
        .from("freelancer_job_offerings")
        .select(`
          *,
          job_categories (id, name)
        `)
        .eq("freelancer_id", user.id)

      if (offeringsError) {
        console.error("Error fetching job offerings:", offeringsError)
      } else {
        const formattedOfferings = offeringsData.map((offering) => ({
          ...offering,
          job_categories: offering.job_categories,
        }))

        setOfferings(formattedOfferings)

        // Select the first offering by default
        if (formattedOfferings.length > 0) {
          setSelectedOffering(formattedOfferings[0])
        }
      }

      setLoading(false)
    }

    fetchProfile()
  }, [supabase, router])

  if (loading) {
    return (
      <div className="container py-10 flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
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
              <h1 className="text-3xl font-bold">Manage Availability</h1>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Your Availability</CardTitle>
                <CardDescription>Set your availability for each service you offer</CardDescription>
              </CardHeader>
              <CardContent>
                {offerings.length === 0 ? (
                  <div className="text-center p-6 border rounded-lg">
                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No services added yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Add job offerings in your profile before setting availability
                    </p>
                    <Button onClick={() => router.push("/profile/edit")}>Add Job Offerings</Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <Tabs
                      defaultValue={selectedOffering?.id}
                      onValueChange={(value) => {
                        const offering = offerings.find((o) => o.id === value)
                        if (offering) setSelectedOffering(offering)
                      }}
                    >
                      <TabsList className="mb-4">
                        {offerings.map((offering) => (
                          <TabsTrigger key={offering.id} value={offering.id}>
                            {offering.job_categories.name}
                          </TabsTrigger>
                        ))}
                      </TabsList>

                      {offerings.map((offering) => (
                        <TabsContent key={offering.id} value={offering.id}>
                          <AvailabilityCalendar
                            freelancerId={profile.id}
                            categoryId={offering.category_id}
                            categoryName={offering.job_categories.name}
                          />
                        </TabsContent>
                      ))}
                    </Tabs>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

