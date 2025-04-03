"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/supabase-provider"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import type { Database } from "@/lib/database.types"
import SidebarNav from "@/components/sidebar-nav"
import JobOfferingsManager from "@/components/job-offerings-manager"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]
type JobOffering = Database["public"]["Tables"]["freelancer_job_offerings"]["Row"] & {
  category_name: string
}

export default function AvailabilityPage() {
  const router = useRouter()
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [offerings, setOfferings] = useState<JobOffering[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)

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
        toast({
          title: "Error",
          description: "Could not load your profile",
          variant: "destructive",
        })
        router.push("/dashboard")
        return
      }

      setProfile(profileData)

      // If not a freelancer, redirect
      if (profileData.user_type !== "freelancer") {
        toast({
          title: "Access denied",
          description: "Only freelancers can access this page",
          variant: "destructive",
        })
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
          category_name: offering.job_categories.name,
        }))

        setOfferings(formattedOfferings)

        // Select the first category by default
        if (formattedOfferings.length > 0) {
          setSelectedCategoryId(formattedOfferings[0].category_id)
        }
      }

      setLoading(false)
    }

    fetchProfile()
  }, [supabase, router, toast])

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

            <div className="bg-background rounded-lg shadow-sm border p-8">
              <h2 className="text-xl font-semibold mb-6">Job Offerings</h2>
              <p className="text-muted-foreground mb-6">
                Add job categories you offer and set your availability for each one.
              </p>

              <JobOfferingsManager freelancerId={profile.id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

