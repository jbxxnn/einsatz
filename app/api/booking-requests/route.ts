import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// GET - Fetch booking requests (for freelancer or client)
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role') // 'freelancer' or 'client'
    const status = searchParams.get('status') // Filter by status

    // Build query based on role
    let query
    
    if (role === 'freelancer') {
      // For freelancers, show client info
      query = supabase
        .from('booking_requests')
        .select(`
          *,
          profiles!booking_requests_client_id_fkey(id, first_name, last_name, avatar_url),
          job_categories(id, name, icon)
        `)
        .eq('freelancer_id', user.id)
    } else if (role === 'client') {
      // For clients, show freelancer info
      query = supabase
        .from('booking_requests')
        .select(`
          *,
          freelancer:profiles!booking_requests_freelancer_id_fkey(id, first_name, last_name, avatar_url),
          job_categories(id, name, icon)
        `)
        .eq('client_id', user.id)
    } else {
      return NextResponse.json({ error: 'Invalid role parameter' }, { status: 400 })
    }

    // Filter by status if provided
    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching booking requests:', error)
      return NextResponse.json({ error: 'Failed to fetch booking requests' }, { status: 500 })
    }

    return NextResponse.json({ requests: data })

  } catch (error) {
    console.error('Unexpected error in booking requests API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create a new booking request (client only)
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      freelancer_id,
      category_id,
      description,
      location,
      preferred_date,
      preferred_start_time,
      preferred_end_time,
      budget_amount,
      budget_is_flexible,
      additional_notes,
      images
    } = body

    // Validate required fields
    if (!freelancer_id || !category_id || !description || !location) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create booking request
    const { data, error } = await supabase
      .from('booking_requests')
      .insert({
        client_id: user.id,
        freelancer_id,
        category_id,
        description,
        location,
        preferred_date: preferred_date || null,
        preferred_start_time: preferred_start_time || null,
        preferred_end_time: preferred_end_time || null,
        budget_amount: budget_amount ? Number.parseFloat(budget_amount) : null,
        budget_is_flexible: budget_is_flexible ?? true,
        additional_notes: additional_notes || null,
        images: images || [],
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating booking request:', error)
      return NextResponse.json({ error: 'Failed to create booking request' }, { status: 500 })
    }

    // TODO: Send notification to freelancer

    return NextResponse.json({ request: data }, { status: 201 })

  } catch (error) {
    console.error('Unexpected error in booking requests API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}



