import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const booking_id = searchParams.get('booking_id')
    const freelancer_id = searchParams.get('freelancer_id')
    const job_category_id = searchParams.get('job_category_id')

    // Verify user authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Support two modes: booking-based lookup or direct freelancer+category lookup
    let targetFreelancerId: string
    let targetJobCategoryId: string
    
    if (booking_id) {
      // Original booking-based lookup
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('id, client_id, freelancer_id, job_category_id')
        .eq('id', booking_id)
        .eq('client_id', user.id)
        .single()

      if (bookingError || !booking) {
        return NextResponse.json({ error: 'Booking not found or unauthorized' }, { status: 404 })
      }
      
      targetFreelancerId = booking.freelancer_id
      targetJobCategoryId = booking.job_category_id
    } else if (freelancer_id && job_category_id) {
      // Direct freelancer+category lookup (for dispute modal)
      targetFreelancerId = freelancer_id
      targetJobCategoryId = job_category_id
    } else {
      return NextResponse.json({ error: 'Either booking_id or both freelancer_id and job_category_id are required' }, { status: 400 })
    }

    // Check if freelancer has completed DBA for this job category
    console.log('🔍 [FREELANCER ANSWERS API] Checking freelancer completion for:', { targetFreelancerId, targetJobCategoryId })
    
    const { data: freelancerCompletion, error: completionError } = await supabase
      .from('freelancer_dba_completions')
      .select('*')
      .eq('freelancer_id', targetFreelancerId)
      .eq('job_category_id', targetJobCategoryId)
      .eq('is_completed', true)
      .single()

    console.log('🔍 [FREELANCER ANSWERS API] Completion check result:', { freelancerCompletion, completionError })

    if (completionError || !freelancerCompletion) {
      console.log('🔍 [FREELANCER ANSWERS API] No completion found, returning error')
      return NextResponse.json({ 
        error: 'Freelancer has not completed DBA for this job category',
        has_freelancer_dba: false
      }, { status: 404 })
    }

    // Fetch freelancer's answers with question details
    console.log('🔍 [FREELANCER ANSWERS API] Fetching freelancer answers...')
    
    const { data: freelancerAnswers, error: answersError } = await supabase
      .from('freelancer_dba_answers')
      .select(`
        question_id,
        selected_option_index,
        answer_score,
        answered_at,
        dba_questions!inner (
          id,
          question_text,
          options_json,
          category,
          respondent_type
        )
      `)
      .eq('freelancer_id', targetFreelancerId)
      .eq('job_category_id', targetJobCategoryId)
      .order('question_id')

    console.log('🔍 [FREELANCER ANSWERS API] Answers fetch result:', { 
      answersCount: freelancerAnswers?.length || 0, 
      answersError,
      sampleAnswer: freelancerAnswers?.[0]
    })

    if (answersError) {
      console.error('Error fetching freelancer answers:', answersError)
      return NextResponse.json({ error: 'Failed to fetch freelancer answers' }, { status: 500 })
    }

    // Format the response to include both questions and answers
    const formattedAnswers = freelancerAnswers.map(answer => {
      const question = Array.isArray(answer.dba_questions) ? answer.dba_questions[0] : answer.dba_questions
      return {
        question_id: answer.question_id,
        question_text: question.question_text,
        category: question.category,
        options: question.options_json,
        selected_option_index: answer.selected_option_index,
        selected_answer: question.options_json[answer.selected_option_index],
        answer_score: answer.answer_score,
        answered_at: answer.answered_at
      }
    })

    // Group by category for better UX
    const groupedAnswers = formattedAnswers.reduce((acc: any, answer) => {
      const category = answer.category || 'general'
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(answer)
      return acc
    }, {})

    return NextResponse.json({
      has_freelancer_dba: true,
      freelancer_id: targetFreelancerId,
      job_category_id: targetJobCategoryId,
      total_score: freelancerCompletion.total_score,
      completion_date: freelancerCompletion.completed_at,
      answers: formattedAnswers, // Return flat array for dispute modal
      grouped_answers: groupedAnswers, // Also provide grouped format
      total_questions: formattedAnswers.length
    })

  } catch (error) {
    console.error('Unexpected error in freelancer answers API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}




