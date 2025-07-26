import { useState } from 'react'
import { useOptimizedSupabase } from '@/components/optimized-supabase-provider'
import { toast } from '@/hooks/use-toast'
import type { Database } from '@/lib/database.types'

type DBAWaiver = Database['public']['Tables']['dba_waivers']['Row']

interface CreateWaiverParams {
  bookingId: string
  waiverReason?: string
}

export function useDBAWaiver() {
  const { supabase } = useOptimizedSupabase()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createWaiver = async ({ bookingId, waiverReason }: CreateWaiverParams) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/dba/waivers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId,
          waiverReason
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create waiver')
      }

      return data.waiver
    } catch (err: any) {
      setError(err.message || 'Failed to create waiver')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const getWaiverByBooking = async (bookingId: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/dba/waivers?bookingId=${bookingId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch waiver')
      }

      return data.waiver
    } catch (err: any) {
      setError(err.message || 'Failed to fetch waiver')
      return null
    } finally {
      setLoading(false)
    }
  }

  const hasWaiver = async (bookingId: string) => {
    const waiver = await getWaiverByBooking(bookingId)
    return waiver !== null
  }

  return {
    loading,
    error,
    createWaiver,
    getWaiverByBooking,
    hasWaiver
  }
} 