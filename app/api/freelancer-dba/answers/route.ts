import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/lib/database.types'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
    
    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { jobCategoryId, answers } = await request.json()

    if (!jobCategoryId || !answers || !Array.isArray(answers)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate that the user is a freelancer
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single()

    if (!profile || profile.user_type !== 'freelancer') {
      return NextResponse.json({ error: 'Only freelancers can complete DBA' }, { status: 403 })
    }

    // Get question details for scoring
    const questionIds = answers.map((a: any) => a.questionId)
    const { data: questions, error: questionsError } = await supabase
      .from('dba_questions')
      .select('id, score_mapping')
      .in('id', questionIds)

    if (questionsError) {
      return NextResponse.json({ error: 'Failed to fetch question details' }, { status: 500 })
    }

    // First, auto-answer preset questions
    await supabase.rpc('auto_answer_preset_questions', {
      p_freelancer_id: user.id,
      p_job_category_id: jobCategoryId
    })

    // Prepare answers for insertion
    const answerInserts = answers.map((answer: any) => {
      const question = questions.find(q => q.id === answer.questionId)
      if (!question) {
        throw new Error(`Question ${answer.questionId} not found`)
      }

      const score = question.score_mapping[answer.selectedOptionIndex.toString()] || 0

      return {
        freelancer_id: user.id,
        job_category_id: jobCategoryId,
        question_id: answer.questionId,
        selected_option_index: answer.selectedOptionIndex,
        answer_score: score
      }
    })

    // Insert/update answers
    const { error: insertError } = await supabase
      .from('freelancer_dba_answers')
      .upsert(answerInserts, {
        onConflict: 'freelancer_id,job_category_id,question_id',
        ignoreDuplicates: false
      })

    if (insertError) {
      console.error('Error saving DBA answers:', insertError)
      return NextResponse.json({ error: 'Failed to save answers' }, { status: 500 })
    }

    // Calculate completion status
    await updateCompletionStatus(supabase, user.id, jobCategoryId)

    return NextResponse.json({ 
      success: true,
      message: 'Answers saved successfully' 
    })

  } catch (error) {
    console.error('Error in DBA answers API:', error)
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

    const url = new URL(request.url)
    const jobCategoryId = url.searchParams.get('jobCategoryId')

    if (!jobCategoryId) {
      return NextResponse.json({ error: 'Job category ID required' }, { status: 400 })
    }

    // Get completion status
    const { data: completion } = await supabase
      .from('freelancer_dba_completions')
      .select('*')
      .eq('freelancer_id', user.id)
      .eq('job_category_id', jobCategoryId)
      .single()

    // Get existing answers
    const { data: answers } = await supabase
      .from('freelancer_dba_answers')
      .select('question_id, selected_option_index, answer_score')
      .eq('freelancer_id', user.id)
      .eq('job_category_id', jobCategoryId)

    return NextResponse.json({
      completion,
      answers: answers || [],
      hasStarted: (answers && answers.length > 0) || false
    })

  } catch (error) {
    console.error('Error fetching DBA status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function updateCompletionStatus(supabase: any, freelancerId: string, jobCategoryId: string) {
  // Get total questions count
  const { data: allQuestions } = await supabase
    .from('dba_questions')
    .select('id')

  // Get answered questions count  
  const { data: answeredQuestions } = await supabase
    .from('freelancer_dba_answers')
    .select('question_id, answer_score')
    .eq('freelancer_id', freelancerId)
    .eq('job_category_id', jobCategoryId)

  if (!allQuestions || !answeredQuestions) return

  const totalQuestions = allQuestions.length
  const answeredCount = answeredQuestions.length
  const totalScore = answeredQuestions.reduce((sum, a) => sum + a.answer_score, 0)
  const maxPossibleScore = totalQuestions * 10 // Max 10 points per question
  const riskPercentage = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0
  const isCompleted = answeredCount >= totalQuestions

  // Determine risk level (we'll implement proper thresholds later)
  let riskLevel = 'safe'
  if (riskPercentage > 60) riskLevel = 'high_risk'
  else if (riskPercentage > 30) riskLevel = 'doubtful'

  // Update completion record
  await supabase
    .from('freelancer_dba_completions')
    .upsert({
      freelancer_id: freelancerId,
      job_category_id: jobCategoryId,
      total_questions: totalQuestions,
      answered_questions: answeredCount,
      total_score: totalScore,
      max_possible_score: maxPossibleScore,
      risk_percentage: riskPercentage,
      risk_level: riskLevel,
      is_completed: isCompleted,
      completed_at: isCompleted ? new Date().toISOString() : null
    }, {
      onConflict: 'freelancer_id,job_category_id',
      ignoreDuplicates: false
    })
}
