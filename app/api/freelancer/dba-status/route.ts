import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/lib/database.types'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
    
    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const freelancerId = searchParams.get('freelancerId') || user.id

    // Verify user can access this freelancer's data
    if (freelancerId !== user.id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', user.id)
        .single()
      
      if (profile?.user_type !== 'admin') {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    console.log('🔍 [DBA Status API] Fetching job offerings for freelancer:', freelancerId)

    // Get job categories for this freelancer (from their job offerings)
    const { data: jobOfferings, error: offeringsError } = await supabase
      .from('freelancer_job_offerings')
      .select(`
        category_id,
        job_categories!inner(id, name)
      `)
      .eq('freelancer_id', freelancerId)

    console.log('🔍 [DBA Status API] Job offerings query result:', { data: jobOfferings, error: offeringsError })

    if (offeringsError) {
      console.error('🚨 [DBA Status API] Error fetching job offerings:', offeringsError)
      return NextResponse.json({ 
        error: 'Failed to fetch job categories',
        details: offeringsError.message,
        hint: offeringsError.hint 
      }, { status: 500 })
    }

    if (!jobOfferings || jobOfferings.length === 0) {
      console.log('📝 [DBA Status API] No job offerings found for freelancer')
      return NextResponse.json({
        freelancer_id: freelancerId,
        categories: [],
        summary: {
          total_categories: 0,
          v2_complete: 0,
          v1_legacy: 0,
          not_started: 0,
          overall_v2_progress: 0
        },
        message: 'No job offerings found. Create job offerings first to enable DBA assessments.'
      })
    }

    // Get unique categories
    const uniqueCategories = jobOfferings?.reduce((acc, offering) => {
      const category = offering.job_categories
      if (category && !acc.find(c => c.id === category.id)) {
        acc.push(category)
      }
      return acc
    }, [] as any[]) || []

    // For each category, check DBA status
    const statusPromises = uniqueCategories.map(async (category) => {
      // Check V1 answers
      const { data: v1Answers } = await supabase
        .from('dba_freelancer_answers')
        .select('id, updated_at')
        .eq('freelancer_id', freelancerId)
        .eq('job_category_id', category.id)
        .not('question_id', 'is', null)

      // Check V2 answers
      const { data: v2Answers } = await supabase
        .from('dba_freelancer_answers')
        .select('id, updated_at')
        .eq('freelancer_id', freelancerId)
        .eq('job_category_id', category.id)
        .not('question_group_id', 'is', null)

      const hasV1 = v1Answers && v1Answers.length > 0
      const hasV2 = v2Answers && v2Answers.length > 0
      const v2Count = v2Answers?.length || 0
      const expectedV2Count = 35 // Total V2 questions

      return {
        category_id: category.id,
        category_name: category.name,
        has_v1: hasV1,
        has_v2: hasV2,
        v1_answers_count: v1Answers?.length || 0,
        v2_answers_count: v2Count,
        last_updated: hasV2 ? v2Answers[0]?.updated_at : (hasV1 ? v1Answers[0]?.updated_at : null),
        completion_percentage: Math.round((v2Count / expectedV2Count) * 100),
        status: hasV2 ? 'v2_complete' : hasV1 ? 'v1_legacy' : 'not_started'
      }
    })

    const statuses = await Promise.all(statusPromises)

    // Calculate overall statistics
    const totalCategories = statuses.length
    const v2CompleteCategories = statuses.filter(s => s.has_v2).length
    const v1OnlyCategories = statuses.filter(s => s.has_v1 && !s.has_v2).length
    const notStartedCategories = statuses.filter(s => !s.has_v1 && !s.has_v2).length

    return NextResponse.json({
      freelancer_id: freelancerId,
      categories: statuses,
      summary: {
        total_categories: totalCategories,
        v2_complete: v2CompleteCategories,
        v1_legacy: v1OnlyCategories,
        not_started: notStartedCategories,
        overall_v2_progress: totalCategories > 0 ? Math.round((v2CompleteCategories / totalCategories) * 100) : 0
      }
    })

  } catch (error) {
    console.error('Error fetching freelancer DBA status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
