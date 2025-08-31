import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useOptimizedSupabase } from '@/components/optimized-supabase-provider'
import { toast } from '@/lib/toast'
import { format, isAfter, isBefore, addWeeks, addMonths } from 'date-fns'
import { useMemo } from 'react'

export interface AvailabilityEntry {
  id?: string
  freelancer_id: string
  start_time: string
  end_time: string
  is_recurring: boolean
  recurrence_pattern?: string | null
  recurrence_end_date?: string | null
  certainty_level: "guaranteed" | "tentative" | "unavailable"
}

export interface AvailabilityData {
  entries: AvailabilityEntry[]
  datesWithAvailability: Map<string, { date: Date; entries: AvailabilityEntry[] }>
}

// Fetch availability data
async function fetchAvailability(supabase: any, freelancerId: string): Promise<AvailabilityEntry[]> {
  const { data, error } = await supabase
    .from("freelancer_availability")
    .select("*")
    .eq("freelancer_id", freelancerId)
    .order('start_time', { ascending: true })

  if (error) throw error
  return data || []
}

// Process availability data to create date mappings
function processAvailabilityData(availability: AvailabilityEntry[]): Map<string, { date: Date; entries: AvailabilityEntry[] }> {
  const result = new Map<string, { date: Date; entries: AvailabilityEntry[] }>()

  // Process one-time availability entries
  availability.forEach((entry) => {
    const startDateTime = new Date(entry.start_time)
    const dateKey = format(startDateTime, "yyyy-MM-dd")

    if (!result.has(dateKey)) {
      result.set(dateKey, {
        date: startDateTime,
        entries: [],
      })
    }

    result.get(dateKey)?.entries.push(entry)
  })

  // Process recurring entries
  availability
    .filter((entry) => entry.is_recurring)
    .forEach((entry) => {
      const startDateTime = new Date(entry.start_time)
      const endDateTime = entry.recurrence_end_date ? new Date(entry.recurrence_end_date) : addMonths(new Date(), 6)

      // Generate recurring dates based on pattern
      let currentDate = addWeeks(new Date(startDateTime), 1) // Start from the next occurrence

      while (isBefore(currentDate, endDateTime)) {
        const dateKey = format(currentDate, "yyyy-MM-dd")

        if (!result.has(dateKey)) {
          result.set(dateKey, {
            date: new Date(currentDate),
            entries: [],
          })
        }

        result.get(dateKey)?.entries.push(entry)

        // Advance to next occurrence
        if (entry.recurrence_pattern === "weekly") {
          currentDate = addWeeks(currentDate, 1)
        } else if (entry.recurrence_pattern === "biweekly") {
          currentDate = addWeeks(currentDate, 2)
        } else if (entry.recurrence_pattern === "monthly") {
          currentDate = addMonths(currentDate, 1)
        } else {
          break // Unknown pattern
        }
      }
    })

  return result
}

// Hook for fetching availability data
export function useAvailability(freelancerId: string) {
  const { supabase } = useOptimizedSupabase()

  // Log when this hook is called
  console.log('📅 useAvailability called at:', new Date().toLocaleTimeString(), 'for freelancer:', freelancerId)

  return useQuery({
    queryKey: ['availability', freelancerId],
    queryFn: () => {
      console.log('🚀 Fetching availability at:', new Date().toLocaleTimeString(), 'for freelancer:', freelancerId)
      return fetchAvailability(supabase, freelancerId)
    },
    // Override global settings to reduce egress
    staleTime: 5 * 60 * 1000, // 5 minutes - availability changes occasionally
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false, // Disable for this query
    retry: 2, // Reduce retries
    refetchInterval: 10 * 60 * 1000, // 10 minutes instead of 2 minutes
  })
}

// Hook for availability data with processed date mappings
export function useAvailabilityData(freelancerId: string) {
  const { data: availability, isLoading, error } = useAvailability(freelancerId)
  
  const datesWithAvailability = useMemo(() => {
    if (!availability) return new Map()
    return processAvailabilityData(availability)
  }, [availability])

  return {
    availability: availability || [],
    datesWithAvailability,
    isLoading,
    error
  }
}

// Hook for creating/updating availability
export function useAvailabilityMutation() {
  const { supabase } = useOptimizedSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      freelancerId, 
      availabilityData, 
      entryId 
    }: { 
      freelancerId: string
      availabilityData: Omit<AvailabilityEntry, "id">
      entryId?: string 
    }) => {
      if (entryId) {
        // Update existing entry
        const { data, error } = await supabase
          .from("freelancer_availability")
          .update(availabilityData)
          .eq("id", entryId)
          .select()

        if (error) throw error
        return data[0]
      } else {
        // Create new entry
        const { data, error } = await supabase
          .from("freelancer_availability")
          .insert(availabilityData)
          .select()

        if (error) throw error
        return data[0]
      }
    },
    onSuccess: (data, { freelancerId, entryId }) => {
      // Invalidate and refetch availability data
      queryClient.invalidateQueries({ queryKey: ['availability', freelancerId] })
      toast.success(entryId ? "Availability updated" : "Availability added")
    },
    onError: (error: any) => {
      console.error("Error saving availability:", error)
      toast.error(`Failed to save availability: ${error?.message || 'Unknown error'}`)
    }
  })
}

// Hook for deleting availability
export function useDeleteAvailability() {
  const { supabase } = useOptimizedSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ freelancerId, entryId }: { freelancerId: string; entryId: string }) => {
      const { error } = await supabase
        .from("freelancer_availability")
        .delete()
        .eq("id", entryId)

      if (error) throw error
      return entryId
    },
    onSuccess: (_, { freelancerId }) => {
      // Invalidate and refetch availability data
      queryClient.invalidateQueries({ queryKey: ['availability', freelancerId] })
      toast.success("Availability deleted")
    },
    onError: (error: any) => {
      console.error("Error deleting availability:", error)
      toast.error("Failed to delete availability")
    }
  })
} 