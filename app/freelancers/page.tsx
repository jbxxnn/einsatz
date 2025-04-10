"use client"

import { useState, useEffect } from "react"
import { useSupabase } from "@/components/supabase-provider"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { MapPin, Search, Star, Clock } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import type { Database } from "@/lib/database.types"
import JobCategorySelector from "@/components/job-category-selector"
import { LocationInput } from "@/components/location-input"
import JobSubcategorySelector from "@/components/job-subcategory-selector"
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import {
  IconClipboardCopy,
  IconFileBroken,
  IconSignature,
  IconTableColumn,
} from "@tabler/icons-react";

type Profile = Database["public"]["Tables"]["profiles"]["Row"]
type JobCategory = Database["public"]["Tables"]["job_categories"]["Row"]
type JobOffering = Database["public"]["Tables"]["freelancer_job_offerings"]["Row"]

interface FreelancerWithOfferings extends Profile {
  job_offerings: (JobOffering & { category_name: string })[]
  is_available_now: boolean
  distance: number | null
}

export default function FreelancersPage() {
  const { supabase } = useSupabase()
  const [freelancers, setFreelancers] = useState<FreelancerWithOfferings[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [priceRange, setPriceRange] = useState([0, 200])
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [availableSkills, setAvailableSkills] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [availableNowOnly, setAvailableNowOnly] = useState(false)
  const [locationSearch, setLocationSearch] = useState("")
  const [searchCoordinates, setSearchCoordinates] = useState<{ lat: number; lng: number } | null>(null)
  const [searchRadius, setSearchRadius] = useState<number>(25)
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null)

  useEffect(() => {
    const fetchFreelancers = async () => {
      setLoading(true)

      try {
        // Build the query URL with all filters
        let queryUrl = `/api/freelancers?search=${encodeURIComponent(searchTerm)}&minPrice=${priceRange[0]}&maxPrice=${priceRange[1]}`

        if (selectedSkills.length > 0) {
          queryUrl += `&skills=${selectedSkills.join(",")}`
        }

        if (selectedCategories.length > 0) {
          queryUrl += `&categories=${selectedCategories.join(",")}`
        }

        if (availableNowOnly) {
          queryUrl += `&availableNow=true`
        }

        // Add location parameters if available
        if (searchCoordinates) {
          queryUrl += `&latitude=${searchCoordinates.lat}&longitude=${searchCoordinates.lng}&radius=${searchRadius}`
        }

         if (selectedCategories) queryUrl += `&category=${selectedCategories}`
        if (selectedSubcategory) queryUrl += `&subcategory=${selectedSubcategory}`

        const response = await fetch(queryUrl, {
          credentials: 'include',
          cache: 'no-store'
        })
        const data = await response.json()

        if (data.error) {
          throw new Error(data.error)
        }

        setFreelancers(data.freelancers || [])

        // Extract all unique skills for the filter
        const allSkills = new Set<string>()
        data.freelancers.forEach((freelancer: FreelancerWithOfferings) => {
          freelancer.skills?.forEach((skill) => {
            allSkills.add(skill)
          })
        })
        setAvailableSkills(Array.from(allSkills))
      } catch (error) {
        console.error("Error fetching freelancers:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchFreelancers()
  }, [
    supabase,
    searchTerm,
    priceRange,
    selectedSkills,
    selectedCategories,
    availableNowOnly,
    searchCoordinates,
    searchRadius,
    selectedSubcategory,
  ])

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) => (prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]))
  }

  const resetFilters = () => {
    setSearchTerm("")
    setPriceRange([0, 200])
    setSelectedSkills([])
    setSelectedCategories([])
    setAvailableNowOnly(false)
    setLocationSearch("")
    setSearchCoordinates(null)
    setSearchRadius(25)
    setSelectedSubcategory(null)
  }
  
  useEffect(() => {
    setSelectedSubcategory(null)
  }, [selectedCategories])

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Find Freelancers</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Filters */}
        <Card className="md:col-span-1 h-fit sticky top-20">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4">Filters</h2>

            <div className="space-y-6">
              {/* <div>
                <Label htmlFor="search" className="mb-2 block">
                  Search
                </Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search freelancers..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div> */}

              <div>
                <Label className="mb-2 block">Job Categories</Label>
                <JobCategorySelector
                  selectedCategories={selectedCategories}
                  onChange={setSelectedCategories}
                  className="mb-2"
                />
              </div>

              
              <div className="space-y-2">
                <Label htmlFor="subcategory">Subcategory</Label>
                <JobSubcategorySelector
                  categoryId={selectedCategories[0] || ""}
                  selectedSubcategory={selectedSubcategory}
                  onChange={setSelectedSubcategory}
                />
              </div>

              {/* <div className="flex items-center space-x-2">
                <Switch id="available-now" checked={availableNowOnly} onCheckedChange={setAvailableNowOnly} />
                <Label htmlFor="available-now" className="flex items-center">
                  <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                  Available Now Only
                </Label>
              </div> */}

              <div>
                <Label className="mb-2 block">Hourly Rate (€)</Label>
                <div className="pt-4 px-2">
                  <Slider defaultValue={[0, 200]} max={200} step={5} value={priceRange} onValueChange={setPriceRange} />
                  <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                    <span>€{priceRange[0]}</span>
                    <span>€{priceRange[1]}</span>
                  </div>
                </div>
              </div>

              {/* <div>
                <Label className="mb-2 block">Skills</Label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {availableSkills.map((skill) => (
                    <div key={skill} className="flex items-center space-x-2">
                      <Checkbox
                        id={`skill-${skill}`}
                        checked={selectedSkills.includes(skill)}
                        onCheckedChange={() => toggleSkill(skill)}
                      />
                      <Label htmlFor={`skill-${skill}`} className="text-sm font-normal">
                        {skill}
                      </Label>
                    </div>
                  ))}
                </div>
              </div> */}

              <div>
                <Label className="mb-2 block">Location</Label>
                <LocationInput
                  value={locationSearch}
                  onChange={(value, result) => {
                    setLocationSearch(value)
                    if (result) {
                      setSearchCoordinates({
                        lat: result.lat,
                        lng: result.lng,
                      })
                    } else {
                      setSearchCoordinates(null)
                    }
                  }}
                  placeholder="Search by location"
                  showRadius={!!searchCoordinates}
                  radiusValue={searchRadius}
                  onRadiusChange={setSearchRadius}
                  className="mb-2"
                />
                {searchCoordinates && (
                  <p className="text-xs text-muted-foreground">Showing freelancers within {searchRadius} km</p>
                )}
              </div>

              <Button variant="outline" className="w-full" onClick={resetFilters}>
                Reset Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Freelancer List */}
        <div className="md:col-span-3">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : freelancers.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium">No freelancers found</h3>
              <p className="text-muted-foreground mt-2">Try adjusting your filters</p>
            </div>
          ) : (
            <BentoGrid className="max-w-4xl mx-auto md:auto-rows-[20rem]">
              {freelancers.map((freelancer) => (
                <Link key={freelancer.id} href={`/freelancers/${freelancer.id}`}>
                <BentoGridItem
                  key={freelancer.id}
                  title={`${freelancer.first_name} ${freelancer.last_name}`}
                  hour={(<p>€{freelancer.hourly_rate}/hour</p>)}
                  distance={freelancer.distance !== null && (
                    <div className="flex items-center mt-1">
                      <MapPin className="h-3 w-3 mr-1" />
                      <span>{Math.round(freelancer.distance * 10) / 10} km away</span>
                    </div>
                  )}
                  description={freelancer.location && (
                    <div className="flex items-center">
                      <MapPin className="mr-1 h-4 w-4 text-muted-foreground" />
                      <span>{freelancer.location || 'Location not specified'}</span>
                    </div>
                    )}
                  header={
                    <div className="relative h-40 w-full">
                      <Image
                        src={freelancer.avatar_url || `/placeholder.svg?height=160&width=320&text=${freelancer.first_name || "Freelancer"}`}
                        alt={`${freelancer.first_name} ${freelancer.last_name}`}
                        fill
                        className="object-cover rounded-t-lg"
                      />
                      {freelancer.is_available_now && (
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-green-500 hover:bg-green-600">
                            <Clock className="h-3 w-3 mr-1" />
                            Available Now
                          </Badge>
                        </div>
                      )}
                    </div>
                  }
                  className="hover:shadow-lg transition-shadow"
                  icon={
                    <div className="flex items-center">
                      <Star className="h-4 w-4 fill-primary text-primary" />
                      <span className="ml-1 text-sm font-medium">4.9</span>
                    </div>
                  }
                />
                </Link>
              ))}
            </BentoGrid>
          )}
        </div>
      </div>
    </div>
  )
}

