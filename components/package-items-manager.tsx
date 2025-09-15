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
  Calculator,
  Euro
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

type JobOfferingPackageItem = Database["public"]["Tables"]["job_offering_package_items"]["Row"]
type UnitType = Database["public"]["Tables"]["unit_types"]["Row"]

interface PackageItemsManagerProps {
  packageId: string
  packageName: string
  onItemsChange?: (totalPrice: number) => void
  onSaveAndClose?: () => void
}

// Sortable item row component
function SortableItemRow({ 
  item, 
  onEdit,
  onDelete
}: { 
  item: JobOfferingPackageItem
  onEdit: (item: JobOfferingPackageItem) => void
  onDelete: (id: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'labour': return 'bg-blue-100 text-blue-800'
      case 'materials': return 'bg-green-100 text-green-800'
      case 'others': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <TableRow 
      ref={setNodeRef} 
      style={style} 
      className="text-xs"
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
            <div className="font-medium">{item.offering}</div>
            <Badge className={`text-xs ${getTypeColor(item.type)}`}>
              {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
            </Badge>
          </div>
        </div>
      </TableCell>
      <TableCell className="font-semibold text-green-600">
        €{item.price_per_unit}
      </TableCell>
      <TableCell className="text-gray-600">
        {item.unit_type}
      </TableCell>
      <TableCell className="text-gray-600">
        {item.quantity_type === "fixed" ? (
          <div className="flex items-center gap-1">
            <Badge variant="outline" className="text-xs">
              Fixed
            </Badge>
            <span className="text-xs">{item.fixed_quantity} {item.unit_type}</span>
          </div>
        ) : (
          <Badge variant="outline" className="text-xs">
            Variable
          </Badge>
        )}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex gap-2 justify-end items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onEdit(item)}
          >
            <Edit className="h-4 w-4" />
          </Button>

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onDelete(item.id)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

export default function PackageItemsManager({ 
  packageId, 
  packageName,
  onItemsChange,
  onSaveAndClose
}: PackageItemsManagerProps) {
  const { t } = useTranslation()
  const { supabase } = useOptimizedSupabase()
  const [items, setItems] = useState<JobOfferingPackageItem[]>([])
  const [unitTypes, setUnitTypes] = useState<UnitType[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<JobOfferingPackageItem | null>(null)
  
  // Form state
  const [type, setType] = useState<"labour" | "materials" | "others">("labour")
  const [offering, setOffering] = useState("")
  const [pricePerUnit, setPricePerUnit] = useState("")
  const [unitType, setUnitType] = useState("")
  const [quantityType, setQuantityType] = useState<"fixed" | "variable">("variable")
  const [fixedQuantity, setFixedQuantity] = useState("")

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Fetch items and unit types
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Fetch items for this package
        const { data: itemsData, error: itemsError } = await supabase
          .from("job_offering_package_items")
          .select("*")
          .eq("package_id", packageId)
          .order("display_order", { ascending: true })

        if (itemsError) throw itemsError

        // Fetch unit types
        const { data: unitTypesData, error: unitTypesError } = await supabase
          .from("unit_types")
          .select("*")
          .order("name", { ascending: true })

        if (unitTypesError) throw unitTypesError

        setItems(itemsData || [])
        setUnitTypes(unitTypesData || [])
      } catch (error) {
        console.error("Error fetching data:", error)
        toast.error("Failed to load package items")
      } finally {
        setLoading(false)
      }
    }

    if (packageId) {
      fetchData()
    }
  }, [supabase, packageId])

  // Calculate total and notify parent
  useEffect(() => {
    const total = items.reduce((sum, item) => sum + item.price_per_unit, 0)
    onItemsChange?.(total)
  }, [items, onItemsChange])

  const resetForm = () => {
    setType("labour")
    setOffering("")
    setPricePerUnit("")
    setUnitType("")
    setQuantityType("variable")
    setFixedQuantity("")
    setEditingItem(null)
  }

  const openEditDialog = (item?: JobOfferingPackageItem) => {
    if (item) {
      setEditingItem(item)
      setType(item.type)
      setOffering(item.offering)
      setPricePerUnit(item.price_per_unit.toString())
      setUnitType(item.unit_type)
      setQuantityType(item.quantity_type)
      setFixedQuantity(item.fixed_quantity?.toString() || "")
    } else {
      resetForm()
    }
    setEditDialogOpen(true)
  }

  const handleSaveItem = async () => {
    if (!offering.trim() || !pricePerUnit.trim() || !unitType.trim()) {
      toast.error("All fields are required")
      return
    }

    if (quantityType === "fixed" && (!fixedQuantity.trim() || parseFloat(fixedQuantity) <= 0)) {
      toast.error("Fixed quantity must be greater than 0")
      return
    }

    setSaving(true)
    try {
      const itemData = {
        package_id: packageId,
        type,
        offering: offering.trim(),
        price_per_unit: parseFloat(pricePerUnit),
        unit_type: unitType,
        quantity_type: quantityType,
        fixed_quantity: quantityType === "fixed" ? parseFloat(fixedQuantity) : null,
        display_order: editingItem ? editingItem.display_order : items.length + 1,
      }

      if (editingItem) {
        // Update existing item
        const { error } = await supabase
          .from("job_offering_package_items")
          .update(itemData)
          .eq("id", editingItem.id)

        if (error) throw error

        setItems(items.map(item => 
          item.id === editingItem.id ? { ...item, ...itemData } : item
        ))
        toast.success("Item updated successfully")
      } else {
        // Create new item
        const { data, error } = await supabase
          .from("job_offering_package_items")
          .insert(itemData)
          .select()
          .single()

        if (error) throw error

        setItems([...items, data])
        toast.success("Item created successfully")
      }

      setEditDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error("Error saving item:", error)
      toast.error("Failed to save item")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return

    try {
      const { error } = await supabase
        .from("job_offering_package_items")
        .delete()
        .eq("id", itemId)

      if (error) throw error

      setItems(items.filter(item => item.id !== itemId))
      toast.success("Item deleted successfully")
    } catch (error) {
      console.error("Error deleting item:", error)
      toast.error("Failed to delete item")
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id)
      const newIndex = items.findIndex((item) => item.id === over?.id)

      const newItems = arrayMove(items, oldIndex, newIndex)
      setItems(newItems)

      // Update display order in database
      try {
        for (let i = 0; i < newItems.length; i++) {
          const { error } = await supabase
            .from("job_offering_package_items")
            .update({ display_order: i + 1 })
            .eq("id", newItems[i].id)

          if (error) throw error
        }

        toast.success("Item order updated")
      } catch (error) {
        console.error("Error updating item order:", error)
        toast.error("Failed to update item order")
      }
    }
  }

  const totalPrice = items.reduce((sum, item) => sum + item.price_per_unit, 0)

  const handleSaveAndClose = async () => {
    try {
      // Update the package price with the calculated total
      const { error } = await supabase
        .from("job_offering_packages")
        .update({ price: totalPrice })
        .eq("id", packageId)

      if (error) throw error

      toast.success("Package price updated successfully")
      onSaveAndClose?.()
    } catch (error) {
      console.error("Error updating package price:", error)
      toast.error("Failed to update package price")
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
          <h3 className="text-lg font-semibold">Package Items - {packageName}</h3>
          <p className="text-sm text-gray-600">Add detailed line items for this package</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm text-gray-500">Total Price</div>
            <div className="text-lg font-semibold text-green-600 flex items-center gap-1">
              <Euro className="h-4 w-4" />
              {totalPrice.toFixed(2)}
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => openEditDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
            <Button onClick={handleSaveAndClose} variant="default">
              <Save className="h-4 w-4 mr-2" />
              Save & Close
            </Button>
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Calculator className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No items yet</h3>
            <p className="text-gray-600 mb-4">Add line items to break down your package pricing</p>
            <Button onClick={() => openEditDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Item
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
                    <TableHead>Offering</TableHead>
                    <TableHead>Price per Unit</TableHead>
                    <TableHead>Unit Type</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <SortableContext
                  items={items.map(item => item.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <TableBody>
                    {items.map((item) => (
                      <SortableItemRow
                        key={item.id}
                        item={item}
                        onEdit={openEditDialog}
                        onDelete={handleDeleteItem}
                      />
                    ))}
                  </TableBody>
                </SortableContext>
              </Table>
            </DndContext>
          </CardContent>
        </Card>
      )}

      {/* Edit Item Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit Item' : 'Add New Item'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <Select value={type} onValueChange={(value: "labour" | "materials" | "others") => setType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="labour">Labour</SelectItem>
                  <SelectItem value="materials">Materials</SelectItem>
                  <SelectItem value="others">Others</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="offering">Offering *</Label>
              <Textarea
                id="offering"
                placeholder="e.g., 30/30 tiles laying, Logo design work, Call out charges"
                value={offering}
                onChange={(e) => setOffering(e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pricePerUnit">Price per Unit (€) *</Label>
                <Input
                  id="pricePerUnit"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="30.00"
                  value={pricePerUnit}
                  onChange={(e) => setPricePerUnit(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unitType">Unit Type *</Label>
                <Select value={unitType} onValueChange={setUnitType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {unitTypes.map((unit) => (
                      <SelectItem key={unit.id} value={unit.symbol}>
                        {unit.symbol} - {unit.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Quantity Type Selection */}
            <div className="space-y-2">
              <Label htmlFor="quantityType">Quantity Type *</Label>
              <Select value={quantityType} onValueChange={(value: "fixed" | "variable") => setQuantityType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select quantity type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="variable">Variable - Client can adjust quantity</SelectItem>
                  <SelectItem value="fixed">Fixed - Predetermined quantity</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Fixed Quantity Input (only shown when quantity type is fixed) */}
            {quantityType === "fixed" && (
              <div className="space-y-2">
                <Label htmlFor="fixedQuantity">Fixed Quantity *</Label>
                <Input
                  id="fixedQuantity"
                  type="number"
                  min="0.1"
                  step="0.1"
                  placeholder="e.g., 2"
                  value={fixedQuantity}
                  onChange={(e) => setFixedQuantity(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  This quantity will be fixed for all clients
                </p>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button 
                variant="outline" 
                onClick={() => setEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveItem} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {editingItem ? 'Update' : 'Add'}
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

