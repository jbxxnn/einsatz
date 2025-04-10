"use client"

import { useState, useEffect, useCallback } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { format, isSameMonth, startOfMonth, endOfMonth, addMonths } from "date-fns"
import { toast } from "@/lib/toast"

interface FreelancerAvailabilityCalendarProps {
  freelancerId: string
  categoryId: string | null
  onSelectDate: (date: Date | undefined) => void
}

type AvailabilityStatus = "guaranteed" | "tentative" | "unavailable" | null

interface DateAvailability {
  date: Date
  status: AvailabilityStatus
}

export default function FreelancerAvailabilityCalendar({
  freelancerId,
  categoryId,
  onSelectDate,
}: FreelancerAvailabilityCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [availability, setAvailability] = useState<DateAvailability[]>([])
  const [loading, setLoading] = useState(false)
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [cachedMonths, setCachedMonths] = useState<Map<string, Map<string, DateAvailability>>>(new Map())
  const [initialLoad, setInitialLoad] = useState(true)

  // Memoized function to fetch available dates
  const fetchAvailableDates = useCallback(
    async (month: Date) => {
      if (!categoryId) return new Map<string, DateAvailability>()

      // Check if we have cached data for this month
      const cacheKey = `${freelancerId}-${categoryId}-${format(month, "yyyy-MM")}`
      if (cachedMonths.has(cacheKey)) {
        return cachedMonths.get(cacheKey) || new Map<string, DateAvailability>()
      }

      setLoading(true)
      try {
        const startDate = format(startOfMonth(month), "yyyy-MM-dd")
        const endDate = format(endOfMonth(month), "yyyy-MM-dd")

        const response = await fetch(
          `/api/available-dates?freelancerId=${freelancerId}&categoryId=${categoryId}&startDate=${startDate}&endDate=${endDate}`,
          { cache: "no-store" },
        )

        if (!response.ok) {
          throw new Error("Failed to fetch availability")
        }

        const data = await response.json()
        const datesMap = new Map<string, DateAvailability>()

        // Process available dates with their status
        if (data.availableDates) {
          data.availableDates.forEach((dateInfo: any) => {
            const date = new Date(dateInfo.date)
            datesMap.set(format(date, "yyyy-MM-dd"), {
              date,
              status: dateInfo.status,
            })
          })
        }

        // Cache the results
        setCachedMonths((prev) => new Map(prev).set(cacheKey, datesMap))

        return datesMap
      } catch (error) {
        console.error("Error fetching available dates:", error)
        toast.error("Failed to fetch freelancer availability")
        return new Map<string, DateAvailability>()
      } finally {
        setLoading(false)
      }
    },
    [freelancerId, categoryId, cachedMonths, toast],
  )

  // Effect to load data when month or category changes
  useEffect(() => {
    if (freelancerId && categoryId) {
      fetchAvailableDates(currentMonth).then((dates) => {
        setAvailability(Array.from(dates.values()))
        setInitialLoad(false)
      })
    }
  }, [freelancerId, categoryId, currentMonth, fetchAvailableDates])

  // Preload next month data for faster navigation
  useEffect(() => {
    if (freelancerId && categoryId && !initialLoad) {
      const nextMonth = addMonths(currentMonth, 1)
      fetchAvailableDates(nextMonth)
    }
  }, [freelancerId, categoryId, currentMonth, fetchAvailableDates, initialLoad])

  // Custom function to determine if a date is disabled
  const isDateDisabled = (date: Date) => {
    // Disable dates in the past
    if (date < new Date()) return true

    // If we're still loading and it's the initial load, don't disable anything yet
    if (loading && initialLoad) return false

    // Disable dates that are not in the available dates list or marked as unavailable
    const dateKey = format(date, "yyyy-MM-dd")
    const dateInfo = availability.find((d) => format(d.date, "yyyy-MM-dd") === dateKey)

    if (!dateInfo) return true

    return dateInfo.status === "unavailable"
  }

  const handleSelectDate = (date: Date | undefined) => {
    setSelectedDate(date)
    onSelectDate(date)
  }

  // Handle month change
  const handleMonthChange = async (month: Date) => {
    if (!isSameMonth(month, currentMonth)) {
      setCurrentMonth(month)
    }
  }

  return (
    <Card>
      <CardContent className="p-3">
        {loading && initialLoad ? (
          <div className="flex justify-center items-center h-[240px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleSelectDate}
              onMonthChange={handleMonthChange}
              disabled={isDateDisabled}
              className="rounded-md"
              modifiers={{
                // Add custom modifiers for styling instead of using a custom Day component
                available: (date) => {
                  const dateKey = format(date, "yyyy-MM-dd")
                  return availability.some((d) => format(d.date, "yyyy-MM-dd") === dateKey && d.status !== "unavailable")
                },
                guaranteed: (date) => {
                  const dateKey = format(date, "yyyy-MM-dd")
                  return availability.some((d) => format(d.date, "yyyy-MM-dd") === dateKey && d.status === "guaranteed")
                },
                tentative: (date) => {
                  const dateKey = format(date, "yyyy-MM-dd")
                  return availability.some((d) => format(d.date, "yyyy-MM-dd") === dateKey && d.status === "tentative")
                },
              }}
              modifiersClassNames={{
                guaranteed: "availability-indicator guaranteed-day",
                tentative: "availability-indicator tentative-day",
                unavailable: "availability-indicator unavailable-day",
              }}
            />
            {loading && !initialLoad && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-background/80 rounded-full p-2">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}

            <div className="mt-4 flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span>Guaranteed</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-amber-500" />
                <span>Tentative</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-gray-300" />
                <span>Unavailable</span>
              </div>
            </div>
          </>
        )}
        {!loading && availability.length === 0 && categoryId && (
          <div className="text-center mt-2 text-sm text-muted-foreground">No available dates in this month</div>
        )}
      </CardContent>
    </Card>
  )
}

