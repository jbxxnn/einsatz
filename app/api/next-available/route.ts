import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { addDays, format } from "date-fns"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const freelancerId = url.searchParams.get("freelancerId")
  const categoryId = url.searchParams.get("categoryId")
  const startDate = url.searchParams.get("startDate")
  const daysToCheck = Number.parseInt(url.searchParams.get("days") || "7", 10)

  if (!freelancerId || !categoryId || !startDate) {
    return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
  }

  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  try {
    const baseDate = new Date(startDate)

    // Check the next X days
    for (let i = 1; i <= daysToCheck; i++) {
      const checkDate = addDays(baseDate, i)
      const dayOfWeek = checkDate.getDay()
      const formattedDate = format(checkDate, "yyyy-MM-dd")

      // First check if the freelancer has any availability schedules for this day
      const { data: schedules } = await supabase
        .from("availability_schedules")
        .select("*")
        .eq("freelancer_id", freelancerId)
        .eq("category_id", categoryId)
        .eq("day_of_week", dayOfWeek)
        .eq("is_available", true)

      if (schedules && schedules.length > 0) {
        // Now check if there are any bookings that would conflict
        const startOfDay = new Date(formattedDate)
        startOfDay.setUTCHours(0, 0, 0, 0)

        const endOfDay = new Date(formattedDate)
        endOfDay.setUTCHours(23, 59, 59, 999)

        const { data: bookings } = await supabase
          .from("bookings")
          .select("start_time, end_time")
          .eq("freelancer_id", freelancerId)
          .gte("start_time", startOfDay.toISOString())
          .lte("end_time", endOfDay.toISOString())
          .not("status", "eq", "cancelled")

        // If there are fewer bookings than schedules, there's likely availability
        // This is a simplification - for a complete check we'd need to compare each time slot
        if (!bookings || bookings.length < schedules.length) {
          return NextResponse.json({
            nextAvailableDate: formattedDate,
          })
        }
      }
    }

    // No availability found in the checked range
    return NextResponse.json({
      nextAvailableDate: null,
    })
  } catch (error) {
    console.error("Error finding next available date:", error)
    return NextResponse.json({ error: "Failed to find next available date" }, { status: 500 })
  }
}

