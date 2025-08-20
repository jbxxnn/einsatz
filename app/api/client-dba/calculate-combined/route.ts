import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { freelancer_id, job_category_id, client_answers, client_total_score } = await request.json()

    console.log('🎯 [CALCULATE API] Calculating combined DBA score...')
    console.log('🎯 [CALCULATE API] Freelancer:', freelancer_id)
    console.log('🎯 [CALCULATE API] Category:', job_category_id)
    console.log('🎯 [CALCULATE API] Client score:', client_total_score)

    // Validate inputs
    if (!freelancer_id || !job_category_id || !client_answers || client_total_score === undefined) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    // Call the RPC function to get freelancer data and calculate combined score
    const { data, error } = await supabase.rpc('calculate_combined_dba_score', {
      p_freelancer_id: freelancer_id,
      p_job_category_id: job_category_id,
      p_client_total_score: client_total_score
    })

    console.log('🎯 [CALCULATE API] RPC result:', { data, error })

    if (error) {
      console.error('🎯 [CALCULATE API] RPC error:', error)
      return NextResponse.json({ error: 'Failed to calculate combined score' }, { status: 500 })
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error('🎯 [CALCULATE API] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
