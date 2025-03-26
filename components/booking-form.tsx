"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/supabase-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, Calendar, MapPin } from "lucide-react"
import { format } from "date-fns"
import type { Database } from "@/lib/database.types"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]

interface BookingFormProps {
  freelancer: Profile
  selectedDate: Date | undefined
  onBack: () => void
}

export default function BookingForm({ freelancer, selectedDate, onBack }: BookingFormProps) {
  const router = useRouter()
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [startTime, setStartTime] = useState("09:00")
  const [endTime, setEndTime] = useState("10:00")
  const [location, setLocation] = useState("")
  const [description, setDescription] = useState("")

  const calculateHours = () => {
    const start = startTime.split(":").map(Number)
    const end = endTime.split(":").map(Number)

    const startMinutes = start[0] * 60 + start[1]
    const endMinutes = end[0] * 60 + end[1]

    return (endMinutes - startMinutes) / 60
  }

  const calculateTotal = () => {
    const hours = calculateHours()
    const hourlyRate = freelancer.hourly_rate || 0
    return hours * hourlyRate
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedDate) {
      toast({
        title: "Error",
        description: "Please select a date",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to book a freelancer",
          variant: "destructive",
        })
        router.push("/login")
        return
      }

      // Format date and times
      const bookingDate = format(selectedDate, "yyyy-MM-dd")
      const startDateTime = new Date(`${bookingDate}T${startTime}:00`)
      const endDateTime = new Date(`${bookingDate}T${endTime}:00`)

      // Create booking
      const { data, error } = await supabase
        .from("bookings")
        .insert({
          client_id: user.id,
          freelancer_id: freelancer.id,
          title: `Booking with ${freelancer.first_name} ${freelancer.last_name}`,
          description,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          location,
          hourly_rate: freelancer.hourly_rate || 0,
          total_amount: calculateTotal(),
          status: "pending",
          payment_status: "unpaid",
        })
        .select()

      if (error) {
        throw error
      }

      toast({
        title: "Booking created",
        description: "Your booking request has been sent to the freelancer",
      })

      // Redirect to payment page
      router.push(`/bookings/${data[0].id}/payment`)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Button type="button" variant="ghost" size="sm" className="mb-2 -ml-2 text-muted-foreground" onClick={onBack}>
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back
      </Button>

      <div className="space-y-2">
        <div className="flex items-center text-sm">
          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
          <span>{selectedDate ? format(selectedDate, "EEEE, MMMM d, yyyy") : "Select a date"}</span>
        </div>

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
            <Input id="end-time" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <div className="relative">
          <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="location"
            placeholder="Enter address"
            className="pl-8"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Job Description</Label>
        <Textarea
          id="description"
          placeholder="Describe what you need help with..."
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>

      <div className="border-t pt-4 mt-4">
        <div className="flex justify-between mb-2">
          <span>Duration</span>
          <span>{calculateHours()} hours</span>
        </div>
        <div className="flex justify-between mb-2">
          <span>Hourly Rate</span>
          <span>€{freelancer.hourly_rate || 0}</span>
        </div>
        <div className="flex justify-between font-bold">
          <span>Total</span>
          <span>€{calculateTotal().toFixed(2)}</span>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Processing..." : "Book and Pay"}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        By booking, you agree to our Terms of Service and Privacy Policy
      </p>
    </form>
  )
}

