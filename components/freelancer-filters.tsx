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
import { useCategories, debounce } from "@/lib/data-fetching"
import { Skeleton } from "@/components/ui/skeleton"
import type { Database } from "@/lib/database.types"

type Category = Database["public"]["Tables"]["job_categories"]["Row"]

export default function FreelancerFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get current filter values from URL
  const currentSearch = searchParams.get("search") || ""
  const currentMinPrice = searchParams.get("minPrice") || "0"
  const currentMaxPrice = searchParams.get("maxPrice") || "200"
  const currentCategories = searchParams.get("categories")?.split(",").filter(Boolean) || []
  const currentAvailableNow = searchParams.get("availableNow") === "true"
  const currentLocation = searchParams.get("location") || ""
  const currentLatitude = searchParams.get("latitude") || ""
  const currentLongitude = searchParams.get("longitude") || ""
  const currentRadius = searchParams.get("radius") || "20"

  // Local state for form values
  const [search, setSearch] = useState(currentSearch)
  const [priceRange, setPriceRange] = useState([Number.parseInt(currentMinPrice), Number.parseInt(currentMaxPrice)])
  const [selectedCategories, setSelectedCategories] = useState<string[]>(currentCategories)
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

  // Fetch categories using SWR
  const { data: categories, isLoading: categoriesLoading } = useCategories()

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

    // Update URL without full page reload
    router.push(`/freelancers?${params.toString()}`, { scroll: false })
  }, 500)

  // Update filters when form values change
  useEffect(() => {
    updateFilters()
  }, [search, priceRange, selectedCategories, availableNow, location, coordinates, radius])

  // Handle category selection
  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId],
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

  // Reset all filters
  const resetFilters = () => {
    setSearch("")
    setPriceRange([0, 200])
    setSelectedCategories([])
    setAvailableNow(false)
    setLocation("")
    setCoordinates(null)
    setRadius(25)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search */}
        <div className="space-y-2">
          <Label htmlFor="search">Search</Label>
          <Input
            id="search"
            placeholder="Search freelancers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Location */}
        <div className="space-y-2">
          <Label>Location</Label>
          <LocationInput
            value={location}
            onChange={handleLocationChange}
            showRadius={true}
            radiusValue={radius}
            onRadiusChange={handleRadiusChange}
            placeholder="Enter a location"
          />
        </div>

        {/* Price Range */}
        <div className="space-y-4">
          <div className="flex justify-between">
            <Label>Price Range (€/hr)</Label>
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

        {/* Categories */}
        <div className="space-y-3">
          <Label>Categories</Label>

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
            <div className="space-y-2">
              {categories?.map((category: Category) => (
                <div key={category.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`category-${category.id}`}
                    checked={selectedCategories.includes(category.id)}
                    onCheckedChange={() => toggleCategory(category.id)}
                  />
                  <Label htmlFor={`category-${category.id}`} className="text-sm font-normal cursor-pointer">
                    {category.name}
                  </Label>
                </div>
              ))}

              {categories?.length === 0 && <p className="text-sm text-muted-foreground">No categories available</p>}
            </div>
          )}
        </div>

        {/* Available Now */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="available-now"
            checked={availableNow}
            onCheckedChange={(checked) => setAvailableNow(checked === true)}
          />
          <Label htmlFor="available-now" className="text-sm font-normal cursor-pointer">
            Available now
          </Label>
        </div>

        {/* Reset Button */}
        <Button variant="outline" className="w-full" onClick={resetFilters}>
          Reset Filters
        </Button>
      </CardContent>
    </Card>
  )
}
