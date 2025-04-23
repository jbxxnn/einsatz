import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const freelancerId = searchParams.get("freelancerId")
  const categoryId = searchParams.get("categoryId")

  if (!freelancerId || !categoryId) {
    return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
  }

  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Get the job offering for this freelancer and category
    const { data: jobOffering, error } = await supabase
      .from("freelancer_job_offerings")
      .select("id, hourly_rate, description")
      .eq("freelancer_id", freelancerId)
      .eq("category_id", categoryId)
      .single()

    if (error) {
      console.error("Error fetching job offering:", error)
      return NextResponse.json({ error: "Failed to fetch job offering" }, { status: 500 })
    }

    return NextResponse.json(jobOffering)
  } catch (error) {
    console.error("Error in job-offering route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
