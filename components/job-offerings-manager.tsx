"use client"

import { useState, useEffect } from "react"
import { useOptimizedSupabase } from "@/components/optimized-supabase-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/lib/toast"
import { Loader2, Plus, Trash2, AlertCircle, Calendar, Briefcase, Loader, GripVertical, Shield, CheckCircle, Clock, Package, DollarSign, Calculator, Edit } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
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

type JobOffering = Database["public"]["Tables"]["freelancer_job_offerings"]["Row"] & {
  is_wildcard?: boolean
}
type JobCategory = Database["public"]["Tables"]["job_categories"]["Row"] & {
  name_en?: string | null
  name_nl?: string | null
}
type JobSubcategory = Database["public"]["Tables"]["job_subcategories"]["Row"] & {
  name_en?: string | null
  name_nl?: string | null
}

interface JobOfferingsManagerProps {
  freelancerId: string
}

// Maximum number of job offerings allowed
const MAX_JOB_OFFERINGS = 3
const MAX_WILDCARD_OFFERINGS = 4 // 3 normal + 1 wildcard

// Wildcard work types
const WILDCARD_WORK_TYPES = [
  { 
    id: 'physical', 
    labelKey: 'jobOfferings.wildcardWorkTypesOptions.physical.label', 
    descriptionKey: 'jobOfferings.wildcardWorkTypesOptions.physical.description' 
  },
  { 
    id: 'customer-facing', 
    labelKey: 'jobOfferings.wildcardWorkTypesOptions.customerFacing.label', 
    descriptionKey: 'jobOfferings.wildcardWorkTypesOptions.customerFacing.description' 
  },
  { 
    id: 'outdoor', 
    labelKey: 'jobOfferings.wildcardWorkTypesOptions.outdoor.label', 
    descriptionKey: 'jobOfferings.wildcardWorkTypesOptions.outdoor.description' 
  },
  { 
    id: 'flexible-hours', 
    labelKey: 'jobOfferings.wildcardWorkTypesOptions.flexibleHours.label', 
    descriptionKey: 'jobOfferings.wildcardWorkTypesOptions.flexibleHours.description' 
  },
  { 
    id: 'repetitive', 
    labelKey: 'jobOfferings.wildcardWorkTypesOptions.repetitive.label', 
    descriptionKey: 'jobOfferings.wildcardWorkTypesOptions.repetitive.description' 
  },
  { 
    id: 'analytical', 
    labelKey: 'jobOfferings.wildcardWorkTypesOptions.analytical.label', 
    descriptionKey: 'jobOfferings.wildcardWorkTypesOptions.analytical.description' 
  },
  { 
    id: 'creative', 
    labelKey: 'jobOfferings.wildcardWorkTypesOptions.creative.label', 
    descriptionKey: 'jobOfferings.wildcardWorkTypesOptions.creative.description' 
  }
]

// Sortable table row component
function SortableTableRow({ 
  offering, 
  onDelete,
  onEdit,
  onDbaClick,
  onManagePackages,
  dbaStatus,
  loadingDbaStatus
}: { 
  offering: JobOffering & { category_name: string; subcategory_name?: string; display_order?: number }
  onDelete: (id: string) => void
  onEdit: (offering: JobOffering & { category_name: string; subcategory_name?: string; display_order?: number }) => void
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
              <div className="font-medium text-green-600">{t("jobOfferings.multiplePackages")}</div>
              <div className="text-xs text-gray-500">{t("jobOfferings.clickManageToView")}</div>
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
              <span className="text-xs text-gray-500">{t("jobOfferings.checking")}</span>
            </div>
          ) : dbaStatus?.completion?.is_completed ? (
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-xs">{t("jobOfferings.complete")}</span>
            </div>
          ) : dbaStatus?.hasStarted ? (
            <div className="flex items-center gap-1 text-orange-600">
              <Clock className="h-4 w-4" />
              <span className="text-xs">{t("jobOfferings.inProgress")}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-gray-500">
              <Clock className="h-4 w-4" />
              <span className="text-xs">{t("jobOfferings.notStarted")}</span>
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
              {t("jobOfferings.managePackages")}
            </Button>
          )}

          <Button 
            variant={dbaStatus?.completion?.is_completed ? "secondary" : "outline"}
            size="sm" 
            onClick={() => onDbaClick(offering.category_id, offering.category_name)}
          >
            <Shield className="h-4 w-4 mr-2" />
            {dbaStatus?.completion?.is_completed ? t("jobOfferings.updateDba") : t("jobOfferings.startDba")}
          </Button>

          <Button variant="ghost" size="icon" onClick={() => onEdit(offering)}>
            <Edit className="h-4 w-4 text-blue-600" />
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
  const { t, locale } = useTranslation()
  const { supabase } = useOptimizedSupabase()
  const [loading, setLoading] = useState(true)
  const [offerings, setOfferings] = useState<(JobOffering & { category_name: string; subcategory_name?: string; display_order?: number })[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | null>(null)
  const [pricingType, setPricingType] = useState<"hourly" | "packages">("packages")
  const [hourlyRate, setHourlyRate] = useState("")
  const [description, setDescription] = useState("")
  const [experienceYears, setExperienceYears] = useState("")
  
  // Wildcard form state
  const [wildcardWorkTypes, setWildcardWorkTypes] = useState<string[]>([])
  const [wildcardPricingType, setWildcardPricingType] = useState<"hourly" | "packages">("hourly")
  const [wildcardHourlyRate, setWildcardHourlyRate] = useState("")
  const [wildcardDescription, setWildcardDescription] = useState("")
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
  const [addOfferingDialogOpen, setAddOfferingDialogOpen] = useState(false)
  const [addWildcardDialogOpen, setAddWildcardDialogOpen] = useState(false)
  const [wildcardEnabled, setWildcardEnabled] = useState(false)
  const [loadingWildcardStatus, setLoadingWildcardStatus] = useState(false)
  const [editingOffering, setEditingOffering] = useState<(JobOffering & { category_name: string; subcategory_name?: string }) | null>(null)
  const [editWildcardDialogOpen, setEditWildcardDialogOpen] = useState(false)

  const getLocalizedCategoryName = (category?: JobCategory | null) => {
    if (!category) return ""
    const categoryFields = category as JobCategory & Record<string, string | null | undefined>
    if (locale === "nl") {
      return categoryFields.name_nl ?? categoryFields.name ?? categoryFields.name_en ?? ""
    }
    return categoryFields.name_en ?? categoryFields.name ?? categoryFields.name_nl ?? ""
  }

  const getLocalizedSubcategoryName = (subcategory?: JobSubcategory | null) => {
    if (!subcategory) return ""
    const subcategoryFields = subcategory as JobSubcategory & Record<string, string | null | undefined>
    if (locale === "nl") {
      return subcategoryFields.name_nl ?? subcategoryFields.name ?? subcategoryFields.name_en ?? ""
    }
    return subcategoryFields.name_en ?? subcategoryFields.name ?? subcategoryFields.name_nl ?? ""
  }

  const getWildcardLabelById = (id: string) => {
    const config = WILDCARD_WORK_TYPES.find((workType) => workType.id === id)
    return config ? t(config.labelKey) : id
  }

  const extractWildcardWorkTypeIds = (description?: string | null) => {
    if (!description) return []
    const [, workTypesPart] = description.split('\n\nWork Types: ')
    if (!workTypesPart) return []
    return workTypesPart
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
  }


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

  const fetchWildcardStatus = async () => {
    setLoadingWildcardStatus(true)
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("wildcard_job_offering_enabled")
        .eq("id", freelancerId)
        .single()

      if (error) {
        console.error("Error fetching wildcard status:", error)
        return
      }

      setWildcardEnabled(data.wildcard_job_offering_enabled || false)
    } catch (error) {
      console.error("Error fetching wildcard status:", error)
    } finally {
      setLoadingWildcardStatus(false)
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
              id, name, name_en, name_nl
            ),
            job_subcategories (
              id, name, name_en, name_nl
            )
          `)
          .eq("freelancer_id", freelancerId)
          .order("display_order", { ascending: true, nullsFirst: false })
          .order("created_at", { ascending: false })

        if (error) throw error

        const formattedOfferings = data.map((offering) => ({
          ...offering,
          category_name: getLocalizedCategoryName(offering.job_categories as JobCategory),
          subcategory_name: getLocalizedSubcategoryName(offering.job_subcategories as JobSubcategory),
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
      fetchWildcardStatus()
    }
  }, [supabase, freelancerId, locale])

  const handleAddWildcardOffering = async () => {
    console.log("🚀 Starting handleAddWildcardOffering...")
    console.log("📊 Current wildcard state:", {
      wildcardWorkTypes,
      wildcardPricingType,
      wildcardHourlyRate,
      wildcardDescription,
      offeringsCount: offerings.length,
      editingOffering: editingOffering?.id,
      freelancerId
    })

    if (wildcardWorkTypes.length === 0) {
      console.log("❌ No work types selected")
      toast.error(t("jobOfferings.wildcardWorkTypesRequired"))
      return
    }

    // If editing, skip the max offerings and duplicate checks
    if (!editingOffering) {
      if (offerings.length >= maxOfferings) {
        console.log("❌ Max offerings reached:", offerings.length, "Max allowed:", maxOfferings)
        toast.error(t("jobOfferings.cardMaxOfferings"))
        return
      }

      // Check if wildcard offering already exists
      const existingWildcardOffering = offerings.find(
        (o) => o.is_wildcard === true
      )

      if (existingWildcardOffering) {
        console.log("❌ Wildcard offering already exists")
        toast.error(t("jobOfferings.wildcardAlreadyExists"))
        setSaving(false)
        return
      }
    }

    setSaving(true)

    try {
      // If editing, update the existing wildcard offering
      if (editingOffering) {
        const updateData = {
          hourly_rate: Number.parseFloat(wildcardHourlyRate) || 45.00,
          description: `${wildcardDescription}\n\nWork Types: ${wildcardWorkTypes.join(', ')}`,
        }

        console.log("📝 Wildcard update data:", updateData)

        const { data, error } = await supabase
          .from("freelancer_job_offerings")
          .update(updateData)
          .eq("id", editingOffering.id)
          .select(`
            *,
            job_categories (
              id, name, name_en, name_nl
            ),
            job_subcategories (
              id, name, name_en, name_nl
            )
          `)
          .single()

        if (error) throw error

        console.log("✅ Successfully updated wildcard offering:", data)

        // Update local state
        const updatedOffering = {
          ...data,
          category_name: getLocalizedCategoryName(data.job_categories as JobCategory) || t("jobOfferings.wildcardOfferings"),
          subcategory_name: getLocalizedSubcategoryName(data.job_subcategories as JobSubcategory),
        }

        setOfferings(offerings.map(o => o.id === editingOffering.id ? updatedOffering : o))

        toast.success(t("jobOfferings.wildcardJobOfferingUpdated"))
        setEditingOffering(null)
        setEditWildcardDialogOpen(false)
        return
      }

      // For wildcard offerings, use the special wildcard category
      const WILDCARD_CATEGORY_ID = '00000000-0000-0000-0000-000000000001'
      
      const insertData = {
        freelancer_id: freelancerId,
        category_id: WILDCARD_CATEGORY_ID, // Use special wildcard category
        subcategory_id: null,
        pricing_type: "hourly", // Always hourly for wildcard
        hourly_rate: Number.parseFloat(wildcardHourlyRate) || 45.00,
        description: `${wildcardDescription}\n\nWork Types: ${wildcardWorkTypes.join(', ')}`,
        experience_years: null, // No experience years for wildcard
        is_available_now: false,
        display_order: offerings.length + 1,
        is_wildcard: true, // Mark as wildcard offering
      }

      console.log("📝 Wildcard insert data:", insertData)

      const { data, error } = await supabase
        .from("freelancer_job_offerings")
        .insert(insertData)
        .select(`
          *,
          job_categories (
            id, name, name_en, name_nl
          ),
          job_subcategories (
            id, name, name_en, name_nl
          )
        `)
        .single()

      console.log("📡 Supabase wildcard response:", { data, error })

      if (error) {
        console.error("❌ Supabase wildcard error details:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          fullError: error
        })
        throw error
      }

      console.log("✅ Successfully inserted wildcard job offering:", data)

      // Add to local state
      const newWildcardOffering = {
        ...data,
        category_name: getLocalizedCategoryName(data.job_categories as JobCategory) || t("jobOfferings.wildcardOfferings"),
        subcategory_name: getLocalizedSubcategoryName(data.job_subcategories as JobSubcategory),
      }
      
      console.log("📝 Adding wildcard to local state:", newWildcardOffering)
      
      setOfferings([
        ...offerings,
        newWildcardOffering,
      ])

      // Reset wildcard form and close modal
      setWildcardWorkTypes([])
      setWildcardPricingType("hourly")
      setWildcardHourlyRate("")
      setWildcardDescription("")
      setAddWildcardDialogOpen(false)

      console.log("🎉 Wildcard job offering added successfully!")

      toast.success(t("jobOfferings.wildcardJobOfferingCreated", {
        workTypes: wildcardWorkTypes.map((id) => getWildcardLabelById(id)).join(', ')
      }))
    } catch (error) {
      console.error("💥 Error adding wildcard job offering - Full error object:", error)
      console.error("💥 Error type:", typeof error)
      console.error("💥 Error constructor:", error?.constructor?.name)
      console.error("💥 Error keys:", error ? Object.keys(error) : 'N/A')
      
      // More specific error handling
      if (error && typeof error === 'object' && 'code' in error) {
        console.log("🔍 Database error detected with code:", error.code)
        if (error.code === '23505') {
          console.log("❌ Unique constraint violation")
          toast.error(t("jobOfferings.duplicateOfferingExists"))
        } else if (error.code === '23503') {
          console.log("❌ Foreign key constraint violation")
          toast.error(t("jobOfferings.invalidCategorySubcategory"))
        } else {
          console.log("❌ Other database error")
          toast.error(t("jobOfferings.databaseError", {
            code: error.code,
            message: (error as any).message || t("jobOfferings.unknownError")
          }))
        }
      } else {
        console.log("❌ Non-database error")
        toast.error(t("jobOfferings.cardAddOfferingError"))
      }
    } finally {
      console.log("🏁 handleAddWildcardOffering completed, setting saving to false")
      setSaving(false)
    }
  }

  const handleAddOffering = async () => {
    console.log("🚀 Starting handleAddOffering...")
    console.log("📊 Current state:", {
      selectedCategoryId,
      selectedSubcategoryId,
      pricingType,
      hourlyRate,
      description,
      experienceYears,
      offeringsCount: offerings.length,
      regularOfferingsCount: regularOfferings.length,
      editingOffering: editingOffering?.id,
      freelancerId
    })

    if (!selectedCategoryId) {
      console.log("❌ No category selected")
      toast.error(t("jobOfferings.cardAddOfferingError"))
      return
    }

    // If editing, skip the max offerings check
    if (!editingOffering) {
      // Regular offerings are limited to MAX_JOB_OFFERINGS (3), regardless of wildcard status
      if (regularOfferings.length >= MAX_JOB_OFFERINGS) {
        console.log("❌ Max regular offerings reached:", regularOfferings.length, "Max allowed:", MAX_JOB_OFFERINGS)
        toast.error(t("jobOfferings.cardMaxOfferings"))
        return
      }
    }

    setSaving(true)

    try {
      // If editing, update the existing offering
      if (editingOffering) {
        const updateData = {
          description: description,
          hourly_rate: pricingType === "hourly" ? Number.parseFloat(hourlyRate) || 45.00 : null,
          experience_years: experienceYears ? Number.parseFloat(experienceYears) : null,
        }

        console.log("📝 Update data:", updateData)

        const { data, error } = await supabase
          .from("freelancer_job_offerings")
          .update(updateData)
          .eq("id", editingOffering.id)
          .select(`
            *,
            job_categories (
              id, name, name_en, name_nl
            ),
            job_subcategories (
              id, name, name_en, name_nl
            )
          `)
          .single()

        if (error) throw error

        console.log("✅ Successfully updated job offering:", data)

        // Update local state
        const updatedOffering = {
          ...data,
          category_name: getLocalizedCategoryName(data.job_categories as JobCategory),
          subcategory_name: getLocalizedSubcategoryName(data.job_subcategories as JobSubcategory),
        }

        setOfferings(offerings.map(o => o.id === editingOffering.id ? updatedOffering : o))

        toast.success(t("jobOfferings.jobOfferingUpdated"))
        setEditingOffering(null)
        setAddOfferingDialogOpen(false)
        return
      }

      // Check if offering already exists for this category and subcategory (only for new offerings)
      const existingOffering = offerings.find(
        (o) =>
          o.category_id === selectedCategoryId &&
          ((!o.subcategory_id && !selectedSubcategoryId) || o.subcategory_id === selectedSubcategoryId),
      )

      console.log("🔍 Checking for existing offering:", {
        existingOffering: existingOffering ? {
          id: existingOffering.id,
          category_id: existingOffering.category_id,
          subcategory_id: existingOffering.subcategory_id
        } : null,
        searchCriteria: {
          category_id: selectedCategoryId,
          subcategory_id: selectedSubcategoryId
        }
      })

      if (existingOffering) {
        console.log("❌ Duplicate offering found in local state")
        toast.error(t("jobOfferings.duplicateOfferingLocal"))
        setSaving(false)
        return
      }

      const insertData = {
          freelancer_id: freelancerId,
          category_id: selectedCategoryId,
          subcategory_id: selectedSubcategoryId,
          pricing_type: pricingType,
          hourly_rate: pricingType === "hourly" ? Number.parseFloat(hourlyRate) || 45.00 : null,
          description: description,
          experience_years: experienceYears ? Number.parseFloat(experienceYears) : null,
          is_available_now: false,
          display_order: offerings.length + 1,
      }

      console.log("📝 Insert data:", insertData)

      const { data, error } = await supabase
        .from("freelancer_job_offerings")
        .insert(insertData)
        .select(`
          *,
          job_categories (
            id, name, name_en, name_nl
          ),
          job_subcategories (
            id, name, name_en, name_nl
          )
        `)
        .single()

      console.log("📡 Supabase response:", { data, error })

      if (error) {
        console.error("❌ Supabase error details:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          fullError: error
        })
        throw error
      }

      console.log("✅ Successfully inserted job offering:", data)

      const localizedCategoryName = getLocalizedCategoryName(data.job_categories as JobCategory)
      const localizedSubcategoryName = getLocalizedSubcategoryName(data.job_subcategories as JobSubcategory)

      // Get freelancer's hourly rate from profile
      console.log("💰 Fetching freelancer hourly rate...")
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("hourly_rate")
        .eq("id", freelancerId)
        .single()

      const freelancerHourlyRate = profile?.hourly_rate || 40 // Default to €40 if not set
      console.log("💰 Using hourly rate:", freelancerHourlyRate)

      // Create default package for the new job offering
      console.log("📦 Creating default package...")
      const defaultPackageData = {
        job_offering_id: data.id,
        package_name: t("jobOfferings.defaultPackageName", { categoryName: localizedCategoryName || data.job_categories.name }),
        short_description: t("jobOfferings.defaultPackageDescription"),
        price: 0, // Default to 0 - calculated from package items
        display_order: 1,
        is_active: true,
      }

      const { data: defaultPackage, error: packageError } = await supabase
        .from("job_offering_packages")
        .insert(defaultPackageData)
        .select()
        .single()

      if (packageError) {
        console.error("❌ Error creating default package:", packageError)
        // Don't throw error, just log it - job offering was created successfully
        toast.error(t("jobOfferings.defaultPackageCreationFailed"))
      } else {
        console.log("✅ Default package created:", defaultPackage)

        // Create default package item
        console.log("📋 Creating default package item...")
        const defaultItemData = {
          package_id: defaultPackage.id,
          type: "labour",
          offering: t("jobOfferings.defaultItemOffering"),
          price_per_unit: freelancerHourlyRate,
          unit_type: "hours",
          display_order: 1,
        }

        const { data: defaultItem, error: itemError } = await supabase
          .from("job_offering_package_items")
          .insert(defaultItemData)
          .select()
          .single()

        if (itemError) {
          console.error("❌ Error creating default package item:", itemError)
          // Don't throw error, package was created successfully
        } else {
          console.log("✅ Default package item created:", defaultItem)
        }
      }

      // Add to local state
      const newOffering = {
          ...data,
          category_name: localizedCategoryName,
          subcategory_name: localizedSubcategoryName,
      }
      
      console.log("📝 Adding to local state:", newOffering)
      
      setOfferings([
        ...offerings,
        newOffering,
      ])

      // Reset form and close modal
      setSelectedCategoryId(null)
      setSelectedSubcategoryId(null)
      setPricingType("packages")
      setHourlyRate("")
      setDescription("")
      setExperienceYears("")
      setAddOfferingDialogOpen(false)

      console.log("🎉 Job offering added successfully!")

      // Auto-open packages modal for the new offering
      
      // Small delay to ensure the add offering modal closes first
      setTimeout(() => {
        setSelectedOfferingForPackages(newOffering)
        setPackagesDialogOpen(true)
      }, 300)

      toast.success(t("jobOfferings.jobOfferingCreated", {
        categoryName: data.job_categories.name,
        subcategoryName: data.job_subcategories?.name ? ` - ${data.job_subcategories.name}` : ""
      }))
    } catch (error) {
      console.error("💥 Error adding job offering - Full error object:", error)
      console.error("💥 Error type:", typeof error)
      console.error("💥 Error constructor:", error?.constructor?.name)
      console.error("💥 Error keys:", error ? Object.keys(error) : 'N/A')
      
      // More specific error handling
      if (error && typeof error === 'object' && 'code' in error) {
        console.log("🔍 Database error detected with code:", error.code)
        if (error.code === '23505') {
          console.log("❌ Unique constraint violation")
          toast.error(t("jobOfferings.duplicateOfferingExists"))
        } else if (error.code === '23503') {
          console.log("❌ Foreign key constraint violation")
          toast.error(t("jobOfferings.invalidCategorySubcategory"))
        } else {
          console.log("❌ Other database error")
          toast.error(t("jobOfferings.databaseError", {
            code: error.code,
            message: (error as any).message || t("jobOfferings.unknownError")
          }))
        }
      } else {
        console.log("❌ Non-database error")
      toast.error(t("jobOfferings.cardAddOfferingError"))
      }
    } finally {
      console.log("🏁 handleAddOffering completed, setting saving to false")
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

        toast.success(t("jobOfferings.orderUpdated"))
      } catch (error) {
        console.error("Error updating job offerings order:", error)
        toast.error(t("jobOfferings.orderUpdateError"))
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

  const openAddOfferingDialog = () => {
    setAddOfferingDialogOpen(true)
  }

  const closeAddOfferingDialog = () => {
    setAddOfferingDialogOpen(false)
    // Reset form when closing
    setSelectedCategoryId(null)
    setSelectedSubcategoryId(null)
    setPricingType("packages")
    setHourlyRate("")
    setDescription("")
    setExperienceYears("")
    setEditingOffering(null)
  }

  const openAddWildcardDialog = () => {
    setAddWildcardDialogOpen(true)
  }

  const closeAddWildcardDialog = () => {
    setAddWildcardDialogOpen(false)
    // Reset wildcard form when closing
    setWildcardWorkTypes([])
    setWildcardPricingType("hourly")
    setWildcardHourlyRate("")
    setWildcardDescription("")
  }

  const handleToggleWildcard = async (enabled: boolean) => {
    try {
      setLoadingWildcardStatus(true)
      
      const { error } = await supabase
        .from("profiles")
        .update({ wildcard_job_offering_enabled: enabled })
        .eq("id", freelancerId)

      if (error) {
        console.error("Error updating wildcard status:", error)
        toast.error(t("jobOfferings.wildcardToggleError"))
        return
      }

      setWildcardEnabled(enabled)
      toast.success(enabled ? t("jobOfferings.wildcardEnabled") : t("jobOfferings.wildcardDisabled"))
    } catch (error) {
      console.error("Error toggling wildcard:", error)
      toast.error(t("jobOfferings.wildcardToggleError"))
    } finally {
      setLoadingWildcardStatus(false)
    }
  }

  // Reset subcategory when category changes
  useEffect(() => {
    setSelectedSubcategoryId(null)
  }, [selectedCategoryId])

  // Separate regular and wildcard offerings
  const regularOfferings = offerings.filter(offering => !offering.is_wildcard)
  const wildcardOfferings = offerings.filter(offering => offering.is_wildcard)
  
  const maxOfferings = wildcardEnabled ? MAX_WILDCARD_OFFERINGS : MAX_JOB_OFFERINGS
  const hasReachedMaxRegularOfferings = regularOfferings.length >= MAX_JOB_OFFERINGS
  const hasReachedMaxOfferings = offerings.length >= maxOfferings
  
  // Check if there are any wildcard offerings in the database (regardless of wildcard enabled status)
  const hasWildcardOfferings = offerings.some(offering => offering.is_wildcard)

  return (
    <div className="space-y-6">
      <div className="bg-background rounded-lg overflow-hidden">
      <div className="p-6">
      <h2 className="text-lg font-semibold mb-1">{t("jobOfferings.cardTitle")}</h2>
          <p className="text-xs text-black">{t("jobOfferings.cardDescription")}</p>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center w-full">
              <Loader className="h-8 w-8 animate-spin" />
            </div>
          ) : regularOfferings.length === 0 ? (
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
                      <TableHead>{t("jobOfferings.pricing")}</TableHead>
                      <TableHead>{t("jobOfferings.experienceYears")}</TableHead>
                      <TableHead>{t("jobOfferings.dbaStatus")}</TableHead>
                      <TableHead className="text-right">{t("jobOfferings.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <SortableContext
                    items={regularOfferings.map(offering => offering.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <TableBody>
                      {regularOfferings.map((offering) => {
                        return (
                          <SortableTableRow
                            key={offering.id}
                            offering={offering}
                            onDelete={handleDeleteOffering}
                            onEdit={(offering) => {
                              setEditingOffering(offering)
                              setSelectedCategoryId(offering.category_id)
                              setSelectedSubcategoryId(offering.subcategory_id)
                              setPricingType(offering.pricing_type)
                              setHourlyRate(offering.hourly_rate?.toString() || "")
                              setDescription(offering.description || "")
                              setExperienceYears(offering.experience_years?.toString() || "")
                              setAddOfferingDialogOpen(true)
                            }}
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
              
              {/* <div className="mt-[20px]">
                <Link href="/profile/availability">
                  <Button>
                    <Briefcase className="h-4 w-4 mr-2" />
                    {t("jobOfferings.cardSetupAvailability")}
                  </Button>
                </Link>
              </div> */}
              </div>
          )}
            </div>
      </div>

      {/* Wildcard Job Offerings Table */}
      {wildcardEnabled && wildcardOfferings.length > 0 && (
        <div className="bg-background rounded-lg overflow-hidden border border-orange-200">
          <div className="p-6 bg-orange-50 border-b border-orange-200">
            <h3 className="text-lg font-semibold text-orange-800 flex items-center gap-2">
              <span className="text-orange-600">🎯</span>
              {t("jobOfferings.wildcardOfferings")}
            </h3>
            <p className="text-sm text-orange-700 mt-1">{t("jobOfferings.wildcardOfferingsDescription")}</p>
          </div>
          <div className="p-6">
            <Table>
              <TableHeader>
                <TableRow className="text-xs text-black">
                  <TableHead>{t("jobOfferings.workTypes")}</TableHead>
                  <TableHead>{t("jobOfferings.pricing")}</TableHead>
                  <TableHead>{t("jobOfferings.workTypesCount")}</TableHead>
                  <TableHead className="text-right">{t("jobOfferings.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {wildcardOfferings.map((offering) => {
                  const workTypeIds = extractWildcardWorkTypeIds(offering.description)
                  return (
                    <TableRow key={offering.id} className="text-xs text-black">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span className="text-orange-600">🎯</span>
                        <div className="flex flex-wrap gap-1">
                          {workTypeIds.map((workTypeId) => (
                            <span key={workTypeId} className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                              {getWildcardLabelById(workTypeId)}
                            </span>
                          ))}
        </div>
      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium text-green-600">
                          €{offering.hourly_rate}/hour
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs text-orange-600">
                        {t("jobOfferings.workTypesCountLabel", { count: workTypeIds.length })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end items-center">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => {
                            setEditingOffering(offering)
                            setWildcardWorkTypes(extractWildcardWorkTypeIds(offering.description))
                            setWildcardHourlyRate(offering.hourly_rate?.toString() || "")
                            setWildcardDescription(offering.description?.split('\n\nWork Types: ')[0] || "")
                            setEditWildcardDialogOpen(true)
                          }}
                          className="text-blue-600 hover:bg-blue-50"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDeleteOffering(offering.id)}
                          className="text-orange-600 hover:bg-orange-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Wildcard Job Offering Toggle */}
        <div className="bg-background rounded-lg overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-black">{t("jobOfferings.wildcardTitle")}</h3>
              <p className="text-xs text-gray-600">{t("jobOfferings.wildcardDescription")}</p>
              <p className="text-xs text-gray-500">
                {t("jobOfferings.wildcardLimit", { 
                  normal: MAX_JOB_OFFERINGS, 
                  wildcard: MAX_WILDCARD_OFFERINGS 
                })}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {loadingWildcardStatus ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Switch
                  checked={wildcardEnabled}
                  onCheckedChange={handleToggleWildcard}
                  disabled={loadingWildcardStatus}
                />
              )}
            </div>
          </div>
          {hasWildcardOfferings && !wildcardEnabled && (
            <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-md">
              <p className="text-xs text-orange-800">
                {t("jobOfferings.wildcardHidden")}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add Job Offering Buttons */}
      <div className="bg-background rounded-lg overflow-hidden">
        <div className="p-6">
          {hasReachedMaxOfferings ? (
            <div className="flex gap-2">
            <AlertCircle className="h-4 w-4" />
            <div>
            <AlertTitle className="text-sm text-black">{t("jobOfferings.cardMaxOfferings")}</AlertTitle>
            <AlertDescription className="text-xs text-black">
                  {t("jobOfferings.cardMaxOfferingsDescription", { 
                    maxOfferings: maxOfferings,
                    wildcardEnabled: wildcardEnabled ? 
                      (t("common.language") === "nl" ? " (inclusief wildcard)" : " (including wildcard)") : ""
                  })}
            </AlertDescription>
          </div>
        </div>
      ) : (
            <div className="space-y-3">
              {/* Regular Job Offering Button */}
              <Button 
                onClick={openAddOfferingDialog}
                className="w-full"
                disabled={hasReachedMaxRegularOfferings}
              >
                <Plus className="mr-2 h-4 w-4" />
                {t("jobOfferings.cardAddNewOffering")}
              </Button>
              
              {/* Wildcard Job Offering Button - Only show if wildcard is enabled and no wildcard exists */}
              {wildcardEnabled && !hasWildcardOfferings && (
                <Button 
                  onClick={openAddWildcardDialog}
                  variant="outline"
                  className="w-full border-orange-200 text-orange-700 hover:bg-orange-50"
                  disabled={hasReachedMaxOfferings}
                >
                  <Package className="mr-2 h-4 w-4" />
                  {t("jobOfferings.cardAddWildcardOffering")}
                </Button>
              )}
          </div>
          )}
        </div>
      </div>

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
              {t("jobOfferings.dbaAssessmentTitle", { categoryName: selectedDbaCategoryName })}
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
              {t("jobOfferings.manageServicePackages")}
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
              {t("jobOfferings.managePackageItems")}
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

      {/* Add/Edit Job Offering Dialog */}
      <Dialog open={addOfferingDialogOpen} onOpenChange={closeAddOfferingDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingOffering ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              {editingOffering ? t("jobOfferings.editJobOffering") : t("jobOfferings.cardAddNewOffering")}
            </DialogTitle>
            <DialogDescription>
              {t("jobOfferings.addJobOfferingDescription")}
            </DialogDescription>
          </DialogHeader>
            <div className="space-y-4">
              {!editingOffering && (
                <>
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
                </>
              )}
              
              {editingOffering && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium text-blue-800">
                    {t("jobOfferings.editingOffering")}: {editingOffering.category_name}
                    {editingOffering.subcategory_name && ` - ${editingOffering.subcategory_name}`}
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    {t("jobOfferings.cannotChangeCategory")}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-xs text-black">{t("jobOfferings.pricingType")}</Label>
                <RadioGroup 
                  value={pricingType} 
                onValueChange={(value: 
                 // "hourly" | 
                  "packages") => setPricingType(value)}
                  className="flex gap-6"
                  disabled={!!editingOffering}
                >
                {/* <div className="flex items-center space-x-2 opacity-50 cursor-not-allowed">
                  <RadioGroupItem value="hourly" id="hourly" disabled />
                  <Label htmlFor="hourly" className="text-xs text-gray-400 cursor-not-allowed">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                      {t("jobOfferings.fixedHourlyRate")} ({t("jobOfferings.comingSoon")})
                      </div>
                    </Label>
                </div> */}
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="packages" id="packages" />
                    <Label htmlFor="packages" className="text-xs text-black cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        {t("jobOfferings.multiplePackages")}
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {pricingType === "hourly" && (
                <div className="space-y-2">
                  <Label htmlFor="hourlyRate" className="text-xs text-black">{t("jobOfferings.cardHourlyRate")}</Label>
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
                  <p className="font-medium mb-1">💡 {t("jobOfferings.packagePricing")}</p>
                  <p>{t("jobOfferings.packagePricingDescription")}</p>
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
                  placeholder={t("jobOfferings.descriptionPlaceholder")}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="rounded-lg text-xs border-brand-green focus-visible:border-none focus-visible:ring-0 focus-visible:ring-brand-green focus-visible:outline-none"
                />
                
                {/* Live Preview */}
                {description && (
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-600">{t("jobOfferings.previewAsShownToClients")}</Label>
                    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-36">
                      <div className="flex flex-col gap-1">
                        <div className="text-xs cursor-help flex flex-col items-start justify-start rounded-md border transition-colors h-full bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200">
                          <div className="flex flex-col items-start justify-start gap-1 p-1 w-full h-full">
                            <span className="font-bold">
                              {selectedSubcategoryId ? t("jobOfferings.sampleSubcategory") : t("jobOfferings.sampleCategory")}
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
                                  {t("jobOfferings.multiplePackages")}
                                </span>
                              )}
                              {experienceYears && (
                                <span className="text-xs">
                                  {experienceYears} {experienceYears === "1" ? "year" : "years"} {t("jobOfferings.yearsExperience")}
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
                        ⚠️ {t("jobOfferings.textWillBeTruncated")}
                      </div>
                    )}
                  </div>
                )}
              </div>

            <div className="flex gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={closeAddOfferingDialog}
                className="flex-1"
              >
                {t("common.cancel")}
              </Button>
              <Button 
                onClick={handleAddOffering} 
                disabled={saving} 
                className="flex-1"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {editingOffering ? t("jobOfferings.updating") : t("jobOfferings.cardAdding")}
                  </>
                ) : (
                  <>
                    {editingOffering ? <Edit className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                    {editingOffering ? t("jobOfferings.updateJobOffering") : t("jobOfferings.cardAddJobOffering")}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Wildcard Job Offering Dialog */}
      <Dialog open={addWildcardDialogOpen || editWildcardDialogOpen} onOpenChange={(open) => {
        if (!open) {
          closeAddWildcardDialog()
          setEditingOffering(null)
          setEditWildcardDialogOpen(false)
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingOffering ? <Edit className="h-5 w-5 text-orange-600" /> : <Package className="h-5 w-5 text-orange-600" />}
              {editingOffering ? t("jobOfferings.editWildcardOffering") : t("jobOfferings.cardAddWildcardOffering")}
            </DialogTitle>
            <DialogDescription>
              {t("jobOfferings.addWildcardJobOfferingDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-3">
              <Label className="text-xs text-black font-medium">{t("jobOfferings.wildcardWorkTypes")}</Label>
              <p className="text-xs text-gray-600">{t("jobOfferings.wildcardWorkTypesDescription")}</p>
              <div className="grid grid-cols-1 gap-3">
                {WILDCARD_WORK_TYPES.map((workType) => (
                  <div key={workType.id} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <input
                      type="checkbox"
                      id={`wildcard-work-${workType.id}`}
                      checked={wildcardWorkTypes.includes(workType.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setWildcardWorkTypes([...wildcardWorkTypes, workType.id])
                        } else {
                          setWildcardWorkTypes(wildcardWorkTypes.filter(id => id !== workType.id))
                        }
                      }}
                      className="mt-1 h-4 w-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <div className="flex-1">
                      <label htmlFor={`wildcard-work-${workType.id}`} className="text-sm font-medium text-gray-900 cursor-pointer">
                        {t(workType.labelKey)}
                      </label>
                      <p className="text-xs text-gray-600 mt-1">{t(workType.descriptionKey)}</p>
                    </div>
                  </div>
                ))}
              </div>
              {wildcardWorkTypes.length === 0 && (
                <p className="text-xs text-red-600">{t("jobOfferings.wildcardWorkTypesRequired")}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="wildcardHourlyRate" className="text-xs text-black">{t("jobOfferings.cardHourlyRate")}</Label>
              <Input
                id="wildcardHourlyRate"
                type="number"
                min="0"
                step="0.01"
                placeholder="45.00"
                value={wildcardHourlyRate}
                onChange={(e) => setWildcardHourlyRate(e.target.value)}
                className="rounded-lg text-xs border-brand-green focus-visible:border-none focus-visible:ring-0 focus-visible:ring-brand-green focus-visible:outline-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="wildcard-description" className="text-xs text-black">{t("jobOfferings.cardDescription")}</Label>
              <Textarea
                id="wildcard-description"
                placeholder={t("jobOfferings.wildcardDescriptionPlaceholder")}
                value={wildcardDescription}
                onChange={(e) => setWildcardDescription(e.target.value)}
                rows={3}
                className="rounded-lg text-xs border-brand-green focus-visible:border-none focus-visible:ring-0 focus-visible:ring-brand-green focus-visible:outline-none"
              />
              
              {/* Live Preview */}
              {wildcardDescription && (
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">{t("jobOfferings.previewAsShownToClients")}</Label>
                  <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-36">
                    <div className="flex flex-col gap-1">
                      <div className="text-xs cursor-help flex flex-col items-start justify-start rounded-md border transition-colors h-full bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200">
                        <div className="flex flex-col items-start justify-start gap-1 p-1 w-full h-full">
                          <span className="font-bold">
                            Wildcard Services
                            <span className="ml-1 text-orange-600">🎯</span>
                          </span>
                          
                          {/* Work Types */}
                          {wildcardWorkTypes.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {wildcardWorkTypes.map((workTypeId) => {
                                return (
                                  <span key={workTypeId} className="text-xs bg-orange-200 text-orange-800 px-1 rounded">
                                    {getWildcardLabelById(workTypeId)}
                                  </span>
                                )
                              })}
                            </div>
                          )}
                          
                          {/* Pricing */}
                          <div className="flex gap-4 mt-1">
                            {wildcardHourlyRate && (
                              <span className="text-xs font-semibold text-green-600">
                                €{wildcardHourlyRate}/hour
                              </span>
                            )}
                          </div>
                          
                          {/* Description - This is what gets truncated */}
                          <div className="flex items-center gap-1 mt-1">
                            <div className="line-clamp-2 text-xs">
                              {wildcardDescription}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {wildcardDescription.length > 80 && (
                    <div className="text-xs text-orange-600">
                      ⚠️ {t("jobOfferings.textWillBeTruncated")}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={closeAddWildcardDialog}
                className="flex-1"
              >
                {t("common.cancel")}
              </Button>
              <Button 
                onClick={handleAddWildcardOffering} 
                disabled={saving} 
                className="flex-1 bg-orange-600 hover:bg-orange-700"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {editingOffering ? t("jobOfferings.updating") : t("jobOfferings.cardAdding")}
                  </>
                ) : (
                  <>
                    {editingOffering ? <Edit className="mr-2 h-4 w-4" /> : <Package className="mr-2 h-4 w-4" />}
                    {editingOffering ? t("jobOfferings.updateWildcardOffering") : t("jobOfferings.cardAddWildcardOffering")}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}

