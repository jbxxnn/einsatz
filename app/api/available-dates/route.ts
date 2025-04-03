import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { format, eachDayOfInterval, startOfMonth, endOfMonth, parseISO } from "date-fns"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const freelancerId = url.searchParams.get("freelancerId")
  const categoryId = url.searchParams.get("categoryId")
  const startDate = url.searchParams.get("startDate")
  const endDate = url.searchParams.get("endDate")

  if (!freelancerId || !categoryId || !startDate || !endDate) {
    return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
  }

  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  try {
    const startDateObj = parseISO(startDate)
    const endDateObj = parseISO(endDate)

    // Get all days in the month
    const daysInMonth = eachDayOfInterval({
      start: startOfMonth(startDateObj),
      end: endOfMonth(endDateObj),
    })

    // Fetch all availability schedules for this freelancer and category
    const { data: schedules, error: schedulesError } = await supabase
      .from("availability_schedules")
      .select("*")
      .eq("freelancer_id", freelancerId)
      .eq("category_id", categoryId)
      .eq("is_available", true)

    if (schedulesError) {
      throw schedulesError
    }

    // Fetch all bookings for this freelancer in the date range
    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("start_time, end_time, status")
      .eq("freelancer_id", freelancerId)
      .gte("start_time", startOfMonth(startDateObj).toISOString())
      .lte("end_time", endOfMonth(endDateObj).toISOString())
      .not("status", "in", '("cancelled")')

    if (bookingsError) {
      throw bookingsError
    }

    // Create a map of day of week to availability
    const availabilityByDay = new Map()
    schedules?.forEach((schedule) => {
      availabilityByDay.set(schedule.day_of_week, true)
    })

    // Create a map of dates that have bookings
    const bookedDates = new Map()
    bookings?.forEach((booking) => {
      const bookingDate = new Date(booking.start_time).toISOString().split("T")[0]
      bookedDates.set(bookingDate, (bookedDates.get(bookingDate) || 0) + 1)
    })

    // Filter available dates - a date is available if:
    // 1. It has an availability schedule for that day of week
    // 2. It doesn't have bookings that take up the entire day
    const availableDates = daysInMonth
      .filter((date) => {
        // Skip dates in the past
        if (date < new Date()) return false

        const dayOfWeek = date.getDay()
        const dateStr = format(date, "yyyy-MM-dd")

        // Check if there's availability for this day of week
        const hasAvailability = availabilityByDay.has(dayOfWeek)

        // Check if the date is fully booked
        // This is a simplification - in a real app, you'd check time slots
        const bookingsOnDate = bookedDates.get(dateStr) || 0
        const isFullyBooked = bookingsOnDate >= (schedules?.filter((s) => s.day_of_week === dayOfWeek).length || 0)

        return hasAvailability && !isFullyBooked
      })
      .map((date) => format(date, "yyyy-MM-dd"))

    return NextResponse.json({
      availableDates,
    })
  } catch (error) {
    console.error("Error fetching available dates:", error)
    return NextResponse.json({ error: "Failed to fetch available dates" }, { status: 500 })
  }
}

