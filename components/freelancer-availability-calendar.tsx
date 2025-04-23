"use client"

import { useState, useEffect } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent } from "@/components/ui/card"
import { format } from "date-fns"
import LoadingSpinner from "@/components/loading-spinner"
import { parseISO } from "date-fns"
import { toast } from "@/lib/toast"

interface FreelancerAvailabilityCalendarProps {
  freelancerId: string
  categoryId: string
  onDateSelect: (date: Date | undefined) => void
}

export function FreelancerAvailabilityCalendar({
  freelancerId,
  categoryId,
  onDateSelect,
}: FreelancerAvailabilityCalendarProps) {
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [availableDates, setAvailableDates] = useState<Record<string, string>>({})
  const [partiallyBookedDates, setPartiallyBookedDates] = useState<string[]>([])
  const [fullyBookedDates, setFullyBookedDates] = useState<string[]>([])
  const [isLoading, setLoading] = useState(false)

  useEffect(() => {
    async function fetchAvailableDates() {
      if (!freelancerId || !categoryId) return

      setLoading(true)
      try {
        const currentDate = new Date()
        const month = currentDate.getMonth() + 1
        const year = currentDate.getFullYear()

        // First, try to get the job offering ID for this category
        let jobOfferingId
        try {
          const { data: jobOffering } = await fetch(
            `/api/job-offering?freelancerId=${freelancerId}&categoryId=${categoryId}`,
          ).then((res) => res.json())

          jobOfferingId = jobOffering?.id
        } catch (error) {
          console.error("Error fetching job offering:", error)
        }

        const queryParams = new URLSearchParams({
          freelancerId,
          categoryId,
          month: month.toString(),
          year: year.toString(),
        })

        if (jobOfferingId) {
          queryParams.append("jobOfferingId", jobOfferingId)
        }

        const response = await fetch(`/api/available-dates?${queryParams.toString()}`)

        if (!response.ok) {
          throw new Error("Failed to fetch available dates")
        }

        const data = await response.json()

        // Process available dates
        const availableDatesMap: Record<string, string> = {}
        const partiallyBooked: string[] = []
        const fullyBooked: string[] = []

        // Process each date in the response
        Object.entries(data.dates || {}).forEach(([dateStr, info]: [string, any]) => {
          const { availability, bookings } = info

          if (availability) {
            // Calculate total available hours
            const totalAvailableHours = availability.reduce((total: number, slot: any) => {
              const start = parseISO(slot.start_time)
              const end = parseISO(slot.end_time)
              const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
              return total + hours
            }, 0)

            // Calculate total booked hours
            const totalBookedHours = bookings.reduce((total: number, booking: any) => {
              const start = parseISO(booking.start_time)
              const end = parseISO(booking.end_time)
              const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
              return total + hours
            }, 0)

            // Determine if date is fully booked, partially booked, or fully available
            if (totalBookedHours >= totalAvailableHours) {
              fullyBooked.push(dateStr)
            } else if (totalBookedHours > 0) {
              partiallyBooked.push(dateStr)
              availableDatesMap[dateStr] = "partial"
            } else {
              availableDatesMap[dateStr] = "full"
            }
          }
        })

        setAvailableDates(availableDatesMap)
        setPartiallyBookedDates(partiallyBooked)
        setFullyBookedDates(fullyBooked)
      } catch (error) {
        console.error("Error fetching available dates:", error)
        toast.error("Failed to load freelancer's availability")
      } finally {
        setLoading(false)
      }
    }

    fetchAvailableDates()
  }, [freelancerId, categoryId])

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate)
    onDateSelect(selectedDate)
  }

  const isDateAvailable = (date: Date) => {
    const formattedDate = format(date, "yyyy-MM-dd")
    return availableDates[formattedDate] === "full" || availableDates[formattedDate] === "partial"
  }

  const handleMonthChange = (month: Date) => {
    // setCurrentMonth(month) // No longer needed
  }

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-lg font-medium mb-4">Select a Date</h3>
        {isLoading ? (
          <div className="flex justify-center items-center h-[240px]">
            <LoadingSpinner />
          </div>
        ) : (
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            onMonthChange={handleMonthChange}
            disabled={(date) => {
              // Disable dates in the past
              const today = new Date()
              today.setHours(0, 0, 0, 0)

              // Disable dates that are not available
              return date < today || !isDateAvailable(date)
            }}
            classNames={{
              day: "rounded-full",
              day_selected:
                "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
              day_today: "bg-secondary text-secondary-foreground",
              day_disabled: "text-muted-foreground opacity-50",
            }}
            className="rounded-md border"
          />
        )}
      </CardContent>
    </Card>
  )
}
