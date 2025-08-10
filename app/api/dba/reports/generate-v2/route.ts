import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/lib/database.types'

type DBAQuestionGroup = {
  id: string
  base_question_en: string
  base_question_nl: string
  category: string
  weight: number
  audience: 'freelancer' | 'client' | 'both'
  options_json: string[]
  score_mapping: Record<string, number>
  order_index: number
}

type DBAFreelancerAnswer = {
  question_group_id: string
  answer_value: string
}

type DBAClientAnswer = {
  question_group_id: string
  answer_value: string
}

type DisputeInfo = {
  question_group_id: string
  freelancer_answer: string
  client_answer: string
  dispute_score: number
  question_text: string
}

interface ReportData {
  bookingId: string
  freelancerId: string
  clientId: string
  jobCategoryId: string
}

// New Dutch DBA Scoring Algorithm - Comparison Based
function calculateDBAScoreV2(
  freelancerAnswers: DBAFreelancerAnswer[],
  clientAnswers: DBAClientAnswer[],
  questionGroups: DBAQuestionGroup[]
): { 
  score: number
  riskLevel: 'safe' | 'doubtful' | 'high_risk'
  disputes: DisputeInfo[]
  details: any 
} {
  let totalScore = 0
  let maxPossibleScore = 0
  let disputes: DisputeInfo[] = []
  
  const categoryScores: Record<string, { score: number; max: number; questions: number }> = {
    control: { score: 0, max: 0, questions: 0 },
    substitution: { score: 0, max: 0, questions: 0 },
    tools: { score: 0, max: 0, questions: 0 },
    risk: { score: 0, max: 0, questions: 0 },
    economic_independence: { score: 0, max: 0, questions: 0 }
  }

  // Process each question group
  questionGroups.forEach(questionGroup => {
    const freelancerAnswer = freelancerAnswers.find(a => a.question_group_id === questionGroup.id)
    const clientAnswer = clientAnswers.find(a => a.question_group_id === questionGroup.id)

    let questionScore = 0
    const maxQuestionScore = 10 // Max score per question in Dutch methodology

    if (questionGroup.audience === 'both') {
      // For "both" questions, compare answers and detect disputes
      if (freelancerAnswer && clientAnswer) {
        if (freelancerAnswer.answer_value === clientAnswer.answer_value) {
          // Answers match - use the score from score_mapping
          const answerIndex = parseInt(freelancerAnswer.answer_value)
          questionScore = questionGroup.score_mapping[answerIndex] || 0
        } else {
          // Answers don't match - this is a dispute
          const freelancerScore = questionGroup.score_mapping[parseInt(freelancerAnswer.answer_value)] || 0
          const clientScore = questionGroup.score_mapping[parseInt(clientAnswer.answer_value)] || 0
          
          // Use the higher risk score (higher score = more risk)
          questionScore = Math.max(freelancerScore, clientScore)
          
          // Calculate dispute severity
          const disputeScore = Math.abs(freelancerScore - clientScore)
          
          disputes.push({
            question_group_id: questionGroup.id,
            freelancer_answer: freelancerAnswer.answer_value,
            client_answer: clientAnswer.answer_value,
            dispute_score: disputeScore,
            question_text: questionGroup.base_question_en
          })
        }
      } else if (freelancerAnswer) {
        // Only freelancer answered
        const answerIndex = parseInt(freelancerAnswer.answer_value)
        questionScore = questionGroup.score_mapping[answerIndex] || 0
      } else if (clientAnswer) {
        // Only client answered
        const answerIndex = parseInt(clientAnswer.answer_value)
        questionScore = questionGroup.score_mapping[answerIndex] || 0
      }
    } else if (questionGroup.audience === 'freelancer' && freelancerAnswer) {
      // Freelancer-only question
      const answerIndex = parseInt(freelancerAnswer.answer_value)
      questionScore = questionGroup.score_mapping[answerIndex] || 0
    } else if (questionGroup.audience === 'client' && clientAnswer) {
      // Client-only question
      const answerIndex = parseInt(clientAnswer.answer_value)
      questionScore = questionGroup.score_mapping[answerIndex] || 0
    }

    // Apply question weight
    const weightedScore = questionScore * (questionGroup.weight || 1)
    const weightedMax = maxQuestionScore * (questionGroup.weight || 1)

    totalScore += weightedScore
    maxPossibleScore += weightedMax

    // Update category scores
    if (categoryScores[questionGroup.category]) {
      categoryScores[questionGroup.category].score += weightedScore
      categoryScores[questionGroup.category].max += weightedMax
      categoryScores[questionGroup.category].questions += 1
    }
  })

  // Calculate percentage score (0-100)
  const percentageScore = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0

  // Determine risk level based on Dutch methodology
  // Higher score = Higher risk (opposite of current system)
  let riskLevel: 'safe' | 'doubtful' | 'high_risk'
  if (percentageScore <= 30) {
    riskLevel = 'safe'           // Low risk - Independent contractor
  } else if (percentageScore <= 60) {
    riskLevel = 'doubtful'       // Medium risk - Unclear classification
  } else {
    riskLevel = 'high_risk'      // High risk - Likely employee relationship
  }

  // Adjust risk level based on disputes
  if (disputes.length > 0) {
    const totalDisputeScore = disputes.reduce((sum, d) => sum + d.dispute_score, 0)
    const avgDisputeScore = totalDisputeScore / disputes.length

    // Major disputes increase risk level
    if (avgDisputeScore >= 8 && riskLevel === 'safe') {
      riskLevel = 'doubtful'
    } else if (avgDisputeScore >= 5 && riskLevel === 'doubtful') {
      riskLevel = 'high_risk'
    }
  }

  return {
    score: percentageScore,
    riskLevel,
    disputes,
    details: {
      totalScore,
      maxPossibleScore,
      percentageScore,
      categoryScores,
      disputeCount: disputes.length,
      totalDisputeScore: disputes.reduce((sum, d) => sum + d.dispute_score, 0),
      methodology: 'v2_dutch_compliant'
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
      .eq('id', bookingId)
      .or(`client_id.eq.${user.id},freelancer_id.eq.${user.id}`)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found or access denied' }, { status: 404 })
    }

    // Fetch question groups (new v2 format)
    const { data: questionGroups, error: questionsError } = await supabase
      .from('dba_question_groups')
      .select('*')
      .order('order_index')

    if (questionsError || !questionGroups) {
      return NextResponse.json({ error: 'Failed to fetch DBA questions' }, { status: 500 })
    }

    // Check for freelancer answers (both V1 and V2)
    const { data: freelancerAnswersV2, error: freelancerErrorV2 } = await supabase
      .from('dba_freelancer_answers')
      .select('question_group_id, answer_value')
      .eq('freelancer_id', freelancerId)
      .eq('job_category_id', jobCategoryId)
      .not('question_group_id', 'is', null)

    const { data: freelancerAnswersV1, error: freelancerErrorV1 } = await supabase
      .from('dba_freelancer_answers')
      .select('question_id, answer_value')
      .eq('freelancer_id', freelancerId)
      .eq('job_category_id', jobCategoryId)
      .not('question_id', 'is', null)

    if (freelancerErrorV2 || freelancerErrorV1) {
      return NextResponse.json({ error: 'Failed to fetch freelancer answers' }, { status: 500 })
    }

    // Check if freelancer has completed ANY DBA for this job category
    const hasV2Answers = freelancerAnswersV2 && freelancerAnswersV2.length > 0
    const hasV1Answers = freelancerAnswersV1 && freelancerAnswersV1.length > 0

    if (!hasV2Answers && !hasV1Answers) {
      return NextResponse.json({ 
        error: 'No DBA assessment available',
        message: 'The freelancer has not completed their DBA assessment for this service category yet. Please contact them to complete it first, or proceed with the booking at your own risk.',
        has_freelancer_dba: false,
        can_proceed_anyway: true
      }, { status: 400 })
    }

    // For V2 API, we need V2 answers to do proper comparison
    if (!hasV2Answers && hasV1Answers) {
      return NextResponse.json({ 
        error: 'DBA format mismatch',
        message: 'The freelancer completed an older DBA format. They need to update their DBA assessment to the new format for proper comparison, or you can proceed at your own risk.',
        has_freelancer_dba: true,
        is_legacy_format: true,
        can_proceed_anyway: true
      }, { status: 400 })
    }

    // Use V2 answers for comparison
    const freelancerAnswers = freelancerAnswersV2

    // Fetch client answers
    const { data: clientAnswers, error: clientError } = await supabase
      .from('dba_booking_answers')
      .select('question_group_id, answer_value')
      .eq('booking_id', bookingId)

    if (clientError) {
      return NextResponse.json({ error: 'Failed to fetch client answers' }, { status: 500 })
    }

    // Calculate DBA score using new methodology
    const { score, riskLevel, disputes, details } = calculateDBAScoreV2(
      freelancerAnswers as DBAFreelancerAnswer[] || [],
      clientAnswers as DBAClientAnswer[] || [],
      questionGroups as DBAQuestionGroup[]
    )

    // Store disputes if any using new dispute table structure
    if (disputes.length > 0) {
      // Determine dispute severity based on score
      const disputeInserts = disputes.map(dispute => ({
        booking_id: bookingId,
        question_group_id: dispute.question_group_id,
        freelancer_answer: dispute.freelancer_answer,
        client_answer: dispute.client_answer,
        dispute_severity: (dispute.dispute_score >= 3 ? 'critical' : 
                         dispute.dispute_score >= 2 ? 'moderate' : 'minor') as any,
        resolution_status: 'pending' as any
      }))

      // Store individual question disputes
      await supabase
        .from('dba_question_disputes')
        .upsert(disputeInserts, { 
          onConflict: 'booking_id,question_group_id',
          ignoreDuplicates: false 
        })

      // Update booking status to indicate disputes need resolution
      await supabase
        .from('bookings')
        .update({
          has_dba_disputes: true,
          booking_status: 'pending_freelancer_review' as any,
          dispute_resolution_deadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString() // 48 hours
        })
        .eq('id', bookingId)
    } else {
      // No disputes - booking can proceed normally
      await supabase
        .from('bookings')
        .update({
          has_dba_disputes: false,
          booking_status: 'pending_acceptance' as any // Ready for freelancer acceptance
        })
        .eq('id', bookingId)
    }

    // Generate or update report
    const reportData = {
      booking_id: bookingId,
      freelancer_id: freelancerId,
      client_id: clientId,
      score: score,
      risk_level: riskLevel,
      answers_json: {
        ...details,
        disputes: disputes
      },
      dispute_count: disputes.length,
      dispute_score: disputes.reduce((sum, d) => sum + d.dispute_score, 0),
      methodology_version: 'v2_dutch_compliant'
    }

    // Upsert report
    const { data: report, error: reportError } = await supabase
      .from('dba_reports')
      .upsert(reportData, { 
        onConflict: 'booking_id',
        ignoreDuplicates: false 
      })
      .select()
      .single()

    if (reportError) {
      console.error('Error creating DBA report:', reportError)
      return NextResponse.json({ error: 'Failed to create report' }, { status: 500 })
    }

    return NextResponse.json({ 
      report,
      disputes: disputes.length > 0 ? disputes : undefined,
      message: disputes.length > 0 
        ? `Report generated with ${disputes.length} dispute(s) requiring attention`
        : 'Report generated successfully'
    })

  } catch (error) {
    console.error('Error in DBA report generation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
