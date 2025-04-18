"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useOptimizedSupabase } from "./optimized-supabase-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/lib/toast"
import { ArrowLeft, Calendar, MapPin, Info, AlertCircle, CheckCircle, HelpCircle, Loader2 } from "lucide-react"
import { format, addDays } from "date-fns"
import type { Database } from "@/lib/database.types"

type Profile = Database["public"]["Tables"]["profiles"]["Row"] & {
  job_offerings?: any[]
  is_available_now?: boolean
}

interface AvailabilityBlock {
  id: string
  start: string
  end: string
  availableStartTimes: string[]
  certainty_level: "guaranteed" | "tentative" | "unavailable"
  is_recurring: boolean
  recurrence_pattern?: string | null
}

interface BookingFormProps {
  freelancer: Profile
  selectedDate: Date | undefined
  selectedCategoryId?: string | null
  onBack: () => void
}

export default function BookingForm({ freelancer, selectedDate, selectedCategoryId, onBack }: BookingFormProps) {
  const router = useRouter()
  const { supabase } = useOptimizedSupabase()
  const [loading, setLoading] = useState(false)
  const [fetchingAvailability, setFetchingAvailability] = useState(false)
  const [availabilityBlocks, setAvailabilityBlocks] = useState<AvailabilityBlock[]>([])
  const [selectedStartTime, setSelectedStartTime] = useState<string | null>(null)
  const [selectedEndTime, setSelectedEndTime] = useState<string | null>(null)
  const [location, setLocation] = useState("")
  const [description, setDescription] = useState("")
  const [hourlyRate, setHourlyRate] = useState<number | null>(null)
  const [categoryName, setCategoryName] = useState<string>("")
  const [noAvailability, setNoAvailability] = useState(false)
  const [suggestedDate, setSuggestedDate] = useState<Date | null>(null)
  const [debugInfo, setDebugInfo] = useState<string>("")
  const [paymentMethod, setPaymentMethod] = useState<"online" | "offline">("online")

  // Calculate valid end times based on selected start time
  const validEndTimes = useMemo(() => {
    if (!selectedStartTime || availabilityBlocks.length === 0) return []

    // Find the block that contains the selected start time
    const relevantBlock = availabilityBlocks.find((block) => {
      // Check if the selected start time falls within this block
      return isTimeInRange(selectedStartTime, block.start, block.end)
    })

    if (!relevantBlock) return []

    // Convert times to minutes for easier comparison
    const toMinutes = (timeStr: string) => {
      const [hours, minutes] = timeStr.split(":").map(Number)
      return hours * 60 + minutes
    }

    const fromMinutes = (minutes: number) => {
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`
    }

    const startMinutes = toMinutes(selectedStartTime)
    const blockEndMinutes = toMinutes(relevantBlock.end)

    // Generate possible end times (in hourly increments)
    const endTimes = []
    // Start with 1 hour after the selected start time
    for (let time = startMinutes + 60; time <= blockEndMinutes; time += 60) {
      endTimes.push(fromMinutes(time))
    }

    return endTimes
  }, [selectedStartTime, availabilityBlocks])

  // Helper function to check if a time is within a range
  function isTimeInRange(time: string, start: string, end: string): boolean {
    const toMinutes = (timeStr: string) => {
      const [hours, minutes] = timeStr.split(":").map(Number)
      return hours * 60 + minutes
    }

    const timeMinutes = toMinutes(time)
    const startMinutes = toMinutes(start)
    const endMinutes = toMinutes(end)

    return timeMinutes >= startMinutes && timeMinutes < endMinutes
  }

  // Reset end time when start time changes
  useEffect(() => {
    setSelectedEndTime(null)
  }, [selectedStartTime])

  useEffect(() => {
    // Set hourly rate based on selected category or default
    if (selectedCategoryId && freelancer.job_offerings) {
      const offering = freelancer.job_offerings.find((o: any) => o.category_id === selectedCategoryId)
      if (offering) {
        setHourlyRate(offering.hourly_rate)
        setCategoryName(offering.category_name)
      }
    } else {
      setHourlyRate(freelancer.hourly_rate)
    }
  }, [selectedCategoryId, freelancer])

  useEffect(() => {
    const fetchAvailability = async () => {
      if (!selectedDate || !selectedCategoryId) return

      setFetchingAvailability(true)
      setNoAvailability(false)
      setSuggestedDate(null)
      setSelectedStartTime(null)
      setSelectedEndTime(null)
      setDebugInfo("")

      try {
        const formattedDate = format(selectedDate, "yyyy-MM-dd")
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

        const response = await fetch(
          `/api/availability?freelancerId=${freelancer.id}&categoryId=${selectedCategoryId}&date=${formattedDate}`,
          { signal: controller.signal, cache: "no-store" },
        )

        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error("Failed to fetch availability")
        }

        const data = await response.json()

        // Add debug info
        setDebugInfo(JSON.stringify(data, null, 2))

        if (data.availabilityBlocks && data.availabilityBlocks.length > 0) {
          setAvailabilityBlocks(data.availabilityBlocks)

          // Flatten all available start times across all blocks
          const allStartTimes = data.availabilityBlocks.flatMap((block: AvailabilityBlock) => block.availableStartTimes)

          if (allStartTimes.length === 0) {
            setNoAvailability(true)
            findNextAvailableDate(selectedDate)
          }
        } else {
          setAvailabilityBlocks([])
          setNoAvailability(true)
          findNextAvailableDate(selectedDate)
        }
      } catch (error: any) {
        console.error("Error fetching availability:", error)
        if (error.name === "AbortError") {
          toast.error("Taking too long to load availability. Please try again.")
        } else {
          toast.error("Failed to fetch freelancer availability")
        }
        setAvailabilityBlocks([])
      } finally {
        setFetchingAvailability(false)
      }
    }

    fetchAvailability()
  }, [selectedDate, selectedCategoryId, freelancer.id, toast])

  // Function to find the next available date
  const findNextAvailableDate = async (startDate: Date) => {
    // Try the next 7 days
    for (let i = 1; i <= 7; i++) {
      const nextDate = addDays(startDate, i)
      const formattedDate = format(nextDate, "yyyy-MM-dd")

      try {
        const response = await fetch(
          `/api/availability?freelancerId=${freelancer.id}&categoryId=${selectedCategoryId}&date=${formattedDate}`,
        )

        if (!response.ok) continue

        const data = await response.json()

        if (data.availabilityBlocks && data.availabilityBlocks.length > 0) {
          // Check if there are actually available start times
          const hasAvailableTimes = data.availabilityBlocks.some(
            (block: AvailabilityBlock) => block.availableStartTimes.length > 0,
          )

          if (hasAvailableTimes) {
            setSuggestedDate(nextDate)
            return
          }
        }
      } catch (error) {
        console.error("Error checking future date:", error)
      }
    }
  }

  // Get all available start times across all blocks
  const allAvailableStartTimes = useMemo(() => {
    const startTimes = availabilityBlocks.flatMap((block) => block.availableStartTimes)
    return [...new Set(startTimes)].sort() // Remove duplicates and sort
  }, [availabilityBlocks])

  // Get certainty level for display
  const getCertaintyLevel = useMemo(() => {
    if (availabilityBlocks.length === 0) return null

    // Find the lowest certainty level among blocks
    if (availabilityBlocks.some((block) => block.certainty_level === "unavailable")) {
      return "unavailable"
    } else if (availabilityBlocks.some((block) => block.certainty_level === "tentative")) {
      return "tentative"
    } else {
      return "guaranteed"
    }
  }, [availabilityBlocks])

  const calculateHours = () => {
    if (!selectedStartTime || !selectedEndTime) return 0

    const start = selectedStartTime.split(":").map(Number)
    const end = selectedEndTime.split(":").map(Number)

    const startMinutes = start[0] * 60 + start[1]
    const endMinutes = end[0] * 60 + end[1]

    return (endMinutes - startMinutes) / 60
  }

  const calculateTotal = () => {
    const hours = calculateHours()
    const rate = hourlyRate || freelancer.hourly_rate || 0
    return hours * rate
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number)
    const period = hours >= 12 ? "PM" : "AM"
    const displayHours = hours % 12 || 12
    return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedDate) {
      toast.error("Please select a date")
      return
    }

    if (!selectedStartTime || !selectedEndTime) {
      toast.error("Please select both start and end times")
      return
    }

    setLoading(true)

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast.error("Authentication required")
        router.push("/login")
        return
      }

      // Format date and times
      const bookingDate = format(selectedDate, "yyyy-MM-dd")
      const startDateTime = new Date(`${bookingDate}T${selectedStartTime}:00`)
      const endDateTime = new Date(`${bookingDate}T${selectedEndTime}:00`)

      // Create booking
      const { data, error } = await supabase
        .from("bookings")
        .insert({
          client_id: user.id,
          freelancer_id: freelancer.id,
          title: categoryName
            ? `${categoryName} Service with ${freelancer.first_name} ${freelancer.last_name}`
            : `Booking with ${freelancer.first_name} ${freelancer.last_name}`,
          description,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          location,
          hourly_rate: hourlyRate || freelancer.hourly_rate || 0,
          total_amount: calculateTotal(),
          status: "pending",
          payment_status: "unpaid",
          category_id: selectedCategoryId,
          payment_method: paymentMethod,
        })
        .select()

      if (error) {
        throw error
      }

      toast.success("Booking created")

      // Redirect to payment page
      router.push(`/bookings/${data[0].id}/payment`)
    } catch (error: any) {
      toast.error(error.message || "Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleSelectSuggestedDate = () => {
    if (suggestedDate) {
      onBack() // Go back to date selection
      toast.success("Try this date instead")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Button type="button" variant="ghost" size="sm" className="mb-2 -ml-2 text-muted-foreground" onClick={onBack}>
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back
      </Button>

      {categoryName && (
        <div className="mb-2">
          <p className="font-medium">{categoryName} Service</p>
          <p className="text-sm text-muted-foreground">€{hourlyRate}/hour</p>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center text-sm">
          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
          <span>{selectedDate ? format(selectedDate, "EEEE, MMMM d, yyyy") : "Select a date"}</span>
        </div>

        {fetchingAvailability ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : noAvailability ? (
          <div className="flex flex-col items-center justify-center p-4 border rounded-md bg-muted/50">
            <div className="flex items-center mb-2">
              <AlertCircle className="h-4 w-4 mr-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No availability for this date.</p>
            </div>

            {suggestedDate ? (
              <div className="mt-2 text-center">
                <p className="text-sm mb-2">
                  <Info className="h-4 w-4 inline mr-1 text-primary" />
                  The freelancer has availability on {format(suggestedDate, "MMMM d, yyyy")}
                </p>
                <Button type="button" variant="outline" size="sm" onClick={handleSelectSuggestedDate}>
                  Try this date instead
                </Button>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">Please select another date.</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Availability Status Indicator */}
            {getCertaintyLevel && (
              <div className="flex items-center p-2 rounded-md bg-muted/30 text-sm">
                {getCertaintyLevel === "guaranteed" ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                    <span>The freelancer has confirmed availability on this date</span>
                  </>
                ) : getCertaintyLevel === "tentative" ? (
                  <>
                    <HelpCircle className="h-4 w-4 mr-2 text-amber-500" />
                    <span>The freelancer's availability is tentative on this date</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 mr-2 text-gray-400" />
                    <span>The freelancer has marked this date as unavailable</span>
                  </>
                )}
              </div>
            )}

            {/* Start Time Selector */}
            <div className="space-y-2">
              <Label htmlFor="start-time">Start Time</Label>
              <Select value={selectedStartTime || ""} onValueChange={setSelectedStartTime}>
                <SelectTrigger id="start-time">
                  <SelectValue placeholder="Select start time" />
                </SelectTrigger>
                <SelectContent>
                  {allAvailableStartTimes.length > 0 ? (
                    allAvailableStartTimes.map((time) => (
                      <SelectItem key={time} value={time}>
                        {formatTime(time)}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      No available times
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* End Time Selector - only enabled if start time is selected */}
            <div className="space-y-2">
              <Label htmlFor="end-time">End Time</Label>
              <Select
                value={selectedEndTime || ""}
                onValueChange={setSelectedEndTime}
                disabled={!selectedStartTime || validEndTimes.length === 0}
              >
                <SelectTrigger id="end-time">
                  <SelectValue placeholder={selectedStartTime ? "Select end time" : "Select start time first"} />
                </SelectTrigger>
                <SelectContent>
                  {validEndTimes.length > 0 ? (
                    validEndTimes.map((time) => (
                      <SelectItem key={time} value={time}>
                        {formatTime(time)}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      {selectedStartTime ? "No available end times" : "Select start time first"}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Duration Display */}
            {selectedStartTime && selectedEndTime && (
              <div className="text-sm text-muted-foreground">
                Duration: {calculateHours()} {calculateHours() === 1 ? "hour" : "hours"}
              </div>
            )}
          </div>
        )}
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
          <span>€{hourlyRate || freelancer.hourly_rate || 0}</span>
        </div>
        <div className="flex justify-between font-bold">
          <span>Total</span>
          <span>€{calculateTotal().toFixed(2)}</span>
        </div>
      </div>

      <div className="space-y-2 border-t pt-4">
        <Label>Payment Method</Label>
        <div className="grid grid-cols-2 gap-4">
          <div
            className={`border rounded-md p-3 cursor-pointer flex items-center ${
              paymentMethod === "online" ? "border-primary bg-primary/5" : "border-muted"
            }`}
            onClick={() => setPaymentMethod("online")}
          >
            <div
              className={`w-4 h-4 rounded-full border mr-2 ${
                paymentMethod === "online" ? "border-primary bg-primary" : "border-muted"
              }`}
            ></div>
            <div>
              <p className="font-medium">Online Payment</p>
              <p className="text-xs text-muted-foreground">Pay securely through our platform</p>
            </div>
          </div>
          <div
            className={`border rounded-md p-3 cursor-pointer flex items-center ${
              paymentMethod === "offline" ? "border-primary bg-primary/5" : "border-muted"
            }`}
            onClick={() => setPaymentMethod("offline")}
          >
            <div
              className={`w-4 h-4 rounded-full border mr-2 ${
                paymentMethod === "offline" ? "border-primary bg-primary" : "border-muted"
              }`}
            ></div>
            <div>
              <p className="font-medium">Offline Payment</p>
              <p className="text-xs text-muted-foreground">Pay directly to the freelancer</p>
            </div>
          </div>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={loading || fetchingAvailability || noAvailability || !selectedStartTime || !selectedEndTime}
      >
        {loading ? "Processing..." : paymentMethod === "online" ? "Book and Pay Online" : "Book with Offline Payment"}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        By booking, you agree to our Terms of Service and Privacy Policy
      </p>
    </form>
  )
}
