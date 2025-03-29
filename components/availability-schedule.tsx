"use client"

import { useState, useEffect } from "react"
import { useSupabase } from "@/components/supabase-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import type { Database } from "@/lib/database.types"

type AvailabilitySchedule = Database["public"]["Tables"]["availability_schedules"]["Row"]
type JobCategory = Database["public"]["Tables"]["job_categories"]["Row"]

interface TimeSlot {
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
  const { toast } = useToast()
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

        // Initialize schedule with default values
        const initialSchedule = DAYS_OF_WEEK.map((day) => {
          const daySchedules = schedulesData?.filter((s) => s.day_of_week === day.index) || []

          return {
            dayName: day.name,
            dayIndex: day.index,
            slots:
              daySchedules.length > 0
                ? daySchedules.map((s) => ({ start: s.start_time.slice(0, 5), end: s.end_time.slice(0, 5) }))
                : [...DEFAULT_SLOTS],
            isAvailable: daySchedules.length > 0 ? daySchedules[0].is_available : false,
          }
        })

        setSchedule(initialSchedule)
      } catch (error) {
        console.error("Error fetching availability data:", error)
        toast({
          title: "Error",
          description: "Failed to load availability data",
          variant: "destructive",
        })
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

      toast({
        title: newStatus ? "You're now available" : "You're now unavailable",
        description: newStatus
          ? "Clients can now book you immediately"
          : "You won't receive immediate booking requests",
      })
    } catch (error) {
      console.error("Error updating real-time availability:", error)
      setIsAvailableNow(!isAvailableNow) // Revert UI state
      toast({
        title: "Error",
        description: "Failed to update availability status",
        variant: "destructive",
      })
    }
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

      toast({
        title: "Schedule saved",
        description: "Your availability schedule has been updated",
      })
    } catch (error) {
      console.error("Error saving schedule:", error)
      toast({
        title: "Error",
        description: "Failed to save availability schedule",
        variant: "destructive",
      })
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
          <div className="space-y-4">
            {schedule.map((day) => (
              <div key={day.dayIndex} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label htmlFor={`day-${day.dayIndex}`} className="font-medium">
                    {day.dayName}
                  </Label>
                </div>
                <Switch
                  id={`day-${day.dayIndex}`}
                  checked={day.isAvailable}
                  onCheckedChange={() => handleToggleDay(day.dayIndex)}
                />
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

