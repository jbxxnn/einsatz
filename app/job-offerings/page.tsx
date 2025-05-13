"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useOptimizedSupabase } from "@/components/optimized-supabase-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { toast } from "@/lib/toast"
import LoadingSpinner from "@/components/loading-spinner"
import type { Database } from "@/lib/database.types"
import SidebarNav from "@/components/sidebar-nav"
import JobOfferingsManager from "@/components/job-offerings-manager"
import { useTranslation } from "@/lib/i18n"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]

export default function JobOfferingsPage() { 
  const { t } = useTranslation()
  const router = useRouter()
  const { supabase } = useOptimizedSupabase()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)

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

      setLoading(false)
    }

    fetchProfile()
  }, [supabase, router])

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
        <h1 className="text-2xl font-bold mb-4">{t("jobOfferings.profileNotFound")}</h1>  
        <Button onClick={() => router.push("/")}>{t("jobOfferings.goToHome")}</Button>
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
              <div>
                <h1 className="text-3xl font-bold">{t("jobOfferings.title")}</h1>
                <p className="text-muted-foreground mt-1">
                  {t("jobOfferings.description")}
                </p>
              </div>
            </div>

            <Card>
              <CardHeader>
                {/* <CardTitle>Your Services</CardTitle> */}
                {/* <CardDescription>
                  Add and manage the services you offer to clients
                </CardDescription> */}
              </CardHeader>
              <CardContent>
                <JobOfferingsManager freelancerId={profile.id} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 