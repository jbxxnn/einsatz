// import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

// Add cache control headers to improve performance
export const revalidate = 3600 // Revalidate at most every hour

export async function GET(request: Request) {
  const cookieStore = await cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })
  
  // Get locale from query parameters or default to 'en'
  const { searchParams } = new URL(request.url)
  const locale = searchParams.get('locale') || 'en'

  try {
    const { data: categories, error } = await supabase
      .from("job_categories")
      .select("id, name, name_nl, name_en, description, description_nl, description_en, icon, created_at, updated_at")
      .order("name")

    if (error) {
      throw error
    }

    // Transform categories to include localized names
    const localizedCategories = categories.map(category => ({
      ...category,
      name: locale === 'nl' ? category.name_nl : category.name_en,
      description: locale === 'nl' ? category.description_nl : category.description_en,
    }))

    // Return with cache headers
    return NextResponse.json(localizedCategories, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    })
  } catch (error) {
    console.error("Error fetching categories:", error)
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 })
  }
}
