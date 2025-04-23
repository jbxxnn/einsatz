import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { parseISO, isSameDay, addHours, format, areIntervalsOverlapping } from "date-fns"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const freelancerId = url.searchParams.get("freelancerId")
  const categoryId = url.searchParams.get("categoryId")
  const jobOfferingId = url.searchParams.get("jobOfferingId")
  const date = url.searchParams.get("date")

  if (!freelancerId || !date || (!categoryId && !jobOfferingId)) {
    return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
  }

  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  try {
    const selectedDate = parseISO(date)
    const dayOfWeek = selectedDate.getDay() // 0 = Sunday, 1 = Monday, etc.

    // If jobOfferingId is not provided, try to get it from categoryId
    let actualJobOfferingId = jobOfferingId
    if (!actualJobOfferingId && categoryId) {
      const { data: jobOffering, error: jobOfferingError } = await supabase
        .from("freelancer_job_offerings")
        .select("id")
        .eq("freelancer_id", freelancerId)
        .eq("category_id", categoryId)
        .single()

      if (jobOfferingError) {
        console.error("Error fetching job offering:", jobOfferingError)
        return NextResponse.json({ error: "Failed to fetch job offering" }, { status: 500 })
      }

      actualJobOfferingId = jobOffering?.id
    }

    // Check if this job offering uses global availability
    const { data: jobOfferingSetting, error: settingError } = await supabase
      .from("job_offering_availability_settings")
      .select("use_global_availability")
      .eq("freelancer_id", freelancerId)
      .eq("job_offering_id", actualJobOfferingId)
      .single()

    // If there's an error but it's not a "not found" error, return an error
    if (settingError && settingError.code !== "PGRST116") {
      console.error("Error fetching job offering settings:", settingError)
      return NextResponse.json({ error: "Failed to fetch job offering settings" }, { status: 500 })
    }

    // Default to using global availability if no settings exist or if use_global_availability is true
    const useGlobalAvailability = jobOfferingSetting?.use_global_availability !== false

    // Fetch availability entries based on the setting
    let availabilityEntries = []

    if (useGlobalAvailability) {
      // Fetch global availability
      const { data: globalAvailability, error: globalError } = await supabase
        .from("freelancer_global_availability")
        .select("*")
        .eq("freelancer_id", freelancerId)

      if (globalError) throw globalError
      availabilityEntries = globalAvailability || []
    } else {
      // Fetch job-specific availability
      const { data: specificAvailability, error: specificError } = await supabase
        .from("freelancer_availability")
        .select("*")
        .eq("freelancer_id", freelancerId)
        .eq("job_offering_id", actualJobOfferingId)

      if (specificError) throw specificError
      availabilityEntries = specificAvailability || []
    }

    // Filter availability entries for this specific date
    const directAvailability = availabilityEntries.filter((entry) => {
      const entryDate = new Date(entry.start_time)
      return !entry.is_recurring && isSameDay(entryDate, selectedDate)
    })

    // Filter recurring availability that applies to this date
    const recurringAvailability = availabilityEntries.filter((entry) => {
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
        useGlobalAvailability,
      })
    }

    // Fetch all bookings for this freelancer on this date
    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("start_time, end_time")
      .eq("freelancer_id", freelancerId)
      .eq("job_offering_id", actualJobOfferingId)
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

      // Generate all possible hourly time slots
      const allTimeSlots: { start: string; end: string; isAvailable: boolean }[] = []
      let currentTime = new Date(startTime)

      while (addHours(currentTime, 1) <= endTime) {
        const slotStart = new Date(currentTime)
        const slotEnd = addHours(slotStart, 1)

        allTimeSlots.push({
          start: format(slotStart, "HH:mm"),
          end: format(slotEnd, "HH:mm"),
          isAvailable: true,
        })

        // Move to next hour
        currentTime = addHours(currentTime, 1)
      }

      // Mark booked slots as unavailable
      bookingsOnDate.forEach((booking) => {
        const bookingStart = new Date(booking.start_time)
        const bookingEnd = new Date(booking.end_time)

        allTimeSlots.forEach((slot) => {
          const slotStart = new Date(selectedDate)
          const [slotStartHours, slotStartMinutes] = slot.start.split(":").map(Number)
          slotStart.setHours(slotStartHours, slotStartMinutes, 0, 0)

          const slotEnd = new Date(selectedDate)
          const [slotEndHours, slotEndMinutes] = slot.end.split(":").map(Number)
          slotEnd.setHours(slotEndHours, slotEndMinutes, 0, 0)

          // Check if this slot overlaps with the booking
          if (areIntervalsOverlapping({ start: slotStart, end: slotEnd }, { start: bookingStart, end: bookingEnd })) {
            slot.isAvailable = false
          }
        })
      })

      // Extract available start times
      const availableStartTimes = allTimeSlots.filter((slot) => slot.isAvailable).map((slot) => slot.start)

      return {
        id: entry.id,
        start: startTimeStr,
        end: endTimeStr,
        availableStartTimes,
        allTimeSlots,
        certainty_level: entry.certainty_level,
        is_recurring: entry.is_recurring,
        recurrence_pattern: entry.recurrence_pattern,
        is_global: useGlobalAvailability,
      }
    })

    // Set cache headers for better performance
    const headers = new Headers()
    headers.set("Cache-Control", "private, max-age=60") // Cache for 1 minute

    return NextResponse.json(
      {
        availabilityBlocks,
        useGlobalAvailability,
      },
      { headers },
    )
  } catch (error) {
    console.error("Error fetching availability:", error)
    return NextResponse.json({ error: "Failed to fetch availability" }, { status: 500 })
  }
}
