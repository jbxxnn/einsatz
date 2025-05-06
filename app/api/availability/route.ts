import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { format, parseISO, addDays, addWeeks, addMonths, isWithinInterval } from "date-fns"

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
  const serviceId = url.searchParams.get("serviceId")
  const date = url.searchParams.get("date")

  console.log("🔍 Debug: Availability Request Parameters:", {
    freelancerId,
    serviceId,
    date,
  })

  if (!freelancerId || !serviceId || !date) {
    console.error("❌ Error: Missing required parameters")
    return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
  }

  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  try {
    const dateObj = new Date(date)
    const formattedDate = dateObj.toISOString().split("T")[0]
    console.log("📅 Debug: Processing date:", formattedDate)

    // Fetch global availability entries
    const { data: availability, error: availabilityError } = await supabase
      .from("freelancer_global_availability")
      .select("*")
      .eq("freelancer_id", freelancerId)
      .eq("service_id", serviceId)
      .eq("certainty_level", "guaranteed")

    if (availabilityError) {
      console.error("❌ Error fetching availability:", availabilityError)
      throw availabilityError
    }

    console.log("📊 Debug: Found availability entries:", availability?.length || 0)
    console.log("📋 Debug: Availability entries:", availability)

    // Fetch existing bookings
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
      .not("status", "eq", "cancelled")

    if (bookingsError) {
      console.error("❌ Error fetching bookings:", bookingsError)
      throw bookingsError
    }

    console.log("📊 Debug: Found existing bookings:", existingBookings?.length || 0)
    console.log("📋 Debug: Existing bookings:", existingBookings)

    // Process availability entries
    const availableBlocks = []
    const bookedTimes = new Set()

    // Process existing bookings
    if (existingBookings && existingBookings.length > 0) {
      console.log("🔄 Debug: Processing existing bookings")
      for (const booking of existingBookings) {
        const bookingStart = new Date(booking.start_time)
        const bookingEnd = new Date(booking.end_time)
        console.log("📅 Debug: Processing booking:", {
          start: bookingStart.toISOString(),
          end: bookingEnd.toISOString(),
        })

        // Mark each hour as booked
        for (let hour = bookingStart.getHours(); hour < bookingEnd.getHours(); hour++) {
          const timeStr = `${hour.toString().padStart(2, "0")}:00`
          bookedTimes.add(timeStr)
          console.log("⏰ Debug: Marked as booked:", timeStr)
        }
      }
    }

    // Process availability entries
    if (availability && availability.length > 0) {
      console.log("🔄 Debug: Processing availability entries")
      for (const entry of availability) {
        console.log("📋 Debug: Processing availability entry:", {
          id: entry.id,
          start_time: entry.start_time,
          end_time: entry.end_time,
          is_recurring: entry.is_recurring,
          recurrence_pattern: entry.recurrence_pattern,
        })

        const entryStart = new Date(entry.start_time)
        const entryEnd = new Date(entry.end_time)

        if (entry.is_recurring) {
          console.log("🔄 Debug: Processing recurring entry")
          const startDate = new Date(entry.start_time)
          const endDate = entry.recurrence_end_date ? new Date(entry.recurrence_end_date) : endOfDay

          if (dateObj < startDate || dateObj > endDate) {
            console.log("❌ Debug: Date outside recurrence range")
            continue
          }

          let isMatchingPattern = false
          switch (entry.recurrence_pattern) {
            case 'weekly':
              isMatchingPattern = dateObj.getDay() === startDate.getDay()
              break
            case 'biweekly':
              const weeksDiff = Math.floor((dateObj.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
              isMatchingPattern = weeksDiff % 2 === 0 && dateObj.getDay() === startDate.getDay()
              break
            case 'monthly':
              isMatchingPattern = dateObj.getDate() === startDate.getDate()
              break
          }

          console.log("📅 Debug: Recurrence pattern check:", {
            pattern: entry.recurrence_pattern,
            isMatching: isMatchingPattern,
          })

          if (!isMatchingPattern) continue
        } else {
          if (format(entryStart, "yyyy-MM-dd") !== formattedDate) {
            console.log("❌ Debug: One-time entry date mismatch")
            continue
          }
        }

        const startTime = format(entryStart, "HH:mm")
        const endTime = format(entryEnd, "HH:mm")
        console.log("⏰ Debug: Processing time range:", { startTime, endTime })

        const hourlySlots = generateHourlyTimeSlots(startTime, endTime)
        console.log("📋 Debug: Generated hourly slots:", hourlySlots)

        const availableSlots = hourlySlots.filter((slot) => !bookedTimes.has(slot))
        console.log("📋 Debug: Available slots after filtering:", availableSlots)

        if (availableSlots.length > 0) {
          availableBlocks.push({
            start: startTime,
            end: endTime,
            availableStartTimes: availableSlots,
          })
        }
      }
    }

    console.log("📊 Debug: Final available blocks:", availableBlocks)

    return NextResponse.json(
      {
        availabilityBlocks: availableBlocks,
        debug: {
          requestParams: { freelancerId, serviceId, date },
          availabilityEntries: availability,
          existingBookings,
          bookedTimes: Array.from(bookedTimes),
          availableBlocks,
        },
      },
      { headers: { "Cache-Control": "private, max-age=60" } },
    )
  } catch (error: any) {
    console.error("❌ Error in availability endpoint:", error)
    return NextResponse.json({ 
      error: "Failed to fetch availability",
      debug: {
        error: error?.message || "Unknown error",
        stack: error?.stack || "No stack trace available",
      }
    }, { status: 500 })
  }
}

