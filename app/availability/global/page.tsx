"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { toast } from "@/lib/toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import GlobalAvailabilityCalendar from "@/components/global-availability-calendar"
import JobTypeAvailabilitySettings from "@/components/job-type-availability-settings"
import { Loader2 } from "lucide-react"
import SidebarNav from "@/components/sidebar-nav"
import type { Database } from "@/lib/database.types"
import LoadingSpinner from "@/components/loading-spinner"

export default function GlobalAvailabilityPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Database["public"]["Tables"]["profiles"]["Row"] | null>(null)
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function checkUser() {
      setLoading(true)
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          router.push("/login")
          return
        }

        const { data: profileData } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()

        if (profileData?.user_type !== "freelancer") {
          toast.error("Only freelancers can access this page")
          router.push("/dashboard")
          return
        }

        setProfile(profileData)
        setUserId(session.user.id)
      } catch (error) {
        console.error("Error checking user:", error)
      } finally {
        setLoading(false)
      }
    }

    checkUser()
  }, [supabase, router])

  if (loading) {
    return (
      <div className="container py-10 flex justify-center items-center min-h-[50vh]">
        <LoadingSpinner />
      </div>
    )
  }

  if (!userId || !profile) {
    return null
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
            <h1 className="text-3xl font-bold mb-6">Manage Global Availability</h1>

            <Tabs defaultValue="calendar" className="space-y-6">
              <TabsList>
                <TabsTrigger value="calendar">Global Calendar</TabsTrigger>
                <TabsTrigger value="settings">Job Type Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="calendar" className="space-y-6">
                <p className="text-muted-foreground">
                  Set your global availability that will apply to all job types by default. You can customize which job types
                  use these settings in the Job Type Settings tab.
                </p>
                <GlobalAvailabilityCalendar freelancerId={userId} />
              </TabsContent>

              <TabsContent value="settings">
                <p className="text-muted-foreground mb-6">
                  Choose which job types should use your global availability settings. Unchecked job types will use their
                  specific availability settings.
                </p>
                <JobTypeAvailabilitySettings freelancerId={userId} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
