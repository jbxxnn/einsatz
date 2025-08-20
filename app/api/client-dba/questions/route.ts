import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
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

    // Fetch client DBA questions (only questions for clients, excluding presets)
    const { data: questions, error } = await supabase
      .from('dba_questions')
      .select('*')
      .eq('respondent_type', 'client')
      .eq('is_visible', true)
      .order('category', { ascending: true })
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching client DBA questions:', error)
      return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 })
    }

    // Group questions by category for better UX
    const groupedQuestions = questions.reduce((acc: any, question) => {
      const category = question.category || 'general'
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(question)
      return acc
    }, {})

    return NextResponse.json({
      questions: groupedQuestions,
      totalQuestions: questions.length
    })

  } catch (error) {
    console.error('Unexpected error in client DBA questions API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}






