import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/lib/database.types'

type DBAWaiver = Database['public']['Tables']['dba_waivers']['Row']

interface CreateWaiverRequest {
  bookingId: string
  waiverReason?: string
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
    
    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { bookingId, waiverReason }: CreateWaiverRequest = await request.json()

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 })
    }

    // Verify user has access to this booking (must be the client)
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('client_id, status')
      .eq('id', bookingId as any)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Only the client can create a waiver
    if (booking.client_id !== user.id) {
      return NextResponse.json({ error: 'Only the client can create a waiver' }, { status: 403 })
    }

    // Check if booking is in a valid state for waiver
    if (booking.status !== 'pending' && booking.status !== 'confirmed') {
      return NextResponse.json({ error: 'Waiver can only be created for pending or confirmed bookings' }, { status: 400 })
    }

    // Check if waiver already exists for this booking
    const { data: existingWaiver } = await supabase
      .from('dba_waivers')
      .select('id')
      .eq('booking_id', bookingId as any)
      .single()

    if (existingWaiver) {
      return NextResponse.json({ error: 'Waiver already exists for this booking' }, { status: 409 })
    }

    // Get client IP and user agent
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Create the waiver
    const { data: waiver, error: waiverError } = await supabase
      .from('dba_waivers')
      .insert([{
        booking_id: bookingId,
        client_id: user.id,
        waiver_reason: waiverReason || null,
        ip_address: ipAddress,
        user_agent: userAgent
      }])
      .select()
      .single()

    if (waiverError) {
      console.error('Error creating waiver:', waiverError)
      return NextResponse.json({ error: 'Failed to create waiver' }, { status: 500 })
    }

    // Log audit trail
    try {
      const { data: systemUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', 'system@einsatz.com')
        .single()

      if (systemUser) {
        await supabase
          .from('dba_audit_logs')
          .insert([{
            booking_id: bookingId,
            user_id: systemUser.id,
            action: 'waiver_signed',
            details: {
              waiver_id: waiver.id,
              client_id: user.id,
              reason: waiverReason
            },
            ip_address: ipAddress,
            user_agent: userAgent
          }])
      }
    } catch (auditError) {
      console.warn('Failed to log audit trail:', auditError)
    }

    return NextResponse.json({
      success: true,
      waiver: {
        id: waiver.id,
        booking_id: waiver.booking_id,
        waiver_reason: waiver.waiver_reason,
        created_at: waiver.created_at
      }
    })

  } catch (error) {
    console.error('Error creating DBA waiver:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
    
    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const bookingId = searchParams.get('bookingId')

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
    const isClient = booking.client_id === user.id
    const isFreelancer = booking.freelancer_id === user.id

    if (!isClient && !isFreelancer) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Fetch the waiver for this booking
    const { data: waiver, error: waiverError } = await supabase
      .from('dba_waivers')
      .select('*')
      .eq('booking_id', bookingId as any)
      .single()

    if (waiverError) {
      if (waiverError.code === 'PGRST116') {
        // No waiver found for this booking
        return NextResponse.json({
          success: true,
          waiver: null,
          message: 'No DBA waiver found for this booking'
        })
      }
      return NextResponse.json({ error: 'Failed to fetch waiver' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      waiver: {
        id: waiver.id,
        booking_id: waiver.booking_id,
        client_id: waiver.client_id,
        waiver_reason: waiver.waiver_reason,
        created_at: waiver.created_at
      }
    })

  } catch (error) {
    console.error('Error fetching DBA waiver:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 