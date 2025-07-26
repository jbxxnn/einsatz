import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/lib/database.types'

type DBAQuestion = Database['public']['Tables']['dba_questions']['Row']
type DBAFreelancerAnswer = Database['public']['Tables']['dba_freelancer_answers']['Row']
type DBABookingAnswer = Database['public']['Tables']['dba_booking_answers']['Row']
type DBAReport = Database['public']['Tables']['dba_reports']['Row']

interface ReportData {
  bookingId: string
  freelancerId: string
  clientId: string
  jobCategoryId: string
}

// DBA Scoring Algorithm
function calculateDBAScore(
  freelancerAnswers: DBAFreelancerAnswer[],
  clientAnswers: DBABookingAnswer[],
  questions: DBAQuestion[]
): { score: number; riskLevel: 'safe' | 'doubtful' | 'high_risk'; details: any } {
  let totalScore = 0
  let maxPossibleScore = 0
  const answerDetails: any = {
    freelancer: {},
    client: {},
    categoryScores: {
      control: { score: 0, max: 0, answers: [] },
      substitution: { score: 0, max: 0, answers: [] },
      tools: { score: 0, max: 0, answers: [] },
      risk: { score: 0, max: 0, answers: [] },
      economic_independence: { score: 0, max: 0, answers: [] }
    }
  }

  // Process freelancer answers
  freelancerAnswers.forEach(answer => {
    const question = questions.find(q => q.id === answer.question_id)
    if (question) {
      const weight = question.weight || 1
      const score = answer.answer_value === 'true' ? weight : 0
      totalScore += score
      maxPossibleScore += weight
      
      answerDetails.freelancer[question.id] = {
        question: question.question_text_en,
        answer: answer.answer_value === 'true' ? 'Yes' : 'No',
        weight,
        score
      }
      
      if (question.category) {
        answerDetails.categoryScores[question.category].score += score
        answerDetails.categoryScores[question.category].max += weight
        answerDetails.categoryScores[question.category].answers.push({
          question: question.question_text_en,
          answer: answer.answer_value === 'true' ? 'Yes' : 'No',
          weight,
          score
        })
      }
    }
  })

  // Process client answers
  clientAnswers.forEach(answer => {
    const question = questions.find(q => q.id === answer.question_id)
    if (question) {
      const weight = question.weight || 1
      const score = answer.answer_value === 'true' ? weight : 0
      totalScore += score
      maxPossibleScore += weight
      
      answerDetails.client[question.id] = {
        question: question.question_text_en,
        answer: answer.answer_value === 'true' ? 'Yes' : 'No',
        weight,
        score
      }
      
      if (question.category) {
        answerDetails.categoryScores[question.category].score += score
        answerDetails.categoryScores[question.category].max += weight
        answerDetails.categoryScores[question.category].answers.push({
          question: question.question_text_en,
          answer: answer.answer_value === 'true' ? 'Yes' : 'No',
          weight,
          score
        })
      }
    }
  })

  // Calculate percentage score
  const percentageScore = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0

  // Determine risk level
  let riskLevel: 'safe' | 'doubtful' | 'high_risk'
  if (percentageScore <= 44) {
    riskLevel = 'safe'
  } else if (percentageScore <= 70) {
    riskLevel = 'doubtful'
  } else {
    riskLevel = 'high_risk'
  }

  return {
    score: percentageScore,
    riskLevel,
    details: {
      totalScore,
      maxPossibleScore,
      percentageScore,
      categoryScores: answerDetails.categoryScores,
      freelancerAnswers: answerDetails.freelancer,
      clientAnswers: answerDetails.client
    }
  }
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

    const { bookingId, freelancerId, clientId, jobCategoryId }: ReportData = await request.json()

    if (!bookingId || !freelancerId || !clientId || !jobCategoryId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify user has access to this booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId as any)
      .eq('client_id', clientId as any)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found or access denied' }, { status: 404 })
    }

    // Fetch all DBA questions
    const { data: questions, error: questionsError } = await supabase
      .from('dba_questions')
      .select('*')
      .order('order_index')

    if (questionsError || !questions) {
      return NextResponse.json({ error: 'Failed to fetch DBA questions' }, { status: 500 })
    }

    // Fetch freelancer answers for this job category
    const { data: freelancerAnswers, error: freelancerError } = await supabase
      .from('dba_freelancer_answers')
      .select('*')
      .eq('freelancer_id', freelancerId as any)
      .eq('job_category_id', jobCategoryId as any)

    if (freelancerError) {
      return NextResponse.json({ error: 'Failed to fetch freelancer answers' }, { status: 500 })
    }

    // Fetch client answers for this booking
    const { data: clientAnswers, error: clientError } = await supabase
      .from('dba_booking_answers')
      .select('*')
      .eq('booking_id', bookingId as any)

    if (clientError) {
      return NextResponse.json({ error: 'Failed to fetch client answers' }, { status: 500 })
    }

    // Calculate DBA score and risk level
    const { score, riskLevel, details } = calculateDBAScore(
      (freelancerAnswers || []) as any,
      (clientAnswers || []) as any,
      questions
    )

    // Generate report content
    const reportContent = {
      booking_id: bookingId,
      freelancer_id: freelancerId,
      client_id: clientId,
      score: score,
      risk_level: riskLevel,
      answers_json: details
    }

    // Store report in database
    const { data: report, error: reportError } = await supabase
      .from('dba_reports')
      .insert([reportContent])
      .select()
      .single()

    if (reportError) {
      console.error('Error storing DBA report:', reportError)
      return NextResponse.json({ error: 'Failed to store DBA report' }, { status: 500 })
    }

    // Log audit trail
    try {
      const { data: systemUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', 'system@einsatz.com')
        .single()

      if (systemUser) {
        await supabase
          .from('dba_audit_logs')
          .insert([{
            user_id: systemUser.id,
            action: 'report_generated',
            details: {
              report_id: report.id,
              booking_id: bookingId,
              score,
              risk_level: riskLevel
            }
          }])
      }
    } catch (auditError) {
      console.warn('Failed to log audit trail:', auditError)
    }

    return NextResponse.json({
      success: true,
      report: {
        id: report.id,
        score: score,
        risk_level: riskLevel,
        created_at: report.created_at
      }
    })

  } catch (error) {
    console.error('Error generating DBA report:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 