// import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const isFreelancer = url.searchParams.get("isFreelancer") === "true"
  const category = url.searchParams.get("category") // Optional category filter

  const cookieStore = await cookies()

  const supabase = createServerComponentClient({ cookies: () => cookieStore })

  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let query = supabase
      .from("dba_questions")
      .select("*")
      .eq("is_freelancer_question", isFreelancer)
      .order("order_index", { ascending: true })

    // Filter by category if specified
    if (category) {
      query = query.eq("category", category)
    }

    const { data: questions, error } = await query

    if (error) {
      throw error
    }

    // Group questions by category
    const groupedQuestions = questions.reduce((acc, question) => {
      const category = question.category
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(question)
      return acc
    }, {} as Record<string, typeof questions>)

    return NextResponse.json({
      questions: groupedQuestions,
      total: questions.length
    })
  } catch (error) {
    console.error("Error fetching DBA questions:", error)
    return NextResponse.json({ error: "Failed to fetch DBA questions" }, { status: 500 })
  }
} 