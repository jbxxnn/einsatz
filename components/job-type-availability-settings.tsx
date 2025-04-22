"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { toast } from "@/lib/toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface JobTypeAvailabilitySettingsProps {
  freelancerId: string
}

export default function JobTypeAvailabilitySettings({ freelancerId }: JobTypeAvailabilitySettingsProps) {
  const [jobOfferings, setJobOfferings] = useState<any[]>([])
  const [selectedJobOfferings, setSelectedJobOfferings] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function fetchJobOfferings() {
      setLoading(true)
      try {
        // Fetch job offerings
        const { data: offerings, error: offeringsError } = await supabase
          .from("freelancer_job_offerings")
          .select(
            `
            id,
            category_id,
            job_categories(name),
            subcategory_id,
            job_subcategories(name)
          `,
          )
          .eq("freelancer_id", freelancerId)

        if (offeringsError) throw offeringsError

        // Fetch availability settings
        const { data: settings, error: settingsError } = await supabase
          .from("job_offering_availability_settings")
          .select("*")
          .eq("freelancer_id", freelancerId)

        if (settingsError) throw settingsError

        // Process the data
        const jobOfferingsWithSettings = offerings.map((offering) => {
          const setting = settings?.find((s) => s.job_offering_id === offering.id)
          return {
            ...offering,
            use_global_availability: setting ? setting.use_global_availability : true,
          }
        })

        setJobOfferings(jobOfferingsWithSettings)
        setSelectedJobOfferings(
          jobOfferingsWithSettings.filter((job) => job.use_global_availability).map((job) => job.id),
        )
      } catch (error) {
        console.error("Error fetching job offerings:", error)
        toast.error("Failed to load job offerings")
      } finally {
        setLoading(false)
      }
    }

    fetchJobOfferings()
  }, [freelancerId, supabase])

  const handleToggleJobOffering = (jobOfferingId: string) => {
    setSelectedJobOfferings((prev) =>
      prev.includes(jobOfferingId) ? prev.filter((id) => id !== jobOfferingId) : [...prev, jobOfferingId],
    )
  }

  const handleSaveSettings = async () => {
    setSaving(true)
    try {
      // Prepare the data for upsert
      const settingsToUpsert = jobOfferings.map((job) => ({
        freelancer_id: freelancerId,
        job_offering_id: job.id,
        use_global_availability: selectedJobOfferings.includes(job.id),
      }))

      // Upsert the settings
      const { error } = await supabase.from("job_offering_availability_settings").upsert(settingsToUpsert)

      if (error) throw error

      toast.success("Your availability settings have been updated")
    } catch (error) {
      console.error("Error saving settings:", error)
      toast.error("Failed to save availability settings")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Job Type Availability Settings</CardTitle>
        <CardDescription>
          Select which job types should use your global availability settings. Unchecked job types will use their
          specific availability settings.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {jobOfferings.length === 0 ? (
            <p className="text-muted-foreground">You haven't created any job offerings yet.</p>
          ) : (
            <>
              <div className="space-y-2">
                {jobOfferings.map((job) => (
                  <div key={job.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`job-${job.id}`}
                      checked={selectedJobOfferings.includes(job.id)}
                      onCheckedChange={() => handleToggleJobOffering(job.id)}
                    />
                    <Label htmlFor={`job-${job.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {job.job_categories?.name} {job.job_subcategories?.name ? `- ${job.job_subcategories.name}` : ''}
                    </Label>
                  </div>
                ))}
              </div>
              <Button onClick={handleSaveSettings} disabled={saving} className="mt-4">
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Settings"
                )}
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
