"use client"

import { useState, useEffect, useCallback } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent } from "@/components/ui/card"
import { Loader } from "lucide-react"
import { format, isSameMonth, startOfMonth, endOfMonth, addMonths } from "date-fns"
import { toast } from "@/lib/toast"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface FreelancerAvailabilityCalendarProps {
  freelancerId: string
  categoryId?: string | null
  onSelectDate: (date: Date | undefined) => void
}

type AvailabilityStatus = "guaranteed" | "tentative" | "unavailable" | null

interface DateAvailability {
  date: Date
  status: AvailabilityStatus
  availableSlots?: number // Number of available time slots
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
  const [dateDetails, setDateDetails] = useState<Map<string, { slots: number, status: string }>>(new Map())

  // Memoized function to fetch available dates
  const fetchAvailableDates = useCallback(
    async (month: Date) => {
      // Check if we have cached data for this month
      const cacheKey = `${freelancerId}-${categoryId || 'all'}-${format(month, "yyyy-MM")}`
      if (cachedMonths.has(cacheKey)) {
        return cachedMonths.get(cacheKey) || new Map<string, DateAvailability>()
      }

      setLoading(true)
      try {
        const startDate = format(startOfMonth(month), "yyyy-MM-dd")
        const endDate = format(endOfMonth(month), "yyyy-MM-dd")

        let url = `/api/available-dates?freelancerId=${freelancerId}&startDate=${startDate}&endDate=${endDate}`
        if (categoryId) {
          url += `&categoryId=${categoryId}`
        }

        const response = await fetch(url, { cache: "no-store" })

        if (!response.ok) {
          console.error("API response not ok:", response.status, response.statusText)
          throw new Error("Failed to fetch availability")
        }

        const data = await response.json()
        console.log("Available dates data:", data)
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

  // Function to fetch detailed time slot information for a date
  const fetchDateDetails = useCallback(async (date: Date) => {
    const dateKey = format(date, "yyyy-MM-dd")
    
    try {
      const response = await fetch("/api/available-dates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          freelancerId,
          date: dateKey,
          categoryId,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setDateDetails(prev => new Map(prev).set(dateKey, {
          slots: data.totalSlots || 0,
          status: data.availableSlots?.length > 0 ? "available" : "unavailable"
        }))
      }
    } catch (error) {
      console.error("Error fetching date details:", error)
    }
  }, [freelancerId, categoryId])

  // Effect to load data when month changes
  useEffect(() => {
    if (freelancerId) {
      fetchAvailableDates(currentMonth).then((dates) => {
        setAvailability(Array.from(dates.values()))
        setInitialLoad(false)
      })
    }
  }, [freelancerId, currentMonth, fetchAvailableDates])

  // Preload next month data for faster navigation
  useEffect(() => {
    if (freelancerId && !initialLoad) {
      const nextMonth = addMonths(currentMonth, 1)
      fetchAvailableDates(nextMonth)
    }
  }, [freelancerId, currentMonth, fetchAvailableDates, initialLoad])

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
    
    // Fetch detailed information for the selected date
    if (date) {
      fetchDateDetails(date)
    }
  }

  // Handle month change
  const handleMonthChange = async (month: Date) => {
    if (!isSameMonth(month, currentMonth)) {
      setCurrentMonth(month)
    }
  }

  // Custom day renderer to show availability indicators
  const renderDay = (date: Date) => {
    const dateKey = format(date, "yyyy-MM-dd")
    const dateInfo = availability.find((d) => format(d.date, "yyyy-MM-dd") === dateKey)
    const details = dateDetails.get(dateKey)
    
    if (!dateInfo || dateInfo.status === "unavailable") {
      return null // Use default rendering
    }

    const isSelected = selectedDate && format(selectedDate, "yyyy-MM-dd") === dateKey
    const hasMultipleSlots = details && details.slots > 1

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`relative w-full h-full flex items-center justify-center ${
              isSelected ? "bg-primary text-primary-foreground" : ""
            }`}>
              <span>{date.getDate()}</span>
              {hasMultipleSlots && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></div>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm">
              <p className="font-medium">{format(date, "EEEE, MMMM d, yyyy")}</p>
              <p className="text-muted-foreground">
                {details ? `${details.slots} time slot${details.slots !== 1 ? 's' : ''} available` : 'Available'}
              </p>
              <p className="text-xs text-muted-foreground">
                Status: {dateInfo.status}
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <Card>
      <CardContent className="p-3 justify-center">
        {loading && initialLoad ? (
          <div className="flex justify-center items-center w-full text-black">
            <Loader className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleSelectDate}
              onMonthChange={handleMonthChange}
              disabled={isDateDisabled}
              className="rounded-md justify-center flex text-black"
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
                partial: (date) => {
                  const dateKey = format(date, "yyyy-MM-dd")
                  const details = dateDetails.get(dateKey)
                  return !!(details && details.slots > 1)
                }
              }}
              modifiersClassNames={{
                guaranteed: "availability-indicator guaranteed-day",
                tentative: "availability-indicator tentative-day",
                unavailable: "availability-indicator unavailable-day",
                partial: "availability-indicator partial-day",
              }}
            />
            {loading && !initialLoad && (
              <div className="flex justify-center items-center w-full">
                <Loader className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}

            <div className="mt-4 flex items-center text-xs justify-center gap-4">
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
        {!loading && availability.length === 0 && (
          <div className="text-center mt-2 text-xs text-black">No available dates in this month</div>
        )}
      </CardContent>
    </Card>
  )
}
