import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { format, eachDayOfInterval, startOfMonth, endOfMonth, parseISO, isSameDay } from "date-fns"

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

    // Fetch all availability entries for this freelancer and category
    const { data: availabilityEntries, error: availabilityError } = await supabase
      .from("freelancer_availability")
      .select("*")
      .eq("freelancer_id", freelancerId)
      .eq("category_id", categoryId)

    if (availabilityError) {
      throw availabilityError
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

    // Process each day in the month
    const availableDates = daysInMonth
      .map((date) => {
        // Skip dates in the past
        if (date < new Date()) {
          return null
        }

        const dateStr = format(date, "yyyy-MM-dd")

        // Check for direct (non-recurring) availability on this date
        const directAvailability = availabilityEntries?.filter((entry) => {
          const entryDate = new Date(entry.start_time)
          return !entry.is_recurring && isSameDay(entryDate, date)
        })

        // Check for recurring availability that applies to this date
        const recurringAvailability = availabilityEntries?.filter((entry) => {
          if (!entry.is_recurring) return false

          const entryStartDate = new Date(entry.start_time)
          const entryEndDate = entry.recurrence_end_date ? new Date(entry.recurrence_end_date) : null

          // Check if the date is after the start date of the recurring pattern
          if (date < entryStartDate) return false

          // Check if the date is before the end date of the recurring pattern (if any)
          if (entryEndDate && date > entryEndDate) return false

          // Check if the day of week matches
          const entryDayOfWeek = entryStartDate.getDay()
          const dateDayOfWeek = date.getDay()

          if (entry.recurrence_pattern === "weekly") {
            return entryDayOfWeek === dateDayOfWeek
          } else if (entry.recurrence_pattern === "biweekly") {
            // Calculate weeks difference
            const diffTime = Math.abs(date.getTime() - entryStartDate.getTime())
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
            const diffWeeks = Math.floor(diffDays / 7)

            return entryDayOfWeek === dateDayOfWeek && diffWeeks % 2 === 0
          } else if (entry.recurrence_pattern === "monthly") {
            // Check if it's the same day of the month
            return entryStartDate.getDate() === date.getDate()
          }

          return false
        })

        // Combine all applicable availability entries
        const allAvailability = [...directAvailability, ...recurringAvailability]

        if (allAvailability.length === 0) {
          return null // No availability for this date
        }

        // Check if there are bookings that take up the entire day
        const bookingsOnDate = bookings?.filter((booking) => {
          const bookingStart = new Date(booking.start_time)
          return isSameDay(bookingStart, date)
        })

        // Determine if the date is fully booked
        // This is a simplification - in a real app, you'd check time slots more precisely
        const isFullyBooked = bookingsOnDate && bookingsOnDate.length >= allAvailability.length

        if (isFullyBooked) {
          return null
        }

        // Determine the availability status for this date
        let status: "guaranteed" | "tentative" | "unavailable" = "unavailable"

        if (allAvailability.some((entry) => entry.certainty_level === "guaranteed")) {
          status = "guaranteed"
        } else if (allAvailability.some((entry) => entry.certainty_level === "tentative")) {
          status = "tentative"
        }

        return {
          date: dateStr,
          status,
        }
      })
      .filter(Boolean) // Remove null entries

    return NextResponse.json({
      availableDates,
    })
  } catch (error) {
    console.error("Error fetching available dates:", error)
    return NextResponse.json({ error: "Failed to fetch available dates" }, { status: 500 })
  }
}

