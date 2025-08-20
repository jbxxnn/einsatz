import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

interface OpenDisputeRequest {
  booking_id: string
}

interface ResolveDisputeRequest {
  booking_id: string
  resolution_type: 'freelancer_updated' | 'client_proceeded' | 'cancelled'
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Verify user authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { booking_id }: OpenDisputeRequest = await request.json()

    if (!booking_id) {
      return NextResponse.json({ error: 'booking_id is required' }, { status: 400 })
    }

    // Verify booking exists and user is the client
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, client_id, freelancer_id')
      .eq('id', booking_id)
      .eq('client_id', user.id)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found or unauthorized' }, { status: 404 })
    }

    // Get the DBA assessment
    const { data: assessment, error: assessmentError } = await supabase
      .from('booking_dba_assessments')
      .select('*')
      .eq('booking_id', booking_id)
      .single()

    if (assessmentError || !assessment) {
      return NextResponse.json({ error: 'DBA assessment not found' }, { status: 404 })
    }

    // Check if dispute already exists
    const { data: existingDispute, error: disputeCheckError } = await supabase
      .from('dba_disputes')
      .select('id, status')
      .eq('booking_id', booking_id)
      .single()

    if (existingDispute && existingDispute.status === 'open') {
      return NextResponse.json({ 
        message: 'Dispute already exists',
        dispute_id: existingDispute.id
      })
    }

    // Create new dispute
    const { data: newDispute, error: createDisputeError } = await supabase
      .from('dba_disputes')
      .insert([
        {
          booking_id,
          assessment_id: assessment.id,
          client_id: booking.client_id,
          freelancer_id: booking.freelancer_id,
          status: 'open'
        }
      ])
      .select()
      .single()

    if (createDisputeError) {
      console.error('Error creating dispute:', createDisputeError)
      return NextResponse.json({ error: 'Failed to create dispute' }, { status: 500 })
    }

    // Update assessment to mark dispute as opened
    const { error: updateAssessmentError } = await supabase
      .from('booking_dba_assessments')
      .update({
        dispute_opened: true,
        dispute_opened_at: new Date().toISOString(),
        client_decision: 'disputed'
      })
      .eq('id', assessment.id)

    if (updateAssessmentError) {
      console.error('Error updating assessment for dispute:', updateAssessmentError)
      // Continue anyway as dispute was created
    }

    return NextResponse.json({
      success: true,
      dispute_id: newDispute.id,
      message: 'Dispute opened successfully'
    })

  } catch (error) {
    console.error('Unexpected error in dispute API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Verify user authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { booking_id, resolution_type }: ResolveDisputeRequest = await request.json()

    if (!booking_id || !resolution_type) {
      return NextResponse.json({ error: 'booking_id and resolution_type are required' }, { status: 400 })
    }

    // Verify user is part of this booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, client_id, freelancer_id')
      .eq('id', booking_id)
      .or(`client_id.eq.${user.id},freelancer_id.eq.${user.id}`)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found or unauthorized' }, { status: 404 })
    }

    // Update dispute status
    const { data: updatedDispute, error: updateDisputeError } = await supabase
      .from('dba_disputes')
      .update({
        status: 'resolved',
        resolution_type,
        resolved_at: new Date().toISOString()
      })
      .eq('booking_id', booking_id)
      .eq('status', 'open')
      .select()
      .single()

    if (updateDisputeError) {
      console.error('Error resolving dispute:', updateDisputeError)
      return NextResponse.json({ error: 'Failed to resolve dispute' }, { status: 500 })
    }

    // Update assessment based on resolution
    let clientDecision = 'proceed'
    if (resolution_type === 'cancelled') {
      clientDecision = 'cancelled'
    }

    const { error: updateAssessmentError } = await supabase
      .from('booking_dba_assessments')
      .update({
        dispute_resolved_at: new Date().toISOString(),
        dispute_resolution_type: resolution_type,
        client_decision: clientDecision
      })
      .eq('booking_id', booking_id)

    if (updateAssessmentError) {
      console.error('Error updating assessment after dispute resolution:', updateAssessmentError)
      // Continue anyway as dispute was resolved
    }

    return NextResponse.json({
      success: true,
      message: 'Dispute resolved successfully',
      resolution_type
    })

  } catch (error) {
    console.error('Unexpected error in resolve dispute API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}






