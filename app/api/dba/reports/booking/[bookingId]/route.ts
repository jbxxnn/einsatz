import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/lib/database.types'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
    const { bookingId } = await params
    
    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 })
    }

    // Verify user has access to this booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('client_id, freelancer_id')
      .eq('id', bookingId as any)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Check if user has access to this booking
    // For now, let's simplify the access check since we don't have a users table with roles
    const isClient = booking.client_id === user.id
    const isFreelancer = booking.freelancer_id === user.id

    if (!isClient && !isFreelancer) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Fetch the report for this booking
    const { data: report, error: reportError } = await supabase
      .from('dba_reports')
      .select('*')
      .eq('booking_id', bookingId as any)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (reportError) {
      if (reportError.code === 'PGRST116') {
        // No report found for this booking
        return NextResponse.json({
          success: true,
          report: null,
          message: 'No DBA report found for this booking'
        })
      }
      return NextResponse.json({ error: 'Failed to fetch report' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      report
    })

  } catch (error) {
    console.error('Error fetching DBA report by booking:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 