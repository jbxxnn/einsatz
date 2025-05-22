import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { calculateDistance } from "@/lib/geocoding"

type JobOffering = {
  id: string
  category_id: string
  subcategory_id?: string
  // Add other fields as necessary
};

export async function GET(request: Request) {
  const url = new URL(request.url)
  const searchTerm = url.searchParams.get("search") || ""
  const minPrice = url.searchParams.get("minPrice") || "0"
  const maxPrice = url.searchParams.get("maxPrice") || "1000"
  const skills = url.searchParams.get("skills")?.split(",").filter(Boolean) || []
  const categories = url.searchParams.get("categories")?.split(",").filter(Boolean) || []
  const availableNow = url.searchParams.get("availableNow") === "true"
  const subcategory = url.searchParams.get("subcategory")
  const wildcards = url.searchParams.get("wildcards")?.split(",").filter(Boolean) || []
  const wildcardOnly = url.searchParams.get("wildcardOnly") === "true"

  // Location parameters
  const latitude = url.searchParams.get("latitude")
  const longitude = url.searchParams.get("longitude")
  const radius = url.searchParams.get("radius") || "10" // Default 10 km

  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  try {
    let query = supabase
      .from("profiles")
      .select(`
        *,
        job_offerings:freelancer_job_offerings!freelancer_job_offerings_freelancer_id_fkey(
          *,
          job_categories(id, name)
        )
      `)
      .eq("user_type", "freelancer")

    // Apply search filter
    if (searchTerm) {
      query = query.or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,bio.ilike.%${searchTerm}%`)
    }

    // Apply price range filter
    query = query.gte("hourly_rate", minPrice).lte("hourly_rate", maxPrice)

    // Apply skills filter
    if (skills.length > 0) {
      query = query.overlaps("skills", skills)
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

        // Check for completed bookings
        const { data: completedBookings } = await supabase
          .from("bookings")
          .select("id")
          .eq("freelancer_id", profile.id)
          .eq("status", "completed")

        // Calculate distance if coordinates are available
        let distance = null
        if (latitude && longitude && profile.latitude && profile.longitude) {
          distance = calculateDistance(
            Number.parseFloat(latitude),
            Number.parseFloat(longitude),
            profile.latitude,
            profile.longitude,
          ) * 1.60934 // Convert miles to kilometers
        }

        return {
          ...profile,
          job_offerings: formattedOfferings,
          is_available_now: isAvailableNow,
          distance: distance,
          completed_bookings: completedBookings?.length || 0
        }
      }),
    )

    // Filter by selected categories if any
    if (categories.length > 0) {
      processedFreelancers = processedFreelancers.filter((freelancer) =>
        freelancer.job_offerings.some((offering: JobOffering) => categories.includes(offering.category_id)),
      )
    }

    // Filter by subcategory if specified
    if (subcategory) {
      processedFreelancers = processedFreelancers.filter((freelancer) =>
        freelancer.job_offerings.some((offering: JobOffering) => offering.subcategory_id === subcategory),
      )
    }

    // Filter by available now if selected
    if (availableNow) {
      processedFreelancers = processedFreelancers.filter((freelancer) => freelancer.is_available_now)
    }

    // Filter by wildcards if any
    if (wildcards.length > 0) {
      processedFreelancers = processedFreelancers.filter((freelancer) => {
        // Skip if wildcard matching is not enabled or no wildcard categories are set
        if (!freelancer.wildcard_enabled || !freelancer.wildcard_categories) return false

        // Check if the freelancer matches any of the selected wildcards
        return wildcards.some((wildcard) => {
          const wildcardValue = freelancer.wildcard_categories[wildcard]
          return wildcardValue === true
        })
      })
    }

    // Filter by wildcard only if enabled
    if (wildcardOnly) {
      processedFreelancers = processedFreelancers.filter((freelancer) => freelancer.wildcard_enabled === true)
    }

    // Apply location filtering if coordinates are provided
    if (latitude && longitude) {
      const lat = Number.parseFloat(latitude)
      const lng = Number.parseFloat(longitude)
      const radiusValue = Number.parseFloat(radius)

      // Filter freelancers by distance directly in JavaScript
      // This is more reliable than using the database function which might have issues
      processedFreelancers = processedFreelancers
        .filter((freelancer) => {
          // Skip freelancers without coordinates
          if (!freelancer.latitude || !freelancer.longitude) return false

          // Calculate distance if not already calculated
          if (freelancer.distance === null) {
            freelancer.distance = calculateDistance(lat, lng, freelancer.latitude, freelancer.longitude)
          }

          // Only include freelancers within the specified radius
          return freelancer.distance !== null && freelancer.distance <= radiusValue
        })
        .sort((a, b) => (a.distance || 0) - (b.distance || 0))
    }

    return NextResponse.json({
      freelancers: processedFreelancers,
    })
  } catch (error) {
    console.error("Error fetching freelancers:", error)
    return NextResponse.json({ error: "Failed to fetch freelancers" }, { status: 500 })
  }
}
