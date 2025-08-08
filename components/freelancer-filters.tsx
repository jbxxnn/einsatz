"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { LocationInput } from "@/components/location-input"
import { useCategories, useSubcategories, debounce } from "@/lib/data-fetching"
import { Skeleton } from "@/components/ui/skeleton"
import type { Database } from "@/lib/database.types"
import WildcardFilter, { type WildcardCategory } from "@/components/wildcard-filter"
import { Separator } from "@/components/ui/separator"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronUp, Search, MapPin, Euro, Clock, Tag } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { useTranslation } from "@/lib/i18n"

type Category = Database["public"]["Tables"]["job_categories"]["Row"]
type Subcategory = Database["public"]["Tables"]["job_subcategories"]["Row"]

export default function FreelancerFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useTranslation()
  // Get current filter values from URL
  const currentSearch = searchParams.get("search") || ""
  const currentMinPrice = searchParams.get("minPrice") || "0"
  const currentMaxPrice = searchParams.get("maxPrice") || "200"
  const currentCategories = searchParams.get("categories")?.split(",").filter(Boolean) || []
  const currentSubcategories = searchParams.get("subcategories")?.split(",").filter(Boolean) || []
  const currentAvailableNow = searchParams.get("availableNow") === "true"
  const currentLocation = searchParams.get("location") || ""
  const currentLatitude = searchParams.get("latitude") || ""
  const currentLongitude = searchParams.get("longitude") || ""
  const currentRadius = searchParams.get("radius") || "20"
  const currentWildcards = (searchParams.get("wildcards")?.split(",").filter(Boolean) as WildcardCategory[]) || []

  // Local state for form values
  const [search, setSearch] = useState(currentSearch)
  const [priceRange, setPriceRange] = useState([Number.parseInt(currentMinPrice), Number.parseInt(currentMaxPrice)])
  const [selectedCategories, setSelectedCategories] = useState<string[]>(currentCategories)
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>(currentSubcategories)
  const [availableNow, setAvailableNow] = useState(currentAvailableNow)
  const [location, setLocation] = useState(currentLocation || "Kampen, Overijssel")
  const [coordinates, setCoordinates] = useState<{
    latitude: number
    longitude: number
    success: boolean
    formattedAddress: string
  } | null>(
    currentLatitude && currentLongitude
      ? {
          latitude: Number.parseFloat(currentLatitude),
          longitude: Number.parseFloat(currentLongitude),
          success: true,
          formattedAddress: currentLocation,
        }
      : {
          latitude: 52.5558,
          longitude: 5.9111,
          success: true,
          formattedAddress: "Kampen, Overijssel",
        },
  )
  const [radius, setRadius] = useState(Number.parseInt(currentRadius) || 20)
  const [selectedWildcards, setSelectedWildcards] = useState<WildcardCategory[]>(currentWildcards)
  const [showWildcardOnly, setShowWildcardOnly] = useState(false)

  // Collapsible sections state
  const [openSections, setOpenSections] = useState({
    search: true,
    location: true,
    price: true,
    categories: true,
    wildcards: true,
  })

  // Fetch categories using SWR
  const { data: categories, isLoading: categoriesLoading } = useCategories()
  
  // Fetch subcategories for selected categories
  const { data: subcategories, isLoading: subcategoriesLoading } = useSubcategories(
    selectedCategories.length === 1 ? selectedCategories[0] : null
  )

  // Update URL with filters (debounced)
  const updateFilters = debounce(() => {
    const params = new URLSearchParams(searchParams.toString())

    // Update search param
    if (search) {
      params.set("search", search)
    } else {
      params.delete("search")
    }

    // Update price range
    params.set("minPrice", priceRange[0].toString())
    params.set("maxPrice", priceRange[1].toString())

    // Update categories
    if (selectedCategories.length > 0) {
      params.set("categories", selectedCategories.join(","))
    } else {
      params.delete("categories")
    }

    // Update subcategories
    if (selectedSubcategories.length > 0) {
      params.set("subcategories", selectedSubcategories.join(","))
    } else {
      params.delete("subcategories")
    }

    // Update available now
    if (availableNow) {
      params.set("availableNow", "true")
    } else {
      params.delete("availableNow")
    }

    // Update location
    if (location && coordinates?.success) {
      params.set("location", location)
      params.set("latitude", coordinates.latitude.toString())
      params.set("longitude", coordinates.longitude.toString())
      params.set("radius", radius.toString())
    } else {
      params.delete("location")
      params.delete("latitude")
      params.delete("longitude")
      params.delete("radius")
    }

    // Update wildcards
    if (selectedWildcards.length > 0) {
      params.set("wildcards", selectedWildcards.join(","))
    } else {
      params.delete("wildcards")
    }

    // Update wildcard only filter
    if (showWildcardOnly) {
      params.set("wildcardOnly", "true")
    } else {
      params.delete("wildcardOnly")
    }

    // Update URL without full page reload
    router.push(`/freelancers?${params.toString()}`, { scroll: false })
  }, 500)

  // Update filters when form values change
  useEffect(() => {
    updateFilters()
  }, [search, priceRange, selectedCategories, selectedSubcategories, availableNow, location, coordinates, radius, selectedWildcards, showWildcardOnly])

  // Handle category selection
  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) => {
      const newCategories = prev.includes(categoryId) 
        ? prev.filter((id) => id !== categoryId) 
        : [...prev, categoryId]
      
      // Clear subcategories if multiple categories are selected
      if (newCategories.length !== 1) {
        setSelectedSubcategories([])
      }
      
      return newCategories
    })
  }

  // Handle subcategory selection
  const toggleSubcategory = (subcategoryId: string) => {
    setSelectedSubcategories((prev) =>
      prev.includes(subcategoryId) ? prev.filter((id) => id !== subcategoryId) : [...prev, subcategoryId],
    )
  }

  // Handle location change
  const handleLocationChange = (
    value: string,
    coordinates?: { lat: number; lng: number; formattedAddress: string } | undefined,
  ) => {
    setLocation(value)
    if (coordinates) {
      setCoordinates({
        latitude: coordinates.lat,
        longitude: coordinates.lng,
        success: true,
        formattedAddress: coordinates.formattedAddress,
      })
    } else {
      setCoordinates(null)
    }
  }

  // Handle radius change
  const handleRadiusChange = (value: number) => {
    setRadius(value)
  }

  // Handle wildcard change
  const handleWildcardChange = (wildcards: WildcardCategory[]) => {
    setSelectedWildcards(wildcards)
  }

  // Toggle collapsible section
  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  // Reset all filters
  const resetFilters = () => {
    setSearch("")
    setPriceRange([0, 200])
    setSelectedCategories([])
    setSelectedSubcategories([])
    setAvailableNow(false)
    setLocation("")
    setCoordinates(null)
    setRadius(25)
    setSelectedWildcards([])
    setShowWildcardOnly(false)
  }

  return (
    <div className="bg-[transparent] border-none">
      <div>
        <h1 className="text-lg text-black font-bold p-2">{t("freelancer.filters.title")}</h1>
      </div>
      <div className="space-y-6">
        {/* Wildcard Only Switch */}
        <div className="flex items-center justify-between bg-white rounded-lg p-4 border border-gray-200">
          <div className="space-y-0.5">
            <Label className="text-sm text-black font-bold">{t("freelancer.filters.wildcardSearch")}</Label>
            <p className="text-xs text-black">
            {t("freelancer.filters.wildcardSearchDescription")}
            </p>
          </div>
          <Switch
            checked={showWildcardOnly}
            onCheckedChange={setShowWildcardOnly}
          />
        </div>

        {/* Wildcard Categories - Only shown when wildcard search is enabled */}
        {showWildcardOnly && (
          <div className="pl-4 bg-white rounded-lg p-4 border border-gray-200">
            <div className="space-y-2">
              <Label className="text-sm text-black font-bold">{t("freelancer.filters.selectWildcardCategories")}</Label>
              <WildcardFilter selectedWildcards={selectedWildcards} onChange={handleWildcardChange} />
            </div>
          </div>
        )}

        {/* Search Section */}
        <Collapsible open={openSections.search} onOpenChange={() => toggleSection("search")} className="bg-white rounded-lg p-4 border border-gray-200">
          <CollapsibleTrigger className="flex w-full items-center justify-between ">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4" />
              <Label className="text-xs text-black font-bold">{t("freelancer.filters.search")}</Label>
            </div>
            {openSections.search ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4">
            <Input
              placeholder={t("freelancer.filters.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </CollapsibleContent>
        </Collapsible>

        {/* Location Section */}
        <Collapsible open={openSections.location} onOpenChange={() => toggleSection("location")} className="bg-white rounded-lg p-4 border border-gray-200">
          <CollapsibleTrigger className="flex w-full items-center justify-between">
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4" />
              <Label className="text-xs text-black font-bold">{t("freelancer.filters.location")}</Label>
            </div>
            {openSections.location ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4">
            <LocationInput
              value={location}
              onChange={handleLocationChange}
              showRadius={true}
              radiusValue={radius}
              onRadiusChange={handleRadiusChange}
              placeholder={t("freelancer.filters.locationPlaceholder")}
            />
          </CollapsibleContent>
        </Collapsible>

        {/* Price Range Section */}
        <Collapsible open={openSections.price} onOpenChange={() => toggleSection("price")} className="bg-white rounded-lg p-4 border border-gray-200">
          <CollapsibleTrigger className="flex w-full items-center justify-between">
            <div className="flex items-center space-x-2">
              <Euro className="h-4 w-4" />
              <Label className="text-xs text-black font-bold">{t("freelancer.filters.priceRange")}</Label>
            </div>
            {openSections.price ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4">
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  €{priceRange[0]} - €{priceRange[1]}
                </span>
              </div>
              <Slider
                defaultValue={priceRange}
                min={0}
                max={200}
                step={5}
                value={priceRange}
                onValueChange={setPriceRange}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Categories Section */}
        <Collapsible open={openSections.categories} onOpenChange={() => toggleSection("categories")} className="bg-white rounded-lg p-4 border border-gray-200">
          <CollapsibleTrigger className="flex w-full items-center justify-between">
            <div className="flex items-center space-x-2">
              <Tag className="h-4 w-4" />
              <Label className="text-xs text-black font-bold">{t("freelancer.filters.categories")}</Label>
            </div>
            {openSections.categories ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4">
            {categoriesLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {categories?.map((category: Category) => (
                  <div key={category.id} className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`category-${category.id}`}
                        checked={selectedCategories.includes(category.id)}
                        onCheckedChange={() => toggleCategory(category.id)}
                      />
                      <Label htmlFor={`category-${category.id}`} className="text-sm font-normal cursor-pointer">
                        {category.name}
                      </Label>
                    </div>
                    
                    {/* Show subcategories if this category is selected and it's the only selected category */}
                    {selectedCategories.includes(category.id) && 
                     selectedCategories.length === 1 && 
                     subcategories && 
                     subcategories.length > 0 && (
                      <div className="ml-6 space-y-2">
                        <Label className="text-xs text-gray-600 font-medium">
                          {t("freelancer.filters.subcategories") || "Subcategories"}
                        </Label>
                        {subcategoriesLoading ? (
                          <div className="space-y-1">
                            {[1, 2, 3].map((i) => (
                              <div key={i} className="flex items-center gap-2">
                                <Skeleton className="h-3 w-3" />
                                <Skeleton className="h-3 w-20" />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {subcategories.map((subcategory: Subcategory) => (
                              <div key={subcategory.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`subcategory-${subcategory.id}`}
                                  checked={selectedSubcategories.includes(subcategory.id)}
                                  onCheckedChange={() => toggleSubcategory(subcategory.id)}
                                />
                                <Label htmlFor={`subcategory-${subcategory.id}`} className="text-xs font-normal cursor-pointer text-gray-700">
                                  {subcategory.name}
                                </Label>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {categories?.length === 0 && <p className="text-xs text-black">{t("freelancer.filters.noCategoriesAvailable")}</p>}
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* Available Now
        <div className="flex items-center space-x-2">
          <Checkbox
            id="available-now"
            checked={availableNow}
            onCheckedChange={(checked) => setAvailableNow(checked === true)}
          />
          <Label htmlFor="available-now" className="text-sm font-normal cursor-pointer">
            {t("freelancer.filters.availableNow")}
          </Label>
        </div> */}

        {/* Reset Button */}
        <Button className="w-full" onClick={resetFilters}>
          {t("freelancer.filters.resetFilters")}
        </Button>
      </div>
    </div>
  )
}
