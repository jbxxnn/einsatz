"use client"

import { useState, useEffect, useMemo } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSupabase } from "@/components/supabase-provider"
import { format, isAfter, isBefore, addWeeks, addMonths } from "date-fns"
import { CalendarIcon, Clock, Plus, Trash2, RefreshCw, AlertCircle, CheckCircle, HelpCircle } from "lucide-react"
import { toast } from "@/lib/toast"

type AvailabilityEntry = {
  id?: string
  freelancer_id: string
  category_id: string
  start_time: string
  end_time: string
  is_recurring: boolean
  recurrence_pattern?: string | null
  recurrence_end_date?: string | null
  certainty_level: "guaranteed" | "tentative" | "unavailable"
}

type AvailabilityCalendarProps = {
  freelancerId: string
  categoryId: string
  categoryName: string
}

export default function AvailabilityCalendar({ freelancerId, categoryId, categoryName }: AvailabilityCalendarProps) {
  const { supabase } = useSupabase()
  const [date, setDate] = useState<Date>(new Date())
  const [availability, setAvailability] = useState<AvailabilityEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<AvailabilityEntry | null>(null)
  const [formData, setFormData] = useState<Partial<AvailabilityEntry>>({})

  // Form state
  const [startDate, setStartDate] = useState<Date>(new Date())
  const [endDate, setEndDate] = useState<Date>(new Date())
  const [startTime, setStartTime] = useState("09:00")
  const [endTime, setEndTime] = useState("17:00")
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurrencePattern, setRecurrencePattern] = useState<string>("weekly")
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<Date | undefined>(addMonths(new Date(), 3))
  const [certaintyLevel, setCertaintyLevel] = useState<"guaranteed" | "tentative" | "unavailable">("guaranteed")

  // Fetch availability data
  useEffect(() => {
    const fetchAvailability = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from("freelancer_availability")
          .select("*")
          .eq("freelancer_id", freelancerId)
          .eq("category_id", categoryId)

        if (error) throw error

        setAvailability(data || [])
      } catch (error) {
        console.error("Error fetching availability:", error)
        toast.error("Failed to load availability")
      } finally {
        setLoading(false)
      }
    }

    fetchAvailability()
  }, [supabase, freelancerId, categoryId, toast])

  // Calculate dates with availability for the calendar
  const datesWithAvailability = useMemo(() => {
    const result = new Map<string, { date: Date; entries: AvailabilityEntry[] }>()

    // Process one-time availability entries
    availability.forEach((entry) => {
      const startDateTime = new Date(entry.start_time)
      const dateKey = format(startDateTime, "yyyy-MM-dd")

      if (!result.has(dateKey)) {
        result.set(dateKey, {
          date: startDateTime,
          entries: [],
        })
      }

      result.get(dateKey)?.entries.push(entry)
    })

    // Process recurring entries
    availability
      .filter((entry) => entry.is_recurring)
      .forEach((entry) => {
        const startDateTime = new Date(entry.start_time)
        const endDateTime = entry.recurrence_end_date ? new Date(entry.recurrence_end_date) : addMonths(new Date(), 6)

        // Generate recurring dates based on pattern
        let currentDate = addWeeks(new Date(startDateTime), 1) // Start from the next occurrence

        while (isBefore(currentDate, endDateTime)) {
          const dateKey = format(currentDate, "yyyy-MM-dd")

          if (!result.has(dateKey)) {
            result.set(dateKey, {
              date: new Date(currentDate),
              entries: [],
            })
          }

          result.get(dateKey)?.entries.push(entry)

          // Advance to next occurrence
          if (entry.recurrence_pattern === "weekly") {
            currentDate = addWeeks(currentDate, 1)
          } else if (entry.recurrence_pattern === "biweekly") {
            currentDate = addWeeks(currentDate, 2)
          } else if (entry.recurrence_pattern === "monthly") {
            currentDate = addMonths(currentDate, 1)
          } else {
            break // Unknown pattern
          }
        }
      })

    return result
  }, [availability])

  // Get availability entries for selected date
  const selectedDateEntries = useMemo(() => {
    const dateKey = format(date, "yyyy-MM-dd")
    return datesWithAvailability.get(dateKey)?.entries || []
  }, [date, datesWithAvailability])

  // Reset form state
  const resetForm = () => {
    setStartDate(new Date())
    setEndDate(new Date())
    setStartTime("09:00")
    setEndTime("17:00")
    setIsRecurring(false)
    setRecurrencePattern("weekly")
    setRecurrenceEndDate(addMonths(new Date(), 3))
    setCertaintyLevel("guaranteed")
    setSelectedEntry(null)
    setFormData({})
  }

  // Open dialog for adding new availability
  const handleAddAvailability = () => {
    resetForm()
    setStartDate(date)
    setEndDate(date)
    setIsDialogOpen(true)
  }

  // Open dialog for editing existing availability
  const handleEditAvailability = (entry: AvailabilityEntry) => {
    setSelectedEntry(entry)
    setIsRecurring(entry.is_recurring)
    setRecurrencePattern(entry.recurrence_pattern || "weekly")
    setRecurrenceEndDate(entry.recurrence_end_date ? new Date(entry.recurrence_end_date) : undefined)
    setCertaintyLevel(entry.certainty_level)

    const startDateTime = new Date(entry.start_time)
    const endDateTime = new Date(entry.end_time)

    setStartDate(startDateTime)
    setEndDate(endDateTime)
    setStartTime(format(startDateTime, "HH:mm"))
    setEndTime(format(endDateTime, "HH:mm"))

    setIsDialogOpen(true)
  }

  // Delete availability entry
  const handleDeleteAvailability = async (entryId: string) => {
    try {
      const { error } = await supabase.from("freelancer_availability").delete().eq("id", entryId)

      if (error) throw error

      setAvailability((prev) => prev.filter((entry) => entry.id !== entryId))

      toast.success("Availability deleted")
    } catch (error) {
      console.error("Error deleting availability:", error)
      toast.error("Failed to delete availability")
    }
  }

  // Save availability entry
  const handleSaveAvailability = async () => {
    try {
      // Validate form
      if (!startDate || !endDate || !startTime || !endTime) {
        toast.error("Please fill in all required fields")
        return
      }

      // Create start and end datetime objects
      const startDateTime = new Date(startDate)
      const [startHours, startMinutes] = startTime.split(":").map(Number)
      startDateTime.setHours(startHours, startMinutes, 0, 0)

      const endDateTime = new Date(endDate)
      const [endHours, endMinutes] = endTime.split(":").map(Number)
      endDateTime.setHours(endHours, endMinutes, 0, 0)

      // Validate time range
      if (isAfter(startDateTime, endDateTime)) {
        toast.error("End time must be after start time")
        return
      }

      const availabilityData: Omit<AvailabilityEntry, "id"> = {
        freelancer_id: freelancerId,
        category_id: categoryId,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        is_recurring: isRecurring,
        recurrence_pattern: isRecurring ? recurrencePattern : null,
        recurrence_end_date: isRecurring && recurrenceEndDate ? recurrenceEndDate.toISOString() : null,
        certainty_level: certaintyLevel,
      }

      if (selectedEntry?.id) {
        // Update existing entry
        const { data, error } = await supabase
          .from("freelancer_availability")
          .update(availabilityData)
          .eq("id", selectedEntry.id)
          .select()

        if (error) throw error

        setAvailability((prev) => prev.map((entry) => (entry.id === selectedEntry.id ? { ...data[0] } : entry)))

        toast.success("Availability updated")
      } else {
        // Create new entry
        const { data, error } = await supabase.from("freelancer_availability").insert(availabilityData).select()

        if (error) throw error

        setAvailability((prev) => [...prev, ...data])

        toast.success("Availability added")
      }

      setIsDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error("Error saving availability:", error)
      toast.error("Failed to save availability")
    }
  }

  // Get status for a specific date
  const getDateStatus = (date: Date) => {
    const dateKey = format(date, "yyyy-MM-dd")
    const dateData = datesWithAvailability.get(dateKey)

    if (!dateData) return null

    // Determine the highest priority status for the day
    let status = "unavailable"

    dateData.entries.forEach((entry) => {
      if (entry.certainty_level === "guaranteed") {
        status = "guaranteed"
      } else if (entry.certainty_level === "tentative" && status !== "guaranteed") {
        status = "tentative"
      }
    })

    return status
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Availability Calendar for {categoryName}</CardTitle>
          <CardDescription>Select dates to view and manage your availability</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
            <div>
              <Calendar
                mode="single"
                selected={date}
                onSelect={(newDate) => newDate && setDate(newDate)}
                className="rounded-md border"
                modifiers={{
                  guaranteed: (date) => getDateStatus(date) === "guaranteed",
                  tentative: (date) => getDateStatus(date) === "tentative",
                  unavailable: (date) => getDateStatus(date) === "unavailable",
                }}
                modifiersClassNames={{
                  guaranteed: "guaranteed-day",
                  tentative: "tentative-day",
                  unavailable: "unavailable-day",
                }}
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
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-gray-300" />
                  <span className="text-sm">Unavailable</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">{format(date, "EEEE, MMMM d, yyyy")}</h3>
                <Button onClick={handleAddAvailability} size="sm">
                  <Plus className="mr-1 h-4 w-4" />
                  Add
                </Button>
              </div>

              {selectedDateEntries.length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-center">
                  <p className="text-sm text-muted-foreground">No availability set for this date</p>
                  <Button variant="outline" size="sm" className="mt-2" onClick={handleAddAvailability}>
                    Add Availability
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDateEntries.map((entry, index) => (
                    <Card key={entry.id || index} className="overflow-hidden">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">
                                {format(new Date(entry.start_time), "h:mm a")} -{" "}
                                {format(new Date(entry.end_time), "h:mm a")}
                              </span>
                            </div>

                            {entry.is_recurring && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <RefreshCw className="h-3 w-3" />
                                <span>
                                  Repeats {entry.recurrence_pattern}
                                  {entry.recurrence_end_date &&
                                    ` until ${format(new Date(entry.recurrence_end_date), "MMM d, yyyy")}`}
                                </span>
                              </div>
                            )}

                            <div className="flex items-center gap-2">
                              {entry.certainty_level === "guaranteed" ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : entry.certainty_level === "tentative" ? (
                                <HelpCircle className="h-4 w-4 text-amber-500" />
                              ) : (
                                <AlertCircle className="h-4 w-4 text-gray-400" />
                              )}
                              <span className="text-sm capitalize">{entry.certainty_level}</span>
                            </div>
                          </div>

                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleEditAvailability(entry)}>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="lucide lucide-pencil"
                              >
                                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                <path d="m15 5 4 4" />
                              </svg>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => entry.id && handleDeleteAvailability(entry.id)}
                            >
                              <Trash2 className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Availability Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{selectedEntry ? "Edit Availability" : "Add Availability"}</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="date-time">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="date-time">Date & Time</TabsTrigger>
              <TabsTrigger value="recurrence">Recurrence</TabsTrigger>
            </TabsList>

            <TabsContent value="date-time" className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-date">Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button id="start-date" variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={(date) => date && setStartDate(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end-date">End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button id="end-date" variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={(date) => date && setEndDate(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-time">Start Time</Label>
                  <Input id="start-time" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end-time">End Time</Label>
                  <Input id="end-time" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="certainty">Availability Status</Label>
                <Select value={certaintyLevel} onValueChange={(value) => setCertaintyLevel(value as any)}>
                  <SelectTrigger id="certainty">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="guaranteed">
                      <div className="flex items-center">
                        <div className="mr-2 h-2 w-2 rounded-full bg-green-500" />
                        Guaranteed
                      </div>
                    </SelectItem>
                    <SelectItem value="tentative">
                      <div className="flex items-center">
                        <div className="mr-2 h-2 w-2 rounded-full bg-amber-500" />
                        Tentative
                      </div>
                    </SelectItem>
                    <SelectItem value="unavailable">
                      <div className="flex items-center">
                        <div className="mr-2 h-2 w-2 rounded-full bg-gray-300" />
                        Unavailable
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="recurrence" className="space-y-4 pt-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is-recurring"
                  checked={isRecurring}
                  onCheckedChange={(checked) => setIsRecurring(checked === true)}
                />
                <Label htmlFor="is-recurring">Repeat this availability</Label>
              </div>

              {isRecurring && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="recurrence-pattern">Repeat Pattern</Label>
                    <Select value={recurrencePattern} onValueChange={setRecurrencePattern} disabled={!isRecurring}>
                      <SelectTrigger id="recurrence-pattern">
                        <SelectValue placeholder="Select pattern" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="biweekly">Every 2 weeks</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="recurrence-end">End Recurrence</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="recurrence-end"
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                          disabled={!isRecurring}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {recurrenceEndDate ? format(recurrenceEndDate, "PPP") : "No end date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={recurrenceEndDate}
                          onSelect={setRecurrenceEndDate}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAvailability}>{selectedEntry ? "Update" : "Save"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

