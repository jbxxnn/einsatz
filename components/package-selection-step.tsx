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

type JobOfferingPackage = Database["public"]["Tables"]["job_offering_packages"]["Row"]
type JobOfferingPackageItem = Database["public"]["Tables"]["job_offering_package_items"]["Row"]

interface PackageSelectionStepProps {
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
  }) => void
  selectedPackage?: JobOfferingPackage | null
}

export default function PackageSelectionStep({
  freelancerId,
  categoryId,
  categoryName,
  onPackageSelect,
  selectedPackage
}: PackageSelectionStepProps) {
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
        toast.error("Failed to load service packages")
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
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  if (packages.length === 0) {
    return (
      <div className="text-center py-8">
        <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold mb-2">No packages available</h3>
        <p className="text-gray-600">This freelancer hasn't set up service packages for this category yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold mb-2">Choose Your Service Package</h2>
        <p className="text-gray-600">Select and customize your {categoryName} service package</p>
      </div>

      <div className="grid gap-4">
        {packages.map((pkg) => {
          const isExpanded = expandedPackage === pkg.id
          const isSelected = selectedPackage?.id === pkg.id
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
                className="pb-3"
                onClick={() => setExpandedPackage(isExpanded ? null : pkg.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{pkg.package_name}</CardTitle>
                    {pkg.short_description && (
                      <p className="text-sm text-gray-600 mt-1">{pkg.short_description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {pkg.items.length} item{pkg.items.length !== 1 ? 's' : ''}
                      </Badge>
                      <div className="flex items-center gap-1 text-green-600 font-semibold">
                        <Euro className="h-4 w-4" />
                        {totalPrice.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isSelected && (
                      <CheckCircle className="h-5 w-5 text-primary" />
                    )}
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {/* Package Items */}
                    <div className="space-y-3">
                      {pkg.items.map((item) => {
                        const itemTotal = calculateItemTotal(item, pkg.id)
                        const quantity = packageQuantities[pkg.id]?.[item.id] || 1

                        return (
                          <div key={item.id} className="border rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Badge className={`text-xs ${getTypeColor(item.type)}`}>
                                  {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                                </Badge>
                                <span className="font-medium text-sm">{item.offering}</span>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-semibold text-green-600">
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
                                    Fixed:
                                  </Label>
                                  <span className="text-xs font-medium">
                                    {item.fixed_quantity} {item.unit_type}
                                  </span>
                                  <Badge variant="outline" className="text-xs">
                                    Fixed
                                  </Badge>
                                </div>
                              ) : (
                                <>
                                  <Label htmlFor={`quantity-${item.id}`} className="text-xs">
                                    Quantity:
                                  </Label>
                                  <Input
                                    id={`quantity-${item.id}`}
                                    type="number"
                                    min="0"
                                    step="0.1"
                                    value={quantity}
                                    onChange={(e) => updateQuantity(pkg.id, item.id, parseFloat(e.target.value) || 0)}
                                    className="w-20 h-8 text-xs"
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
                      <span className="font-semibold">Package Total:</span>
                      <div className="flex items-center gap-1 text-lg font-bold text-green-600">
                        <Euro className="h-5 w-5" />
                        {totalPrice.toFixed(2)}
                      </div>
                    </div>

                    {/* Select Button */}
                    <Button 
                      onClick={(e) => {
                        e.stopPropagation()
                        handlePackageSelect(pkg)
                      }}
                      className="w-full"
                      variant={isSelected ? "outline" : "default"}
                    >
                      {isSelected ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Selected Package
                        </>
                      ) : (
                        <>
                          <Package className="h-4 w-4 mr-2" />
                          Select This Package
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
