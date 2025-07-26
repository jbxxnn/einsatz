import { useState } from 'react'
import { useOptimizedSupabase } from '@/components/optimized-supabase-provider'
import { toast } from '@/hooks/use-toast'
import type { Database } from '@/lib/database.types'

type DBAReport = Database['public']['Tables']['dba_reports']['Row']
type Booking = Database['public']['Tables']['bookings']['Row'] & {
  freelancer: Database['public']['Tables']['profiles']['Row']
  client: Database['public']['Tables']['profiles']['Row']
}

interface ContractData {
  bookingId: string
  dbaReportId?: string
  contractNumber: string
  generatedAt: string
}

export function useContract() {
  const { supabase } = useOptimizedSupabase()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateContractNumber = (bookingId: string) => {
    const timestamp = new Date().getTime().toString().slice(-6)
    const bookingSuffix = bookingId.substring(0, 4).toUpperCase()
    return `CON-${timestamp}-${bookingSuffix}`
  }

  const getContractByBooking = async (bookingId: string) => {
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from('dba_reports')
        .select('*')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      return data
    } catch (err: any) {
      setError(err.message || 'Failed to fetch contract')
      return null
    } finally {
      setLoading(false)
    }
  }

  const updateContractUrl = async (reportId: string, contractUrl: string) => {
    try {
      const { error } = await supabase
        .from('dba_reports')
        .update({ contract_pdf_url: contractUrl })
        .eq('id', reportId)

      if (error) throw error

      return true
    } catch (err: any) {
      setError(err.message || 'Failed to update contract URL')
      return false
    }
  }

  const downloadContract = async (booking: Booking, dbaReport?: DBAReport) => {
    setLoading(true)
    setError(null)

    try {
      // For now, we'll trigger the browser's print dialog for the contract viewer
      // This is a simpler approach that works reliably
      
      // Wait a moment for the contract to load, then trigger print
      setTimeout(() => {
        const pdfViewer = document.querySelector('iframe[title="PDF viewer"]') as HTMLIFrameElement
        if (pdfViewer && pdfViewer.contentWindow) {
          pdfViewer.contentWindow.print()
        }
      }, 1000)

      return true
    } catch (err: any) {
      setError(err.message || 'Failed to download contract')
      return false
    } finally {
      setLoading(false)
    }
  }

  const generateContract = async (booking: Booking, dbaReport?: DBAReport) => {
    setLoading(true)
    setError(null)

    try {
      const contractNumber = generateContractNumber(booking.id)
      
      // If we have a DBA report, update it with contract info
      if (dbaReport) {
        await updateContractUrl(dbaReport.id, `contracts/${contractNumber}.pdf`)
      }

      return {
        contractNumber,
        success: true
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate contract')
      return {
        contractNumber: '',
        success: false
      }
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    error,
    generateContractNumber,
    getContractByBooking,
    updateContractUrl,
    downloadContract,
    generateContract
  }
} 