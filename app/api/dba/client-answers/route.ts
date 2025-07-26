// import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/lib/database.types'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerComponentClient<Database>({ cookies: () => cookieStore })
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const bookingId = searchParams.get('bookingId')

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 })
    }

    // Get client answers for the booking
    const { data: answers, error } = await supabase
      .from('dba_booking_answers')
      .select(`
        *,
        dba_questions (
          id,
          category,
          question_text_en,
          question_text_nl,
          question_type,
          weight,
          order_index
        )
      `)
      .eq('booking_id', bookingId as any)
      .order('dba_questions.order_index')

    if (error) {
      console.error('Error fetching client answers:', error)
      return NextResponse.json({ error: 'Failed to fetch answers' }, { status: 500 })
    }

    return NextResponse.json({ answers: answers || [] })
  } catch (error) {
    console.error('Error in GET /api/dba/client-answers:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerComponentClient<Database>({ cookies: () => cookieStore })
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { bookingId, answers } = body

    if (!bookingId || !answers || !Array.isArray(answers)) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 })
    }

    // Verify the user is the client for this booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('client_id, freelancer_id')
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    if (booking && 'client_id' in booking && booking.client_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Delete existing answers for this booking
    await supabase
      .from('dba_booking_answers')
      .delete()
      .eq('booking_id', bookingId as any)

    // Insert new answers
    const answersToInsert = answers.map((answer: any) => ({
      booking_id: bookingId,
      client_id: (booking as any)?.client_id,
      freelancer_id: (booking as any)?.freelancer_id,
      question_id: answer.question_id,
      answer_value: answer.answer_value
    }))

    const { data: insertedAnswers, error: insertError } = await supabase
      .from('dba_booking_answers')
      .insert(answersToInsert as any)
      .select()

    if (insertError) {
      console.error('Error inserting client answers:', insertError)
      return NextResponse.json({ error: 'Failed to save answers' }, { status: 500 })
    }

    // Log the action
    await supabase
      .from('dba_audit_logs')
      .insert({
        booking_id: bookingId,
        user_id: user.id,
        action: 'client_questionnaire_completed',
        details: {
          answers_count: answers.length,
          completed_at: new Date().toISOString()
        }
      } as any)

    return NextResponse.json({ 
      success: true, 
      answers: insertedAnswers,
      message: 'Client DBA answers saved successfully'
    })
  } catch (error) {
    console.error('Error in POST /api/dba/client-answers:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerComponentClient<Database>({ cookies: () => cookieStore })
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { bookingId, answers } = body

    if (!bookingId || !answers || !Array.isArray(answers)) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 })
    }

    // Verify the user is the client for this booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('client_id, freelancer_id')
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    if (booking && 'client_id' in booking && booking.client_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Update answers one by one
    const updatePromises = answers.map(async (answer: any) => {
      const { error } = await supabase
        .from('dba_booking_answers')
        .update({ answer_value: answer.answer_value } as any)
        .eq('booking_id', bookingId as any)
        .eq('question_id', answer.question_id as any)

      return { question_id: answer.question_id, error }
    })

    const results = await Promise.all(updatePromises)
    const errors = results.filter(result => result.error)

    if (errors.length > 0) {
      console.error('Errors updating client answers:', errors)
      return NextResponse.json({ error: 'Failed to update some answers' }, { status: 500 })
    }

    // Log the action
    await supabase
      .from('dba_audit_logs')
      .insert({
        booking_id: bookingId,
        user_id: user.id,
        action: 'client_questionnaire_updated',
        details: {
          answers_count: answers.length,
          updated_at: new Date().toISOString()
        }
      } as any)

    return NextResponse.json({ 
      success: true, 
      message: 'Client DBA answers updated successfully'
    })
  } catch (error) {
    console.error('Error in PUT /api/dba/client-answers:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 