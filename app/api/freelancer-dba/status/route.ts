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

    const url = new URL(request.url)
    const freelancerId = url.searchParams.get('freelancerId') || user.id
    const jobCategoryId = url.searchParams.get('jobCategoryId')

    // If specific job category requested
    if (jobCategoryId) {
      const { data: completion } = await supabase
        .from('freelancer_dba_completions')
        .select('*')
        .eq('freelancer_id', freelancerId)
        .eq('job_category_id', jobCategoryId)
        .single()

      const { data: answers } = await supabase
        .from('freelancer_dba_answers')
        .select('question_id')
        .eq('freelancer_id', freelancerId)
        .eq('job_category_id', jobCategoryId)

      return NextResponse.json({
        jobCategoryId,
        completion,
        hasStarted: (answers && answers.length > 0) || false,
        answeredCount: answers?.length || 0
      })
    }

    // Get status for all job categories
    const { data: completions } = await supabase
      .from('freelancer_dba_completions')
      .select(`
        *,
        job_categories!inner(id, name)
      `)
      .eq('freelancer_id', freelancerId)

    // Get job offerings to see which categories this freelancer offers
    const { data: offerings } = await supabase
      .from('freelancer_job_offerings')
      .select(`
        category_id,
        job_categories!inner(id, name)
      `)
      .eq('freelancer_id', freelancerId)

    // Create status for each offered category
    const statusByCategory = (offerings || []).map(offering => {
      const completion = completions?.find(c => c.job_category_id === offering.category_id)
      
      return {
        categoryId: offering.category_id,
        categoryName: offering.job_categories.name,
        completion,
        hasStarted: !!completion,
        isCompleted: completion?.is_completed || false,
        riskLevel: completion?.risk_level || null,
        riskPercentage: completion?.risk_percentage || 0,
        answeredQuestions: completion?.answered_questions || 0,
        totalQuestions: completion?.total_questions || 0
      }
    })

    return NextResponse.json({
      freelancerId,
      statusByCategory,
      totalCategories: statusByCategory.length,
      completedCategories: statusByCategory.filter(s => s.isCompleted).length
    })

  } catch (error) {
    console.error('Error fetching DBA status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
