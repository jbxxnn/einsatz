import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { format, eachDayOfInterval, startOfMonth, endOfMonth, parseISO, addDays, addWeeks, addMonths, isWithinInterval } from "date-fns"

/**
 * API route handler for fetching available dates for a freelancer
 * This endpoint returns dates when a freelancer is available for bookings
 * based on their availability schedule and existing bookings
 */
export async function GET(request: Request) {
  // Extract query parameters from the request URL
  const url = new URL(request.url)
  const freelancerId = url.searchParams.get("freelancerId")
  const serviceId = url.searchParams.get("serviceId")
  const startDate = url.searchParams.get("startDate")
  const endDate = url.searchParams.get("endDate")

  // Validate required parameters
  if (!freelancerId || !serviceId || !startDate || !endDate) {
    return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
  }

  // Initialize Supabase client with cookies
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  try {
    // Parse date strings into Date objects
    const startDateObj = parseISO(startDate)
    const endDateObj = parseISO(endDate)

    // Generate an array of all days in the specified month range
    const daysInMonth = eachDayOfInterval({
      start: startOfMonth(startDateObj),
      end: endOfMonth(endDateObj),
    })

    // Fetch the freelancer's availability schedule from the database
    const { data: availability, error: availabilityError } = await supabase
      .from("freelancer_global_availability")
      .select("*")
      .eq("freelancer_id", freelancerId)
      .eq("service_id", serviceId)
      .eq("certainty_level", "guaranteed") // Only consider guaranteed availability

    if (availabilityError) {
      throw availabilityError
    }

    // Fetch all existing bookings for the freelancer within the date range
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

    // Create a map to track booked dates
    const bookedDates = new Map()
    bookings?.forEach((booking) => {
      const bookingDate = new Date(booking.start_time).toISOString().split("T")[0]
      bookedDates.set(bookingDate, (bookedDates.get(bookingDate) || 0) + 1)
    })

    // Helper function to check if a date falls within a recurring pattern
    const isDateInRecurringPattern = (date: Date, availability: any) => {
      if (!availability.is_recurring) {
        return isWithinInterval(date, {
          start: new Date(availability.start_time),
          end: new Date(availability.end_time)
        })
      }

      const startDate = new Date(availability.start_time)
      const endDate = availability.recurrence_end_date ? new Date(availability.recurrence_end_date) : endDateObj

      if (date < startDate || date > endDate) return false

      switch (availability.recurrence_pattern) {
        case 'weekly':
          return date.getDay() === startDate.getDay()
        case 'biweekly':
          const weeksDiff = Math.floor((date.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
          return weeksDiff % 2 === 0 && date.getDay() === startDate.getDay()
        case 'monthly':
          return date.getDate() === startDate.getDate()
        default:
          return false
      }
    }

    // Filter and process available dates
    const availableDates = daysInMonth
      .filter((date) => {
        // Skip dates that are in the past
        if (date < new Date()) return false

        const dateStr = format(date, "yyyy-MM-dd")

        // Check if any availability pattern includes this date
        const hasAvailability = availability?.some((avail) => isDateInRecurringPattern(date, avail))

        // Check if the date is fully booked
        const bookingsOnDate = bookedDates.get(dateStr) || 0
        const isFullyBooked = bookingsOnDate >= availability?.length || 0

        return hasAvailability && !isFullyBooked
      })
      .map((date) => format(date, "yyyy-MM-dd"))

    // Return the list of available dates
    return NextResponse.json({
      availableDates,
    })
  } catch (error) {
    console.error("Error fetching available dates:", error)
    return NextResponse.json({ error: "Failed to fetch available dates" }, { status: 500 })
  }
}

