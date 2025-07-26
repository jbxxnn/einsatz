import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import type { Database } from "@/lib/database.types"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
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

    const now = new Date().toISOString()
    const stats: any = {}

    // Get stats based on user type
    if (profile.user_type === "client") {
      // Single query to get all booking data for client
      const { data: bookings, error: bookingsError } = await supabase
        .from("bookings")
        .select("status, total_amount, payment_status, start_time")
        .eq("client_id", session.user.id)

      if (bookingsError) throw bookingsError

      // Calculate stats from the single query result
      stats.totalBookings = bookings.length
      stats.upcomingBookings = bookings.filter(b => 
        new Date(b.start_time) >= new Date(now) && 
        ["pending", "confirmed"].includes(b.status)
      ).length
      stats.completedBookings = bookings.filter(b => b.status === "completed").length
      stats.totalSpent = bookings
        .filter(b => b.payment_status === "paid")
        .reduce((sum, booking) => sum + (booking.total_amount || 0), 0)
    } else {
      // Single query to get all booking data for freelancer
      const { data: bookings, error: bookingsError } = await supabase
        .from("bookings")
        .select("status, total_amount, payment_status, start_time")
        .eq("freelancer_id", session.user.id)

      if (bookingsError) throw bookingsError

      // Calculate stats from the single query result
      stats.totalBookings = bookings.length
      stats.upcomingBookings = bookings.filter(b => 
        new Date(b.start_time) >= new Date(now) && 
        ["pending", "confirmed"].includes(b.status)
      ).length
      stats.completedBookings = bookings.filter(b => b.status === "completed").length
      stats.totalEarned = bookings
        .filter(b => b.payment_status === "paid")
        .reduce((sum, booking) => sum + (booking.total_amount || 0), 0)

      // Get active job offerings count
      const { count: activeOfferings, error: offeringsError } = await supabase
        .from("freelancer_job_offerings")
        .select("*", { count: "exact", head: true })
        .eq("freelancer_id", session.user.id)

      if (offeringsError) throw offeringsError
      stats.activeOfferings = activeOfferings
    }

    // Set cache control headers
    const headers = new Headers()
    headers.set("Cache-Control", "private, max-age=60")

    return NextResponse.json(stats, {
      headers,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
