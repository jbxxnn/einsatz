"use client"

import { useState, useEffect } from "react"
import { useSupabase } from "@/components/supabase-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Plus, Trash2 } from "lucide-react"
import JobCategorySelector from "@/components/job-category-selector"
import AvailabilityScheduleComponent from "@/components/availability-schedule"
import type { Database } from "@/lib/database.types"

type JobOffering = Database["public"]["Tables"]["freelancer_job_offerings"]["Row"]
type JobCategory = Database["public"]["Tables"]["job_categories"]["Row"]

interface JobOfferingsManagerProps {
  freelancerId: string
}

export default function JobOfferingsManager({ freelancerId }: JobOfferingsManagerProps) {
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [offerings, setOfferings] = useState<(JobOffering & { category_name: string })[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [hourlyRate, setHourlyRate] = useState("")
  const [description, setDescription] = useState("")
  const [experienceYears, setExperienceYears] = useState("")
  const [saving, setSaving] = useState(false)
  const [availabilityView, setAvailabilityView] = useState<string | null>(null)

  useEffect(() => {
    const fetchOfferings = async () => {
      setLoading(true)

      try {
        const { data, error } = await supabase
          .from("freelancer_job_offerings")
          .select(`
            *,
            job_categories (
              id, name
            )
          `)
          .eq("freelancer_id", freelancerId)

        if (error) throw error

        const formattedOfferings = data.map((offering) => ({
          ...offering,
          category_name: offering.job_categories.name,
        }))

        setOfferings(formattedOfferings)
      } catch (error) {
        console.error("Error fetching job offerings:", error)
        toast({
          title: "Error",
          description: "Failed to load job offerings",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (freelancerId) {
      fetchOfferings()
    }
  }, [supabase, freelancerId, toast])

  const handleAddOffering = async () => {
    if (!selectedCategoryId || !hourlyRate) {
      toast({
        title: "Missing information",
        description: "Please select a category and enter an hourly rate",
        variant: "destructive",
      })
      return
    }

    setSaving(true)

    try {
      // Check if offering already exists for this category
      const existingOffering = offerings.find((o) => o.category_id === selectedCategoryId)

      if (existingOffering) {
        toast({
          title: "Category already added",
          description: "You already have an offering for this job category",
          variant: "destructive",
        })
        setSaving(false)
        return
      }

      const { data, error } = await supabase
        .from("freelancer_job_offerings")
        .insert({
          freelancer_id: freelancerId,
          category_id: selectedCategoryId,
          hourly_rate: Number.parseFloat(hourlyRate),
          description: description,
          experience_years: experienceYears ? Number.parseFloat(experienceYears) : null,
          is_available_now: false,
        })
        .select(`
          *,
          job_categories (
            id, name
          )
        `)
        .single()

      if (error) throw error

      // Add to local state
      setOfferings([
        ...offerings,
        {
          ...data,
          category_name: data.job_categories.name,
        },
      ])

      // Reset form
      setSelectedCategoryId(null)
      setHourlyRate("")
      setDescription("")
      setExperienceYears("")

      toast({
        title: "Job offering added",
        description: `You can now be booked for ${data.job_categories.name} jobs`,
      })
    } catch (error) {
      console.error("Error adding job offering:", error)
      toast({
        title: "Error",
        description: "Failed to add job offering",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteOffering = async (offeringId: string) => {
    try {
      const { error } = await supabase.from("freelancer_job_offerings").delete().eq("id", offeringId)

      if (error) throw error

      // Update local state
      setOfferings(offerings.filter((o) => o.id !== offeringId))

      toast({
        title: "Job offering removed",
        description: "The job category has been removed from your profile",
      })
    } catch (error) {
      console.error("Error removing job offering:", error)
      toast({
        title: "Error",
        description: "Failed to remove job offering",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      {availabilityView ? (
        <>
          <Button variant="outline" onClick={() => setAvailabilityView(null)} className="mb-4">
            Back to Job Offerings
          </Button>
          <AvailabilityScheduleComponent freelancerId={freelancerId} categoryId={availabilityView} />
        </>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Your Job Offerings</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : offerings.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  <p>You haven't added any job offerings yet.</p>
                  <p>Add job categories below to start receiving bookings.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {offerings.map((offering) => (
                    <div key={offering.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium">{offering.category_name}</h3>
                        <p className="text-sm text-muted-foreground">€{offering.hourly_rate}/hour</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setAvailabilityView(offering.category_id)}>
                          Set Availability
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteOffering(offering.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Add New Job Offering</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Job Category</Label>
                  <JobCategorySelector
                    selectedCategories={selectedCategoryId ? [selectedCategoryId] : []}
                    onChange={(categories) => setSelectedCategoryId(categories[0] || null)}
                    multiple={false}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hourlyRate">Hourly Rate (€)</Label>
                  <Input
                    id="hourlyRate"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="45.00"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experienceYears">Years of Experience</Label>
                  <Input
                    id="experienceYears"
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="3.5"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your experience and services for this job category"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                <Button onClick={handleAddOffering} disabled={saving} className="w-full">
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Job Offering
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

