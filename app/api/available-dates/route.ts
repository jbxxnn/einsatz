import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import { format } from "date-fns"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const freelancerId = searchParams.get("freelancerId")
  const categoryId = searchParams.get("categoryId")
  const jobOfferingId = searchParams.get("jobOfferingId")
  const month = searchParams.get("month")
  const year = searchParams.get("year")

  if (!freelancerId || (!categoryId && !jobOfferingId) || !month || !year) {
    return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
  }

  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

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

    // First, check if this job offering uses global availability
    const { data: jobOfferingSettings, error: settingsError } = await supabase
      .from("job_offering_availability_settings")
      .select("use_global_availability")
      .eq("freelancer_id", freelancerId)
      .eq("job_offering_id", actualJobOfferingId)
      .single()

    // If there's an error but it's not a "not found" error, return an error
    if (settingsError && settingsError.code !== "PGRST116") {
      console.error("Error fetching job offering settings:", settingsError)
      return NextResponse.json({ error: "Failed to fetch job offering settings" }, { status: 500 })
    }

    // Default to using global availability if no settings exist
    const useGlobalAvailability = jobOfferingSettings?.use_global_availability !== false

    let availabilityQuery

    if (useGlobalAvailability) {
      // Query global availability
      availabilityQuery = supabase.from("freelancer_global_availability").select("*").eq("freelancer_id", freelancerId)
    } else {
      // Query job-specific availability
      availabilityQuery = supabase
        .from("freelancer_availability")
        .select("*")
        .eq("freelancer_id", freelancerId)
        .eq("job_offering_id", actualJobOfferingId)
    }

    const { data: availabilityData, error: availabilityError } = await availabilityQuery

    if (availabilityError) {
      console.error("Error fetching availability:", availabilityError)
      return NextResponse.json({ error: "Failed to fetch availability" }, { status: 500 })
    }

    // Get existing bookings for this freelancer and job offering
    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("start_time, end_time")
      .eq("freelancer_id", freelancerId)
      .eq("job_offering_id", actualJobOfferingId)
      .gte("start_time", `${year}-${month.padStart(2, "0")}-01`)
      .lt("start_time", `${year}-${Number(month) + 1 > 12 ? "01" : (Number(month) + 1).toString().padStart(2, "0")}-01`)
      .not("status", "in", '("cancelled")')

    if (bookingsError) {
      console.error("Error fetching bookings:", bookingsError)
      return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 })
    }

    // Process the data to determine available dates
    const daysInMonth = new Date(Number(year), Number(month), 0).getDate()
    const dates: Record<string, any> = {}

    // Process direct (non-recurring) availability
    const directAvailability = availabilityData?.filter((entry) => !entry.is_recurring) || []
    directAvailability.forEach((entry) => {
      const entryDate = new Date(entry.start_time)
      const dateStr = format(entryDate, "yyyy-MM-dd")

      if (!dates[dateStr]) {
        dates[dateStr] = { availability: [], bookings: [] }
      }

      dates[dateStr].availability.push(entry)
    })

    // Process recurring availability
    const recurringAvailability = availabilityData?.filter((entry) => entry.is_recurring) || []
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(Number(year), Number(month) - 1, day)
      const dateStr = format(date, "yyyy-MM-dd")
      const dayOfWeek = date.getDay()

      recurringAvailability.forEach((entry) => {
        const entryStartDate = new Date(entry.start_time)
        const entryDayOfWeek = entryStartDate.getDay()
        const entryEndDate = entry.recurrence_end_date ? new Date(entry.recurrence_end_date) : null

        // Check if this recurring entry applies to this date
        let applies = false

        // Check if the date is after the start date of the recurring pattern
        if (date < entryStartDate) return

        // Check if the date is before the end date of the recurring pattern (if any)
        if (entryEndDate && date > entryEndDate) return

        if (entry.recurrence_pattern === "weekly") {
          applies = entryDayOfWeek === dayOfWeek
        } else if (entry.recurrence_pattern === "biweekly") {
          // Calculate weeks difference
          const diffTime = Math.abs(date.getTime() - entryStartDate.getTime())
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
          const diffWeeks = Math.floor(diffDays / 7)

          applies = entryDayOfWeek === dayOfWeek && diffWeeks % 2 === 0
        } else if (entry.recurrence_pattern === "monthly") {
          // Check if it's the same day of the month
          applies = entryStartDate.getDate() === date.getDate()
        }

        if (applies) {
          if (!dates[dateStr]) {
            dates[dateStr] = { availability: [], bookings: [] }
          }

          // Create a copy of the entry with adjusted date
          const adjustedEntry = { ...entry }
          const adjustedStartTime = new Date(date)
          adjustedStartTime.setHours(
            entryStartDate.getHours(),
            entryStartDate.getMinutes(),
            entryStartDate.getSeconds(),
          )

          const adjustedEndTime = new Date(date)
          const entryEndTime = new Date(entry.end_time)
          adjustedEndTime.setHours(entryEndTime.getHours(), entryEndTime.getMinutes(), entryEndTime.getSeconds())

          adjustedEntry.start_time = adjustedStartTime.toISOString()
          adjustedEntry.end_time = adjustedEndTime.toISOString()

          dates[dateStr].availability.push(adjustedEntry)
        }
      })
    }

    // Add bookings to the dates object
    bookings?.forEach((booking) => {
      const bookingDate = new Date(booking.start_time)
      const dateStr = format(bookingDate, "yyyy-MM-dd")

      if (!dates[dateStr]) {
        dates[dateStr] = { availability: [], bookings: [] }
      }

      dates[dateStr].bookings.push(booking)
    })

    return NextResponse.json({
      dates,
      useGlobalAvailability,
    })
  } catch (error) {
    console.error("Error in available-dates route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
