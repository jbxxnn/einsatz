import useSWR from "swr"
import { useOptimizedSupabase } from "@/components/optimized-supabase-provider"
import { SWRConfiguration } from "swr"

// Generic fetcher function for SWR
const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Error fetching data: ${response.statusText}`)
  }
  return response.json()
}

// Supabase fetcher for SWR
export function useSupabaseSWR<T>(table: string, query: any, options?: SWRConfiguration<T>) {
  const { supabase } = useOptimizedSupabase()

  return useSWR<T>(
    table ? [table, JSON.stringify(query)] : null,
    async ([_, queryStr]: [string, string]) => {
      const parsedQuery = JSON.parse(queryStr)
      let queryBuilder = supabase.from(table).select(parsedQuery.select || "*")

      if (parsedQuery.eq) {
        for (const [key, value] of Object.entries(parsedQuery.eq)) {
          queryBuilder = queryBuilder.eq(key, value)
        }
      }

      if (parsedQuery.order) {
        queryBuilder = queryBuilder.order(parsedQuery.order.column, { ascending: parsedQuery.order.ascending })
      }

      if (parsedQuery.limit) {
        queryBuilder = queryBuilder.limit(parsedQuery.limit)
      }

      const { data, error } = await queryBuilder
      if (error) throw error
      return data as T
    },
    {
      revalidateOnFocus: false,
      ...options,
    }
  )
}

// Hook for fetching freelancers with filters
export function useFreelancers(filters: {
  search?: string
  categories?: string
  minPrice?: string
  maxPrice?: string
  availableNow?: boolean
  location?: string
  latitude?: string
  longitude?: string
  radius?: string
  wildcards?: string
  wildcardOnly?: boolean
}) {
  const queryParams = new URLSearchParams()

  if (filters.search) queryParams.set("search", filters.search)
  if (filters.categories) queryParams.set("categories", filters.categories)
  if (filters.minPrice) queryParams.set("minPrice", filters.minPrice)
  if (filters.maxPrice) queryParams.set("maxPrice", filters.maxPrice)
  if (filters.availableNow) queryParams.set("availableNow", "true")
  if (filters.wildcards) queryParams.set("wildcards", filters.wildcards)
  if (filters.wildcardOnly) queryParams.set("wildcardOnly", "true")

  // Add location parameters
  if (filters.location) queryParams.set("location", filters.location)
  if (filters.latitude) queryParams.set("latitude", filters.latitude)
  if (filters.longitude) queryParams.set("longitude", filters.longitude)
  if (filters.radius) queryParams.set("radius", filters.radius)

  const queryString = queryParams.toString()
  const url = `/api/freelancers${queryString ? `?${queryString}` : ""}`

  return useSWR(url, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000, // 1 minute
  })
}

// Hook for fetching categories
export function useCategories() {
  return useSWR("/api/categories", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 300000, // 5 minutes - categories don't change often
  })
}

// Hook for fetching user's bookings
export function useBookings(status?: string) {
  const url = status ? `/api/bookings?status=${status}` : "/api/bookings"

  return useSWR(url, fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 10000, // 10 seconds - bookings may change frequently
  })
}

// Hook for fetching user's dashboard stats
export function useDashboardStats() {
  return useSWR("/api/dashboard/stats", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000, // 1 minute
  })
}

// Hook for fetching user's upcoming bookings
export function useUpcomingBookings(limit = 5) {
  return useSWR(`/api/bookings/upcoming?limit=${limit}`, fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 30000, // 30 seconds
  })
}

// Hook for fetching freelancer availability
export function useFreelancerAvailability(freelancerId: string, month?: number, year?: number) {
  const now = new Date()
  const currentMonth = month || now.getMonth() + 1
  const currentYear = year || now.getFullYear()

  const url = `/api/available-dates?freelancerId=${freelancerId}&month=${currentMonth}&year=${currentYear}`

  return useSWR(url, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000, // 1 minute
  })
}

// Add a utility function for debouncing
export function debounce<T extends (...args: any) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}
