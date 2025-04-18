import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import type { Database } from "@/lib/database.types"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get("limit")
    const limit = limitParam ? Number.parseInt(limitParam, 10) : 5

    // Create a Supabase client for the route handler
    const supabase = createRouteHandlerClient<Database>({ cookies })

    // Check if user is authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user profile to determine user type
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("user_type")
      .eq("id", session.user.id)
      .single()

    if (profileError) {
      return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
    }

    // Get current date
    const now = new Date().toISOString()

    // Build query based on user type
    let query

    if (profile.user_type === "client") {
      query = supabase
        .from("bookings")
        .select(`
          *,
          freelancer:freelancer_id(id, first_name, last_name, avatar_url, hourly_rate)
        `)
        .eq("client_id", session.user.id)
        .gte("start_time", now)
        .in("status", ["pending", "confirmed"])
        .order("start_time", { ascending: true })
        .limit(limit)
    } else {
      query = supabase
        .from("bookings")
        .select(`
          *,
          client:client_id(id, first_name, last_name, avatar_url)
        `)
        .eq("freelancer_id", session.user.id)
        .gte("start_time", now)
        .in("status", ["pending", "confirmed"])
        .order("start_time", { ascending: true })
        .limit(limit)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Set cache control headers
    const headers = new Headers()
    headers.set("Cache-Control", "private, max-age=30")

    return NextResponse.json(data, {
      headers,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
