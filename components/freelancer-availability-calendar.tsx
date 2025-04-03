"use client"

import { useState, useEffect, useCallback } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { format, isSameMonth, startOfMonth, endOfMonth, addMonths } from "date-fns"

interface FreelancerAvailabilityCalendarProps {
  freelancerId: string
  categoryId: string | null
  onSelectDate: (date: Date | undefined) => void
}

export default function FreelancerAvailabilityCalendar({
  freelancerId,
  categoryId,
  onSelectDate,
}: FreelancerAvailabilityCalendarProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [availableDates, setAvailableDates] = useState<Date[]>([])
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [cachedMonths, setCachedMonths] = useState<Map<string, Date[]>>(new Map())
  const [initialLoad, setInitialLoad] = useState(true)

  // Memoized function to fetch available dates
  const fetchAvailableDates = useCallback(
    async (month: Date) => {
      if (!categoryId) return []

      // Check if we have cached data for this month
      const cacheKey = `${freelancerId}-${categoryId}-${format(month, "yyyy-MM")}`
      if (cachedMonths.has(cacheKey)) {
        return cachedMonths.get(cacheKey) || []
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
        const dates = data.availableDates.map((dateStr: string) => new Date(dateStr))

        // Cache the results
        setCachedMonths((prev) => new Map(prev).set(cacheKey, dates))

        return dates
      } catch (error) {
        console.error("Error fetching available dates:", error)
        toast({
          title: "Error",
          description: "Failed to fetch freelancer availability",
          variant: "destructive",
        })
        return []
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
        setAvailableDates(dates)
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

    // Disable dates that are not in the available dates list
    if (availableDates.length > 0) {
      return !availableDates.some(
        (availableDate) =>
          availableDate.getFullYear() === date.getFullYear() &&
          availableDate.getMonth() === date.getMonth() &&
          availableDate.getDate() === date.getDate(),
      )
    }

    return false
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
            />
            {loading && !initialLoad && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-background/80 rounded-full p-2">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}
          </>
        )}
        {!loading && availableDates.length === 0 && categoryId && (
          <div className="text-center mt-2 text-sm text-muted-foreground">No available dates in this month</div>
        )}
      </CardContent>
    </Card>
  )
}

