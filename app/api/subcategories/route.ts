import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get("categoryId")

    if (!categoryId) {
      return NextResponse.json({ error: "Category ID is required" }, { status: 400 })
    }

    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const { data, error } = await supabase
      .from("job_subcategories")
      .select("*")
      .eq("category_id", categoryId)
      .order("name")

    if (error) {
      console.error("Error fetching subcategories:", error)
      return NextResponse.json({ error: "Failed to fetch subcategories" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in subcategories API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
