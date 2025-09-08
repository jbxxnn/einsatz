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
import { ArrowLeft, Calendar, MapPin, Info, AlertCircle, CheckCircle, HelpCircle, Loader2, FileText, ChevronRight, ChevronLeft, Shield, Upload, X, Image as ImageIcon } from "lucide-react"
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
  freelancer: Profile & {
    job_offerings?: Array<{
      id: string
      category_id: string
      category_name: string
      subcategory_name?: string
      pricing_type: "hourly" | "packages"
      hourly_rate: number | null
      job_offering_packages?: Array<{
        id: string
        package_name: string
        short_description: string | null
        price: number
        display_order: number
        is_active: boolean
      }>
      dba_status?: {
        is_completed: boolean
        risk_level: string
        risk_percentage: number
      } | null
    }>
  }
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
  const [paymentMethod, setPaymentMethod] = useState<"online" | "offline">("offline")
  const [currentStep, setCurrentStep] = useState<BookingStep>('details')
  const [bookingId, setBookingId] = useState<string | null>(null)
  const [clientId, setClientId] = useState<string | null>(null)
  const [showDBAModal, setShowDBAModal] = useState(false)
  const [dbaCompleted, setDbaCompleted] = useState(false)
  const [dbaResult, setDbaResult] = useState<any>(null)
  const [dbaSkipped, setDbaSkipped] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<Array<{url: string, path: string, file?: File}>>([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const [tempImages, setTempImages] = useState<File[]>([])
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null)
  const [selectedPackage, setSelectedPackage] = useState<any>(null)

  const { t } = useTranslation()

  // Get freelancer's DBA status for the selected category
  const freelancerDbaStatus = useMemo(() => {
    if (!selectedCategoryId || !freelancer.job_offerings) return null
    const offering = freelancer.job_offerings.find(offering => offering.category_id === selectedCategoryId)
    return offering?.dba_status || null
  }, [selectedCategoryId, freelancer.job_offerings])

  // Get current job offering details
  const currentOffering = useMemo(() => {
    if (!selectedCategoryId || !freelancer.job_offerings) return null
    return freelancer.job_offerings.find(offering => offering.category_id === selectedCategoryId)
  }, [selectedCategoryId, freelancer.job_offerings])

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
    // Set pricing based on selected category or default
    if (selectedCategoryId && freelancer.job_offerings) {
      const offering = freelancer.job_offerings.find((o: any) => o.category_id === selectedCategoryId)
      if (offering) {
        setHourlyRate(offering.hourly_rate)
        setCategoryName(offering.category_name)
        
        // Reset package selection when category changes
        setSelectedPackageId(null)
        setSelectedPackage(null)
        
        // If it's package pricing, select the first package by default
        if (offering.pricing_type === "packages" && offering.job_offering_packages?.length > 0) {
          const firstPackage = offering.job_offering_packages[0]
          setSelectedPackageId(firstPackage.id)
          setSelectedPackage(firstPackage)
        }
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
    if (currentOffering?.pricing_type === "packages" && selectedPackage) {
      // For packages, use the fixed package price
      return selectedPackage.price
    } else {
      // For hourly pricing, calculate based on hours
      const hours = calculateHours()
      const rate = hourlyRate || freelancer.hourly_rate || 0
      return hours * rate
    }
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

  // Image upload functions
  const handleImageUpload = async (files: FileList) => {
    const fileArray = Array.from(files)
    
    // Validate file count
    if (tempImages.length + fileArray.length > 5) {
      toast.error("Maximum 5 images allowed")
      return
    }

    // Validate each file
    for (const file of fileArray) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        toast.error(`${file.name}: Invalid file type. Only JPG, JPEG, PNG, and WEBP are allowed.`)
        return
      }

      if (file.size > 2 * 1024 * 1024) {
        toast.error(`${file.name}: File size too large. Maximum size is 2MB.`)
        return
      }
    }

    // Store files temporarily and create preview URLs
    const newTempImages = [...tempImages, ...fileArray]
    setTempImages(newTempImages)

    // Create preview URLs for display
    const previewImages = fileArray.map(file => ({
      url: URL.createObjectURL(file),
      path: '', // Will be set when uploaded to storage
      file: file
    }))

    setUploadedImages(prev => [...prev, ...previewImages])
    toast.success(`${fileArray.length} image(s) added successfully`)
  }

  const handleImageRemove = async (imageIndex: number) => {
    const imageToRemove = uploadedImages[imageIndex]
    
    // If it's a temporary image (before booking creation)
    if (imageToRemove.file) {
      // Remove from temp images
      const newTempImages = tempImages.filter((_, index) => index !== (tempImages.length - uploadedImages.length + imageIndex))
      setTempImages(newTempImages)
      
      // Remove from uploaded images display
      setUploadedImages(prev => prev.filter((_, index) => index !== imageIndex))
      
      // Revoke object URL to free memory
      URL.revokeObjectURL(imageToRemove.url)
      
      toast.success('Image removed successfully')
    } else {
      // If it's an uploaded image (after booking creation)
      try {
        const response = await fetch(`/api/upload-booking-image?path=${encodeURIComponent(imageToRemove.path)}`, {
          method: 'DELETE',
        })

        if (!response.ok) {
          throw new Error('Failed to delete image')
        }

        setUploadedImages(prev => prev.filter((_, index) => index !== imageIndex))
        toast.success('Image removed successfully')
      } catch (error: any) {
        toast.error(error.message || 'Failed to remove image')
      }
    }
  }

  // Upload temporary images to storage
  const uploadTempImages = async (bookingId: string) => {
    if (tempImages.length === 0) return []

    setUploadingImages(true)
    try {
      const uploadPromises = tempImages.map(async (file) => {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('bookingId', bookingId)

        const response = await fetch('/api/upload-booking-image', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Upload failed')
        }

        return response.json()
      })

      const results = await Promise.all(uploadPromises)
      const uploadedImageUrls = results.map(result => result.url)
      
      // Update uploadedImages with actual URLs
      setUploadedImages(prev => prev.map((img, index) => {
        if (img.file) {
          const result = results.find(r => r.path.includes(img.file!.name) || index < results.length)
          return result ? { url: result.url, path: result.path } : img
        }
        return img
      }))

      setTempImages([]) // Clear temp images
      return uploadedImageUrls
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload images')
      return []
    } finally {
      setUploadingImages(false)
    }
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

      // Create booking first
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
          hourly_rate: currentOffering?.pricing_type === "packages" ? null : (hourlyRate || freelancer.hourly_rate || 0),
          package_id: currentOffering?.pricing_type === "packages" ? selectedPackageId : null,
          package_name: currentOffering?.pricing_type === "packages" ? selectedPackage?.package_name : null,
          package_description: currentOffering?.pricing_type === "packages" ? selectedPackage?.short_description : null,
          total_amount: calculateTotal(),
          status: "pending",
          payment_status: "unpaid",
          category_id: selectedCategoryId,
          payment_method: paymentMethod,
          images: [], // Will be updated after image upload
        })
        .select()

      if (error) {
        throw error
      }

      const newBookingId = data[0].id
      setBookingId(newBookingId)
      setClientId(user.id)

      // Upload images to storage
      const uploadedImageUrls = await uploadTempImages(newBookingId)

      // Update booking with image URLs
      if (uploadedImageUrls.length > 0) {
        await supabase
          .from("bookings")
          .update({ images: uploadedImageUrls })
          .eq("id", newBookingId)
      }

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

    // For package pricing, ensure a package is selected
    if (currentOffering?.pricing_type === "packages" && !selectedPackageId) {
      toast.error("Please select a service package before starting DBA assessment")
      return
    }

    // DBA is always available now

    setShowDBAModal(true)
  }

  const handleSkipDBA = () => {
    setDbaSkipped(true)
    setDbaCompleted(false)
    setDbaResult(null)
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

    // For package pricing, ensure a package is selected
    if (currentOffering?.pricing_type === "packages" && !selectedPackageId) {
      toast.error("Please select a service package before creating the booking")
      return
    }

    // Check DBA requirements based on freelancer's DBA status
    if (freelancerDbaStatus?.is_completed) {
      // Freelancer completed DBA - client can skip or complete DBA
      if (!dbaCompleted && !dbaSkipped) {
        toast.error("Please either complete the DBA assessment or skip it to proceed with the booking.")
        return
      }
    } else {
      // Freelancer didn't complete DBA - client can only skip DBA
      if (!dbaSkipped) {
        toast.error("The freelancer hasn't completed their DBA for this job category. Please skip DBA to proceed with the booking.")
        return
      }
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

      // Create booking first
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
          hourly_rate: currentOffering?.pricing_type === "packages" ? null : (hourlyRate || freelancer.hourly_rate || 0),
          package_id: currentOffering?.pricing_type === "packages" ? selectedPackageId : null,
          package_name: currentOffering?.pricing_type === "packages" ? selectedPackage?.package_name : null,
          package_description: currentOffering?.pricing_type === "packages" ? selectedPackage?.short_description : null,
          total_amount: calculateTotal(),
          status: "pending",
          payment_status: "unpaid",
          category_id: selectedCategoryId,
          payment_method: paymentMethod,
          images: [], // Will be updated after image upload
        })
        .select()

      if (error) {
        throw error
      }

      const newBookingId = data[0].id
      setBookingId(newBookingId)
      setClientId(user.id)

      // Upload images to storage
      const uploadedImageUrls = await uploadTempImages(newBookingId)

      // Update booking with image URLs
      if (uploadedImageUrls.length > 0) {
        await supabase
          .from("bookings")
          .update({ images: uploadedImageUrls })
          .eq("id", newBookingId)
      }
      
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
          {currentOffering?.pricing_type === "packages" ? (
            // Package pricing display
            (() => {
              const activePackages = currentOffering?.job_offering_packages?.filter((p: any) => p.is_active) || []
              return activePackages.length > 0 ? (
                <p className="text-sm text-muted-foreground text-black">
                  {activePackages.length === 1 
                    ? `€${activePackages[0].price} package`
                    : `From €${Math.min(...activePackages.map((p: any) => p.price))} packages`
                  }
                </p>
              ) : (
                <p className="text-sm text-muted-foreground text-black">Packages available</p>
              )
            })()
          ) : (
            // Hourly pricing display
            <p className="text-sm text-muted-foreground text-black">€{hourlyRate} {t("freelancer.filters.hour")}</p>
          )}
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
            {selectedStartTime && selectedEndTime && currentOffering?.pricing_type === "hourly" && (
                <div className="text-xs text-black">
                {t("bookingform.duration")}: {calculateHours()} {calculateHours() === 1 ? t("bookingform.hour") : t("bookingform.hours")}
              </div>
            )}

            {/* Package Selection - only show for package pricing */}
            {currentOffering?.pricing_type === "packages" && currentOffering.job_offering_packages && currentOffering.job_offering_packages.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs text-black">Select Service Package</Label>
                <div className="grid gap-3">
                  {currentOffering.job_offering_packages.map((pkg: any) => (
                    <div
                      key={pkg.id}
                      className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                        selectedPackageId === pkg.id
                          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => {
                        setSelectedPackageId(pkg.id)
                        setSelectedPackage(pkg)
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded-full border-2 ${
                              selectedPackageId === pkg.id
                                ? "border-primary bg-primary"
                                : "border-gray-300"
                            }`}>
                              {selectedPackageId === pkg.id && (
                                <div className="w-2 h-2 bg-white rounded-full m-0.5" />
                              )}
                            </div>
                            <h4 className="font-medium text-sm text-black">{pkg.package_name}</h4>
                          </div>
                          {pkg.short_description && (
                            <p className="text-xs text-gray-600 mt-1 ml-6">{pkg.short_description}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-green-600">€{pkg.price}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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

      {/* Image Upload Section */}
      <div className="space-y-2">
        <Label className="text-xs text-black">Job Images (Optional)</Label>
        <div className="border rounded-md p-3">
          {/* Upload Area */}
          <div className="space-y-3">
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="image-upload"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-4 text-gray-500" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, JPEG, WEBP (MAX. 2MB each, 5 images max)
                  </p>
                </div>
                <input
                  id="image-upload"
                  type="file"
                  className="hidden"
                  multiple
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                  disabled={uploadingImages || uploadedImages.length >= 5}
                />
              </label>
            </div>

            {/* Upload Progress */}
            {uploadingImages && (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm text-gray-600">Uploading images...</span>
              </div>
            )}

            {/* Image Previews */}
            {uploadedImages.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {uploadedImages.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image.url}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-24 object-cover rounded-md border"
                    />
                    <button
                      title="Remove image"
                      type="button"
                      onClick={() => handleImageRemove(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Image Count */}
            <div className="text-xs text-gray-500 text-center">
              {uploadedImages.length}/5 images uploaded
            </div>
          </div>
        </div>
      </div>



      <div className="border-t pt-4 mt-4">
        {currentOffering?.pricing_type === "packages" ? (
          // Package pricing summary
          <>
            {selectedPackage && (
              <div className="flex justify-between mb-2">
                <span className="text-xs text-black">Selected Package</span>
                <span className="text-xs text-black">{selectedPackage.package_name}</span>
              </div>
            )}
            <div className="flex justify-between font-bold">
              <span className="text-xs text-black">{t("bookingform.total")}</span>
              <span className="text-xs text-black">€{calculateTotal().toFixed(2)}</span>
            </div>
          </>
        ) : (
          // Hourly pricing summary
          <>
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
          </>
        )}
      </div>

      <div className="space-y-2 border-t pt-4">
        <Label className="text-xs text-black">{t("bookingform.paymentMethod")}</Label>
        <div className="grid gap-4">
          <div
            className="border rounded-md p-3 flex items-center text-xs text-gray-400 bg-gray-50 cursor-not-allowed opacity-50"
          >
            <div className="w-2 h-2 rounded-full border border-gray-300 mr-4"></div>
            <div>
              <p className="font-medium text-xs text-gray-400">{t("bookingform.onlinePayment")}</p>
              <p className="text-xs text-gray-400">Currently unavailable</p>
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

      {/* DBA Check Section - Shows different options based on freelancer's DBA status */}
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
            {dbaSkipped && (
              <Badge variant="outline" className="text-xs text-orange-600 border-orange-200">
                <AlertCircle className="h-3 w-3 mr-1" />
                Skipped
              </Badge>
            )}
          </div>
          
          {freelancerDbaStatus?.is_completed ? (
            // Freelancer completed DBA - client can choose to complete or skip
            <div className="space-y-3">
              <p className="text-xs text-gray-600">
                The freelancer has completed their DBA assessment for this job category. You can either complete your own DBA assessment or skip it (you will bear legal risks).
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={handleOpenDBAModal}
                  variant={dbaCompleted ? "outline" : "default"}
                  size="sm"
                  className="flex-1"
                >
                  <CustomRescheduleIcon2 className="h-4 w-4 mr-2" />
                  {dbaCompleted ? 'Review DBA Assessment' : 'Complete DBA Check'}
                </Button>
                <Button
                  type="button"
                  onClick={handleSkipDBA}
                  variant={dbaSkipped ? "outline" : "outline"}
                  size="sm"
                  className="flex-1 text-orange-600 border-orange-200 hover:bg-orange-50"
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Skip DBA
                </Button>
              </div>
            </div>
          ) : (
            // Freelancer didn't complete DBA - client can only skip
            <div className="space-y-3">
              <div className="bg-orange-50 border border-orange-200 rounded-md p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-orange-800">
                      Freelancer DBA Not Completed
                    </p>
                    <p className="text-xs text-orange-700 mt-1">
                      The freelancer hasn't completed their DBA assessment for this job category. 
                      You will bear all legal responsibility if you proceed without DBA.
                    </p>
                  </div>
                </div>
              </div>
              <Button
                type="button"
                onClick={handleSkipDBA}
                variant={dbaSkipped ? "outline" : "outline"}
                size="sm"
                className="w-full text-orange-600 border-orange-200 hover:bg-orange-50"
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                {dbaSkipped ? 'DBA Skipped - Proceed with Risk' : 'Proceed without DBA (You bear legal risks)'}
              </Button>
            </div>
          )}
        </div>

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

      <Button
        type="submit"
        className="w-full"
        disabled={loading || fetchingAvailability || noAvailability || !selectedStartTime || !selectedEndTime || !location.trim() || !description.trim() || (!dbaCompleted && !dbaSkipped) || !!bookingId || (currentOffering?.pricing_type === "packages" && !selectedPackageId)}
      >
        {loading ? t("bookingform.processing") : bookingId ? 'Booking Created - Proceed to Payment' : 
         dbaCompleted ? 'Booking Created - Proceed to Payment' : 
         dbaSkipped ? 'Booking Created - Proceed to Payment' : 
         currentOffering?.pricing_type === "packages" && !selectedPackageId ? 'Please Select a Package' :
         'Complete DBA or Skip to Proceed'}
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
          {currentOffering?.pricing_type === "packages" ? (
            // Package pricing summary
            <>
              {selectedPackage && (
                <div className="flex justify-between">
                  <span className="text-xs text-black">Selected Package</span>
                  <span className="text-xs text-black">{selectedPackage.package_name}</span>
                </div>
              )}
            </>
          ) : (
            // Hourly pricing summary
            <>
              <div className="flex justify-between">
                <span className="text-xs text-black">{t("bookingform.duration")}</span>
                <span className="text-xs text-black">{calculateHours()} {t("bookingform.hours")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-black">{t("bookingform.hourlyRate")}</span>
                <span className="text-xs text-black">€{hourlyRate || freelancer.hourly_rate || 0}</span>
              </div>
            </>
          )}
          <div className="flex justify-between font-bold text-lg">
            <span className="text-xs text-black">{t("bookingform.total")}</span>
            <span className="text-xs text-black">€{calculateTotal().toFixed(2)}</span>
          </div>
          
          {/* Images Summary */}
          {uploadedImages.length > 0 && (
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-2">
                <ImageIcon className="h-4 w-4 text-gray-500" />
                <span className="text-xs text-black font-medium">Job Images ({uploadedImages.length})</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {uploadedImages.map((image, index) => (
                  <img
                    key={index}
                    src={image.url}
                    alt={`Job image ${index + 1}`}
                    className="w-full h-16 object-cover rounded border"
                  />
                ))}
              </div>
            </div>
          )}
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