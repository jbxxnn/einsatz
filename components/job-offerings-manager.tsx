"use client"

import { useState, useEffect } from "react"
import { useOptimizedSupabase } from "@/components/optimized-supabase-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/lib/toast"
import { Loader2, Plus, Trash2, AlertCircle, Calendar, Briefcase, Loader, GripVertical, Shield, CheckCircle, Clock, Package, DollarSign, Calculator } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import JobCategorySelector from "@/components/job-category-selector"
import JobSubcategorySelector from "@/components/job-subcategory-selector"
import AvailabilityCalendar from "@/components/availability-calendar"
import FreelancerDBAQuestionnaire from "@/components/freelancer-dba-questionnaire"
import JobOfferingPackagesManagerV2 from "@/components/job-offering-packages-manager-v2"
import PackageItemsManager from "@/components/package-items-manager"

import Link from "next/link"
import type { Database } from "@/lib/database.types"
import LoadingSpinner from "@/components/loading-spinner"
import { useTranslation } from "@/lib/i18n"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

type JobOffering = Database["public"]["Tables"]["freelancer_job_offerings"]["Row"]
type JobCategory = Database["public"]["Tables"]["job_categories"]["Row"]
type JobSubcategory = Database["public"]["Tables"]["job_subcategories"]["Row"]

interface JobOfferingsManagerProps {
  freelancerId: string
}

// Maximum number of job offerings allowed
const MAX_JOB_OFFERINGS = 3

// Sortable table row component
function SortableTableRow({ 
  offering, 
  onDelete,
  onDbaClick,
  onManagePackages,
  dbaStatus,
  loadingDbaStatus
}: { 
  offering: JobOffering & { category_name: string; subcategory_name?: string; display_order?: number }
  onDelete: (id: string) => void
  onDbaClick: (categoryId: string, categoryName: string) => void
  onManagePackages: (offering: JobOffering & { category_name: string; subcategory_name?: string; display_order?: number }) => void
  dbaStatus?: any
  loadingDbaStatus: boolean
}) {
  const { t } = useTranslation()
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: offering.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <TableRow 
      ref={setNodeRef} 
      style={style} 
      className="text-xs text-black cursor-move"
    >
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded"
          >
            <GripVertical className="h-4 w-4 text-gray-400" />
          </div>
          {offering.category_name}
        </div>
      </TableCell>
      <TableCell>
        {offering.subcategory_name || "-"}
      </TableCell>
      <TableCell>
        <div className="text-sm">
          {offering.pricing_type === "packages" ? (
            <>
              <div className="font-medium text-green-600">Multiple Packages</div>
              <div className="text-xs text-gray-500">Click "Manage" to view</div>
            </>
          ) : (
            <div className="font-medium text-green-600">
              €{offering.hourly_rate}/hour
            </div>
          )}
        </div>
      </TableCell>
      <TableCell>
        {offering.experience_years ? `${offering.experience_years} ${offering.experience_years === 1 ? "year" : "years"}` : "-"}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          {loadingDbaStatus ? (
            <div className="flex items-center gap-2">
              <Loader className="h-4 w-4 animate-spin" />
              <span className="text-xs text-gray-500">Checking...</span>
            </div>
          ) : dbaStatus?.completion?.is_completed ? (
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-xs">Complete</span>
            </div>
          ) : dbaStatus?.hasStarted ? (
            <div className="flex items-center gap-1 text-orange-600">
              <Clock className="h-4 w-4" />
              <span className="text-xs">In Progress</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-gray-500">
              <Clock className="h-4 w-4" />
              <span className="text-xs">Not Started</span>
            </div>
          )}
        </div>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex gap-2 justify-end items-center">
          {offering.pricing_type === "packages" && (
            <Button 
              variant="outline"
              size="sm" 
              onClick={() => onManagePackages(offering)}
            >
              <Package className="h-4 w-4 mr-2" />
              Manage Packages
            </Button>
          )}

          <Button 
            variant={dbaStatus?.completion?.is_completed ? "secondary" : "outline"}
            size="sm" 
            onClick={() => onDbaClick(offering.category_id, offering.category_name)}
          >
            <Shield className="h-4 w-4 mr-2" />
            {dbaStatus?.completion?.is_completed ? 'Update DBA' : 'Start DBA'}
          </Button>

          <Button variant="ghost" size="icon" onClick={() => onDelete(offering.id)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}



export default function JobOfferingsManager({ freelancerId }: JobOfferingsManagerProps) { 
  const { t } = useTranslation()
  const { supabase } = useOptimizedSupabase()
  const [loading, setLoading] = useState(true)
  const [offerings, setOfferings] = useState<(JobOffering & { category_name: string; subcategory_name?: string; display_order?: number })[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | null>(null)
  const [pricingType, setPricingType] = useState<"hourly" | "packages">("hourly")
  const [hourlyRate, setHourlyRate] = useState("")
  const [description, setDescription] = useState("")
  const [experienceYears, setExperienceYears] = useState("")
  const [saving, setSaving] = useState(false)
  const [availabilityDialogOpen, setAvailabilityDialogOpen] = useState(false)
  const [selectedOfferingCategoryId, setSelectedOfferingCategoryId] = useState<string | null>(null)
  const [dbaDialogOpen, setDbaDialogOpen] = useState(false)
  const [selectedDbaCategoryId, setSelectedDbaCategoryId] = useState<string | null>(null)
  const [selectedDbaCategoryName, setSelectedDbaCategoryName] = useState<string>("")
  const [dbaStatuses, setDbaStatuses] = useState<Record<string, any>>({})
  const [loadingDbaStatus, setLoadingDbaStatus] = useState(false)
  const [packagesDialogOpen, setPackagesDialogOpen] = useState(false)
  const [selectedOfferingForPackages, setSelectedOfferingForPackages] = useState<(JobOffering & { category_name: string; subcategory_name?: string; display_order?: number }) | null>(null)
  const [packageItemsDialogOpen, setPackageItemsDialogOpen] = useState(false)
  const [selectedPackageForItems, setSelectedPackageForItems] = useState<{ id: string; name: string } | null>(null)
  const [packagesRefreshTrigger, setPackagesRefreshTrigger] = useState(0)


  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const fetchDBAStatuses = async (categoryIds: string[]) => {
    if (categoryIds.length === 0) return

    setLoadingDbaStatus(true)
    try {
      const statusPromises = categoryIds.map(async (categoryId) => {
        const response = await fetch(`/api/freelancer-dba/status?jobCategoryId=${categoryId}`)
        if (response.ok) {
          const data = await response.json()
          return { categoryId, status: data }
        }
        return { categoryId, status: null }
      })

      const results = await Promise.all(statusPromises)
      const statusMap: Record<string, any> = {}
      results.forEach(({ categoryId, status }) => {
        statusMap[categoryId] = status
      })
      
      setDbaStatuses(statusMap)
    } catch (error) {
      console.error('Error fetching DBA statuses:', error)
    } finally {
      setLoadingDbaStatus(false)
    }
  }

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
          .order("display_order", { ascending: true, nullsFirst: false })
          .order("created_at", { ascending: false })

        if (error) throw error

        const formattedOfferings = data.map((offering) => ({
          ...offering,
          category_name: offering.job_categories.name,
          subcategory_name: offering.job_subcategories?.name,
        }))

        setOfferings(formattedOfferings)

        // Fetch DBA statuses for all categories
        if (formattedOfferings.length > 0) {
          await fetchDBAStatuses(formattedOfferings.map(o => o.category_id))
        }

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
    if (!selectedCategoryId) {
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
          pricing_type: pricingType,
          hourly_rate: pricingType === "hourly" ? Number.parseFloat(hourlyRate) || 45.00 : null,
          description: description,
          experience_years: experienceYears ? Number.parseFloat(experienceYears) : null,
          is_available_now: false,
          display_order: offerings.length + 1,
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
      setPricingType("hourly")
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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      const oldIndex = offerings.findIndex((offering) => offering.id === active.id)
      const newIndex = offerings.findIndex((offering) => offering.id === over?.id)

      const newOfferings = arrayMove(offerings, oldIndex, newIndex)
      setOfferings(newOfferings)

      // Update the display order in the database
      try {
        // Update each offering individually to avoid potential upsert issues
        for (let i = 0; i < newOfferings.length; i++) {
          const { error } = await supabase
            .from("freelancer_job_offerings")
            .update({ display_order: i + 1 })
            .eq("id", newOfferings[i].id)

          if (error) {
            console.error("Error updating offering:", newOfferings[i].id, error)
            throw error
          }
        }

        toast.success(t("jobOfferings.orderUpdated") || "Job offerings order updated")
      } catch (error) {
        console.error("Error updating job offerings order:", error)
        toast.error(t("jobOfferings.orderUpdateError") || "Failed to update order")
      }
    }
  }

  const openAvailabilityDialog = (categoryId: string) => {
    setSelectedOfferingCategoryId(categoryId)
    setAvailabilityDialogOpen(true)
  }

  const openPackagesDialog = (offering: JobOffering & { category_name: string; subcategory_name?: string; display_order?: number }) => {
    setSelectedOfferingForPackages(offering)
    setPackagesDialogOpen(true)
  }

  const openPackageItemsDialog = (packageId: string, packageName: string) => {
    setSelectedPackageForItems({ id: packageId, name: packageName })
    setPackageItemsDialogOpen(true)
  }

  // Reset subcategory when category changes
  useEffect(() => {
    setSelectedSubcategoryId(null)
  }, [selectedCategoryId])

  const hasReachedMaxOfferings = offerings.length >= MAX_JOB_OFFERINGS

  return (
    <div className="space-y-6">
      <div className="bg-background rounded-lg overflow-hidden">
      <div className="p-6">
      <h2 className="text-lg font-semibold mb-1">{t("jobOfferings.cardTitle")}</h2>
          <p className="text-xs text-black">{t("jobOfferings.cardDescription")}</p>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center min-h-screen w-full">
              <Loader className="h-8 w-8 animate-spin" />
            </div>
          ) : offerings.length === 0 ? (
            <div className="text-center py-4 text-black text-sm">
              <p>{t("jobOfferings.cardNoOfferings")}</p>
              <p>{t("jobOfferings.cardAddOfferings")}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <Table>
                  <TableHeader>
                    <TableRow className="text-xs text-black">
                      <TableHead>{t("jobOfferings.category")}</TableHead>
                      <TableHead>{t("jobOfferings.subcategory")}</TableHead>
                      <TableHead>Pricing</TableHead>
                      <TableHead>{t("jobOfferings.experienceYears")}</TableHead>
                      <TableHead>DBA Status</TableHead>
                      <TableHead className="text-right">{t("jobOfferings.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <SortableContext
                    items={offerings.map(offering => offering.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <TableBody>
                      {offerings.map((offering) => {
                        return (
                          <SortableTableRow
                            key={offering.id}
                            offering={offering}
                            onDelete={handleDeleteOffering}
                            onDbaClick={(categoryId, categoryName) => {
                              setSelectedDbaCategoryId(categoryId)
                              setSelectedDbaCategoryName(categoryName)
                              setDbaDialogOpen(true)
                            }}
                            onManagePackages={openPackagesDialog}
                            dbaStatus={dbaStatuses[offering.category_id]}
                            loadingDbaStatus={loadingDbaStatus}
                          />
                        )
                      })}
                    </TableBody>
                  </SortableContext>
                </Table>
              </DndContext>
              
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
        </div>
      </div>

      {hasReachedMaxOfferings ? (
        <div className="bg-background rounded-lg overflow-hidden">
          <div className="p-6 flex gap-2">
            <AlertCircle className="h-4 w-4" />
            <div>
            <AlertTitle className="text-sm text-black">{t("jobOfferings.cardMaxOfferings")}</AlertTitle>
            <AlertDescription className="text-xs text-black">
              {t("jobOfferings.cardMaxOfferingsDescription", { MAX_JOB_OFFERINGS: 3 })}
            </AlertDescription>
          </div>
          </div>
        </div>
      ) : (
        <div className="bg-background rounded-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-1">{t("jobOfferings.cardAddNewOffering")}</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category" className="text-xs text-black">{t("jobOfferings.cardCategory")}</Label>
                <JobCategorySelector
                  selectedCategories={selectedCategoryId ? [selectedCategoryId] : []}
                  onChange={(categories) => setSelectedCategoryId(categories[0] || null)}
                  multiple={false}
                  className="rounded-lg text-xs border-brand-green focus-visible:border-none focus-visible:ring-0 focus-visible:ring-brand-green focus-visible:outline-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subcategory" className="text-xs text-black">{t("jobOfferings.cardSubcategory")}</Label>
                <JobSubcategorySelector
                  categoryId={selectedCategoryId}
                  selectedSubcategory={selectedSubcategoryId}
                  onChange={setSelectedSubcategoryId}
                  className="rounded-lg text-xs border-brand-green focus-visible:border-none focus-visible:ring-0 focus-visible:ring-brand-green focus-visible:outline-none"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-black">Pricing Type</Label>
                <RadioGroup 
                  value={pricingType} 
                  onValueChange={(value: "hourly" | "packages") => setPricingType(value)}
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="hourly" id="hourly" />
                    <Label htmlFor="hourly" className="text-xs text-black cursor-pointer">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Fixed Hourly Rate
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="packages" id="packages" />
                    <Label htmlFor="packages" className="text-xs text-black cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Multiple Packages
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {pricingType === "hourly" && (
                <div className="space-y-2">
                  <Label htmlFor="hourlyRate" className="text-xs text-black">Hourly Rate (€)</Label>
                  <Input
                    id="hourlyRate"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="45.00"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    className="rounded-lg text-xs border-brand-green focus-visible:border-none focus-visible:ring-0 focus-visible:ring-brand-green focus-visible:outline-none"
                  />
                </div>
              )}

              {pricingType === "packages" && (
                <div className="text-xs text-gray-600 p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium mb-1">💡 Package Pricing</p>
                  <p>After creating this job offering, you'll be able to add multiple service packages with different prices and features.</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="experienceYears" className="text-xs text-black">{t("jobOfferings.cardExperienceYears")}</Label>
                <Input
                  id="experienceYears"
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="3.5"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(e.target.value)}
                  className="rounded-lg text-xs border-brand-green focus-visible:border-none focus-visible:ring-0 focus-visible:ring-brand-green focus-visible:outline-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-xs text-black">{t("jobOfferings.cardDescription")}</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your experience and services for this job category"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="rounded-lg text-xs border-brand-green focus-visible:border-none focus-visible:ring-0 focus-visible:ring-brand-green focus-visible:outline-none"
                />
                
                {/* Live Preview */}
                {description && (
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-600">Preview (as shown to clients):</Label>
                    <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-5 gap-4">
                      <div className="flex flex-col gap-1">
                        <div className="text-xs cursor-help flex flex-col items-start justify-start rounded-md border transition-colors h-full bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200">
                          <div className="flex flex-col items-start justify-start gap-1 p-1 w-full h-full">
                            <span className="font-bold">
                              {selectedSubcategoryId ? "Sample Subcategory" : "Sample Category"}
                            </span>
                            
                            {/* Pricing and Experience */}
                            <div className="flex gap-4 mt-1">
                              {pricingType === "hourly" && hourlyRate && (
                                <span className="text-xs font-semibold text-green-600">
                                  €{hourlyRate}/hour
                                </span>
                              )}
                              {pricingType === "packages" && (
                                <span className="text-xs font-semibold text-green-600">
                                  Multiple Packages
                                </span>
                              )}
                              {experienceYears && (
                                <span className="text-xs">
                                  {experienceYears} {experienceYears === "1" ? "year" : "years"} experience
                                </span>
                              )}
                            </div>
                            
                            {/* Description - This is what gets truncated */}
                            <div className="flex items-center gap-1 mt-1">
                              <div className="line-clamp-2 text-xs">
                                {description}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    {description.length > 80 && (
                      <div className="text-xs text-orange-600">
                        ⚠️ Text will be truncated at 2 lines on the freelancers list
                      </div>
                    )}
                  </div>
                )}
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
          </div>
        </div>
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

      {/* DBA Questionnaire Dialog */}
      <Dialog open={dbaDialogOpen} onOpenChange={setDbaDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              DBA Assessment - {selectedDbaCategoryName}
            </DialogTitle>
          </DialogHeader>
          {selectedDbaCategoryId && (
            <FreelancerDBAQuestionnaire
              jobCategoryId={selectedDbaCategoryId}
              jobCategoryName={selectedDbaCategoryName}
              freelancerId={freelancerId}
              onComplete={() => {
                // Refresh DBA statuses when completed
                fetchDBAStatuses([selectedDbaCategoryId])
                setDbaDialogOpen(false)
              }}
              onSave={() => {
                // Refresh DBA statuses when saved
                fetchDBAStatuses([selectedDbaCategoryId])
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Packages Management Dialog */}
      <Dialog open={packagesDialogOpen} onOpenChange={setPackagesDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Manage Service Packages
            </DialogTitle>
          </DialogHeader>
          {selectedOfferingForPackages && (
            <JobOfferingPackagesManagerV2
              jobOfferingId={selectedOfferingForPackages.id}
              categoryName={selectedOfferingForPackages.category_name}
              onPackagesChange={() => {
                // Optionally refresh offerings data
                // This could trigger a refetch of the main offerings
              }}
              onManageItems={openPackageItemsDialog}
              refreshTrigger={packagesRefreshTrigger}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Package Items Management Dialog */}
      <Dialog open={packageItemsDialogOpen} onOpenChange={setPackageItemsDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Manage Package Items
            </DialogTitle>
          </DialogHeader>
          {selectedPackageForItems && (
            <PackageItemsManager
              packageId={selectedPackageForItems.id}
              packageName={selectedPackageForItems.name}
              onItemsChange={(totalPrice) => {
                // Update package total price when items change
                console.log('Package total updated:', totalPrice)
              }}
              onSaveAndClose={() => {
                setPackageItemsDialogOpen(false)
                // Trigger refresh of packages data
                setPackagesRefreshTrigger(prev => prev + 1)
              }}
            />
          )}
        </DialogContent>
      </Dialog>

    </div>
  )
}

