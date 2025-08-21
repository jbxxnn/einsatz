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

export async function GET() {
  return NextResponse.json({ message: 'DBA submit endpoint is working', timestamp: new Date().toISOString() })
}

export async function POST(request: NextRequest) {
  console.log('🚀 [API] DBA submit endpoint called')
  
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
      .select('id, client_id, freelancer_id, category_id')
      .eq('id', booking_id)
      .eq('client_id', user.id)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found or unauthorized' }, { status: 404 })
    }

    // Insert client DBA answers directly into the database
    const { data: clientAnswersData, error: clientAnswersError } = await supabase
      .from('client_dba_answers')
      .insert(
        answers.map(answer => ({
          booking_id: booking_id,
          question_id: answer.question_id,
          selected_option_index: answer.selected_option_index,
          answer_score: answer.answer_score
        }))
      )
      .select()

    if (clientAnswersError) {
      console.error('Error inserting client DBA answers:', clientAnswersError)
      return NextResponse.json({ 
        error: 'Failed to save DBA answers', 
        details: clientAnswersError.message 
      }, { status: 500 })
    }

    // Calculate basic assessment
    const clientTotalScore = answers.reduce((sum, answer) => sum + answer.answer_score, 0)
    
    let riskLevel = 'safe'
    if (clientTotalScore > 60) riskLevel = 'high_risk'
    else if (clientTotalScore > 30) riskLevel = 'doubtful'

    const data = {
      assessment: {
        client_total_score: clientTotalScore,
        combined_score: clientTotalScore,
        risk_level: riskLevel
      }
    }

    const response = {
      ...data,
      debug_server: {
        booking_id,
        answers_count: answers.length,
        client_answers_saved: clientAnswersData?.length || 0
      }
    }

    console.log('DEBUG: Sending response:', response)
    return NextResponse.json(response)

  } catch (error) {
    console.error('Unexpected error in client DBA submit API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


