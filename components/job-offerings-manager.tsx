"use client"

import { useState, useEffect } from "react"
import { useOptimizedSupabase } from "@/components/optimized-supabase-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/lib/toast"
import { Loader2, Plus, Trash2, AlertCircle, Calendar, Briefcase } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import JobCategorySelector from "@/components/job-category-selector"
import JobSubcategorySelector from "@/components/job-subcategory-selector"
import AvailabilityCalendar from "@/components/availability-calendar"
import Link from "next/link"
import type { Database } from "@/lib/database.types"
import LoadingSpinner from "@/components/loading-spinner"
import { useTranslation } from "@/lib/i18n"

type JobOffering = Database["public"]["Tables"]["freelancer_job_offerings"]["Row"]
type JobCategory = Database["public"]["Tables"]["job_categories"]["Row"]
type JobSubcategory = Database["public"]["Tables"]["job_subcategories"]["Row"]

interface JobOfferingsManagerProps {
  freelancerId: string
}

// Maximum number of job offerings allowed
const MAX_JOB_OFFERINGS = 3

export default function JobOfferingsManager({ freelancerId }: JobOfferingsManagerProps) { 
  const { t } = useTranslation()
  const { supabase } = useOptimizedSupabase()
  const [loading, setLoading] = useState(true)
  const [offerings, setOfferings] = useState<(JobOffering & { category_name: string; subcategory_name?: string })[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | null>(null)
  const [hourlyRate, setHourlyRate] = useState("")
  const [description, setDescription] = useState("")
  const [experienceYears, setExperienceYears] = useState("")
  const [saving, setSaving] = useState(false)
  const [availabilityDialogOpen, setAvailabilityDialogOpen] = useState(false)
  const [selectedOfferingCategoryId, setSelectedOfferingCategoryId] = useState<string | null>(null)

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
            ),
            job_subcategories (
              id, name
            )
          `)
          .eq("freelancer_id", freelancerId)
          .order("created_at", { ascending: false })

        if (error) throw error

        const formattedOfferings = data.map((offering) => ({
          ...offering,
          category_name: offering.job_categories.name,
          subcategory_name: offering.job_subcategories?.name,
        }))

        setOfferings(formattedOfferings)
      } catch (error) {
        console.error("Error fetching job offerings:", error)
        toast.error(t("jobOfferings.cardLoadOfferingsError"))
      } finally {
        setLoading(false)
      }
    }

    if (freelancerId) {
      fetchOfferings()
    }
  }, [supabase, freelancerId])

  const handleAddOffering = async () => {
    if (!selectedCategoryId || !hourlyRate) {
      toast.error(t("jobOfferings.cardAddOfferingError"))
      return
    }

    if (offerings.length >= MAX_JOB_OFFERINGS) {
      toast.error(t("jobOfferings.cardMaxOfferings"))
      return
    }

    setSaving(true)

    try {
      // Check if offering already exists for this category and subcategory
      const existingOffering = offerings.find(
        (o) =>
          o.category_id === selectedCategoryId &&
          ((!o.subcategory_id && !selectedSubcategoryId) || o.subcategory_id === selectedSubcategoryId),
      )

      if (existingOffering) {
        toast.error(t("jobOfferings.cardAddOfferingError"))
        setSaving(false)
        return
      }

      const { data, error } = await supabase
        .from("freelancer_job_offerings")
        .insert({
          freelancer_id: freelancerId,
          category_id: selectedCategoryId,
          subcategory_id: selectedSubcategoryId,
          hourly_rate: Number.parseFloat(hourlyRate),
          description: description,
          experience_years: experienceYears ? Number.parseFloat(experienceYears) : null,
          is_available_now: false,
        })
        .select(`
          *,
          job_categories (
            id, name
          ),
          job_subcategories (
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
          subcategory_name: data.job_subcategories?.name,
        },
      ])

      // Reset form
      setSelectedCategoryId(null)
      setSelectedSubcategoryId(null)
      setHourlyRate("")
      setDescription("")
      setExperienceYears("")

      toast.success(`You can now be booked for ${data.job_categories.name} ${
        data.job_subcategories?.name ? `- ${data.job_subcategories.name}` : ""
      } jobs`)
    } catch (error) {
      console.error("Error adding job offering:", error)
      toast.error(t("jobOfferings.cardAddOfferingError"))
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

      toast.success(t("jobOfferings.cardRemoveOfferingSuccess"))
    } catch (error) {
      console.error("Error removing job offering:", error)
      toast.error(t("jobOfferings.cardRemoveOfferingError"))
    }
  }

  const openAvailabilityDialog = (categoryId: string) => {
    setSelectedOfferingCategoryId(categoryId)
    setAvailabilityDialogOpen(true)
  }

  // Reset subcategory when category changes
  useEffect(() => {
    setSelectedSubcategoryId(null)
  }, [selectedCategoryId])

  const hasReachedMaxOfferings = offerings.length >= MAX_JOB_OFFERINGS

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("jobOfferings.cardTitle")}</CardTitle>
          <CardDescription>
            {t("jobOfferings.cardDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-4">
              <LoadingSpinner />
            </div>
          ) : offerings.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              <p>{t("jobOfferings.cardNoOfferings")}</p>
              <p>{t("jobOfferings.cardAddOfferings")}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {offerings.map((offering) => (
                <div key={offering.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-medium">{offering.category_name}</h3>
                      {offering.subcategory_name && (
                        <p className="text-sm text-muted-foreground">{offering.subcategory_name}</p>
                      )}
                      <p className="text-sm text-muted-foreground">€{offering.hourly_rate}/hour</p>
                      {/* {offering.experience_years && (
                        <p className="text-sm text-muted-foreground">
                          {offering.experience_years} {offering.experience_years === 1 ? "year" : "years"} of experience
                        </p>
                      )} */}
                    </div>
                    <div className="flex gap-2">
                      {/* <Button variant="outline" size="sm" onClick={() => openAvailabilityDialog(offering.category_id)}>
                        <Calendar className="h-4 w-4 mr-2" />
                        Set Availability
                      </Button> */}
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteOffering(offering.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  {/* {offering.description && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      <p>{offering.description}</p>
                    </div>
                  )} */}
                </div>
              ))}
              <div className="mt-[20px]">
              <Link href="/profile/availability">
                        <Button>
                          <Briefcase className="h-4 w-4 mr-2" />
                          {t("jobOfferings.cardSetupAvailability")}
                        </Button>
                      </Link>
                      </div>
            </div>
            
          )}
        </CardContent>
        
      </Card>

      {hasReachedMaxOfferings ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t("jobOfferings.cardMaxOfferings")}</AlertTitle>
          <AlertDescription>
            {t("jobOfferings.cardMaxOfferingsDescription", { MAX_JOB_OFFERINGS: 3 })}
          </AlertDescription>
        </Alert>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{t("jobOfferings.cardAddNewOffering")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category">{t("jobOfferings.cardCategory")}</Label>
                <JobCategorySelector
                  selectedCategories={selectedCategoryId ? [selectedCategoryId] : []}
                  onChange={(categories) => setSelectedCategoryId(categories[0] || null)}
                  multiple={false}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subcategory">{t("jobOfferings.cardSubcategory")}</Label>
                <JobSubcategorySelector
                  categoryId={selectedCategoryId}
                  selectedSubcategory={selectedSubcategoryId}
                  onChange={setSelectedSubcategoryId}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hourlyRate">{t("jobOfferings.cardHourlyRate")}</Label>
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
                <Label htmlFor="experienceYears">{t("jobOfferings.cardExperienceYears")}</Label>
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
                <Label htmlFor="description">{t("jobOfferings.cardDescription")}</Label>
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
                    {t("jobOfferings.cardAdding")}
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    {t("jobOfferings.cardAddJobOffering")}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Availability Dialog */}
      <Dialog open={availabilityDialogOpen} onOpenChange={setAvailabilityDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t("jobOfferings.cardSetAvailability")}</DialogTitle>
          </DialogHeader>
          <AvailabilityCalendar freelancerId={freelancerId} />
        </DialogContent>
      </Dialog>
    </div>
  )
}

