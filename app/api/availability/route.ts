import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

// Helper function to check if two time ranges overlap
function doTimesOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
  // Convert times to minutes since midnight for easier comparison
  const toMinutes = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(":").map(Number)
    return hours * 60 + minutes
  }

  const start1Min = toMinutes(start1)
  const end1Min = toMinutes(end1)
  const start2Min = toMinutes(start2)
  const end2Min = toMinutes(end2)

  // Check for overlap
  return start1Min < end2Min && start2Min < end1Min
}

// Helper function to generate hourly time slots within a range
function generateHourlyTimeSlots(startTime: string, endTime: string) {
  const slots = []
  const toMinutes = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(":").map(Number)
    return hours * 60 + minutes
  }

  const fromMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`
  }

  const startMinutes = toMinutes(startTime)
  const endMinutes = toMinutes(endTime)

  // Generate hourly slots
  for (let time = startMinutes; time < endMinutes; time += 60) {
    slots.push(fromMinutes(time))
  }

  return slots
}

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
    // Get day of week from date
    const dateObj = new Date(date)
    const dayOfWeek = dateObj.getDay() // 0 = Sunday, 6 = Saturday

    // Format date for database queries
    const formattedDate = dateObj.toISOString().split("T")[0]

    // Fetch availability schedules for the freelancer, category, and day
    const { data: schedules, error } = await supabase
      .from("availability_schedules")
      .select("*")
      .eq("freelancer_id", freelancerId)
      .eq("category_id", categoryId)
      .eq("day_of_week", dayOfWeek)
      .eq("is_available", true)

    if (error) {
      throw error
    }

    // Fetch existing bookings for the freelancer on the selected date
    const startOfDay = new Date(formattedDate)
    startOfDay.setUTCHours(0, 0, 0, 0)

    const endOfDay = new Date(formattedDate)
    endOfDay.setUTCHours(23, 59, 59, 999)

    const { data: existingBookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("start_time, end_time")
      .eq("freelancer_id", freelancerId)
      .gte("start_time", startOfDay.toISOString())
      .lte("end_time", endOfDay.toISOString())
      .not("status", "eq", "cancelled") // Exclude cancelled bookings

    if (bookingsError) {
      throw bookingsError
    }

    // Process the schedules to identify available time blocks
    const availableBlocks = []
    const bookedTimes = new Set()

    // First, collect all booked times in hourly increments
    if (existingBookings && existingBookings.length > 0) {
      for (const booking of existingBookings) {
        const bookingStart = new Date(booking.start_time)
        const bookingEnd = new Date(booking.end_time)

        // Convert to hours and iterate through each hour in the booking
        const startHour = bookingStart.getHours()
        const endHour = bookingEnd.getHours()
        const startMinutes = bookingStart.getMinutes()
        const endMinutes = bookingEnd.getMinutes()

        // Mark each hour as booked
        for (let hour = startHour; hour < endHour; hour++) {
          bookedTimes.add(`${hour.toString().padStart(2, "0")}:00`)
        }

        // Handle partial hours
        if (startMinutes > 0) {
          bookedTimes.add(`${startHour.toString().padStart(2, "0")}:${startMinutes.toString().padStart(2, "0")}`)
        }

        if (endMinutes > 0) {
          bookedTimes.add(`${endHour.toString().padStart(2, "0")}:${endMinutes.toString().padStart(2, "0")}`)
        }
      }
    }

    // Process each availability schedule
    if (schedules && schedules.length > 0) {
      for (const schedule of schedules) {
        const scheduleStart = schedule.start_time.slice(0, 5) // Format: HH:MM
        const scheduleEnd = schedule.end_time.slice(0, 5)

        // Generate hourly time slots
        const hourlySlots = generateHourlyTimeSlots(scheduleStart, scheduleEnd)

        // Filter out booked slots
        const availableSlots = hourlySlots.filter((slot) => !bookedTimes.has(slot))

        if (availableSlots.length > 0) {
          availableBlocks.push({
            start: scheduleStart,
            end: scheduleEnd,
            availableStartTimes: availableSlots,
            // We'll calculate valid end times on the client based on the selected start time
          })
        }
      }
    }

    // Check real-time availability
    const { data: realTimeAvailability } = await supabase
      .from("real_time_availability")
      .select("*")
      .eq("freelancer_id", freelancerId)
      .eq("category_id", categoryId)
      .eq("is_available_now", true)
      .single()

    return NextResponse.json(
      {
        availabilityBlocks: availableBlocks,
        isAvailableNow: !!realTimeAvailability,
      },
      { headers: { "Cache-Control": "private, max-age=60" } },
    ) // Cache for 1 minute
  } catch (error) {
    console.error("Error fetching availability:", error)
    return NextResponse.json({ error: "Failed to fetch availability" }, { status: 500 })
  }
}

