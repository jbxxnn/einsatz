import { useState, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from '@/hooks/use-toast'
import type { Database } from '@/lib/database.types'

type DBAReport = Database['public']['Tables']['dba_reports']['Row']

interface GenerateReportParams {
  bookingId: string
  freelancerId: string
  clientId: string
  jobCategoryId: string
}

interface UseDBAReportReturn {
  generateReport: (params: GenerateReportParams) => Promise<DBAReport | null>
  getReportByBooking: (bookingId: string) => Promise<DBAReport | null>
  getReportById: (reportId: string) => Promise<DBAReport | null>
  loading: boolean
  error: string | null
}

export function useDBAReport(): UseDBAReportReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient<Database>()

  const generateReport = useCallback(async (params: GenerateReportParams): Promise<DBAReport | null> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/dba/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate DBA report')
      }

      toast({
        title: 'DBA Report Generated',
        description: `Compliance score: ${data.report.compliance_score}% - Risk level: ${data.report.risk_level}`,
      })

      return data.report
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate DBA report'
      setError(errorMessage)
      toast({
        title: 'Report Generation Failed',
        description: errorMessage,
        variant: 'destructive',
      })
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const getReportByBooking = useCallback(async (bookingId: string): Promise<DBAReport | null> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/dba/reports/booking/${bookingId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch DBA report')
      }

      return data.report
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch DBA report'
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const getReportById = useCallback(async (reportId: string): Promise<DBAReport | null> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/dba/reports/${reportId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch DBA report')
      }

      return data.report
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch DBA report'
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    generateReport,
    getReportByBooking,
    getReportById,
    loading,
    error,
  }
} 