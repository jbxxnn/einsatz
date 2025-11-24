"use client"

import { useState, useEffect } from "react"
import { useOptimizedSupabase } from "@/components/optimized-supabase-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/lib/toast"
import { 
  Package, 
  Calculator, 
  Euro, 
  ChevronDown, 
  ChevronUp,
  CheckCircle,
  Loader2
} from "lucide-react"
import type { Database } from "@/lib/database.types"
import { useTranslation } from "@/lib/i18n"

type JobOfferingPackage = Database["public"]["Tables"]["job_offering_packages"]["Row"]
type JobOfferingPackageItem = Database["public"]["Tables"]["job_offering_package_items"]["Row"]

interface LeftPackageSelectionProps {
  freelancerId: string
  categoryId: string
  categoryName: string
  onPackageSelect: (packageData: {
    package: JobOfferingPackage
    items: Array<{
      item: JobOfferingPackageItem
      quantity: number
      total: number
    }>
    totalPrice: number
  } | null) => void
  selectedPackageData?: {
    package: JobOfferingPackage
    items: Array<{
      item: JobOfferingPackageItem
      quantity: number
      total: number
    }>
    totalPrice: number
  } | null
}

export default function LeftPackageSelection({
  freelancerId,
  categoryId,
  categoryName,
  onPackageSelect,
  selectedPackageData
}: LeftPackageSelectionProps) {
  const { t } = useTranslation()
  const { supabase } = useOptimizedSupabase()
  const [packages, setPackages] = useState<(JobOfferingPackage & {
    items: JobOfferingPackageItem[]
  })[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedPackage, setExpandedPackage] = useState<string | null>(null)
  const [packageQuantities, setPackageQuantities] = useState<Record<string, Record<string, number>>>({})

  // Fetch packages with items
  useEffect(() => {
    const fetchPackages = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from("job_offering_packages")
          .select(`
            *,
            job_offering_package_items (*)
          `)
          .eq("job_offering_id", (await supabase
            .from("freelancer_job_offerings")
            .select("id")
            .eq("freelancer_id", freelancerId)
            .eq("category_id", categoryId)
            .single()
          ).data?.id)
          .eq("is_active", true)
          .order("display_order", { ascending: true })

        if (error) throw error

        const packagesWithItems = data?.map(pkg => ({
          ...pkg,
          items: pkg.job_offering_package_items || []
        })) || []

        setPackages(packagesWithItems)

        // Initialize quantities with default values
        const initialQuantities: Record<string, Record<string, number>> = {}
        packagesWithItems.forEach(pkg => {
          initialQuantities[pkg.id] = {}
          pkg.items.forEach((item: JobOfferingPackageItem) => {
            // Use fixed quantity for fixed items, default to 1 for variable items
            initialQuantities[pkg.id][item.id] = item.quantity_type === "fixed" 
              ? (item.fixed_quantity || 1) 
              : 1
          })
        })
        setPackageQuantities(initialQuantities)

      } catch (error) {
        console.error("Error fetching packages:", error)
        toast.error(t("packages.selection.failedToLoadPackages"))
      } finally {
        setLoading(false)
      }
    }

    if (freelancerId && categoryId) {
      fetchPackages()
    }
  }, [supabase, freelancerId, categoryId])

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'labour': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'materials': return 'bg-green-100 text-green-800 border-green-200'
      case 'others': return 'bg-purple-100 text-purple-800 border-purple-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const calculatePackageTotal = (pkg: JobOfferingPackage & { items: JobOfferingPackageItem[] }) => {
    const quantities = packageQuantities[pkg.id] || {}
    return pkg.items.reduce((total, item) => {
      const quantity = quantities[item.id] || 1
      return total + (item.price_per_unit * quantity)
    }, 0)
  }

  const calculateItemTotal = (item: JobOfferingPackageItem, packageId: string) => {
    const quantity = packageQuantities[packageId]?.[item.id] || 1
    return item.price_per_unit * quantity
  }

  const updateQuantity = (packageId: string, itemId: string, quantity: number) => {
    if (quantity < 0) return
    
    setPackageQuantities(prev => ({
      ...prev,
      [packageId]: {
        ...prev[packageId],
        [itemId]: quantity
      }
    }))
  }

  const handlePackageSelect = (pkg: JobOfferingPackage & { items: JobOfferingPackageItem[] }) => {
    // If already selected, deselect it
    if (selectedPackageData?.package.id === pkg.id) {
      onPackageSelect(null)
      return
    }

    const quantities = packageQuantities[pkg.id] || {}
    const itemsWithQuantities = pkg.items.map(item => ({
      item,
      quantity: quantities[item.id] || 1,
      total: calculateItemTotal(item, pkg.id)
    }))
    
    const totalPrice = calculatePackageTotal(pkg)

    onPackageSelect({
      package: pkg,
      items: itemsWithQuantities,
      totalPrice
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  if (packages.length === 0) {
    return (
      <div className="text-center py-4">
        <Package className="h-8 w-8 mx-auto text-gray-400 mb-2" />
        <h3 className="text-sm font-semibold mb-1">{t("packages.selection.noPackagesAvailable")}</h3>
        <p className="text-xs text-gray-600">{t("packages.selection.noPackagesDescription")}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="text-start mb-4">
        <h3 className="text-sm font-semibold mb-1">{t("packages.selection.chooseServicePackage")}</h3>
        <p className="text-xs text-gray-600">{t("packages.selection.selectAndCustomize", { categoryName })}</p>
      </div>

      <div className="space-y-3">
        {packages.map((pkg) => {
          const isExpanded = expandedPackage === pkg.id
          const isSelected = selectedPackageData?.package.id === pkg.id
          const totalPrice = calculatePackageTotal(pkg)

          return (
            <Card 
              key={pkg.id} 
              className={`cursor-pointer transition-all ${
                isSelected 
                  ? 'ring-2 ring-primary border-primary' 
                  : 'hover:border-gray-300'
              }`}
            >
              <CardHeader 
                className="pb-2"
                onClick={() => setExpandedPackage(isExpanded ? null : pkg.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-sm">{pkg.package_name}</CardTitle>
                    {pkg.short_description && (
                      <p className="text-xs text-gray-600 mt-1">{pkg.short_description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {pkg.items.length} {pkg.items.length !== 1 ? t("packages.selection.items") : t("packages.selection.item")}
                      </Badge>
                      <div className="flex items-center gap-1 text-green-600 font-semibold text-sm">
                        <Euro className="h-3 w-3" />
                        {totalPrice.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isSelected && (
                      <CheckCircle className="h-4 w-4 text-primary" />
                    )}
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {/* Package Items */}
                    <div className="space-y-2">
                      {pkg.items.map((item) => {
                        const itemTotal = calculateItemTotal(item, pkg.id)
                        const quantity = packageQuantities[pkg.id]?.[item.id] || 1

                        return (
                          <div key={item.id} className="border rounded p-2">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Badge className={`text-xs ${getTypeColor(item.type)}`}>
                                  {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                                </Badge>
                                <span className="font-medium text-xs">{item.offering}</span>
                              </div>
                              <div className="text-right">
                                <div className="text-xs font-semibold text-green-600">
                                  €{itemTotal.toFixed(2)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  €{item.price_per_unit}/{item.unit_type}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {item.quantity_type === "fixed" ? (
                                <div className="flex items-center gap-2">
                                  <Label className="text-xs text-gray-600">
                                    {t("packages.selection.fixedLabel")}
                                  </Label>
                                  <span className="text-xs font-medium">
                                    {item.fixed_quantity} {item.unit_type}
                                  </span>
                                  <Badge variant="outline" className="text-xs">
                                    {t("packages.selection.fixed")}
                                  </Badge>
                                </div>
                              ) : (
                                <>
                                  <Label htmlFor={`quantity-${item.id}`} className="text-xs">
                                    {t("packages.selection.quantity")}
                                  </Label>
                                  <Input
                                    id={`quantity-${item.id}`}
                                    type="number"
                                    min="0"
                                    step="0.1"
                                    value={quantity}
                                    onChange={(e) => updateQuantity(pkg.id, item.id, parseFloat(e.target.value) || 0)}
                                    className="w-16 h-6 text-xs"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <span className="text-xs text-gray-500">{item.unit_type}</span>
                                </>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    <Separator />

                    {/* Package Total */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">{t("packages.selection.total")}</span>
                      <div className="flex items-center gap-1 text-sm font-bold text-green-600">
                        <Euro className="h-4 w-4" />
                        {totalPrice.toFixed(2)}
                      </div>
                    </div>

                    {/* Select Button */}
                    <Button 
                      onClick={(e) => {
                        e.stopPropagation()
                        handlePackageSelect(pkg)
                      }}
                      className="w-full text-xs"
                      size="sm"
                      variant={isSelected ? "outline" : "default"}
                    >
                      {isSelected ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {t("packages.selection.selected")}
                        </>
                      ) : (
                        <>
                          <Package className="h-3 w-3 mr-1" />
                          {t("packages.selection.selectPackage")}
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
