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
import { useTranslation } from "@/lib/i18n"

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
  const { t } = useTranslation()
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
          throw new Error(t("bookingform.failedToFetchAvailability"))
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
          toast.error(t("bookingform.takingTooLongToLoadAvailability"))
        } else {
          toast.error(t("bookingform.failedToFetchFreelancerAvailability"))
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
      toast.error(t("bookingform.pleaseSelectADate"))
      return
    }

    if (!selectedStartTime || !selectedEndTime) {
      toast.error(t("bookingform.pleaseSelectBothStartAndEndTimes"))
      return
    }

    setLoading(true)

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast.error(t("bookingform.authenticationRequired"))
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
            ? `${categoryName} ${t("bookingform.service")} with ${freelancer.first_name} ${freelancer.last_name}`
            : `${t("bookingform.booking")} with ${freelancer.first_name} ${freelancer.last_name}`,
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

      toast.success(t("bookingform.bookingCreated"))

      // Redirect to payment page
      router.push(`/bookings/${data[0].id}/payment`)
    } catch (error: any) {
      toast.error(error.message || t("bookingform.somethingWentWrong"))
    } finally {
      setLoading(false)
    }
  }

  const handleSelectSuggestedDate = () => {
    if (suggestedDate) {
      onBack() // Go back to date selection
      toast.success(t("bookingform.tryDateInstead"))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Button type="button" variant="ghost" size="sm" className="mb-2 -ml-2 text-muted-foreground" onClick={onBack}>
        <ArrowLeft className="h-4 w-4 mr-1" />
        {t("bookingform.back")}
      </Button>

      {categoryName && (
        <div className="mb-2">
          <p className="font-medium">{categoryName} {t("bookingform.service")}</p>
          <p className="text-sm text-muted-foreground">€{hourlyRate}/{t("bookingform.hour")}</p>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center text-sm">
          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
          <span>{selectedDate ? format(selectedDate, "EEEE, MMMM d, yyyy") : t("bookingform.selectDate")}</span>
        </div>

        {fetchingAvailability ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : noAvailability ? (
          <div className="flex flex-col items-center justify-center p-4 border rounded-md bg-muted/50">
            <div className="flex items-center mb-2">
              <AlertCircle className="h-4 w-4 mr-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{t("bookingform.noAvailability")}</p>
            </div>

            {suggestedDate ? (
              <div className="mt-2 text-center">
                <p className="text-sm mb-2">
                  <Info className="h-4 w-4 inline mr-1 text-primary" />
                  {t("bookingform.suggestedDate", { date: format(suggestedDate, "MMMM d, yyyy") })}
                </p>
                <Button type="button" variant="outline" size="sm" onClick={handleSelectSuggestedDate}>
                  {t("bookingform.tryDate")}
                </Button>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">{t("bookingform.selectAnotherDate")}</p>
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
                    <span>{t("bookingform.confirmedAvailability")}</span>
                  </>
                ) : getCertaintyLevel === "tentative" ? (
                  <>
                    <HelpCircle className="h-4 w-4 mr-2 text-amber-500" />
                    <span>{t("bookingform.tentativeAvailability")}</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{t("bookingform.unavailableAvailability")}</span>
                  </>
                )}
              </div>
            )}

            {/* Start Time Selector */}
            <div className="space-y-2">
              <Label htmlFor="start-time">{t("bookingform.startTime")}</Label>
              <Select value={selectedStartTime || ""} onValueChange={setSelectedStartTime}>
                <SelectTrigger id="start-time">
                  <SelectValue placeholder={t("bookingform.selectStartTime")} />
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
                      {t("bookingform.noAvailableTimes")}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* End Time Selector - only enabled if start time is selected */}
            <div className="space-y-2">
              <Label htmlFor="end-time">{t("bookingform.endTime")}</Label>
              <Select
                value={selectedEndTime || ""}
                onValueChange={setSelectedEndTime}
                disabled={!selectedStartTime || validEndTimes.length === 0}
              >
                <SelectTrigger id="end-time">
                  <SelectValue placeholder={selectedStartTime ? t("bookingform.selectEndTime") : t("bookingform.selectStartTimeFirst")} />
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
                      {selectedStartTime ? t("bookingform.noAvailableEndTimes") : t("bookingform.selectStartTimeFirst")}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Duration Display */}
            {selectedStartTime && selectedEndTime && (
              <div className="text-sm text-muted-foreground">
                {t("bookingform.duration")}: {calculateHours()} {calculateHours() === 1 ? t("bookingform.hour") : t("bookingform.hours")}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">{t("bookingform.location")}</Label>
        <div className="relative">
          <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="location"
            placeholder={t("bookingform.enterAddress")}
            className="pl-8"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{t("bookingform.jobDescription")}</Label>
        <Textarea
          id="description"
          placeholder={t("bookingform.describeJob")}
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>

      <div className="border-t pt-4 mt-4">
        <div className="flex justify-between mb-2">
          <span>{t("bookingform.duration")}</span>
          <span>{calculateHours()} {t("bookingform.hours")}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span>{t("bookingform.hourlyRate")}</span>
          <span>€{hourlyRate || freelancer.hourly_rate || 0}</span>
        </div>
        <div className="flex justify-between font-bold">
          <span>{t("bookingform.total")}</span>
          <span>€{calculateTotal().toFixed(2)}</span>
        </div>
      </div>

      <div className="space-y-2 border-t pt-4">
        <Label>{t("bookingform.paymentMethod")}</Label>
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
              <p className="font-medium">{t("bookingform.onlinePayment")}</p>
              <p className="text-xs text-muted-foreground">{t("bookingform.paySecurely")}</p>
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
              <p className="font-medium">{t("bookingform.offlinePayment")}</p>
              <p className="text-xs text-muted-foreground">{t("bookingform.payDirectly")}</p>
            </div>
          </div>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={loading || fetchingAvailability || noAvailability || !selectedStartTime || !selectedEndTime || paymentMethod === "online"}
      >
        {loading ? t("bookingform.processing") : paymentMethod === "online" ? t("bookingform.onlinePaymentComingSoon") : t("bookingform.bookWithOfflinePayment")}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        {t("bookingform.byBooking")}
      </p>
    </form>
  )
}
