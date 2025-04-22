"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { toast } from "@/lib/toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Globe } from "lucide-react"
import Link from "next/link"
import JobCategorySelector from "@/components/job-category-selector"
import AvailabilityCalendar from "@/components/availability-calendar"
import SidebarNav from "@/components/sidebar-nav"
import type { Database } from "@/lib/database.types"

export default function AvailabilityPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [jobCategories, setJobCategories] = useState<any[]>([])
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

        // Fetch job offerings
        const { data: offerings } = await supabase
          .from("freelancer_job_offerings")
          .select(`
            id,
            category_id,
            job_categories(id, name)
          `)
          .eq("freelancer_id", session.user.id)

        if (offerings && offerings.length > 0) {
          const categories = offerings.map((offering) => ({
            id: offering.category_id,
            name: offering.job_categories.name,
          }))

          // Remove duplicates
          const uniqueCategories = Array.from(new Map(categories.map((item) => [item.id, item])).values())

          setJobCategories(uniqueCategories)
          setSelectedCategory(uniqueCategories[0].id)
        }
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
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
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
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <h1 className="text-3xl font-bold">Manage Availability</h1>
              <Link href="/profile/availability/global">
                <Button variant="outline" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Manage Global Availability
                </Button>
              </Link>
            </div>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Job-Specific Availability</CardTitle>
                <CardDescription>
                  Set your availability for specific job types. You can also set global availability that applies to all job
                  types by default.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {jobCategories.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">You haven't created any job offerings yet.</p>
                    <Link href="/profile/edit">
                      <Button>Create Job Offerings</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Select Job Category</label>
                      <JobCategorySelector
                        selectedCategories={selectedCategory ? [selectedCategory] : []}
                        onChange={(categories) => setSelectedCategory(categories[0] || null)}
                        multiple={false}
                      />
                    </div>

                    {selectedCategory && (
                      <AvailabilityCalendar 
                        categoryId={selectedCategory} 
                        freelancerId={userId} 
                        categoryName={jobCategories.find(cat => cat.id === selectedCategory)?.name || ''}
                      />
                    )}
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
