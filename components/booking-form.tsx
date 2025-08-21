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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/lib/toast"
import { ArrowLeft, Calendar, MapPin, Info, AlertCircle, CheckCircle, HelpCircle, Loader2, FileText, ChevronRight, ChevronLeft, Shield } from "lucide-react"
import { format, addDays } from "date-fns"
import type { Database } from "@/lib/database.types"
import { useTranslation } from "@/lib/i18n"
import { PreBookingDBAModal } from './pre-booking-dba-modal'




const CustomNoBookingsIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg 
  className={props.className}
  xmlns="http://www.w3.org/2000/svg" 
  width="50" 
  height="50" 
  viewBox="0 0 24 24" 
  fill="none">
    <path opacity=".4" d="M21.08 8.58v6.84c0 1.12-.6 2.16-1.57 2.73l-5.94 3.43c-.97.56-2.17.56-3.15 0l-5.94-3.43a3.15 3.15 0 0 1-1.57-2.73V8.58c0-1.12.6-2.16 1.57-2.73l5.94-3.43c.97-.56 2.17-.56 3.15 0l5.94 3.43c.97.57 1.57 1.6 1.57 2.73Z" 
    fill="currentColor">
      </path>
      <path d="M12 13.75c-.41 0-.75-.34-.75-.75V7.75c0-.41.34-.75.75-.75s.75.34.75.75V13c0 .41-.34.75-.75.75ZM12 17.249c-.13 0-.26-.03-.38-.08-.13-.05-.23-.12-.33-.21-.09-.1-.16-.21-.22-.33a.986.986 0 0 1-.07-.38c0-.26.1-.52.29-.71.1-.09.2-.16.33-.21.37-.16.81-.07 1.09.21.09.1.16.2.21.33.05.12.08.25.08.38s-.03.26-.08.38-.12.23-.21.33a.99.99 0 0 1-.71.29Z" 
      fill="currentColor">
        </path>
        </svg>
)

const CustomRescheduleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg 
  xmlns="http://www.w3.org/2000/svg" 
  width="24" 
  height="24" 
  viewBox="0 0 24 24" 
  fill="none">
    <path 
    opacity=".4" d="M16 12.692v5.39c0 2.34-1.56 3.89-3.89 3.89H5.89c-2.33 0-3.89-1.55-3.89-3.89v-7.77c0-2.34 1.56-3.89 3.89-3.89h3.83c1.03 0 2.02.41 2.75 1.14l2.39 2.38c.73.73 1.14 1.72 1.14 2.75Z" 
    fill="#15dda9">
      </path>
      <path d="M22 8.249v5.39c0 2.33-1.56 3.89-3.89 3.89H16v-4.84c0-1.03-.41-2.02-1.14-2.75l-2.39-2.38a3.89 3.89 0 0 0-2.75-1.14H8v-.56c0-2.33 1.56-3.89 3.89-3.89h3.83c1.03 0 2.02.41 2.75 1.14l2.39 2.39A3.89 3.89 0 0 1 22 8.249Z" 
      fill="#15dda9">
        </path>
        </svg>
)

const CustomRescheduleIcon2 = (props: React.SVGProps<SVGSVGElement>) => (
  <svg 
  xmlns="http://www.w3.org/2000/svg" 
  width="24" 
  height="24" 
  viewBox="0 0 24 24" 
  fill="none">
    <path 
    opacity=".4" d="M16 12.692v5.39c0 2.34-1.56 3.89-3.89 3.89H5.89c-2.33 0-3.89-1.55-3.89-3.89v-7.77c0-2.34 1.56-3.89 3.89-3.89h3.83c1.03 0 2.02.41 2.75 1.14l2.39 2.38c.73.73 1.14 1.72 1.14 2.75Z" 
    fill="#000000">
      </path>
      <path d="M22 8.249v5.39c0 2.33-1.56 3.89-3.89 3.89H16v-4.84c0-1.03-.41-2.02-1.14-2.75l-2.39-2.38a3.89 3.89 0 0 0-2.75-1.14H8v-.56c0-2.33 1.56-3.89 3.89-3.89h3.83c1.03 0 2.02.41 2.75 1.14l2.39 2.39A3.89 3.89 0 0 1 22 8.249Z" 
      fill="#000000">
        </path>
        </svg>
)

type Profile = Database["public"]["Tables"]["profiles"]["Row"] & {
  job_offerings?: any[]
  is_available_now?: boolean
}

type AvailabilityBlock = {
  start: string
  end: string
  availableStartTimes: string[]
  certainty_level: "guaranteed" | "tentative" | "unavailable"
}



interface BookingFormProps {
  freelancer: Profile
  selectedDate: Date | undefined
  selectedCategoryId?: string | null
  onBack: () => void
}

type BookingStep = 'details' | 'payment'

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
  const [paymentMethod, setPaymentMethod] = useState<"online" | "offline">("online")
  const [currentStep, setCurrentStep] = useState<BookingStep>('details')
  const [bookingId, setBookingId] = useState<string | null>(null)
  const [clientId, setClientId] = useState<string | null>(null)
  const [showDBAModal, setShowDBAModal] = useState(false)
  const [dbaCompleted, setDbaCompleted] = useState(false)
  const [dbaResult, setDbaResult] = useState<any>(null)

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

        if (data.availabilityBlocks && data.availabilityBlocks.length > 0) {
          setAvailabilityBlocks(data.availabilityBlocks)
        } else {
          setNoAvailability(true)
          // Try to find next available date
          await findNextAvailableDate(selectedDate)
        }
      } catch (error: any) {
        if (error.name === "AbortError") {
          toast.error(t("bookingform.takingTooLongToLoadAvailability"))
        } else {
          toast.error(t("bookingform.failedToFetchFreelancerAvailability"))
        }
        setNoAvailability(true)
      } finally {
        setFetchingAvailability(false)
      }
    }

    fetchAvailability()
  }, [selectedDate, selectedCategoryId, freelancer.id])

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

        if (!response.ok) {
          continue
        }

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
        // Continue to next date
      }
    }
  }

  // Get all available start times across all blocks
  const allAvailableStartTimes = useMemo(() => {
    const startTimes = availabilityBlocks.flatMap((block) => block.availableStartTimes)
    const uniqueSortedTimes = [...new Set(startTimes)].sort() // Remove duplicates and sort
    return uniqueSortedTimes
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

  const handleDBAComplete = async (result: any) => {
    setDbaResult(result)
    setDbaCompleted(true)
    
    // Now create the booking since DBA is complete
    await createBookingWithDBA(result)
  }

  const createBookingWithDBA = async (dbaResult: any) => {
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
      const bookingDate = format(selectedDate!, "yyyy-MM-dd")
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

      const newBookingId = data[0].id
      setBookingId(newBookingId)
      setClientId(user.id)

      // Submit DBA answers to the database
      const dbaSubmissionResult = await submitClientDBA(newBookingId, dbaResult)
      
      if (dbaSubmissionResult) {
        toast.success('Booking created successfully with DBA assessment!')
      } else {
        toast.warning('Booking created successfully, but DBA assessment could not be saved. Please contact support.')
      }
      
      // Auto-proceed to payment
      setTimeout(() => {
        setCurrentStep('payment')
      }, 1000)
      
    } catch (error: any) {
      toast.error(error.message || t("bookingform.somethingWentWrong"))
    } finally {
      setLoading(false)
    }
  }

  const submitClientDBA = async (bookingId: string, dbaResult: any) => {
    try {
      const response = await fetch('/api/client-dba/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          booking_id: bookingId,
          answers: dbaResult.answers
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(`Failed to submit DBA assessment: ${errorData.error || 'Server error'}`)
      }

      const serverResult = await response.json()
      
      // Update the DBA result with server-calculated values
      const updatedResult = {
        ...dbaResult,
        combined_score: serverResult.assessment?.combined_score,
        freelancer_score: serverResult.assessment?.freelancer_total_score,
        risk_level: serverResult.assessment?.risk_level,
        debug: serverResult.debug
      }
      
      setDbaResult(updatedResult)
      
      return serverResult
    } catch (error) {
      // Don't throw error here as booking is already created
      return null
    }
  }

  const handleOpenDBAModal = () => {
    // Validate required fields before opening DBA modal
    if (!selectedDate) {
      toast.error(t("bookingform.pleaseSelectADate"))
      return
    }

    if (!selectedStartTime || !selectedEndTime) {
      toast.error(t("bookingform.pleaseSelectBothStartAndEndTimes"))
      return
    }

    if (!location.trim()) {
      toast.error("Please enter a location before starting DBA assessment")
      return
    }

    if (!description.trim()) {
      toast.error("Please enter a job description before starting DBA assessment")
      return
    }

    // Only allow DBA for offline payments
    if (paymentMethod === "online") {
      toast.error("DBA assessment is only required for offline payments. Please select offline payment method to proceed with DBA.")
      return
    }

    setShowDBAModal(true)
  }



  const handleCreateBooking = async () => {
    if (!selectedDate) {
      toast.error(t("bookingform.pleaseSelectADate"))
      return
    }

    if (!selectedStartTime || !selectedEndTime) {
      toast.error(t("bookingform.pleaseSelectBothStartAndEndTimes"))
      return
    }

    if (!location.trim()) {
      toast.error("Please enter a location before creating the booking")
      return
    }

    if (!description.trim()) {
      toast.error("Please enter a job description before creating the booking")
      return
    }

    // For offline payments, require DBA completion
    if (paymentMethod === "offline" && !dbaCompleted) {
      toast.error("DBA assessment is required for offline payments. Please complete the DBA assessment above before proceeding.")
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

      setBookingId(data[0].id)
      setClientId(user.id)
      
      // Proceed directly to payment step
      setCurrentStep('payment')
      
      toast.success(t("bookingform.bookingCreated"))
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

  const getStepProgress = () => {
    switch (currentStep) {
      case 'details': return 50
      case 'payment': return 100
      default: return 0
    }
  }

  const getStepTitle = () => {
    switch (currentStep) {
      case 'details': return t("bookingform.stepDetails")
      case 'payment': return t("bookingform.stepPayment")
      default: return ''
    }
  }

  const renderDetailsStep = () => (
    <form onSubmit={(e) => { e.preventDefault(); handleCreateBooking(); }} className="space-y-4">
      {categoryName && (
        <div className="mb-2">
          <p className="font-medium">{categoryName} {t("bookingform.service")}</p>
          <p className="text-sm text-muted-foreground text-black">€{hourlyRate} {t("freelancer.filters.hour")}</p>
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
              <Label htmlFor="start-time" className="text-xs text-black">{t("bookingform.startTime")}</Label>
              <Select value={selectedStartTime || ""} onValueChange={setSelectedStartTime}>
                <SelectTrigger id="start-time">
                  <SelectValue placeholder={t("bookingform.selectStartTime")} className="text-xs text-black" />
                </SelectTrigger>
                <SelectContent>
                  {allAvailableStartTimes.length > 0 ? (
                    allAvailableStartTimes.map((time) => (
                      <SelectItem key={time} value={time} className="text-xs text-black">
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
              <Label htmlFor="end-time" className="text-xs text-black">{t("bookingform.endTime")}</Label>
              <Select
                value={selectedEndTime || ""}
                onValueChange={setSelectedEndTime}
                disabled={!selectedStartTime || validEndTimes.length === 0}
              >
                <SelectTrigger id="end-time">
                  <SelectValue placeholder={selectedStartTime ? t("bookingform.selectEndTime") : t("bookingform.selectStartTimeFirst")} className="text-xs text-black" />
                </SelectTrigger>
                <SelectContent>
                  {validEndTimes.length > 0 ? (
                    validEndTimes.map((time) => (
                      <SelectItem key={time} value={time} className="text-xs text-black">
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
                <div className="text-xs text-black">
                {t("bookingform.duration")}: {calculateHours()} {calculateHours() === 1 ? t("bookingform.hour") : t("bookingform.hours")}
              </div>
            )}


          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="location" className="text-xs text-black">{t("bookingform.location")}</Label>
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
        <Label htmlFor="description" className="text-xs text-black">{t("bookingform.jobDescription")}</Label>
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
          <span className="text-xs text-black">{t("bookingform.duration")}</span>
          <span className="text-xs text-black">{calculateHours()} {t("bookingform.hours")}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span className="text-xs text-black">{t("bookingform.hourlyRate")}</span>
          <span className="text-xs text-black">€{hourlyRate || freelancer.hourly_rate || 0}</span>
        </div>
        <div className="flex justify-between font-bold">
          <span className="text-xs text-black">{t("bookingform.total")}</span>
          <span className="text-xs text-black">€{calculateTotal().toFixed(2)}</span>
        </div>
      </div>

      <div className="space-y-2 border-t pt-4">
        <Label className="text-xs text-black">{t("bookingform.paymentMethod")}</Label>
        <div className="grid grid-cols-2 gap-4">
          <div
            className={`border rounded-md p-3 cursor-pointer flex items-center text-xs text-black ${
              paymentMethod === "online" ? "border-primary bg-primary/5" : "border-muted"
            }`}
            onClick={() => setPaymentMethod("online")}
          >
            <div
              className={`w-2 h-2 rounded-full border mr-4 ${
                paymentMethod === "online" ? "border-primary bg-primary" : "border-muted"
              }`}
            ></div>
            <div>
              <p className="font-medium text-xs text-black">{t("bookingform.onlinePayment")}</p>
              <p className="text-xs text-black">{t("bookingform.paySecurely")}</p>
            </div>
          </div>
          <div
            className={`border rounded-md p-3 cursor-pointer flex items-center text-xs text-black ${
              paymentMethod === "offline" ? "border-primary bg-primary/5" : "border-muted"
            }`}
            onClick={() => setPaymentMethod("offline")}
          >
            <div
              className={`w-2 h-2 rounded-full border mr-4 ${
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

      {/* DBA Check Button - Moved below payment method and restricted to offline payments */}
      <div className="space-y-3 pt-4 border-t">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CustomRescheduleIcon className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium">DBA Compliance Check</span>
          </div>
          {dbaCompleted && (
            <Badge variant="default" className="text-xs">
              <CheckCircle className="h-3 w-3 mr-1" />
              Completed
            </Badge>
          )}
        </div>
        
        <p className="text-xs text-gray-600">
          Complete your DBA assessment to ensure legal compliance for this working relationship.
          {paymentMethod === "online" && (
            <span className="text-orange-600 font-medium"> DBA is only required for offline payments.</span>
          )}
        </p>
        
        <Button
          type="button"
          onClick={handleOpenDBAModal}
          variant={dbaCompleted ? "outline" : "default"}
          size="sm"
          className="w-full"
          disabled={paymentMethod === "online"}
        >
          <CustomRescheduleIcon2 className="h-4 w-4 mr-2" />
          {paymentMethod === "online" 
            ? 'DBA Not Required (Online Payment)' 
            : dbaCompleted 
              ? 'Review DBA Assessment' 
              : 'Complete DBA Check'
          }
        </Button>

        {dbaCompleted && dbaResult && (
          <div className="text-xs p-2 rounded-md border bg-gray-50">
            <div className="flex items-center justify-between">
              <span>Risk Level:</span>
              <Badge 
                variant={dbaResult.risk_level === 'safe' ? 'default' : 'destructive'}
                className="text-xs"
              >
                {dbaResult.risk_level.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {dbaResult.combined_score ?
                `Combined Score: ${dbaResult.combined_score} points` :
                `Your Score: ${dbaResult.total_score} points`}
            </div>
          </div>
        )}
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={loading || fetchingAvailability || noAvailability || !selectedStartTime || !selectedEndTime || !location.trim() || !description.trim() || paymentMethod === "online" || (paymentMethod === "offline" && !dbaCompleted) || !!bookingId}
      >
        {loading ? t("bookingform.processing") : bookingId ? 'Booking Created - Complete DBA Above' : 
         paymentMethod === "offline" ? 'Continue to DBA Assessment' : 'Online Payment Not Available'}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        {t("bookingform.byBooking")}
      </p>
    </form>
  )



  const renderPaymentStep = () => (
    <div className="space-y-4">


      <div className="flex items-center gap-2">
        <CheckCircle className="h-5 w-5 text-green-500" />
        <h2 className="text-sm font-semibold">{t("bookingform.paymentStepTitle")}</h2>
      </div>
      
      <p className="text-xs text-black">
        {t("bookingform.paymentStepDescription")}
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-black">{t("bookingform.bookingSummary")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <span className="text-xs text-black">{t("bookingform.duration")}</span>
            <span className="text-xs text-black">{calculateHours()} {t("bookingform.hours")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-black">{t("bookingform.hourlyRate")}</span>
            <span className="text-xs text-black">€{hourlyRate || freelancer.hourly_rate || 0}</span>
          </div>
          <div className="flex justify-between font-bold text-lg">
            <span className="text-xs text-black">{t("bookingform.total")}</span>
            <span className="text-xs text-black">€{calculateTotal().toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      {dbaCompleted && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-black flex items-center gap-2">
              <CustomNoBookingsIcon className="h-5 w-5 text-green-500" />
              {t("bookingform.dbaCompleted")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-black">
              {t("bookingform.dbaCompletedDescription")}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3 pt-4">
        <Button
          variant="outline"
          onClick={() => setCurrentStep('details')}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          {t("bookingform.back")}
        </Button>
        
        <Button
          onClick={() => router.push(`/bookings/${bookingId}/payment`)}
          className="flex items-center gap-2 ml-auto"
        >
          {t("bookingform.proceedToPayment")}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <div className="space-y-4">
        <Button type="button" variant="ghost" size="sm" className="-ml-2 text-muted-foreground" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          {t("bookingform.back")}
        </Button>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{getStepTitle()}</h2>
            <Badge variant="outline">Step {currentStep === 'details' ? 1 : 2} of 2</Badge>
          </div>
          <Progress value={getStepProgress()} className="h-2" />
        </div>
      </div>

      {/* Step Content */}
      {currentStep === 'details' && renderDetailsStep()}
      {currentStep === 'payment' && renderPaymentStep()}

      {/* DBA Modal */}
      <PreBookingDBAModal
        isOpen={showDBAModal}
        onClose={() => setShowDBAModal(false)}
        freelancerId={freelancer.id}
        jobCategoryId={selectedCategoryId || ''}
        onComplete={handleDBAComplete}
      />
    </div>
  )
}