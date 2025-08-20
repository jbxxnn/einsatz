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

    // Get job category ID from query params (optional - can fetch all categories)
    const url = new URL(request.url)
    const jobCategoryId = url.searchParams.get('jobCategoryId')

    // Fetch all visible questions (excludes preset questions)
    const { data: questions, error: questionsError } = await supabase
      .from('dba_questions')
      .select('*')
      .eq('is_visible', true)
      .in('respondent_type', ['freelancer', 'client']) // Only show freelancer and client questions
      .order('category, display_order')

    if (questionsError) {
      console.error('Error fetching DBA questions:', questionsError)
      return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 })
    }

    // Group questions by category for better UX
    const groupedQuestions = questions.reduce((acc, question) => {
      const category = question.category || 'general'
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(question)
      return acc
    }, {} as Record<string, typeof questions>)

    // If jobCategoryId is provided, also fetch existing answers
    let existingAnswers: any[] = []
    if (jobCategoryId) {
      const { data: answers, error: answersError } = await supabase
        .from('freelancer_dba_answers')
        .select('question_id, selected_option_index, answer_score')
        .eq('freelancer_id', user.id)
        .eq('job_category_id', jobCategoryId)

      if (!answersError && answers) {
        existingAnswers = answers
      }
    }

    return NextResponse.json({
      questions: groupedQuestions,
      existingAnswers,
      totalQuestions: questions.length
    })

  } catch (error) {
    console.error('Error in DBA questions API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
