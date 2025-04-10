"use client"

import { useState, useEffect } from "react"
import { useSupabase } from "@/components/supabase-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Loader2, Plus, Trash2 } from "lucide-react"
import type { Database } from "@/lib/database.types"
import { toast } from "@/lib/toast"

type AvailabilitySchedule = Database["public"]["Tables"]["availability_schedules"]["Row"]
type JobCategory = Database["public"]["Tables"]["job_categories"]["Row"]

interface TimeSlot {
  id?: string
  start: string
  end: string
}

interface DaySchedule {
  dayName: string
  dayIndex: number
  slots: TimeSlot[]
  isAvailable: boolean
}

interface AvailabilityScheduleProps {
  freelancerId: string
  categoryId: string
}

const DEFAULT_SLOTS: TimeSlot[] = [{ start: "09:00", end: "17:00" }]
const DAYS_OF_WEEK = [
  { name: "Sunday", index: 0 },
  { name: "Monday", index: 1 },
  { name: "Tuesday", index: 2 },
  { name: "Wednesday", index: 3 },
  { name: "Thursday", index: 4 },
  { name: "Friday", index: 5 },
  { name: "Saturday", index: 6 },
]

export default function AvailabilityScheduleComponent({ freelancerId, categoryId }: AvailabilityScheduleProps) {
  const { supabase } = useSupabase()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [schedule, setSchedule] = useState<DaySchedule[]>([])
  const [category, setCategory] = useState<JobCategory | null>(null)
  const [isAvailableNow, setIsAvailableNow] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)

      try {
        // Fetch the category
        const { data: categoryData } = await supabase.from("job_categories").select("*").eq("id", categoryId).single()

        setCategory(categoryData)

        // Fetch existing availability schedules
        const { data: schedulesData } = await supabase
          .from("availability_schedules")
          .select("*")
          .eq("freelancer_id", freelancerId)
          .eq("category_id", categoryId)

        // Fetch real-time availability
        const { data: realTimeData } = await supabase
          .from("real_time_availability")
          .select("*")
          .eq("freelancer_id", freelancerId)
          .eq("category_id", categoryId)
          .single()

        if (realTimeData) {
          setIsAvailableNow(realTimeData.is_available_now)
        }

        // Group schedules by day
        const schedulesGroupedByDay = DAYS_OF_WEEK.map((day) => {
          const daySchedules = schedulesData?.filter((s) => s.day_of_week === day.index) || []

          return {
            dayName: day.name,
            dayIndex: day.index,
            slots:
              daySchedules.length > 0
                ? daySchedules.map((s) => ({
                    id: s.id,
                    start: s.start_time.slice(0, 5),
                    end: s.end_time.slice(0, 5),
                  }))
                : [...DEFAULT_SLOTS],
            isAvailable: daySchedules.length > 0,
          }
        })

        setSchedule(schedulesGroupedByDay)
      } catch (error) {
        console.error("Error fetching availability data:", error)
        toast.error("Failed to load availability data")
      } finally {
        setLoading(false)
      }
    }

    if (freelancerId && categoryId) {
      fetchData()
    }
  }, [supabase, freelancerId, categoryId, toast])

  const handleToggleDay = (dayIndex: number) => {
    setSchedule((prev) =>
      prev.map((day) => (day.dayIndex === dayIndex ? { ...day, isAvailable: !day.isAvailable } : day)),
    )
  }

  const handleToggleAvailableNow = async () => {
    try {
      const newStatus = !isAvailableNow
      setIsAvailableNow(newStatus)

      const { error } = await supabase.from("real_time_availability").upsert({
        freelancer_id: freelancerId,
        category_id: categoryId,
        is_available_now: newStatus,
        last_updated: new Date().toISOString(),
      })

      if (error) throw error

      toast.success(newStatus ? "You're now available" : "You're now unavailable")
    } catch (error) {
      console.error("Error updating real-time availability:", error)
      setIsAvailableNow(!isAvailableNow) // Revert UI state
      toast.error("Failed to update availability status")
    }
  }

  const handleAddTimeSlot = (dayIndex: number) => {
    setSchedule((prev) =>
      prev.map((day) => {
        if (day.dayIndex === dayIndex) {
          const lastSlot = day.slots[day.slots.length - 1]
          // Calculate a new slot starting after the last one ends
          const newStart = lastSlot.end
          // Default to 1 hour later
          const [hours, minutes] = newStart.split(":").map(Number)
          let newEndHours = hours + 1
          const newEndMinutes = minutes

          // Handle overflow
          if (newEndHours >= 24) {
            newEndHours = 23
          }

          const newEnd = `${String(newEndHours).padStart(2, "0")}:${String(newEndMinutes).padStart(2, "0")}`

          return {
            ...day,
            slots: [...day.slots, { start: newStart, end: newEnd }],
          }
        }
        return day
      }),
    )
  }

  const handleRemoveTimeSlot = (dayIndex: number, slotIndex: number) => {
    setSchedule((prev) =>
      prev.map((day) => {
        if (day.dayIndex === dayIndex) {
          const newSlots = [...day.slots]
          newSlots.splice(slotIndex, 1)
          return {
            ...day,
            slots: newSlots.length > 0 ? newSlots : [{ start: "09:00", end: "17:00" }],
          }
        }
        return day
      }),
    )
  }

  const handleTimeChange = (dayIndex: number, slotIndex: number, field: "start" | "end", value: string) => {
    setSchedule((prev) =>
      prev.map((day) => {
        if (day.dayIndex === dayIndex) {
          const newSlots = [...day.slots]
          newSlots[slotIndex] = { ...newSlots[slotIndex], [field]: value }
          return { ...day, slots: newSlots }
        }
        return day
      }),
    )
  }

  const handleSaveSchedule = async () => {
    setSaving(true)

    try {
      // Delete existing schedules for this freelancer and category
      await supabase
        .from("availability_schedules")
        .delete()
        .eq("freelancer_id", freelancerId)
        .eq("category_id", categoryId)

      // Create array of new schedules to insert
      const newSchedules = schedule.flatMap((day) =>
        day.isAvailable
          ? day.slots.map((slot) => ({
              freelancer_id: freelancerId,
              category_id: categoryId,
              day_of_week: day.dayIndex,
              start_time: slot.start,
              end_time: slot.end,
              is_available: true,
            }))
          : [],
      )

      if (newSchedules.length > 0) {
        const { error } = await supabase.from("availability_schedules").insert(newSchedules)

        if (error) throw error
      }

      toast.success("Schedule updated successfully")
    } catch (error) {
      console.error("Error saving schedule:", error)
      toast.error("Failed to save availability schedule")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Availability for {category?.name || "Job Category"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
          <div>
            <h3 className="font-medium">Available Now</h3>
            <p className="text-sm text-muted-foreground">
              Toggle this to show clients you're ready for immediate bookings
            </p>
          </div>
          <Switch checked={isAvailableNow} onCheckedChange={handleToggleAvailableNow} />
        </div>

        <div className="space-y-4">
          <h3 className="font-medium">Weekly Schedule</h3>
          <div className="space-y-6">
            {schedule.map((day) => (
              <div key={day.dayIndex} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <Label htmlFor={`day-${day.dayIndex}`} className="font-medium">
                    {day.dayName}
                  </Label>
                  <Switch
                    id={`day-${day.dayIndex}`}
                    checked={day.isAvailable}
                    onCheckedChange={() => handleToggleDay(day.dayIndex)}
                  />
                </div>

                {day.isAvailable && (
                  <div className="space-y-4 mt-4">
                    {day.slots.map((slot, slotIndex) => (
                      <div key={slotIndex} className="flex items-center gap-2">
                        <div className="grid grid-cols-2 gap-2 flex-1">
                          <div>
                            <Label
                              htmlFor={`start-${day.dayIndex}-${slotIndex}`}
                              className="text-xs text-muted-foreground"
                            >
                              Start Time
                            </Label>
                            <Input
                              id={`start-${day.dayIndex}-${slotIndex}`}
                              type="time"
                              value={slot.start}
                              onChange={(e) => handleTimeChange(day.dayIndex, slotIndex, "start", e.target.value)}
                            />
                          </div>
                          <div>
                            <Label
                              htmlFor={`end-${day.dayIndex}-${slotIndex}`}
                              className="text-xs text-muted-foreground"
                            >
                              End Time
                            </Label>
                            <Input
                              id={`end-${day.dayIndex}-${slotIndex}`}
                              type="time"
                              value={slot.end}
                              onChange={(e) => handleTimeChange(day.dayIndex, slotIndex, "end", e.target.value)}
                            />
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="mt-6"
                          onClick={() => handleRemoveTimeSlot(day.dayIndex, slotIndex)}
                          disabled={day.slots.length <= 1}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => handleAddTimeSlot(day.dayIndex)}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add Time Slot
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <Button onClick={handleSaveSchedule} disabled={saving} className="w-full">
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Schedule"
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

