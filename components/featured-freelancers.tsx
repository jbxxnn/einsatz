"use client"

import { useState, useEffect } from "react"
import { useOptimizedSupabase } from "./optimized-supabase-provider"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Star, MapPin, MessageCircle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import type { Database } from "@/lib/database.types"
import LoadingSpinner from "@/components/loading-spinner"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]

export default function FeaturedFreelancers() {
  const { supabase } = useOptimizedSupabase()
  const [freelancers, setFreelancers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>("all")
  const [availableSkills, setAvailableSkills] = useState<string[]>([])

  useEffect(() => {
    const fetchFreelancers = async () => {
      setLoading(true)

      try {
        // Fetch freelancers with at least one skill and an hourly rate
        let query = supabase
          .from("profiles")
          .select("*")
          .eq("user_type", "freelancer")
          .not("skills", "is", null)
          .not("hourly_rate", "is", null)
          .order("created_at", { ascending: false })
          .limit(6)

        // Apply skill filter if not "all"
        if (filter !== "all") {
          query = query.contains("skills", [filter])
        }

        const { data, error } = await query

        if (error) {
          console.error("Error fetching freelancers:", error)
        } else {
          setFreelancers(data || [])

          // Extract all unique skills for the filter
          if (availableSkills.length === 0) {
            const allSkills = new Set<string>()
            data?.forEach((freelancer) => {
              freelancer.skills?.forEach((skill: string) => {
                allSkills.add(skill)
              })
            })
            setAvailableSkills(Array.from(allSkills))
          }
        }
      } catch (error) {
        console.error("Error:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchFreelancers()
  }, [supabase, filter, availableSkills.length])

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner />
      </div>
    )
  }

  if (freelancers.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No freelancers found. Please check back later.</p>
      </div>
    )
  }

  return (
    <div className="mt-8">
      <div className="flex justify-end mb-6">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filter by skill:</span>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select a skill" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Skills</SelectItem>
              {availableSkills.map((skill) => (
                <SelectItem key={skill} value={skill}>
                  {skill}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-3 md:grid-cols-2 grid-cols-1">
        {freelancers.map((freelancer) => (
          <Card key={freelancer.id} className="flex flex-col overflow-hidden rounded-lg border bg-background shadow-sm">
            <div className="relative">
              <Image
                src={
                  freelancer.avatar_url ||
                  `/placeholder.svg?height=200&width=400&text=${freelancer.first_name || "Freelancer"}`
                }
                width={400}
                height={200}
                alt={`${freelancer.first_name} ${freelancer.last_name}`}
                className="aspect-[2/1] w-full object-cover"
              />
            </div>
            <div className="flex flex-col space-y-1.5 p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">
                  {freelancer.first_name} {freelancer.last_name}
                </h3>
                <div className="flex items-center">
                  <Star className="h-4 w-4 fill-primary text-primary" />
                  <span className="ml-1 text-sm font-medium">4.9</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{freelancer.skills && freelancer.skills[0]}</p>
              {freelancer.location && (
                <div className="flex items-center pt-2">
                  <MapPin className="mr-1 h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{freelancer.location}</span>
                </div>
              )}
              <p className="pt-2 text-sm line-clamp-2">
                {freelancer.bio || "Professional freelancer available for work."}
              </p>
              <div className="flex flex-wrap gap-1 pt-2">
                {freelancer.skills?.slice(0, 3).map((skill) => (
                  <Badge key={skill} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
                {(freelancer.skills?.length || 0) > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{(freelancer.skills?.length || 0) - 3} more
                  </Badge>
                )}
              </div>
              <div className="flex justify-between items-center pt-4">
                <p className="font-semibold">€{freelancer.hourly_rate}/hour</p>
                <div className="flex gap-2">
                  <Link href={`/freelancers/${freelancer.id}`}>
                    <Button size="sm" variant="outline">View Profile</Button>
                  </Link>
                  <Link href={`/freelancers/${freelancer.id}`}>
                    <Button size="sm">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Message
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

