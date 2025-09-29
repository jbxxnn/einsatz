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
  onDelete,
  t
}: { 
  item: JobOfferingPackageItem
  onEdit: (item: JobOfferingPackageItem) => void
  onDelete: (id: string) => void
  t: (key: string) => string
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
              {t("packageItems.fixed")}
            </Badge>
            <span className="text-xs">{item.fixed_quantity} {item.unit_type}</span>
          </div>
        ) : (
          <Badge variant="outline" className="text-xs">
            {t("packageItems.variable")}
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
        toast.error(t("packageItems.failedToLoadPackageItems"))
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
      toast.error(t("packageItems.allFieldsRequired"))
      return
    }

    if (quantityType === "fixed" && (!fixedQuantity.trim() || parseFloat(fixedQuantity) <= 0)) {
      toast.error(t("packageItems.fixedQuantityMustBeGreaterThanZero"))
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
        toast.success(t("packageItems.itemUpdatedSuccessfully"))
      } else {
        // Create new item
        const { data, error } = await supabase
          .from("job_offering_package_items")
          .insert(itemData)
          .select()
          .single()

        if (error) throw error

        setItems([...items, data])
        toast.success(t("packageItems.itemCreatedSuccessfully"))
      }

      setEditDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error("Error saving item:", error)
      toast.error(t("packageItems.failedToSaveItem"))
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm(t("packageItems.confirmDelete"))) return

    try {
      const { error } = await supabase
        .from("job_offering_package_items")
        .delete()
        .eq("id", itemId)

      if (error) throw error

      setItems(items.filter(item => item.id !== itemId))
      toast.success(t("packageItems.itemDeletedSuccessfully"))
    } catch (error) {
      console.error("Error deleting item:", error)
      toast.error(t("packageItems.failedToDeleteItem"))
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

        toast.success(t("packageItems.itemOrderUpdated"))
      } catch (error) {
        console.error("Error updating item order:", error)
        toast.error(t("packageItems.failedToUpdateItemOrder"))
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

      toast.success(t("packageItems.packagePriceUpdatedSuccessfully"))
      onSaveAndClose?.()
    } catch (error) {
      console.error("Error updating package price:", error)
      toast.error(t("packageItems.failedToUpdatePackagePrice"))
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
          <h3 className="text-lg font-semibold">{t("packageItems.title")} - {packageName}</h3>
          <p className="text-sm text-gray-600">{t("packageItems.subtitle")}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm text-gray-500">{t("packageItems.totalPrice")}</div>
            <div className="text-lg font-semibold text-green-600 flex items-center gap-1">
              <Euro className="h-4 w-4" />
              {totalPrice.toFixed(2)}
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => openEditDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              {t("packageItems.addItem")}
            </Button>
            <Button onClick={handleSaveAndClose} variant="default">
              <Save className="h-4 w-4 mr-2" />
              {t("packageItems.saveAndClose")}
            </Button>
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Calculator className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t("packageItems.noItemsYet")}</h3>
            <p className="text-gray-600 mb-4">{t("packageItems.addLineItemsDescription")}</p>
            <Button onClick={() => openEditDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              {t("packageItems.addFirstItem")}
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
                    <TableHead>{t("packageItems.offering")}</TableHead>
                    <TableHead>{t("packageItems.pricePerUnit")}</TableHead>
                    <TableHead>{t("packageItems.unitType")}</TableHead>
                    <TableHead>{t("packageItems.quantity")}</TableHead>
                    <TableHead className="text-right">{t("packageItems.actions")}</TableHead>
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

      {/* Edit Item Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? t("packageItems.editItem") : t("packageItems.addNewItem")}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="type">{t("packageItems.typeRequired")}</Label>
              <Select value={type} onValueChange={(value: "labour" | "materials" | "others") => setType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t("packageItems.selectType")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="labour">{t("packageItems.labour")}</SelectItem>
                  <SelectItem value="materials">{t("packageItems.materials")}</SelectItem>
                  <SelectItem value="others">{t("packageItems.others")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="offering">{t("packageItems.offeringRequired")}</Label>
              <Textarea
                id="offering"
                placeholder={t("packageItems.offeringPlaceholder")}
                value={offering}
                onChange={(e) => setOffering(e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pricePerUnit">{t("packageItems.pricePerUnitRequired")}</Label>
                <Input
                  id="pricePerUnit"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder={t("packageItems.pricePerUnitPlaceholder")}
                  value={pricePerUnit}
                  onChange={(e) => setPricePerUnit(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unitType">{t("packageItems.unitTypeRequired")}</Label>
                <Select value={unitType} onValueChange={setUnitType}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("packageItems.selectUnit")} />
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
              <Label htmlFor="quantityType">{t("packageItems.quantityTypeRequired")}</Label>
              <Select value={quantityType} onValueChange={(value: "fixed" | "variable") => setQuantityType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t("packageItems.selectQuantityType")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="variable">{t("packageItems.variableDescription")}</SelectItem>
                  <SelectItem value="fixed">{t("packageItems.fixedDescription")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Fixed Quantity Input (only shown when quantity type is fixed) */}
            {quantityType === "fixed" && (
              <div className="space-y-2">
                <Label htmlFor="fixedQuantity">{t("packageItems.fixedQuantityRequired")}</Label>
                <Input
                  id="fixedQuantity"
                  type="number"
                  min="0.1"
                  step="0.1"
                  placeholder={t("packageItems.fixedQuantityPlaceholder")}
                  value={fixedQuantity}
                  onChange={(e) => setFixedQuantity(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  {t("packageItems.fixedQuantityDescription")}
                </p>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button 
                variant="outline" 
                onClick={() => setEditDialogOpen(false)}
              >
                {t("packageItems.cancel")}
              </Button>
              <Button onClick={handleSaveItem} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t("packageItems.saving")}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {editingItem ? t("packageItems.update") : t("packageItems.add")}
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

