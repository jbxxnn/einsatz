import { useQuery } from '@tanstack/react-query'
import type { Database } from '@/lib/database.types'

type Freelancer = Database["public"]["Tables"]["profiles"]["Row"] & {
  job_offerings?: Array<{
    id: string
    category_name: string
    subcategory_name?: string
    pricing_type: "hourly" | "packages"
    hourly_rate?: number
    experience_years?: number
    job_offering_packages?: Array<{
      id: string
      package_name: string
      short_description: string | null
      price: number
      display_order: number
      is_active: boolean
    }>
    dba_status?: {
      risk_level: string
      risk_percentage: number
      is_completed: boolean
    } | null
  }>
  rating?: number
  distance?: number
  is_available_now?: boolean
  wildcard_categories?: {
    physical_work: boolean
    customer_facing: boolean
    outdoor_work: boolean
    odd_hours: boolean
    repetitive_work: boolean
    analytical_work: boolean
    creative_work: boolean
  } | null
  wildcard_enabled?: boolean
}

interface UseFreelancersParams {
  category?: string
  subcategory?: string
  subcategories?: string[]
  location?: string
  rating?: string
  availability?: string
  search?: string
  sortBy?: string
  sortOrder?: string
  page?: number
  limit?: number
  minPrice?: string
  maxPrice?: string
  skills?: string[]
  categories?: string[]
  availableNow?: boolean
  wildcardWorkTypes?: string[]
  wildcardOnly?: boolean
  latitude?: string
  longitude?: string
  radius?: string
}

interface FreelancersResponse {
  freelancers: Freelancer[]
  pagination: {
    page: number
    limit: number
    total: number
    hasMore: boolean
  }
}

const fetchFreelancers = async (params: UseFreelancersParams): Promise<FreelancersResponse> => {
  const searchParams = new URLSearchParams()
  
  // Add all parameters to search params
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        searchParams.set(key, value.join(','))
      } else {
        searchParams.set(key, String(value))
      }
    }
  })

  const url = `/api/freelancers?${searchParams.toString()}`
  
  const response = await fetch(url)
  
  if (!response.ok) {
    throw new Error(`Failed to fetch freelancers: ${response.status}`)
  }
  
  return response.json()
}

export function useFreelancers(params: UseFreelancersParams = {}) {
  // Log when this hook is called
  console.log('🎯 useFreelancers called at:', new Date().toLocaleTimeString(), 'with params:', params)
  
  return useQuery({
    queryKey: ['freelancers', params],
    queryFn: () => {
      console.log('🚀 Fetching freelancers at:', new Date().toLocaleTimeString())
      return fetchFreelancers(params)
    },
    // Override global settings to reduce egress
    staleTime: 10 * 60 * 1000, // 10 minutes - freelancers don't change often
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false, // Disable for this heavy query
    retry: 2, // Reduce retries
    refetchInterval: 15 * 60 * 1000, // 15 minutes instead of 2 minutes
    // Smart caching: Only refetch when data is actually stale
    // Manual refetch can be triggered for real-time updates when needed
  })
} 