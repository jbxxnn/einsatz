/**
 * GlobalAvailabilityCalendar Component
 * 
 * This component provides a calendar interface for freelancers to manage their global availability.
 * It allows setting both one-time and recurring availability slots with different certainty levels.
 * The component includes:
 * - A calendar view showing availability status
 * - A form to add new availability entries
 * - Support for recurring patterns (weekly, biweekly, monthly)
 * - Different certainty levels (guaranteed, tentative)
 * 
 * @component
 * @param {string} freelancerId - The ID of the freelancer whose availability is being managed
 * @param {boolean} readOnly - Whether the calendar is in read-only mode (default: false)
 */

"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { format, addDays, addMonths } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Clock, Loader2, Plus, Repeat, Trash2, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { toast } from "@/lib/toast"
import { Checkbox } from "@/components/ui/checkbox"

interface GlobalAvailabilityCalendarProps {
  freelancerId: string
  readOnly?: boolean
}

export default function GlobalAvailabilityCalendar({
  freelancerId,
  readOnly = false,
}: GlobalAvailabilityCalendarProps) {
  // State for managing the selected date in the calendar
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  
  // State for storing availability entries for the selected date
  const [availabilityEntries, setAvailabilityEntries] = useState<any[]>([])
  
  // State for controlling the visibility of the add availability form
  const [showAddForm, setShowAddForm] = useState(false)
  
  // State for managing the time range of new availability entries
  const [startTime, setStartTime] = useState("09:00")
  const [endTime, setEndTime] = useState("17:00")
  
  // State for managing recurring availability settings
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurrencePattern, setRecurrencePattern] = useState("weekly")
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<Date | undefined>(addMonths(new Date(), 1))
  
  // State for managing the certainty level of availability
  const [certaintyLevel, setCertaintyLevel] = useState("guaranteed")
  
  // Loading states
  const [loading, setLoading] = useState(false)
  const [fetchingEntries, setFetchingEntries] = useState(false)
  
  // State for storing availability dates with their certainty levels
  const [availabilityDates, setAvailabilityDates] = useState<Record<string, string>>({})

  const [services, setServices] = useState<any[]>([])
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  const supabase = createClientComponentClient()

  /**
   * Fetches and processes availability dates for the calendar view
   * This effect runs when the component mounts or when freelancerId changes
   */
  useEffect(() => {
    async function fetchAvailabilityDates() {
      try {
        const { data: session } = await supabase.auth.getSession()
        if (!session.session && !freelancerId) return

        const userId = freelancerId || session.session?.user.id

        const { data, error } = await supabase
          .from("freelancer_global_availability")
          .select("*")
          .eq("freelancer_id", userId)

        if (error) throw error

        // Process the data to mark dates on the calendar
        const dates: Record<string, string> = {}
        data.forEach((entry) => {
          const startDate = new Date(entry.start_time)
          const dateKey = format(startDate, "yyyy-MM-dd")

          // If there's already a higher certainty level, don't override it
          if (dates[dateKey] === "guaranteed") return
          if (entry.certainty_level === "guaranteed" || !dates[dateKey]) {
            dates[dateKey] = entry.certainty_level
          }

          // For recurring entries, mark future dates
          if (entry.is_recurring) {
            const endDate = entry.recurrence_end_date ? new Date(entry.recurrence_end_date) : addMonths(new Date(), 3)
            const startDay = startDate.getDay()
            const currentDate = new Date()

            // Mark dates for the next 3 months
            for (let d = new Date(currentDate); d <= endDate; d = addDays(d, 1)) {
              if (entry.recurrence_pattern === "weekly" && d.getDay() === startDay) {
                const key = format(d, "yyyy-MM-dd")
                if (dates[key] === "guaranteed") continue
                if (entry.certainty_level === "guaranteed" || !dates[key]) {
                  dates[key] = entry.certainty_level
                }
              } else if (entry.recurrence_pattern === "biweekly" && d.getDay() === startDay) {
                // Check if it's the right week
                const diffTime = Math.abs(d.getTime() - startDate.getTime())
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                const diffWeeks = Math.floor(diffDays / 7)

                if (diffWeeks % 2 === 0) {
                  const key = format(d, "yyyy-MM-dd")
                  if (dates[key] === "guaranteed") continue
                  if (entry.certainty_level === "guaranteed" || !dates[key]) {
                    dates[key] = entry.certainty_level
                  }
                }
              } else if (entry.recurrence_pattern === "monthly" && d.getDate() === startDate.getDate()) {
                const key = format(d, "yyyy-MM-dd")
                if (dates[key] === "guaranteed") continue
                if (entry.certainty_level === "guaranteed" || !dates[key]) {
                  dates[key] = entry.certainty_level
                }
              }
            }
          }
        })

        setAvailabilityDates(dates)
      } catch (error) {
        console.error("Error fetching availability dates:", error)
      }
    }

    fetchAvailabilityDates()
  }, [freelancerId, supabase])

  /**
   * Fetches availability entries for the selected date
   * This effect runs when the selected date changes
   */
  useEffect(() => {
    async function fetchAvailabilityEntries() {
      setFetchingEntries(true)
      try {
        const { data: session } = await supabase.auth.getSession()
        if (!session.session && !freelancerId) {
          console.log("No session or freelancerId found")
          return
        }

        const userId = freelancerId || session.session?.user.id
        console.log("Fetching availability for user:", userId)

        // Fetch availability entries
        const { data: availabilityData, error: availabilityError } = await supabase
          .from("freelancer_global_availability")
          .select("*")
          .eq("freelancer_id", userId)

        if (availabilityError) {
          console.error("Supabase error details:", {
            message: availabilityError.message,
            details: availabilityError.details,
            hint: availabilityError.hint,
            code: availabilityError.code
          })
          throw availabilityError
        }

        console.log("Fetched availability data:", availabilityData)

        // Filter entries that apply to the selected date
        const filteredEntries = filterEntriesForDate(availabilityData || [], selectedDate)
        console.log("Filtered entries:", filteredEntries)

        // Deduplicate entries based on start/end time and recurrence pattern
        const uniqueEntries = deduplicateEntries(filteredEntries)
        console.log("Unique entries:", uniqueEntries)

        // Fetch services for each entry
        const entriesWithServices = await Promise.all(
          uniqueEntries.map(async (entry) => {
            if (entry.service_ids && entry.service_ids.length > 0) {
              const { data: serviceData, error: serviceError } = await supabase
                .from("freelancer_job_offerings")
                .select(`
                  id,
                  job_categories (
                    id,
                    name
                  )
                `)
                .in("id", entry.service_ids)

              if (serviceError) {
                console.error("Error fetching services:", serviceError)
                return entry
              }

              return {
                ...entry,
                services: serviceData || []
              }
            }
            return entry
          })
        )

        setAvailabilityEntries(entriesWithServices)
      } catch (error) {
        console.error("Error fetching availability entries:", {
          error,
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        })
      } finally {
        setFetchingEntries(false)
      }
    }

    fetchAvailabilityEntries()
  }, [selectedDate, freelancerId, supabase])

  /**
   * Filters availability entries that apply to a specific date
   * @param entries - Array of availability entries
   * @param date - The date to filter entries for
   * @returns Filtered array of entries that apply to the given date
   */
  function filterEntriesForDate(entries: any[], date: Date) {
    const dayOfWeek = date.getDay()
    const formattedDate = format(date, "yyyy-MM-dd")

    return entries.filter((entry) => {
      // For one-time entries, check if the date matches
      if (!entry.is_recurring) {
        const entryDate = new Date(entry.start_time)
        return format(entryDate, "yyyy-MM-dd") === formattedDate
      }

      // For recurring entries
      const entryStartDate = new Date(entry.start_time)
      const entryEndDate = entry.recurrence_end_date ? new Date(entry.recurrence_end_date) : null

      // Check if the selected date is after the start date
      if (date < entryStartDate) return false

      // Check if the selected date is before the end date (if any)
      if (entryEndDate && date > entryEndDate) return false

      // Check if the day of week matches
      const entryDayOfWeek = entryStartDate.getDay()

      if (entry.recurrence_pattern === "weekly") {
        return entryDayOfWeek === dayOfWeek
      } else if (entry.recurrence_pattern === "biweekly") {
        // Calculate weeks difference
        const diffTime = Math.abs(date.getTime() - entryStartDate.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        const diffWeeks = Math.floor(diffDays / 7)

        return entryDayOfWeek === dayOfWeek && diffWeeks % 2 === 0
      } else if (entry.recurrence_pattern === "monthly") {
        // Check if it's the same day of the month
        return entryStartDate.getDate() === date.getDate()
      }

      return false
    })
  }

  /**
   * Removes duplicate availability entries based on start/end time and recurrence pattern
   * @param entries - Array of availability entries
   * @returns Array of unique availability entries
   */
  function deduplicateEntries(entries: any[]) {
    const uniqueMap = new Map()

    entries.forEach((entry) => {
      // Create a unique key based on start time, end time, and recurrence pattern
      const startTime = format(new Date(entry.start_time), "HH:mm")
      const endTime = format(new Date(entry.end_time), "HH:mm")
      const key = `${startTime}-${endTime}-${entry.is_recurring}-${entry.recurrence_pattern || ""}`

      // Only keep the first entry with this key
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, entry)
      }
    })

    return Array.from(uniqueMap.values())
  }

  /**
   * Fetches freelancer's services
   */
  useEffect(() => {
    async function fetchServices() {
      try {
        const { data: session } = await supabase.auth.getSession()
        if (!session.session && !freelancerId) {
          console.log("No session or freelancerId found for services fetch")
          return
        }

        const userId = freelancerId || session.session?.user.id
        console.log("Fetching services for user:", userId)

        const { data, error } = await supabase
          .from("freelancer_job_offerings")
          .select(`
            *,
            job_categories (
              id,
              name
            )
          `)
          .eq("freelancer_id", userId)

        if (error) {
          console.error("Supabase services error details:", {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          })
          throw error
        }

        console.log("Fetched services data:", data)
        setServices(data || [])
        setSelectedServices(data?.map(service => service.id) || [])
        setSelectedCategories(data?.map(service => service.job_categories.id) || [])
      } catch (error) {
        console.error("Error fetching services:", {
          error,
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        })
      }
    }

    fetchServices()
  }, [freelancerId, supabase])

  /**
   * Handles the submission of a new availability entry
   * @param e - Form submission event
   */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: session } = await supabase.auth.getSession()
      if (!session.session) {
        toast.error("You must be logged in to set availability")
        return
      }

      // Validate that the selected date is not in the past
      if (selectedDate < new Date()) {
        toast.error("Cannot set availability for past dates")
        setLoading(false)
        return
      }

      // Validate that at least one service is selected
      if (selectedServices.length === 0) {
        toast.error("Please select at least one service")
        setLoading(false)
        return
      }

      const userId = session.session.user.id

      // Create start and end datetime objects
      const startDateTime = new Date(selectedDate)
      const [startHours, startMinutes] = startTime.split(":").map(Number)
      startDateTime.setHours(startHours, startMinutes, 0, 0)

      const endDateTime = new Date(selectedDate)
      const [endHours, endMinutes] = endTime.split(":").map(Number)
      endDateTime.setHours(endHours, endMinutes, 0, 0)

      // Validate times
      if (endDateTime <= startDateTime) {
        toast.error("End time must be after start time")
        setLoading(false)
        return
      }

      // Generate a single availability_group_id for all related entries
      const availabilityGroupId = crypto.randomUUID()

      // Create an array of availability entries, one for each selected service
      const availabilityEntries = selectedServices.map((serviceId, index) => ({
        freelancer_id: userId,
        availability_group_id: availabilityGroupId,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        is_recurring: isRecurring,
        recurrence_pattern: isRecurring ? recurrencePattern : null,
        recurrence_end_date: isRecurring && recurrenceEndDate ? recurrenceEndDate.toISOString() : null,
        certainty_level: certaintyLevel,
        service_id: serviceId,
        category_id: selectedCategories[index]
      }))

      // Insert all availability entries
      const { error } = await supabase
        .from("freelancer_global_availability")
        .insert(availabilityEntries)

      if (error) throw error

      toast.success("Global availability has been set")

      // Reset form and refresh data
      setShowAddForm(false)
      setStartTime("09:00")
      setEndTime("17:00")
      setIsRecurring(false)
      setRecurrencePattern("weekly")
      setRecurrenceEndDate(addMonths(new Date(), 1))
      setCertaintyLevel("guaranteed")
      setSelectedServices([])

      // Refresh the availability entries
      const { data: session2 } = await supabase.auth.getSession()
      if (!session2.session) return

      const { data, error: fetchError } = await supabase
        .from("freelancer_global_availability")
        .select("*")
        .eq("freelancer_id", userId)

      if (fetchError) throw fetchError

      // Filter entries that apply to the selected date
      const filteredEntries = filterEntriesForDate(data || [], selectedDate)

      // Deduplicate entries based on start/end time and recurrence pattern
      const uniqueEntries = deduplicateEntries(filteredEntries)

      setAvailabilityEntries(uniqueEntries)

      // Update availabilityDates state with the new entries
      const newAvailabilityDates = { ...availabilityDates }
      
      // Add the selected date with the highest certainty level
      const dateKey = format(selectedDate, "yyyy-MM-dd")
      if (!newAvailabilityDates[dateKey] || certaintyLevel === "guaranteed") {
        newAvailabilityDates[dateKey] = certaintyLevel
      }

      // If recurring, add future dates
      if (isRecurring && recurrenceEndDate) {
        let currentDate = new Date(selectedDate)
        const endDate = new Date(recurrenceEndDate)

        while (currentDate <= endDate) {
          const currentDateKey = format(currentDate, "yyyy-MM-dd")
          
          // Only update if there's no guaranteed entry or if this is guaranteed
          if (!newAvailabilityDates[currentDateKey] || certaintyLevel === "guaranteed") {
            newAvailabilityDates[currentDateKey] = certaintyLevel
          }

          // Move to next occurrence based on pattern
          if (recurrencePattern === "weekly") {
            currentDate = addDays(currentDate, 7)
          } else if (recurrencePattern === "biweekly") {
            currentDate = addDays(currentDate, 14)
          } else if (recurrencePattern === "monthly") {
            currentDate = addMonths(currentDate, 1)
          }
        }
      }

      setAvailabilityDates(newAvailabilityDates)
    } catch (error) {
      console.error("Error setting availability:", error)
      toast.error("Failed to set availability")
    } finally {
      setLoading(false)
    }
  }

  /**
   * Deletes an availability entry and all related entries in the same group
   * @param id - The ID of the availability entry to delete
   */
  async function handleDelete(id: string) {
    try {
      // First, get the availability_group_id and other details of the entry being deleted
      const { data: entryToDelete, error: fetchError } = await supabase
        .from("freelancer_global_availability")
        .select("availability_group_id, start_time, end_time, is_recurring, recurrence_pattern, recurrence_end_date, certainty_level")
        .eq("id", id)
        .single()

      if (fetchError) throw fetchError

      if (!entryToDelete) {
        toast.error("Entry not found")
        return
      }

      // Delete all entries with the same availability_group_id
      const { error } = await supabase
        .from("freelancer_global_availability")
        .delete()
        .eq("availability_group_id", entryToDelete.availability_group_id)

      if (error) throw error

      toast.success("Availability entries deleted")

      // Remove all entries with the same availability_group_id from the state
      setAvailabilityEntries(availabilityEntries.filter(
        (entry) => entry.availability_group_id !== entryToDelete.availability_group_id
      ))

      // Update availabilityDates state
      const newAvailabilityDates = { ...availabilityDates }
      const startDate = new Date(entryToDelete.start_time)
      const dateKey = format(startDate, "yyyy-MM-dd")

      // Remove the date from availabilityDates if it was the only entry for that date
      const hasOtherEntries = availabilityEntries.some(
        entry => 
          entry.availability_group_id !== entryToDelete.availability_group_id && 
          format(new Date(entry.start_time), "yyyy-MM-dd") === dateKey
      )

      if (!hasOtherEntries) {
        delete newAvailabilityDates[dateKey]
      }

      // If recurring, remove all future dates
      if (entryToDelete.is_recurring && entryToDelete.recurrence_end_date) {
        let currentDate = new Date(startDate)
        const endDate = new Date(entryToDelete.recurrence_end_date)

        while (currentDate <= endDate) {
          const currentDateKey = format(currentDate, "yyyy-MM-dd")
          
          // Only remove if there are no other entries for this date
          const hasOtherEntriesForDate = availabilityEntries.some(
            entry => 
              entry.availability_group_id !== entryToDelete.availability_group_id && 
              format(new Date(entry.start_time), "yyyy-MM-dd") === currentDateKey
          )

          if (!hasOtherEntriesForDate) {
            delete newAvailabilityDates[currentDateKey]
          }

          // Move to next occurrence based on pattern
          if (entryToDelete.recurrence_pattern === "weekly") {
            currentDate = addDays(currentDate, 7)
          } else if (entryToDelete.recurrence_pattern === "biweekly") {
            currentDate = addDays(currentDate, 14)
          } else if (entryToDelete.recurrence_pattern === "monthly") {
            currentDate = addMonths(currentDate, 1)
          }
        }
      }

      setAvailabilityDates(newAvailabilityDates)
    } catch (error) {
      console.error("Error deleting availability:", error)
      toast.error("Failed to delete availability entries")
    }
  }

  /**
   * Formats a time range into a human-readable string
   * @param startTime - Start time string
   * @param endTime - End time string
   * @returns Formatted time range string
   */
  function formatTimeRange(startTime: string, endTime: string) {
    return `${format(new Date(startTime), "h:mm a")} - ${format(new Date(endTime), "h:mm a")}`
  }

  /**
   * Formats recurrence information into a human-readable string
   * @param entry - The availability entry
   * @returns Formatted recurrence string or null if not recurring
   */
  function formatRecurrence(entry: any) {
    if (!entry.is_recurring) return null

    let recurrenceText = `Repeats ${entry.recurrence_pattern}`

    if (entry.recurrence_end_date) {
      recurrenceText += ` until ${format(new Date(entry.recurrence_end_date), "MMM d, yyyy")}`
    }

    return recurrenceText
  }

  // Update the formatServiceNames function to handle the new data structure
  function formatServiceNames(entry: any) {
    if (!entry.services || entry.services.length === 0) return ""
    
    const serviceNames = entry.services.map((service: any) => 
      service.job_categories?.name
    ).filter(Boolean)
    
    return serviceNames.join(", ")
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-medium mb-2">Global Availability Calendar</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Set your global availability that applies to all job types by default
          </p>

          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            className="rounded-md border"
            modifiers={{
              guaranteed: (date) => availabilityDates[format(date, "yyyy-MM-dd")] === "guaranteed",
              tentative: (date) => availabilityDates[format(date, "yyyy-MM-dd")] === "tentative",
            }}
            modifiersClassNames={{
              guaranteed: "guaranteed-day",
              tentative: "tentative-day",
            }}
            disabled={(date) => date < new Date()}
          />

          <div className="mt-4 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500" />
              <span className="text-sm">Guaranteed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-amber-500" />
              <span className="text-sm">Tentative</span>
            </div>
          </div>
        </div>

        <div >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">{format(selectedDate, "EEEE, MMMM d, yyyy")}</h3>

            {!readOnly && (
              <Button onClick={() => setShowAddForm(true)} size="sm" disabled={showAddForm}>
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            )}
          </div>

          {showAddForm ? (
            <form onSubmit={handleSubmit} className="space-y-4 border rounded-md p-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-time">Start Time</Label>
                  <Input
                    id="start-time"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end-time">End Time</Label>
                  <Input
                    id="end-time"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="recurring" checked={isRecurring} onCheckedChange={setIsRecurring} />
                <Label htmlFor="recurring">Recurring availability</Label>
              </div>

              {isRecurring && (
                <div className="space-y-4 pl-6">
                  <div className="space-y-2">
                    <Label htmlFor="recurrence-pattern">Repeats</Label>
                    <Select value={recurrencePattern} onValueChange={setRecurrencePattern}>
                      <SelectTrigger id="recurrence-pattern">
                        <SelectValue placeholder="Select pattern" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="biweekly">Biweekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="recurrence-end">Ends on</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !recurrenceEndDate && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {recurrenceEndDate ? format(recurrenceEndDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={recurrenceEndDate}
                          onSelect={setRecurrenceEndDate}
                          initialFocus
                          disabled={(date) => date < addDays(new Date(), 1)}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Certainty Level</Label>
                <RadioGroup
                  defaultValue={certaintyLevel}
                  onValueChange={setCertaintyLevel}
                  className="flex flex-col space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="guaranteed" id="guaranteed" />
                    <Label htmlFor="guaranteed" className="flex items-center">
                      <div className="h-2 w-2 rounded-full bg-green-500 mr-2" />
                      Guaranteed
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="tentative" id="tentative" />
                    <Label htmlFor="tentative" className="flex items-center">
                      <div className="h-2 w-2 rounded-full bg-amber-500 mr-2" />
                      Tentative
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label>Available for Services</Label>
                <div className="grid grid-cols-2 gap-2">
                  {services.map((service) => (
                    <div key={service.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`service-${service.id}`}
                        checked={selectedServices.includes(service.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedServices([...selectedServices, service.id])
                          } else {
                            setSelectedServices(selectedServices.filter(id => id !== service.id))
                          }
                        }}
                      />
                      <Label htmlFor={`service-${service.id}`} className="text-sm">
                        {service.job_categories?.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save
                </Button>
              </div>
            </form>
          ) : fetchingEntries ? (
            <div className="text-center py-4">
              <Loader2 className="h-6 w-6 animate-spin mx-auto" />
              <p className="text-sm text-muted-foreground mt-2">Loading availability...</p>
            </div>
          ) : availabilityEntries.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">No availability set for this date</div>
          ) : (
            <div className="space-y-2">
              {availabilityEntries.map((entry) => (
                <div
                  key={`${entry.id}-${entry.is_recurring ? "recurring" : "onetime"}`}
                  className="border rounded-md p-3 flex items-start justify-between gap-2"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{formatTimeRange(entry.start_time, entry.end_time)}</span>
                    </div>

                    {entry.is_recurring && (
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <Repeat className="h-3 w-3" />
                        <span>{formatRecurrence(entry)}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-1 mt-1">
                      <Check
                        className={`h-4 w-4 ${
                          entry.certainty_level === "guaranteed" ? "text-green-500" : "text-amber-500"
                        }`}
                      />
                      <span className="text-sm capitalize">{entry.certainty_level}</span>
                    </div>

                    {entry.service_ids && entry.service_ids.length > 0 && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        <span className="font-medium">Services: </span>
                        {formatServiceNames(entry)}
                      </div>
                    )}
                  </div>

                  {!readOnly && (
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(entry.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
