import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/lib/database.types'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
    
    const { freelancerId, jobCategoryId } = await request.json()

    if (!freelancerId || !jobCategoryId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check for V2 DBA answers (using question_group_id)
    const { data: freelancerAnswers, error: freelancerError } = await supabase
      .from('dba_freelancer_answers')
      .select('question_group_id, job_category_id')
      .eq('freelancer_id', freelancerId)
      .eq('job_category_id', jobCategoryId)
      .not('question_group_id', 'is', null)
      .limit(1)

    if (freelancerError) {
      console.error('🚨 [DBA Status Check] Error checking V2 answers:', freelancerError)
      return NextResponse.json({ error: 'Failed to check freelancer status' }, { status: 500 })
    }

    const hasV2Answers = freelancerAnswers && freelancerAnswers.length > 0
    const status = hasV2Answers ? 'v2_ready' : 'no_dba'

    return NextResponse.json({
      has_dba: hasV2Answers,
      has_v2_dba: hasV2Answers,
      status
    })

  } catch (error) {
    console.error('🚨 [DBA Status Check] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

