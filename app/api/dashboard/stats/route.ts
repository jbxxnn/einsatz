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
      // Total bookings
      const { count: totalBookings, error: totalError } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("client_id", session.user.id)

      if (totalError) throw totalError
      stats.totalBookings = totalBookings

      // Upcoming bookings
      const { count: upcomingBookings, error: upcomingError } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("client_id", session.user.id)
        .gte("start_time", now)
        .in("status", ["pending", "confirmed"])

      if (upcomingError) throw upcomingError
      stats.upcomingBookings = upcomingBookings

      // Completed bookings
      const { count: completedBookings, error: completedError } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("client_id", session.user.id)
        .eq("status", "completed")

      if (completedError) throw completedError
      stats.completedBookings = completedBookings

      // Total spent
      const { data: payments, error: paymentsError } = await supabase
        .from("bookings")
        .select("total_amount")
        .eq("client_id", session.user.id)
        .eq("payment_status", "paid")

      if (paymentsError) throw paymentsError
      stats.totalSpent = payments.reduce((sum, booking) => sum + booking.total_amount, 0)
    } else {
      // Total bookings for freelancer
      const { count: totalBookings, error: totalError } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("freelancer_id", session.user.id)

      if (totalError) throw totalError
      stats.totalBookings = totalBookings

      // Upcoming bookings
      const { count: upcomingBookings, error: upcomingError } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("freelancer_id", session.user.id)
        .gte("start_time", now)
        .in("status", ["pending", "confirmed"])

      if (upcomingError) throw upcomingError
      stats.upcomingBookings = upcomingBookings

      // Completed bookings
      const { count: completedBookings, error: completedError } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("freelancer_id", session.user.id)
        .eq("status", "completed")

      if (completedError) throw completedError
      stats.completedBookings = completedBookings

      // Total earned
      const { data: earnings, error: earningsError } = await supabase
        .from("bookings")
        .select("total_amount")
        .eq("freelancer_id", session.user.id)
        .eq("payment_status", "paid")

      if (earningsError) throw earningsError
      stats.totalEarned = earnings.reduce((sum, booking) => sum + booking.total_amount, 0)

      // Active job offerings
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
