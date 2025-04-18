import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { format, parseISO, isSameDay, addHours, isWithinInterval } from "date-fns"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const freelancerId = url.searchParams.get("freelancerId")
  const categoryId = url.searchParams.get("categoryId")
  const date = url.searchParams.get("date")

  if (!freelancerId || !categoryId || !date) {
    return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
  }

  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  try {
    const selectedDate = parseISO(date)
    const dayOfWeek = selectedDate.getDay() // 0 = Sunday, 1 = Monday, etc.

    // Fetch all availability entries for this freelancer and category
    const { data: availabilityEntries, error: availabilityError } = await supabase
      .from("freelancer_availability")
      .select("*")
      .eq("freelancer_id", freelancerId)
      .eq("category_id", categoryId)

    if (availabilityError) {
      throw availabilityError
    }

    // Filter availability entries for this specific date
    const directAvailability = availabilityEntries?.filter((entry) => {
      const entryDate = new Date(entry.start_time)
      return !entry.is_recurring && isSameDay(entryDate, selectedDate)
    })

    // Filter recurring availability that applies to this date
    const recurringAvailability = availabilityEntries?.filter((entry) => {
      if (!entry.is_recurring) return false

      const entryStartDate = new Date(entry.start_time)
      const entryEndDate = entry.recurrence_end_date ? new Date(entry.recurrence_end_date) : null

      // Check if the date is after the start date of the recurring pattern
      if (selectedDate < entryStartDate) return false

      // Check if the date is before the end date of the recurring pattern (if any)
      if (entryEndDate && selectedDate > entryEndDate) return false

      // Check if the day of week matches
      const entryDayOfWeek = entryStartDate.getDay()

      if (entry.recurrence_pattern === "weekly") {
        return entryDayOfWeek === dayOfWeek
      } else if (entry.recurrence_pattern === "biweekly") {
        // Calculate weeks difference
        const diffTime = Math.abs(selectedDate.getTime() - entryStartDate.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        const diffWeeks = Math.floor(diffDays / 7)

        return entryDayOfWeek === dayOfWeek && diffWeeks % 2 === 0
      } else if (entry.recurrence_pattern === "monthly") {
        // Check if it's the same day of the month
        return entryStartDate.getDate() === selectedDate.getDate()
      }

      return false
    })

    // Combine all applicable availability entries
    const allAvailability = [...directAvailability, ...recurringAvailability]

    if (allAvailability.length === 0) {
      return NextResponse.json({
        availabilityBlocks: [],
      })
    }

    // Fetch all bookings for this freelancer on this date
    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("start_time, end_time")
      .eq("freelancer_id", freelancerId)
      .eq("category_id", categoryId)
      .not("status", "in", '("cancelled")')

    if (bookingsError) {
      throw bookingsError
    }

    // Filter bookings for this specific date
    const bookingsOnDate =
      bookings?.filter((booking) => {
        const bookingStart = new Date(booking.start_time)
        return isSameDay(bookingStart, selectedDate)
      }) || []

    // Process each availability entry into blocks with available start times
    const availabilityBlocks = allAvailability.map((entry) => {
      // Get the time part from the entry
      const entryStartTime = new Date(entry.start_time)
      const entryEndTime = new Date(entry.end_time)

      // For recurring entries, we need to adjust the date to the selected date
      const startTime = new Date(selectedDate)
      startTime.setHours(entryStartTime.getHours(), entryStartTime.getMinutes(), 0, 0)

      const endTime = new Date(selectedDate)
      endTime.setHours(entryEndTime.getHours(), entryEndTime.getMinutes(), 0, 0)

      // Format times for display
      const startTimeStr = format(startTime, "HH:mm")
      const endTimeStr = format(endTime, "HH:mm")

      // Generate available start times in hourly increments
      const availableStartTimes = []
      let currentTime = new Date(startTime)

      while (addHours(currentTime, 1) <= endTime) {
        const timeStr = format(currentTime, "HH:mm")

        // Check if this time slot is already booked
        const isBooked = bookingsOnDate.some((booking) => {
          const bookingStart = new Date(booking.start_time)
          const bookingEnd = new Date(booking.end_time)

          return isWithinInterval(currentTime, {
            start: bookingStart,
            end: bookingEnd,
          })
        })

        if (!isBooked) {
          availableStartTimes.push(timeStr)
        }

        // Move to next hour
        currentTime = addHours(currentTime, 1)
      }

      return {
        id: entry.id,
        start: startTimeStr,
        end: endTimeStr,
        availableStartTimes,
        certainty_level: entry.certainty_level,
        is_recurring: entry.is_recurring,
        recurrence_pattern: entry.recurrence_pattern,
      }
    })

    return NextResponse.json({
      availabilityBlocks,
    })
  } catch (error) {
    console.error("Error fetching availability:", error)
    return NextResponse.json({ error: "Failed to fetch availability" }, { status: 500 })
  }
}
