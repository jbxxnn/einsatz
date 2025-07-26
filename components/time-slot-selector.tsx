"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Clock } from "lucide-react"
import { format } from "date-fns"
import { toast } from "@/lib/toast"

interface TimeSlot {
  start: string
  end: string
  startTime: string
  endTime: string
}

interface TimeSlotSelectorProps {
  freelancerId: string
  categoryId?: string | null
  selectedDate: Date | undefined
  onTimeSlotSelect: (startTime: string, endTime: string) => void
  className?: string
}

export default function TimeSlotSelector({
  freelancerId,
  categoryId,
  selectedDate,
  onTimeSlotSelect,
  className = "",
}: TimeSlotSelectorProps) {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)

  useEffect(() => {
    if (!selectedDate || !freelancerId) {
      setTimeSlots([])
      setSelectedSlot(null)
      return
    }

    const fetchTimeSlots = async () => {
      setLoading(true)
      try {
        const response = await fetch("/api/available-dates", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            freelancerId,
            date: format(selectedDate, "yyyy-MM-dd"),
            categoryId,
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to fetch time slots")
        }

        const data = await response.json()
        setTimeSlots(data.availableSlots || [])
        setSelectedSlot(null)
      } catch (error) {
        console.error("Error fetching time slots:", error)
        toast.error("Failed to fetch available time slots")
        setTimeSlots([])
      } finally {
        setLoading(false)
      }
    }

    fetchTimeSlots()
  }, [selectedDate, freelancerId, categoryId])

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot)
    onTimeSlotSelect(slot.startTime, slot.endTime)
  }

  if (!selectedDate) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Select a date to view available time slots</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Available Time Slots for {format(selectedDate, "EEEE, MMMM d, yyyy")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : timeSlots.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No available time slots for this date</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {timeSlots.map((slot, index) => (
              <Button
                key={index}
                variant={selectedSlot === slot ? "default" : "outline"}
                className="h-12 text-sm"
                onClick={() => handleSlotSelect(slot)}
              >
                {slot.start} - {slot.end}
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 