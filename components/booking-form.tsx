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
// import { toast } from "@/hooks/use-toast"
import { ArrowLeft, Calendar, MapPin, Info, AlertCircle, CheckCircle, HelpCircle, Loader2, FileText, ChevronRight, ChevronLeft, AlertTriangle } from "lucide-react"
import { format, addDays } from "date-fns"
import type { Database } from "@/lib/database.types"
import { useTranslation } from "@/lib/i18n"
import DBAQuestionnaireV2 from "./dba-questionnaire-v2"
import DBADisputeResolver from "./dba-dispute-resolver"
import DBAReportDisplay from "./dba-report-display"
import DBAWaiverModal from "./dba-waiver-modal"
import DBAWarningDialog from "./dba-warning-dialog"
import { useDBAReport } from "@/hooks/use-dba-report"
import { useDBAWaiver } from "@/hooks/use-dba-waiver"



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

type DBAAnswer = {
  question_group_id: string
  answer_value: string
}

interface BookingFormProps {
  freelancer: Profile
  selectedDate: Date | undefined
  selectedCategoryId?: string | null
  onBack: () => void
}

type BookingStep = 'details' | 'dba' | 'payment'

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
  const [currentStep, setCurrentStep] = useState<BookingStep>('details')
  const [bookingId, setBookingId] = useState<string | null>(null)
  const [clientId, setClientId] = useState<string | null>(null)
  const [dbaAnswers, setDbaAnswers] = useState<DBAAnswer[]>([])
  const [dbaCompleted, setDbaCompleted] = useState(false)
  const [dbaReport, setDbaReport] = useState<any>(null)
  const [showWaiverModal, setShowWaiverModal] = useState(false)
  const [waiverCreated, setWaiverCreated] = useState(false)
  const [disputes, setDisputes] = useState<any[]>([])
  const [disputesResolved, setDisputesResolved] = useState(false)
  const [freelancerDBAStatus, setFreelancerDBAStatus] = useState<any>(null)
  const [checkingFreelancerDBA, setCheckingFreelancerDBA] = useState(false)
  const [showDBAWarning, setShowDBAWarning] = useState(false)
  const [dbaWarningType, setDbaWarningType] = useState<'no_dba'>('no_dba')
  const { t } = useTranslation()
  const { generateReport } = useDBAReport()
  const { hasWaiver } = useDBAWaiver()

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

      console.log('🔄 [DEBUG] Starting availability fetch:', {
        date: selectedDate,
        categoryId: selectedCategoryId,
        freelancerId: freelancer.id,
        timestamp: new Date().toISOString()
      })

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

        console.log('📡 [DEBUG] Making API request to:', `/api/availability?freelancerId=${freelancer.id}&categoryId=${selectedCategoryId}&date=${formattedDate}`)

        const response = await fetch(
          `/api/availability?freelancerId=${freelancer.id}&categoryId=${selectedCategoryId}&date=${formattedDate}`,
          { signal: controller.signal, cache: "no-store" },
        )

        clearTimeout(timeoutId)

        console.log('📥 [DEBUG] API Response status:', response.status, response.ok)

        if (!response.ok) {
          throw new Error(t("bookingform.failedToFetchAvailability"))
        }

        const data = await response.json()

        console.log('📊 [DEBUG] API Response data:', {
          hasAvailabilityBlocks: !!data.availabilityBlocks,
          blocksCount: data.availabilityBlocks?.length || 0,
          blocks: data.availabilityBlocks,
          timestamp: new Date().toISOString()
        })

        // Add debug info
        setDebugInfo(JSON.stringify(data, null, 2))

        if (data.availabilityBlocks && data.availabilityBlocks.length > 0) {
          console.log('✅ [DEBUG] Setting availability blocks:', data.availabilityBlocks)
          setAvailabilityBlocks(data.availabilityBlocks)
        } else {
          console.log('❌ [DEBUG] No availability blocks found, setting noAvailability to true')
          setNoAvailability(true)
          // Try to find next available date
          await findNextAvailableDate(selectedDate)
        }
      } catch (error: any) {
        console.error('💥 [DEBUG] Error in fetchAvailability:', error)
        if (error.name === "AbortError") {
          console.log('⏰ [DEBUG] Request was aborted due to timeout')
          toast.error(t("bookingform.takingTooLongToLoadAvailability"))
        } else {
          console.error("Error fetching availability:", error)
          toast.error(t("bookingform.failedToFetchFreelancerAvailability"))
        }
        setNoAvailability(true)
      } finally {
        console.log('🏁 [DEBUG] Fetch availability completed, setting fetchingAvailability to false')
        setFetchingAvailability(false)
      }
    }

    fetchAvailability()
  }, [selectedDate, selectedCategoryId, freelancer.id])

  // Function to find the next available date
  const findNextAvailableDate = async (startDate: Date) => {
    console.log('🔍 [DEBUG] Starting findNextAvailableDate for:', startDate)
    
    // Try the next 7 days
    for (let i = 1; i <= 7; i++) {
      const nextDate = addDays(startDate, i)
      const formattedDate = format(nextDate, "yyyy-MM-dd")

      console.log(`🔍 [DEBUG] Checking day ${i}:`, formattedDate)

      try {
        const response = await fetch(
          `/api/availability?freelancerId=${freelancer.id}&categoryId=${selectedCategoryId}&date=${formattedDate}`,
        )

        if (!response.ok) {
          console.log(`❌ [DEBUG] Day ${i} response not ok:`, response.status)
          continue
        }

        const data = await response.json()

        console.log(`📊 [DEBUG] Day ${i} data:`, {
          hasBlocks: !!data.availabilityBlocks,
          blocksCount: data.availabilityBlocks?.length || 0
        })

        if (data.availabilityBlocks && data.availabilityBlocks.length > 0) {
          // Check if there are actually available start times
          const hasAvailableTimes = data.availabilityBlocks.some(
            (block: AvailabilityBlock) => block.availableStartTimes.length > 0,
          )

          console.log(`🔍 [DEBUG] Day ${i} hasAvailableTimes:`, hasAvailableTimes)

          if (hasAvailableTimes) {
            console.log(`✅ [DEBUG] Found available date:`, nextDate)
            setSuggestedDate(nextDate)
            return
          }
        }
      } catch (error) {
        console.error(`💥 [DEBUG] Error checking day ${i}:`, error)
      }
    }
    
    console.log('❌ [DEBUG] No available dates found in next 7 days')
  }

  // Get all available start times across all blocks
  const allAvailableStartTimes = useMemo(() => {
    const startTimes = availabilityBlocks.flatMap((block) => block.availableStartTimes)
    const uniqueSortedTimes = [...new Set(startTimes)].sort() // Remove duplicates and sort
    
    console.log('🕐 [DEBUG] allAvailableStartTimes calculated:', {
      availabilityBlocksCount: availabilityBlocks.length,
      allStartTimes: startTimes,
      uniqueSortedTimes: uniqueSortedTimes,
      timestamp: new Date().toISOString()
    })
    
    return uniqueSortedTimes
  }, [availabilityBlocks])

  // Debug effect to track state changes
  useEffect(() => {
    console.log('🔄 [DEBUG] State changed:', {
      fetchingAvailability,
      noAvailability,
      availabilityBlocksCount: availabilityBlocks.length,
      allAvailableStartTimesCount: allAvailableStartTimes.length,
      selectedStartTime,
      selectedEndTime,
      timestamp: new Date().toISOString()
    })
  }, [fetchingAvailability, noAvailability, availabilityBlocks, allAvailableStartTimes, selectedStartTime, selectedEndTime])

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

  const handleCreateBooking = async () => {
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

      setBookingId(data[0].id)
      setClientId(user.id)
      
      // Check freelancer DBA status before proceeding to DBA step
      const dbaStatus = await checkFreelancerDBAStatus()
      
      console.log('🔍 [Booking Form] DBA Status Check Results:', {
        dbaStatus,
        selectedCategoryId,
        freelancerId: freelancer.id
      })
      
      if (dbaStatus) {
        console.log('🔍 [Booking Form] DBA Logic:', {
          status: dbaStatus.status,
          hasDBA: dbaStatus.has_dba
        })
        
        if (dbaStatus.status === 'no_dba') {
          // No DBA at all - show warning dialog
          console.log('🔍 [Booking Form] Showing no_dba warning')
          setDbaWarningType('no_dba')
          setShowDBAWarning(true)
          return // Don't proceed until user responds to dialog
        } else {
          // Has V2 DBA - proceed normally
          console.log('🔍 [Booking Form] Proceeding to DBA step (V2 ready)')
          setCurrentStep('dba')
        }
      } else {
        // No DBA status - proceed normally (fallback)
        console.log('🔍 [Booking Form] Proceeding to DBA step (no status)')
        setCurrentStep('dba')
      }
      
      toast.success(t("bookingform.bookingCreated"))
    } catch (error: any) {
      toast.error(error.message || t("bookingform.somethingWentWrong"))
    } finally {
      setLoading(false)
    }
  }

  const handleDBAComplete = async (answers: DBAAnswer[]) => {
    setDbaAnswers(answers)
    setDbaCompleted(true)
    
    // Generate DBA report (V2)
    if (bookingId && clientId && selectedCategoryId) {
      try {
        const apiEndpoint = '/api/dba/reports/generate'
        
        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingId,
            freelancerId: freelancer.id,
            clientId,
            jobCategoryId: selectedCategoryId
          })
        })
        
        const data = await response.json()
        
        if (!response.ok) {
          // Handle no freelancer DBA scenario
          if (data.has_freelancer_dba === false) {
            toast.warning(data.message || "Freelancer has not completed DBA assessment")
            
            // Show risk warning and allow proceeding anyway
            const proceed = confirm(
              `⚠️ DBA Risk Warning\n\n${data.message}\n\nWould you like to proceed with the booking anyway?\n\n• Click "OK" to continue at your own risk\n• Click "Cancel" to contact the freelancer first`
            )
            
            if (proceed) {
              setDbaReport({ 
                score: 0, 
                risk_level: 'high_risk', 
                no_freelancer_dba: true,
                message: 'Booking created without DBA assessment - High risk'
              })
              setDbaCompleted(true)
              setCurrentStep('payment')
              toast.info("Proceeding without DBA assessment - High risk booking")
            } else {
              setCurrentStep('details')
              toast.info("Contact the freelancer to complete their DBA assessment first")
            }
            return
          } else {
            throw new Error(data.error || 'Failed to generate DBA report')
          }
        }
        
        if (data.report) {
          setDbaReport(data.report)
          
          // Handle V2 disputes if any
          if (data.disputes?.length > 0) {
            setDisputes(data.disputes)
            setDisputesResolved(false)
            toast.warning(`DBA report generated with ${data.disputes.length} dispute(s) requiring attention`)
          } else {
            setDisputesResolved(true)
            toast.success(`Compliance score: ${data.report.score}% - Risk level: ${data.report.risk_level}`)
          }
        }
      } catch (error) {
        console.error('Failed to generate DBA report:', error)
        toast.error("DBA report could not be generated, but you can continue with payment.")
      }
    }
    
    // Only proceed to payment if no disputes or disputes are resolved
    if (!disputesResolved || disputes.length === 0) {
      setCurrentStep('payment')
    }
  }

  const handleDBASave = (answers: DBAAnswer[]) => {
    setDbaAnswers(answers)
  }

  const checkFreelancerDBAStatus = async () => {
    if (!selectedCategoryId) return null
    
    console.log('🔍 [Booking Form] Starting DBA status check for:', {
      freelancerId: freelancer.id,
      jobCategoryId: selectedCategoryId
    })
    
    setCheckingFreelancerDBA(true)
    try {
      const response = await fetch('/api/dba/check-freelancer-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          freelancerId: freelancer.id,
          jobCategoryId: selectedCategoryId
        })
      })
      
      console.log('🔍 [Booking Form] DBA status API response:', {
        status: response.status,
        ok: response.ok
      })
      
      const data = await response.json()
      console.log('🔍 [Booking Form] DBA status API data:', data)
      
      setFreelancerDBAStatus(data)
      return data
    } catch (error) {
      console.error('🚨 [Booking Form] Failed to check freelancer DBA status:', error)
      return null
    } finally {
      setCheckingFreelancerDBA(false)
    }
  }

  const handleWaiverCreated = () => {
    setWaiverCreated(true)
    setDbaCompleted(true)
    // Skip to payment step after waiver
    setCurrentStep('payment')
  }

  const handleDBAWarningProceed = () => {
    setShowDBAWarning(false)
    
    // No DBA - proceed with high risk warning
    setDbaReport({ 
      score: 0, 
      risk_level: 'high_risk', 
      no_freelancer_dba: true,
      message: 'Booking created without DBA assessment - High risk'
    })
    setDbaCompleted(true)
    setCurrentStep('payment')
    toast.warning("Proceeding without DBA assessment - High risk booking")
  }

  const handleDBAWarningCancel = () => {
    setShowDBAWarning(false)
    toast.info("Contact the freelancer to complete their DBA assessment first")
    // Stay on current step (details)
  }

  const checkForExistingWaiver = async () => {
    if (bookingId) {
      const hasExistingWaiver = await hasWaiver(bookingId)
      if (hasExistingWaiver) {
        setWaiverCreated(true)
        setDbaCompleted(true)
      }
    }
  }

  // Check for existing waiver when booking is created
  useEffect(() => {
    if (bookingId) {
      checkForExistingWaiver()
    }
  }, [bookingId])



  const handleSelectSuggestedDate = () => {
    if (suggestedDate) {
      onBack() // Go back to date selection
      toast.success(t("bookingform.tryDateInstead"))
    }
  }

  const getStepProgress = () => {
    switch (currentStep) {
      case 'details': return 33
      case 'dba': return 66
      case 'payment': return 100
      default: return 0
    }
  }

  const getStepTitle = () => {
    switch (currentStep) {
      case 'details': return t("bookingform.stepDetails")
      case 'dba': return t("bookingform.stepDBA")
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

            {/* Debug Info Display */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded text-xs">
                <p><strong>Debug Info:</strong></p>
                <p>Fetching: {fetchingAvailability ? 'Yes' : 'No'}</p>
                <p>No Availability: {noAvailability ? 'Yes' : 'No'}</p>
                <p>Blocks Count: {availabilityBlocks.length}</p>
                <p>Available Times: {allAvailableStartTimes.length}</p>
                <p>Suggested Date: {suggestedDate ? format(suggestedDate, "yyyy-MM-dd") : 'None'}</p>
              </div>
            )}

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
            {/* Debug Info Display for Available Times */}
            {process.env.NODE_ENV === 'development' && (
              <div className="p-2 bg-green-100 border border-green-300 rounded text-xs">
                <p><strong>Debug - Available Times:</strong></p>
                <p>Blocks Count: {availabilityBlocks.length}</p>
                <p>Available Times: {allAvailableStartTimes.length}</p>
                <p>Certainty Level: {getCertaintyLevel}</p>
                <p>Selected Start: {selectedStartTime || 'None'}</p>
                <p>Selected End: {selectedEndTime || 'None'}</p>
              </div>
            )}

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

      <Button
        type="submit"
        className="w-full"
        disabled={loading || fetchingAvailability || noAvailability || !selectedStartTime || !selectedEndTime || paymentMethod === "online"}
      >
        {loading ? t("bookingform.processing") : t("bookingform.continueToDBA")}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        {t("bookingform.byBooking")}
      </p>
    </form>
  )

  const renderDBAStep = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CustomNoBookingsIcon className="h-5 w-5 text-primary" />
          <h2 className="text-sm font-semibold">{t("bookingform.dbaStepTitle")}</h2>
        </div>
        <Badge variant="secondary">{t("bookingform.required")}</Badge>
      </div>
      
      <p className="text-xs text-black">
        {t("bookingform.dbaStepDescription")}
      </p>

      {/* Waiver Option */}
      {bookingId && clientId && !waiverCreated && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <h4 className="font-semibold text-orange-500">
                {t("dba.waiver.option.title")}
              </h4>
              <p className="text-xs text-orange-500">
                {t("dba.waiver.option.warning")}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowWaiverModal(true)}
                className="border-orange-500 text-orange-700 bg-orange-200 hover:bg-orange-100 text-xs"
              >
                {t("dba.waiver.option.skipDBA")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* DBA Questionnaire */}
      {bookingId && clientId && !waiverCreated && (
        <>
          <DBAQuestionnaireV2
            userType="client"
            bookingId={bookingId}
            clientId={clientId}
            freelancerId={freelancer.id}
            jobCategoryId={selectedCategoryId || undefined}
            onComplete={handleDBAComplete as any}
            onSave={handleDBASave as any}
          />
          
          {/* V2 Dispute Resolution */}
          {disputes.length > 0 && !disputesResolved && (
            <DBADisputeResolver
              userType="client"
              bookingId={bookingId}
              disputes={disputes}
              // onResolved={() => setDisputesResolved(true)}
            />
          )}
        </>
      )}

      {/* Waiver Status */}
      {waiverCreated && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-orange-600" />
            <div>
              <h4 className="font-semibold text-orange-800">
                {t("dba.waiver.status.title")}
              </h4>
              <p className="text-sm text-orange-700">
                {t("dba.waiver.status.description")}
              </p>
            </div>
          </div>
        </div>
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
          onClick={() => setCurrentStep('payment')}
          disabled={!dbaCompleted}
          className="flex items-center gap-2 ml-auto"
        >
          {t("bookingform.continueToPayment")}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )

  const renderPaymentStep = () => (
    <div className="space-y-4">
      {/* DBA Report Display */}
      {bookingId && clientId && selectedCategoryId && (
        <DBAReportDisplay
          bookingId={bookingId}
          freelancerId={freelancer.id}
          clientId={clientId}
          jobCategoryId={selectedCategoryId}
          bookingDetails={{
            title: categoryName || 'Service',
            description: description,
            startDate: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '',
            endDate: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '',
            total: calculateTotal()
          }}
          freelancerDetails={{
            name: `${freelancer.first_name} ${freelancer.last_name}`,
            email: freelancer.email
          }}
          onReportGenerated={setDbaReport}
        />
      )}

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
          onClick={() => setCurrentStep('dba')}
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
            <Badge variant="outline">Step {currentStep === 'details' ? 1 : currentStep === 'dba' ? 2 : 3} of 3</Badge>
          </div>
          <Progress value={getStepProgress()} className="h-2" />
        </div>
      </div>

      {/* Step Content */}
      {currentStep === 'details' && renderDetailsStep()}
      {currentStep === 'dba' && renderDBAStep()}
      {currentStep === 'payment' && renderPaymentStep()}

      {/* Waiver Modal */}
      <DBAWaiverModal
        isOpen={showWaiverModal}
        onClose={() => setShowWaiverModal(false)}
        bookingId={bookingId || ''}
        onWaiverCreated={handleWaiverCreated}
      />

      <DBAWarningDialog
        isOpen={showDBAWarning}
        onClose={() => setShowDBAWarning(false)}
        onProceed={handleDBAWarningProceed}
        onCancel={handleDBAWarningCancel}
        type={dbaWarningType}
        freelancerName={freelancer.first_name || 'The freelancer'}
      />
    </div>
  )
}