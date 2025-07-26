import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { format, parseISO, isSameDay, addHours, isWithinInterval, startOfDay, endOfDay } from "date-fns"
import type { Database } from "@/lib/database.types"

type AvailabilityEntry = Database["public"]["Tables"]["freelancer_availability"]["Row"]
type Booking = Database["public"]["Tables"]["bookings"]["Row"]

interface TimeSlot {
  start: Date
  end: Date
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const freelancerId = url.searchParams.get("freelancerId")
  const date = url.searchParams.get("date")
  const categoryId = url.searchParams.get("categoryId") // Optional, only for bookings

  if (!freelancerId || !date) {
    return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
  }

  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  try {
    const selectedDate = parseISO(date)

    // Fetch all availability entries for this freelancer (global, not category-specific)
    const { data: availabilityEntries, error: availabilityError } = await supabase
      .from("freelancer_availability")
      .select("*")
      .eq("freelancer_id", freelancerId)

    if (availabilityError) {
      throw availabilityError
    }

    // Fetch bookings for this freelancer on the selected date (category-specific if categoryId is provided)
    let bookingsQuery = supabase
      .from("bookings")
      .select("start_time, end_time, status")
      .eq("freelancer_id", freelancerId)
      .gte("start_time", startOfDay(selectedDate).toISOString())
      .lte("end_time", endOfDay(selectedDate).toISOString())
      .not("status", "in", '("cancelled")')

    if (categoryId) {
      bookingsQuery = bookingsQuery.eq("category_id", categoryId)
    }

    const { data: bookings, error: bookingsError } = await bookingsQuery

    if (bookingsError) {
      throw bookingsError
    }

    // Helper function to generate time slots for a given time range
    const generateTimeSlots = (startTime: string, endTime: string, date: Date): TimeSlot[] => {
      const slots: TimeSlot[] = []
      const startHour = parseInt(startTime.split(':')[0])
      const startMinute = parseInt(startTime.split(':')[1])
      const endHour = parseInt(endTime.split(':')[0])
      const endMinute = parseInt(endTime.split(':')[1])

      let currentSlot = new Date(date)
      currentSlot.setHours(startHour, startMinute, 0, 0)

      const endSlot = new Date(date)
      endSlot.setHours(endHour, endMinute, 0, 0)

      while (currentSlot < endSlot) {
        const slotEnd = new Date(currentSlot)
        slotEnd.setHours(currentSlot.getHours() + 1)
        
        if (slotEnd <= endSlot) {
          slots.push({
            start: new Date(currentSlot),
            end: slotEnd
          })
        }
        
        currentSlot = slotEnd
      }

      return slots
    }

    // Helper function to check if two time slots overlap
    const slotsOverlap = (slot1: TimeSlot, slot2: TimeSlot): boolean => {
      return slot1.start < slot2.end && slot2.start < slot1.end
    }

    // Helper function to remove booked slots from available slots
    const removeBookedSlots = (availableSlots: TimeSlot[], bookedSlots: TimeSlot[]): TimeSlot[] => {
      return availableSlots.filter(availableSlot => {
        return !bookedSlots.some(bookedSlot => slotsOverlap(availableSlot, bookedSlot))
      })
    }

    // Check for direct (non-recurring) availability on this date
    const directAvailability = availabilityEntries?.filter((entry: AvailabilityEntry) => {
      const entryDate = new Date(entry.start_time)
      return !entry.is_recurring && isSameDay(entryDate, selectedDate)
    })

    // Check for recurring availability that applies to this date
    const recurringAvailability = availabilityEntries?.filter((entry: AvailabilityEntry) => {
      if (!entry.is_recurring) return false

      const entryStartDate = new Date(entry.start_time)
      const entryEndDate = entry.recurrence_end_date ? new Date(entry.recurrence_end_date) : null

      // Check if the date is after the start date of the recurring pattern
      if (selectedDate < entryStartDate) return false

      // Check if the date is before the end date of the recurring pattern (if any)
      if (entryEndDate && selectedDate > entryEndDate) return false

      // Check if the day of week matches
      const entryDayOfWeek = entryStartDate.getDay()
      const dateDayOfWeek = selectedDate.getDay()

      if (entry.recurrence_pattern === "weekly") {
        return entryDayOfWeek === dateDayOfWeek
      } else if (entry.recurrence_pattern === "biweekly") {
        // Calculate weeks difference
        const diffTime = Math.abs(selectedDate.getTime() - entryStartDate.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        const diffWeeks = Math.floor(diffDays / 7)

        return entryDayOfWeek === dateDayOfWeek && diffWeeks % 2 === 0
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

    // Generate all available time slots for this date
    let allAvailableSlots: TimeSlot[] = []
    allAvailability.forEach((entry) => {
      const entryStart = new Date(entry.start_time)
      const entryEnd = new Date(entry.end_time)
      
      // Extract time components
      const startTime = format(entryStart, "HH:mm")
      const endTime = format(entryEnd, "HH:mm")
      
      const slots = generateTimeSlots(startTime, endTime, selectedDate)
      allAvailableSlots = [...allAvailableSlots, ...slots]
    })

    // Remove duplicate slots (in case of overlapping availability entries)
    allAvailableSlots = allAvailableSlots.filter((slot, index, self) => 
      index === self.findIndex(s => s.start.getTime() === slot.start.getTime())
    )

    // Convert bookings to time slots
    const bookedSlots: TimeSlot[] = (bookings || []).map((booking) => ({
      start: new Date(booking.start_time),
      end: new Date(booking.end_time)
    }))

    // Remove booked slots from available slots
    const remainingAvailableSlots = removeBookedSlots(allAvailableSlots, bookedSlots)

    // Group consecutive time slots into availability blocks
    const availabilityBlocks = []
    let currentBlock: any = null

    remainingAvailableSlots.forEach((slot) => {
      const startTimeStr = format(slot.start, "HH:mm")
      const endTimeStr = format(slot.end, "HH:mm")

      if (!currentBlock) {
        // Start a new block
        currentBlock = {
          id: `block-${startTimeStr}`,
          start: startTimeStr,
          end: endTimeStr,
          availableStartTimes: [startTimeStr],
          certainty_level: allAvailability[0]?.certainty_level || "guaranteed",
          is_recurring: allAvailability[0]?.is_recurring || false,
          recurrence_pattern: allAvailability[0]?.recurrence_pattern || null,
        }
      } else {
        // Check if this slot is consecutive with the current block
        const currentBlockEnd = new Date(selectedDate)
        const [endHours, endMinutes] = currentBlock.end.split(":").map(Number)
        currentBlockEnd.setHours(endHours, endMinutes, 0, 0)

        if (slot.start.getTime() === currentBlockEnd.getTime()) {
          // Consecutive slot, extend the current block
          currentBlock.end = endTimeStr
          currentBlock.availableStartTimes.push(startTimeStr)
        } else {
          // Non-consecutive slot, save current block and start a new one
          availabilityBlocks.push(currentBlock)
          currentBlock = {
            id: `block-${startTimeStr}`,
            start: startTimeStr,
            end: endTimeStr,
            availableStartTimes: [startTimeStr],
            certainty_level: allAvailability[0]?.certainty_level || "guaranteed",
            is_recurring: allAvailability[0]?.is_recurring || false,
            recurrence_pattern: allAvailability[0]?.recurrence_pattern || null,
          }
        }
      }
    })

    // Don't forget to add the last block
    if (currentBlock) {
      availabilityBlocks.push(currentBlock)
    }

    return NextResponse.json({
      availabilityBlocks,
    })
  } catch (error) {
    console.error("Error fetching availability:", error)
    return NextResponse.json({ error: "Failed to fetch availability" }, { status: 500 })
  }
}
