import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// GET - Get a specific booking request
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const { data, error } = await supabase
      .from('booking_requests')
      .select(`
        *,
        profiles!booking_requests_client_id_fkey(id, first_name, last_name, avatar_url, email, phone),
        profiles!booking_requests_freelancer_id_fkey(id, first_name, last_name, avatar_url),
        job_categories(id, name, icon)
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching booking request:', error)
      return NextResponse.json({ error: 'Failed to fetch booking request' }, { status: 500 })
    }

    // Check if user has access to this request
    if (data.client_id !== user.id && data.freelancer_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Mark as viewed if freelancer is viewing
    if (data.freelancer_id === user.id && !data.viewed_by_freelancer) {
      await supabase
        .from('booking_requests')
        .update({ viewed_by_freelancer: true, viewed_at: new Date().toISOString() })
        .eq('id', id)
    }

    return NextResponse.json({ request: data })

  } catch (error) {
    console.error('Unexpected error in booking request API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH - Update booking request (for freelancer to respond)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { action, ...updateData } = body

    // First, get the request to check ownership
    const { data: existingRequest, error: fetchError } = await supabase
      .from('booking_requests')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existingRequest) {
      return NextResponse.json({ error: 'Booking request not found' }, { status: 404 })
    }

    // Handle different actions
    if (action === 'accept') {
      // Accept the request - convert to booking
      // This will be handled by creating a booking from the request
      const { data, error } = await supabase
        .from('booking_requests')
        .update({
          status: 'accepted',
          freelancer_responded_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: 'Failed to accept request' }, { status: 500 })
      }

      // TODO: Create booking from accepted request
      // TODO: Send notification to client

      return NextResponse.json({ request: data })
    }

    if (action === 'reject') {
      const { data, error } = await supabase
        .from('booking_requests')
        .update({
          status: 'rejected',
          freelancer_responded_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: 'Failed to reject request' }, { status: 500 })
      }

      // TODO: Send notification to client

      return NextResponse.json({ request: data })
    }

    if (action === 'counter_offer') {
      // Check if freelancer owns this request
      if (existingRequest.freelancer_id !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const { data, error } = await supabase
        .from('booking_requests')
        .update({
          status: 'counter_offered',
          freelancer_proposed_date: updateData.proposed_date || null,
          freelancer_proposed_start_time: updateData.proposed_start_time || null,
          freelancer_proposed_end_time: updateData.proposed_end_time || null,
          freelancer_proposed_rate: updateData.proposed_rate ? Number.parseFloat(updateData.proposed_rate) : null,
          freelancer_proposed_total: updateData.proposed_total ? Number.parseFloat(updateData.proposed_total) : null,
          freelancer_response_notes: updateData.response_notes || null,
          freelancer_responded_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating booking request:', error)
        return NextResponse.json({ error: 'Failed to submit counter offer' }, { status: 500 })
      }

      // TODO: Send notification to client

      return NextResponse.json({ request: data })
    }

    // Generic update (for client to accept/reject counter offer or freelancer to update after converting)
    if (action === 'client_accept_counter' || action === 'client_reject_counter') {
      if (existingRequest.client_id !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const status = action === 'client_accept_counter' ? 'accepted' : 'pending'
      
      const { data, error } = await supabase
        .from('booking_requests')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: 'Failed to update request' }, { status: 500 })
      }

      // TODO: Send notification to freelancer
      // TODO: If accepted, create booking from request

      return NextResponse.json({ request: data })
    }

    // Generic update action (for converting to booking or other updates)
    if (action === 'update') {
      // Check if user has access (either client or freelancer)
      if (existingRequest.client_id !== user.id && existingRequest.freelancer_id !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const { data, error } = await supabase
        .from('booking_requests')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: 'Failed to update request' }, { status: 500 })
      }

      return NextResponse.json({ request: data })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Unexpected error in booking request API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}



