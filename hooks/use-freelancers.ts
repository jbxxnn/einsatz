import { useQuery } from '@tanstack/react-query'
import type { Database } from '@/lib/database.types'

type Freelancer = Database["public"]["Tables"]["profiles"]["Row"] & {
  job_offerings?: Array<{
    id: string
    category_name: string
  }>
  rating?: number
  distance?: number
  is_available_now?: boolean
}

interface UseFreelancersParams {
  category?: string
  subcategory?: string
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
  wildcards?: string[]
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
  return useQuery({
    queryKey: ['freelancers', params],
    queryFn: () => fetchFreelancers(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    retry: 3,
    refetchInterval: 2 * 60 * 1000, // 2 minutes
  })
} 