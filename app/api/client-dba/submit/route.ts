import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

interface ClientDBAAnswer {
  question_id: number
  selected_option_index: number
  answer_score: number
}

interface SubmitDBARequest {
  booking_id: string
  answers: ClientDBAAnswer[]
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

    const { booking_id, answers }: SubmitDBARequest = await request.json()

    if (!booking_id || !answers || !Array.isArray(answers)) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 })
    }

    // Verify booking exists and user is the client
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, client_id, freelancer_id, job_category_id')
      .eq('id', booking_id)
      .eq('client_id', user.id)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found or unauthorized' }, { status: 404 })
    }

    console.log('DEBUG: Booking details:', { 
      booking_id, 
      freelancer_id: booking.freelancer_id, 
      job_category_id: booking.job_category_id,
      client_id: user.id
    })

    // DEBUG: Check if freelancer has completed DBA for this category
    const { data: freelancerDBA, error: freelancerDBAError } = await supabase
      .from('freelancer_dba_completions')
      .select('total_score, is_completed, risk_level')
      .eq('freelancer_id', booking.freelancer_id)
      .eq('job_category_id', booking.job_category_id)
      .single()

    console.log('DEBUG: Freelancer DBA lookup:', {
      freelancer_id: booking.freelancer_id,
      job_category_id: booking.job_category_id,
      freelancerDBA,
      freelancerDBAError
    })

    // Start transaction
    const { data, error: transactionError } = await supabase.rpc('process_client_dba_submission', {
      p_booking_id: booking_id,
      p_client_id: user.id,
      p_freelancer_id: booking.freelancer_id,
      p_job_category_id: booking.job_category_id,
      p_answers: answers
    })

    console.log('DEBUG: Function call result:', { data, transactionError })

    if (transactionError) {
      console.error('Error processing client DBA submission:', transactionError)
      return NextResponse.json({ error: 'Failed to process DBA submission' }, { status: 500 })
    }

    // Add debug info to response
    const response = {
      ...data,
      debug_server: {
        booking_id,
        freelancer_id: booking.freelancer_id,
        job_category_id: booking.job_category_id,
        freelancer_dba_check: freelancerDBA,
        answers_count: answers.length
      }
    }

    console.log('DEBUG: Sending response:', response)
    return NextResponse.json(response)

  } catch (error) {
    console.error('Unexpected error in client DBA submit API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


