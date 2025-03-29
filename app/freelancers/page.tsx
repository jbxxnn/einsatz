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

type Profile = Database["public"]["Tables"]["profiles"]["Row"]
type JobCategory = Database["public"]["Tables"]["job_categories"]["Row"]
type JobOffering = Database["public"]["Tables"]["freelancer_job_offerings"]["Row"]

interface FreelancerWithOfferings extends Profile {
  job_offerings: (JobOffering & { category_name: string })[]
  is_available_now: boolean
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

  useEffect(() => {
    const fetchFreelancers = async () => {
      setLoading(true)

      try {
        // First, get all job categories
        const { data: categories } = await supabase.from("job_categories").select("*").order("name")

        // Fetch freelancers with their job offerings
        let query = supabase
          .from("profiles")
          .select(`
          *,
          job_offerings:freelancer_job_offerings(
            *,
            job_categories(id, name)
          )
        `)
          .eq("user_type", "freelancer")

        // Apply search filter
        if (searchTerm) {
          query = query.or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,bio.ilike.%${searchTerm}%`)
        }

        // Apply price range filter to the default hourly rate
        if (priceRange[0] > 0 || priceRange[1] < 200) {
          query = query.gte("hourly_rate", priceRange[0]).lte("hourly_rate", priceRange[1])
        }

        // Apply skills filter
        if (selectedSkills.length > 0) {
          query = query.overlaps("skills", selectedSkills)
        }

        const { data: profilesData, error } = await query

        if (error) {
          throw error
        }

        // Process the data to include availability and filter by categories
        let processedFreelancers = await Promise.all(
          (profilesData || []).map(async (profile) => {
            // Format job offerings
            const formattedOfferings = profile.job_offerings.map((offering: any) => ({
              ...offering,
              category_name: offering.job_categories.name,
            }))

            // Check real-time availability
            const { data: availabilityData } = await supabase
              .from("real_time_availability")
              .select("*")
              .eq("freelancer_id", profile.id)
              .eq("is_available_now", true)

            const isAvailableNow = availabilityData && availabilityData.length > 0

            return {
              ...profile,
              job_offerings: formattedOfferings,
              is_available_now: isAvailableNow,
            }
          }),
        )

        // Filter by selected categories if any
        if (selectedCategories.length > 0) {
          processedFreelancers = processedFreelancers.filter((freelancer) =>
            freelancer.job_offerings.some((offering: JobOffering) => selectedCategories.includes(offering.category_id)),
          )
        }

        // Filter by available now if selected
        if (availableNowOnly) {
          processedFreelancers = processedFreelancers.filter((freelancer) => freelancer.is_available_now)
        }

        setFreelancers(processedFreelancers)

        // Extract all unique skills for the filter
        const allSkills = new Set<string>()
        processedFreelancers.forEach((freelancer) => {
          freelancer.skills?.forEach((skill: string) => {
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
  }, [supabase, searchTerm, priceRange, selectedSkills, selectedCategories, availableNowOnly])

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) => (prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]))
  }

  const resetFilters = () => {
    setSearchTerm("")
    setPriceRange([0, 200])
    setSelectedSkills([])
    setSelectedCategories([])
    setAvailableNowOnly(false)
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Find Freelancers</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Filters */}
        <Card className="md:col-span-1 h-fit sticky top-20">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4">Filters</h2>

            <div className="space-y-6">
              <div>
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
              </div>

              <div>
                <Label className="mb-2 block">Job Categories</Label>
                <JobCategorySelector
                  selectedCategories={selectedCategories}
                  onChange={setSelectedCategories}
                  className="mb-2"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="available-now" checked={availableNowOnly} onCheckedChange={setAvailableNowOnly} />
                <Label htmlFor="available-now" className="flex items-center">
                  <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                  Available Now Only
                </Label>
              </div>

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

              <div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {freelancers.map((freelancer) => (
                <Link key={freelancer.id} href={`/freelancers/${freelancer.id}`}>
                  <Card className="h-full overflow-hidden hover:shadow-md transition-shadow">
                    <div className="relative h-40">
                      <Image
                        src={
                          freelancer.avatar_url ||
                          `/placeholder.svg?height=160&width=320&text=${freelancer.first_name || "Freelancer"}`
                        }
                        alt={`${freelancer.first_name} ${freelancer.last_name}`}
                        fill
                        className="object-cover"
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
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-lg">
                          {freelancer.first_name} {freelancer.last_name}
                        </h3>
                        <div className="flex items-center">
                          <Star className="h-4 w-4 fill-primary text-primary" />
                          <span className="ml-1 text-sm font-medium">4.9</span>
                        </div>
                      </div>

                      {freelancer.hourly_rate && (
                        <p className="font-medium text-primary">€{freelancer.hourly_rate}/hour</p>
                      )}

                      {freelancer.location && (
                        <div className="flex items-center mt-1 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3 mr-1" />
                          <span>{freelancer.location}</span>
                        </div>
                      )}

                      {freelancer.bio && (
                        <p className="mt-2 text-sm line-clamp-2 text-muted-foreground">{freelancer.bio}</p>
                      )}

                      <div className="mt-3 flex flex-wrap gap-1">
                        {freelancer.job_offerings.slice(0, 2).map((offering) => (
                          <Badge key={offering.id} variant="outline" className="text-xs">
                            {offering.category_name}
                          </Badge>
                        ))}
                        {freelancer.job_offerings.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{freelancer.job_offerings.length - 2} more
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

