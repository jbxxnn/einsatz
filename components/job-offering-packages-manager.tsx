"use client"

import { useState, useEffect } from "react"
import { useOptimizedSupabase } from "@/components/optimized-supabase-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/lib/toast"
import { 
  Loader2, 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  X, 
  GripVertical,
  Package
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

interface JobOfferingPackagesManagerProps {
  jobOfferingId: string
  categoryName: string
  onPackagesChange?: () => void
}

// Sortable package row component
function SortablePackageRow({ 
  package: pkg, 
  onEdit,
  onDelete,
  onToggleActive
}: { 
  package: JobOfferingPackage
  onEdit: (pkg: JobOfferingPackage) => void
  onDelete: (id: string) => void
  onToggleActive: (id: string, isActive: boolean) => void
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
          </div>
        </div>
      </TableCell>
      <TableCell className="font-semibold text-green-600">
        €{pkg.price}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${pkg.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
          <span className="text-xs">{pkg.is_active ? 'Active' : 'Inactive'}</span>
        </div>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex gap-2 justify-end items-center">
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
            {pkg.is_active ? 'Deactivate' : 'Activate'}
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

export default function JobOfferingPackagesManager({ 
  jobOfferingId, 
  categoryName,
  onPackagesChange 
}: JobOfferingPackagesManagerProps) {
  const { t } = useTranslation()
  const { supabase } = useOptimizedSupabase()
  const [packages, setPackages] = useState<JobOfferingPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingPackage, setEditingPackage] = useState<JobOfferingPackage | null>(null)
  
  // Form state
  const [packageName, setPackageName] = useState("")
  const [shortDescription, setShortDescription] = useState("")
  const [price, setPrice] = useState("")

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Fetch packages
  useEffect(() => {
    const fetchPackages = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from("job_offering_packages")
          .select("*")
          .eq("job_offering_id", jobOfferingId)
          .order("display_order", { ascending: true })

        if (error) throw error
        setPackages(data || [])
      } catch (error) {
        console.error("Error fetching packages:", error)
        toast.error("Failed to load packages")
      } finally {
        setLoading(false)
      }
    }

    if (jobOfferingId) {
      fetchPackages()
    }
  }, [supabase, jobOfferingId])

  const resetForm = () => {
    setPackageName("")
    setShortDescription("")
    setPrice("")
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

  const handleSavePackage = async () => {
    if (!packageName.trim() || !price.trim()) {
      toast.error("Package name and price are required")
      return
    }

    setSaving(true)
    try {
      const packageData = {
        job_offering_id: jobOfferingId,
        package_name: packageName.trim(),
        short_description: shortDescription.trim() || null,
        price: parseFloat(price),
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
        toast.success("Package updated successfully")
      } else {
        // Create new package
        const { data, error } = await supabase
          .from("job_offering_packages")
          .insert(packageData)
          .select()
          .single()

        if (error) throw error

        setPackages([...packages, data])
        toast.success("Package created successfully")
      }

      setEditDialogOpen(false)
      resetForm()
      onPackagesChange?.()
    } catch (error) {
      console.error("Error saving package:", error)
      toast.error("Failed to save package")
    } finally {
      setSaving(false)
    }
  }

  const handleDeletePackage = async (packageId: string) => {
    if (!confirm("Are you sure you want to delete this package?")) return

    try {
      const { error } = await supabase
        .from("job_offering_packages")
        .delete()
        .eq("id", packageId)

      if (error) throw error

      setPackages(packages.filter(pkg => pkg.id !== packageId))
      toast.success("Package deleted successfully")
      onPackagesChange?.()
    } catch (error) {
      console.error("Error deleting package:", error)
      toast.error("Failed to delete package")
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
      toast.success(`Package ${isActive ? 'activated' : 'deactivated'} successfully`)
      onPackagesChange?.()
    } catch (error) {
      console.error("Error toggling package status:", error)
      toast.error("Failed to update package status")
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

        toast.success("Package order updated")
        onPackagesChange?.()
      } catch (error) {
        console.error("Error updating package order:", error)
        toast.error("Failed to update package order")
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
          <h3 className="text-lg font-semibold">Service Packages - {categoryName}</h3>
          <p className="text-sm text-gray-600">Create different pricing packages for this service</p>
        </div>
        <Button onClick={() => openEditDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Package
        </Button>
      </div>

      {packages.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No packages yet</h3>
            <p className="text-gray-600 mb-4">Create your first service package to get started</p>
            <Button onClick={() => openEditDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Package
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
                    <TableHead>Package Name</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
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
              {editingPackage ? 'Edit Package' : 'Create New Package'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="packageName">Package Name *</Label>
              <Input
                id="packageName"
                placeholder="e.g., Basic Logo Design"
                value={packageName}
                onChange={(e) => setPackageName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shortDescription">Short Description</Label>
              <Textarea
                id="shortDescription"
                placeholder="e.g., Simple logo with 2 revisions"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price (€) *</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                placeholder="150.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button 
                variant="outline" 
                onClick={() => setEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSavePackage} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {editingPackage ? 'Update' : 'Create'}
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
