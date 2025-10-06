"use client"

import { useState, useEffect } from "react"
import { useOptimizedSupabase } from "@/components/optimized-supabase-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/lib/toast"
import { 
  Loader2, 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  X, 
  GripVertical,
  Package,
  Calculator
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import type { Database } from "@/lib/database.types"

type JobOfferingPackage = Database["public"]["Tables"]["job_offering_packages"]["Row"]
type JobOfferingPackageItem = Database["public"]["Tables"]["job_offering_package_items"]["Row"]
type UnitType = Database["public"]["Tables"]["unit_types"]["Row"]

interface JobOfferingPackagesManagerV2Props {
  jobOfferingId: string
  categoryName: string
  onPackagesChange?: () => void
  onManageItems?: (packageId: string, packageName: string) => void
  refreshTrigger?: number
}

// Sortable package row component
function SortablePackageRow({ 
  package: pkg, 
  onEdit,
  onDelete,
  onToggleActive,
  onManageItems,
  t
}: { 
  package: JobOfferingPackage & { 
    items?: JobOfferingPackageItem[]
    calculated_total?: number
  }
  onEdit: (pkg: JobOfferingPackage) => void
  onDelete: (id: string) => void
  onToggleActive: (id: string, isActive: boolean) => void
  onManageItems: (pkg: JobOfferingPackage) => void
  t: (key: string) => string
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: pkg.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const itemCount = pkg.items?.length || 0
  const totalPrice = pkg.calculated_total || pkg.price

  return (
    <TableRow 
      ref={setNodeRef} 
      style={style} 
      className={`text-xs ${!pkg.is_active ? 'opacity-50' : ''}`}
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
          <div>
            <div className="font-medium">{pkg.package_name}</div>
            {pkg.short_description && (
              <div className="text-xs text-gray-500 mt-1">{pkg.short_description}</div>
            )}
            <div className="text-xs text-blue-600 mt-1">
              {itemCount} item{itemCount !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell className="font-semibold text-green-600">
        <div className="flex flex-col">
          {totalPrice > 0 ? (
            <>
              <span>€{totalPrice}</span>
              {pkg.calculated_total && pkg.calculated_total !== pkg.price && pkg.price > 0 && (
                <span className="text-xs text-gray-500 line-through">€{pkg.price}</span>
              )}
            </>
          ) : (
            <span className="text-gray-400 text-sm">{t("packages.addItemsToSetPrice")}</span>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${pkg.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
          <span className="text-xs">{pkg.is_active ? t("packages.active") : t("packages.inactive")}</span>
        </div>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex gap-2 justify-end items-center">
          <Button 
            variant="outline"
            size="sm" 
            onClick={() => onManageItems(pkg)}
          >
            <Calculator className="h-4 w-4 mr-1" />
            {t("packages.items")}
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onEdit(pkg)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onToggleActive(pkg.id, !pkg.is_active)}
          >
            {pkg.is_active ? t("packages.deactivate") : t("packages.activate")}
          </Button>

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onDelete(pkg.id)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

export default function JobOfferingPackagesManagerV2({ 
  jobOfferingId, 
  categoryName,
  onPackagesChange,
  onManageItems,
  refreshTrigger
}: JobOfferingPackagesManagerV2Props) {
  const { t } = useTranslation()
  const { supabase } = useOptimizedSupabase()
  const [packages, setPackages] = useState<(JobOfferingPackage & { 
    items?: JobOfferingPackageItem[]
    calculated_total?: number
  })[]>([])
  const [unitTypes, setUnitTypes] = useState<UnitType[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [itemsDialogOpen, setItemsDialogOpen] = useState(false)
  const [editingPackage, setEditingPackage] = useState<JobOfferingPackage | null>(null)
  const [selectedPackage, setSelectedPackage] = useState<JobOfferingPackage | null>(null)
  
  // Form state
  const [packageName, setPackageName] = useState("")
  const [shortDescription, setShortDescription] = useState("")
  const [price, setPrice] = useState("0") // Default to 0, hidden from user

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Fetch packages with items and unit types
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Fetch packages with items
        const { data: packagesData, error: packagesError } = await supabase
          .from("job_offering_packages")
          .select(`
            *,
            job_offering_package_items (*)
          `)
          .eq("job_offering_id", jobOfferingId)
          .order("display_order", { ascending: true })

        if (packagesError) throw packagesError

        // Fetch unit types
        const { data: unitTypesData, error: unitTypesError } = await supabase
          .from("unit_types")
          .select("*")
          .order("name", { ascending: true })

        if (unitTypesError) throw unitTypesError

        // Calculate totals for each package
        const packagesWithTotals = packagesData?.map(pkg => {
          const items = pkg.job_offering_package_items || []
          const calculatedTotal = items.reduce((sum: number, item: JobOfferingPackageItem) => sum + item.price_per_unit, 0)
          return {
            ...pkg,
            items,
            calculated_total: calculatedTotal
          }
        }) || []

        setPackages(packagesWithTotals)
        setUnitTypes(unitTypesData || [])
      } catch (error) {
        console.error("Error fetching data:", error)
        toast.error(t("packages.failedToLoadPackages"))
      } finally {
        setLoading(false)
      }
    }

    if (jobOfferingId) {
      fetchData()
    }
  }, [supabase, jobOfferingId])

  // Separate effect for refresh trigger
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      const refreshData = async () => {
        try {
          const { data: packagesData, error: packagesError } = await supabase
            .from("job_offering_packages")
            .select(`
              *,
              job_offering_package_items (*)
            `)
            .eq("job_offering_id", jobOfferingId)
            .order("display_order", { ascending: true })

          if (packagesError) throw packagesError

          const packagesWithTotals = packagesData?.map(pkg => {
            const items = pkg.job_offering_package_items || []
            const calculatedTotal = items.reduce((sum: number, item: JobOfferingPackageItem) => sum + item.price_per_unit, 0)
            return {
              ...pkg,
              items,
              calculated_total: calculatedTotal
            }
          }) || []

          setPackages(packagesWithTotals)
        } catch (error) {
          console.error("Error refreshing packages:", error)
        }
      }

      refreshData()
    }
  }, [refreshTrigger, supabase, jobOfferingId])

  const resetForm = () => {
    setPackageName("")
    setShortDescription("")
    setPrice("0") // Always reset to 0
    setEditingPackage(null)
  }

  const openEditDialog = (pkg?: JobOfferingPackage) => {
    if (pkg) {
      setEditingPackage(pkg)
      setPackageName(pkg.package_name)
      setShortDescription(pkg.short_description || "")
      setPrice(pkg.price.toString())
    } else {
      resetForm()
    }
    setEditDialogOpen(true)
  }

  const openItemsDialog = (pkg: JobOfferingPackage) => {
    if (onManageItems) {
      onManageItems(pkg.id, pkg.package_name)
    } else {
      setSelectedPackage(pkg)
      setItemsDialogOpen(true)
    }
  }

  const handleSavePackage = async () => {
    if (!packageName.trim()) {
      toast.error(t("packages.packageNameRequired"))
      return
    }

    setSaving(true)
    try {
      const packageData = {
        job_offering_id: jobOfferingId,
        package_name: packageName.trim(),
        short_description: shortDescription.trim() || null,
        price: 0, // Always 0 - calculated from package items
        display_order: editingPackage ? editingPackage.display_order : packages.length + 1,
        is_active: editingPackage ? editingPackage.is_active : true,
      }

      if (editingPackage) {
        // Update existing package
        const { error } = await supabase
          .from("job_offering_packages")
          .update(packageData)
          .eq("id", editingPackage.id)

        if (error) throw error

        setPackages(packages.map(pkg => 
          pkg.id === editingPackage.id ? { ...pkg, ...packageData } : pkg
        ))
        toast.success(t("packages.packageUpdatedSuccessfully"))
      } else {
        // Create new package
        const { data, error } = await supabase
          .from("job_offering_packages")
          .insert(packageData)
          .select()
          .single()

        if (error) throw error

        setPackages([...packages, { ...data, items: [], calculated_total: data.price }])
        toast.success(t("packages.packageCreatedSuccessfully"))
      }

      setEditDialogOpen(false)
      resetForm()
      onPackagesChange?.()
    } catch (error) {
      console.error("Error saving package:", error)
      toast.error(t("packages.failedToSavePackage"))
    } finally {
      setSaving(false)
    }
  }

  const handleDeletePackage = async (packageId: string) => {
    if (!confirm(t("packages.confirmDelete"))) return

    try {
      const { error } = await supabase
        .from("job_offering_packages")
        .delete()
        .eq("id", packageId)

      if (error) throw error

      setPackages(packages.filter(pkg => pkg.id !== packageId))
      toast.success(t("packages.packageDeletedSuccessfully"))
      onPackagesChange?.()
    } catch (error) {
      console.error("Error deleting package:", error)
      toast.error(t("packages.failedToDeletePackage"))
    }
  }

  const handleToggleActive = async (packageId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("job_offering_packages")
        .update({ is_active: isActive })
        .eq("id", packageId)

      if (error) throw error

      setPackages(packages.map(pkg => 
        pkg.id === packageId ? { ...pkg, is_active: isActive } : pkg
      ))
      toast.success(isActive ? t("packages.packageActivatedSuccessfully") : t("packages.packageDeactivatedSuccessfully"))
      onPackagesChange?.()
    } catch (error) {
      console.error("Error toggling package status:", error)
      toast.error(t("packages.failedToUpdatePackageStatus"))
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      const oldIndex = packages.findIndex((pkg) => pkg.id === active.id)
      const newIndex = packages.findIndex((pkg) => pkg.id === over?.id)

      const newPackages = arrayMove(packages, oldIndex, newIndex)
      setPackages(newPackages)

      // Update display order in database
      try {
        for (let i = 0; i < newPackages.length; i++) {
          const { error } = await supabase
            .from("job_offering_packages")
            .update({ display_order: i + 1 })
            .eq("id", newPackages[i].id)

          if (error) throw error
        }

        toast.success(t("packages.packageOrderUpdated"))
        onPackagesChange?.()
      } catch (error) {
        console.error("Error updating package order:", error)
        toast.error(t("packages.failedToUpdatePackageOrder"))
      }
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{t("packages.title")} - {categoryName}</h3>
          <p className="text-sm text-gray-600">{t("packages.subtitle")}</p>
        </div>
        <Button onClick={() => openEditDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          {t("packages.addPackage")}
        </Button>
      </div>

      {packages.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t("packages.noPackagesYet")}</h3>
            <p className="text-gray-600 mb-4">{t("packages.createFirstPackageDescription")}</p>
            <Button onClick={() => openEditDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              {t("packages.createFirstPackage")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("packages.packageName")}</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>{t("packages.status")}</TableHead>
                    <TableHead className="text-right">{t("packages.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <SortableContext
                  items={packages.map(pkg => pkg.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <TableBody>
                    {packages.map((pkg) => (
                      <SortablePackageRow
                        key={pkg.id}
                        package={pkg}
                        onEdit={openEditDialog}
                        onDelete={handleDeletePackage}
                        onToggleActive={handleToggleActive}
                        onManageItems={openItemsDialog}
                        t={t}
                      />
                    ))}
                  </TableBody>
                </SortableContext>
              </Table>
            </DndContext>
          </CardContent>
        </Card>
      )}

      {/* Edit Package Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingPackage ? t("packages.editPackage") : t("packages.createNewPackage")}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="packageName">{t("packages.packageNameRequired")}</Label>
              <Input
                id="packageName"
                placeholder={t("packages.packageNamePlaceholder")}
                value={packageName}
                onChange={(e) => setPackageName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shortDescription">{t("packages.shortDescription")}</Label>
              <Textarea
                id="shortDescription"
                placeholder={t("packages.shortDescriptionPlaceholder")}
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                rows={3}
              />
            </div>

            {/* Price field hidden - calculated from package items */}
            <input
              type="hidden"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />

            <div className="flex gap-2 justify-end">
              <Button 
                variant="outline" 
                onClick={() => setEditDialogOpen(false)}
              >
                {t("packages.cancel")}
              </Button>
              <Button onClick={handleSavePackage} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t("packages.saving")}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {editingPackage ? t("packages.update") : t("packages.create")}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Package Items Dialog - This will be implemented next */}
      <Dialog open={itemsDialogOpen} onOpenChange={setItemsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              {t("packages.packageItems")} - {selectedPackage?.package_name}
            </DialogTitle>
          </DialogHeader>
          {selectedPackage && (
            <div className="p-4 text-center text-gray-500">
              <p>{t("packages.packageItemsDescription")}</p>
              <p className="text-sm">{t("packages.packageItemsDescription2", { packageName: selectedPackage.package_name })}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
