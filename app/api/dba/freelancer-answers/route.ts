// import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const jobCategoryId = url.searchParams.get("jobCategoryId")

  const cookieStore = await cookies()

  const supabase = createServerComponentClient({ cookies: () => cookieStore })

  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify user is a freelancer
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_type")
      .eq("id", user.id)
      .single()

    if (!profile || profile.user_type !== "freelancer") {
      return NextResponse.json({ error: "Only freelancers can access this endpoint" }, { status: 403 })
    }

    let query = supabase
      .from("dba_freelancer_answers")
      .select(`
        *,
        dba_questions (
          id,
          category,
          question_text_en,
          question_text_nl,
          question_type,
          weight
        )
      `)
      .eq("freelancer_id", user.id)

    if (jobCategoryId) {
      query = query.eq("job_category_id", jobCategoryId)
    }

    const { data: answers, error } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({ answers })
  } catch (error) {
    console.error("Error fetching freelancer DBA answers:", error)
    return NextResponse.json({ error: "Failed to fetch DBA answers" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })

  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify user is a freelancer
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_type")
      .eq("id", user.id)
      .single()

    if (!profile || profile.user_type !== "freelancer") {
      return NextResponse.json({ error: "Only freelancers can submit DBA answers" }, { status: 403 })
    }

    const body = await request.json()
    const { jobCategoryId, answers } = body

    if (!jobCategoryId || !answers || !Array.isArray(answers)) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 })
    }

    // Validate job category exists
    const { data: jobCategory } = await supabase
      .from("job_categories")
      .select("id")
      .eq("id", jobCategoryId)
      .single()

    if (!jobCategory) {
      return NextResponse.json({ error: "Invalid job category" }, { status: 400 })
    }

    // Prepare answers for upsert
    const answersToUpsert = answers.map((answer: any) => ({
      freelancer_id: user.id,
      job_category_id: jobCategoryId,
      question_id: answer.questionId,
      answer_value: answer.value
    }))

    // Upsert answers (insert or update)
    const { data: insertedAnswers, error } = await supabase
      .from("dba_freelancer_answers")
      .upsert(answersToUpsert, { onConflict: "freelancer_id,job_category_id,question_id" })
      .select()

    if (error) {
      throw error
    }

    // Log audit trail
    await supabase.from("dba_audit_logs").insert({
      user_id: user.id,
      action: "freelancer_dba_answers_submitted",
      details: {
        job_category_id: jobCategoryId,
        answers_count: answers.length
      }
    })

    return NextResponse.json({ 
      success: true, 
      answers: insertedAnswers,
      message: "DBA answers saved successfully"
    })
  } catch (error) {
    console.error("Error saving freelancer DBA answers:", error)
    return NextResponse.json({ error: "Failed to save DBA answers" }, { status: 500 })
  }
} 