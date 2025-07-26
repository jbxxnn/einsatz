// import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import type { Database } from "@/lib/database.types"


export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    // Add pagination parameters
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const from = (page - 1) * limit
    const to = from + limit - 1

    const cookieStore = await cookies()

    // Create a Supabase client for the route handler
    const supabase = createServerComponentClient<Database>({ 
      cookies: () => cookieStore
     })

    // Check if user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user profile to determine user type
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("user_type")
      .eq("id", user.id as any)
      .single()

    if (profileError) {
      return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
    }

    // Build query based on user type
    let query

    if (profile && 'user_type' in profile && profile.user_type === "client") {
      query = supabase
        .from("bookings")
        .select(`
          *,
          freelancer:freelancer_id(id, first_name, last_name, avatar_url, hourly_rate)
        `)
        .eq("client_id", user.id as any)
        .order("start_time", { ascending: false })
        .range(from, to)
    } else {
      query = supabase
        .from("bookings")
        .select(`
          *,
          client:client_id(id, first_name, last_name, avatar_url)
        `)
        .eq("freelancer_id", user.id as any)
        .order("start_time", { ascending: false })
        .range(from, to)
    }

    // Apply status filter if provided
    if (status) {
      query = query.eq("status", status as any)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Set cache control headers
    const headers = new Headers()
    headers.set("Cache-Control", "private, max-age=60") // Increased cache time

    return NextResponse.json({
      bookings: data,
      pagination: {
        page,
        limit,
        total: data?.length || 0,
        hasMore: data?.length === limit
      }
    }, {
      headers,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
