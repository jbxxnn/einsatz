import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { feedback_type, title, description, priority, metadata } = body

    // Validate required fields
    if (!feedback_type || !title || !description) {
      return NextResponse.json({ 
        error: 'Missing required fields: feedback_type, title, and description are required' 
      }, { status: 400 })
    }

    // Validate feedback_type enum
    const validTypes = ['bug', 'feature', 'improvement', 'general', 'other']
    if (!validTypes.includes(feedback_type)) {
      return NextResponse.json({ 
        error: `Invalid feedback_type. Must be one of: ${validTypes.join(', ')}` 
      }, { status: 400 })
    }

    // Create feedback
    const { data, error } = await supabase
      .from('feedback')
      .insert({
        user_id: user.id,
        feedback_type,
        title: title.trim(),
        description: description.trim(),
        priority: priority || 'medium',
        metadata: metadata || {},
        status: 'open'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating feedback:', error)
      return NextResponse.json({ 
        error: 'Failed to create feedback',
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      feedback: data,
      success: true 
    }, { status: 201 })

  } catch (error) {
    console.error('Unexpected error in feedback API:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const feedback_type = searchParams.get('type')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = supabase
      .from('feedback')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (feedback_type) {
      query = query.eq('feedback_type', feedback_type)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching feedback:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch feedback',
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      feedback: data || [],
      count: data?.length || 0
    }, { status: 200 })

  } catch (error) {
    console.error('Unexpected error in feedback API:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}


