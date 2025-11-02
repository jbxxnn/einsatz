"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "@/lib/toast"
import { useTranslation } from "@/lib/i18n"
import { useOptimizedSupabase } from "@/components/optimized-supabase-provider"
import type { Database } from "@/lib/database.types"
import {
  Calendar,
  MapPin,
  Euro,
  Clock,
  FileText,
  CheckCircle,
  X,
  MessageSquare,
  AlertCircle,
  Loader2,
  Send,
  DollarSign
} from "lucide-react"
import Image from "next/image"
import { format } from "date-fns"

type BookingRequest = Database["public"]["Tables"]["booking_requests"]["Row"] & {
  profiles?: Database["public"]["Tables"]["profiles"]["Row"]
  job_categories?: {
    id: string
    name: string
    icon: string | null
  }
}

interface BookingRequestCardProps {
  request: BookingRequest
  onUpdate: () => void
}

export default function BookingRequestCard({ request, onUpdate }: BookingRequestCardProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const { supabase } = useOptimizedSupabase()
  const [loading, setLoading] = useState(false)
  const [counterOfferOpen, setCounterOfferOpen] = useState(false)
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [convertDialogOpen, setConvertDialogOpen] = useState(false)
  const [proposedDate, setProposedDate] = useState<string>("")
  const [proposedStartTime, setProposedStartTime] = useState<string>("")
  const [proposedEndTime, setProposedEndTime] = useState<string>("")
  const [proposedRate, setProposedRate] = useState<string>("")
  const [proposedTotal, setProposedTotal] = useState<string>("")
  const [responseNotes, setResponseNotes] = useState<string>("")

  const handleAccept = async () => {
    // Accepting a pending request directly converts it to a booking
    setAcceptDialogOpen(false)
    
    // Use the same conversion logic
    await handleConvertToBooking()
  }

  const handleReject = async () => {
    setRejectDialogOpen(false)
    setLoading(true)
    try {
      const response = await fetch(`/api/booking-requests/${request.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'reject'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to reject request')
      }

      toast.success(t("bookingRequests.success.rejected"))
      onUpdate()
    } catch (error: any) {
      console.error("Error rejecting request:", error)
      toast.error(error.message || t("bookingRequests.error.failedToReject"))
    } finally {
      setLoading(false)
    }
  }

  const handleCounterOffer = async () => {
    if (!proposedDate || !proposedStartTime || !proposedEndTime || !proposedRate || !proposedTotal) {
      toast.error(t("bookingRequests.validation.fillAllFields"))
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/booking-requests/${request.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'counter_offer',
          proposed_date: proposedDate,
          proposed_start_time: proposedStartTime,
          proposed_end_time: proposedEndTime,
          proposed_rate: Number.parseFloat(proposedRate),
          proposed_total: Number.parseFloat(proposedTotal),
          response_notes: responseNotes
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit counter offer')
      }

      toast.success(t("bookingRequests.success.counterOfferSubmitted"))
      setCounterOfferOpen(false)
      // Reset form
      setProposedDate("")
      setProposedStartTime("")
      setProposedEndTime("")
      setProposedRate("")
      setProposedTotal("")
      setResponseNotes("")
      onUpdate()
    } catch (error: any) {
      console.error("Error submitting counter offer:", error)
      toast.error(error.message || t("bookingRequests.error.failedToSubmitCounterOffer"))
    } finally {
      setLoading(false)
    }
  }

  const handleConvertToBooking = async () => {
    setConvertDialogOpen(false)
    setLoading(true)
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast.error(t("bookingform.authenticationRequired"))
        return
      }

      // Calculate start and end times
      let startDateTime: Date
      let endDateTime: Date

      if (request.freelancer_proposed_date && request.freelancer_proposed_start_time && request.freelancer_proposed_end_time) {
        // Normalize time format - ensure we have HH:MM:SS format
        const normalizeTime = (time: string): string => {
          if (!time) return "00:00:00"
          const parts = time.split(':')
          if (parts.length === 2) {
            // HH:MM format, add seconds
            return `${time}:00`
          } else if (parts.length === 3) {
            // Already HH:MM:SS format
            return time
          }
          // Invalid format, return default
          return "00:00:00"
        }

        const startTime = normalizeTime(request.freelancer_proposed_start_time)
        const endTime = normalizeTime(request.freelancer_proposed_end_time)

        startDateTime = new Date(`${request.freelancer_proposed_date}T${startTime}`)
        endDateTime = new Date(`${request.freelancer_proposed_date}T${endTime}`)
      } else if (request.preferred_date && request.preferred_start_time && request.preferred_end_time) {
        // Normalize time format
        const normalizeTime = (time: string): string => {
          if (!time) return "00:00:00"
          const parts = time.split(':')
          if (parts.length === 2) {
            return `${time}:00`
          } else if (parts.length === 3) {
            return time
          }
          return "00:00:00"
        }

        const startTime = normalizeTime(request.preferred_start_time)
        const endTime = normalizeTime(request.preferred_end_time)

        startDateTime = new Date(`${request.preferred_date}T${startTime}`)
        endDateTime = new Date(`${request.preferred_date}T${endTime}`)
      } else {
        // Default to now + 1 hour if no dates provided
        startDateTime = new Date()
        endDateTime = new Date(Date.now() + 3600000)
      }

      // Validate dates are valid
      if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
        console.error("Invalid date values:", {
          freelancer_proposed_date: request.freelancer_proposed_date,
          freelancer_proposed_start_time: request.freelancer_proposed_start_time,
          freelancer_proposed_end_time: request.freelancer_proposed_end_time,
          preferred_date: request.preferred_date,
          preferred_start_time: request.preferred_start_time,
          preferred_end_time: request.preferred_end_time,
          startDateTime: startDateTime.toString(),
          endDateTime: endDateTime.toString()
        })
        throw new Error(t("bookingRequests.error.invalidDate") || "Invalid date or time values")
      }

      // Calculate total amount
      let totalAmount = 0
      if (request.freelancer_proposed_total) {
        totalAmount = request.freelancer_proposed_total
      } else if (request.budget_amount) {
        totalAmount = request.budget_amount
      } else if (request.freelancer_proposed_rate) {
        // Calculate from hourly rate and duration
        const hours = (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60 * 60)
        totalAmount = hours * request.freelancer_proposed_rate
      }

      // Create booking directly via Supabase
      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .insert({
          client_id: request.client_id,
          freelancer_id: request.freelancer_id,
          title: `${request.job_categories?.name || "Custom Service"} ${t("bookingform.service")} - ${request.profiles?.first_name || ""} ${request.profiles?.last_name || ""}`,
          description: request.description,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          location: request.location,
          hourly_rate: request.freelancer_proposed_rate || null,
          total_amount: totalAmount,
          category_id: request.category_id,
          payment_method: "offline",
          images: Array.isArray(request.images) ? request.images : [],
          status: "confirmed", // Already accepted by freelancer, so confirmed
          payment_status: "unpaid"
        })
        .select()
        .single()

      if (bookingError) {
        throw bookingError
      }

      // Update the request to mark it as converted
      const updateResponse = await fetch(`/api/booking-requests/${request.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update',
          status: 'converted_to_booking',
          converted_booking_id: booking.id
        })
      })

      if (!updateResponse.ok) {
        throw new Error('Failed to update request status')
      }

      toast.success(t("bookingRequests.success.convertedToBooking"))
      
      // Redirect to the booking page
      router.push(`/bookings/${booking.id}`)
      
      onUpdate()
    } catch (error: any) {
      console.error("Error converting to booking:", error)
      toast.error(error.message || t("bookingRequests.error.failedToConvert"))
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = () => {
    switch (request.status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">{t("bookingRequests.status.pending")}</Badge>
      case 'counter_offered':
        return <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">{t("bookingRequests.status.counterOffered")}</Badge>
      case 'accepted':
        return <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">{t("bookingRequests.status.accepted")}</Badge>
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-800 border-red-200">{t("bookingRequests.status.rejected")}</Badge>
      case 'converted_to_booking':
        return <Badge variant="outline" className="bg-purple-50 text-purple-800 border-purple-200">{t("bookingRequests.status.convertedToBooking")}</Badge>
      default:
        return <Badge variant="outline">{request.status}</Badge>
    }
  }

  const images = Array.isArray(request.images) ? request.images : []
  const clientName = request.profiles?.first_name && request.profiles?.last_name
    ? `${request.profiles.first_name} ${request.profiles.last_name}`
    : t("bookingRequests.unknownClient")

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              {request.job_categories?.icon && (
                <span className="text-2xl">{request.job_categories.icon}</span>
              )}
              <CardTitle className="text-lg">{request.job_categories?.name || "Custom Service"}</CardTitle>
              {getStatusBadge()}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MessageSquare className="h-4 w-4" />
              <span>{t("bookingRequests.from")} {clientName}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Client Information */}
        <div className="flex items-center gap-3">
          {request.profiles?.avatar_url && (
            <div className="w-10 h-10 rounded-full overflow-hidden relative">
              <Image
                src={request.profiles.avatar_url}
                alt={clientName}
                fill
                className="object-cover"
              />
            </div>
          )}
          <div>
            <p className="font-medium">{clientName}</p>
            <p className="text-sm text-muted-foreground">
              {t("bookingRequests.requestedOn")} {format(new Date(request.created_at), "PPP")}
            </p>
          </div>
        </div>

        {/* Request Details */}
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <FileText className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div>
              <Label className="text-xs text-muted-foreground">{t("bookingRequests.description")}</Label>
              <p className="text-sm">{request.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{request.location}</span>
          </div>

          {request.preferred_date && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {format(new Date(request.preferred_date), "PPP")}
                {request.preferred_start_time && request.preferred_end_time && (
                  <> • {request.preferred_start_time} - {request.preferred_end_time}</>
                )}
              </span>
            </div>
          )}

          {request.budget_amount && (
            <div className="flex items-center gap-2">
              <Euro className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {t("bookingRequests.budget")}: €{request.budget_amount.toFixed(2)}
                {request.budget_is_flexible && (
                  <Badge variant="outline" className="ml-2 text-xs">{t("bookingRequests.flexible")}</Badge>
                )}
              </span>
            </div>
          )}

          {request.additional_notes && (
            <div className="mt-2 p-3 bg-muted rounded-md">
              <Label className="text-xs text-muted-foreground">{t("bookingRequests.additionalNotes")}</Label>
              <p className="text-sm mt-1">{request.additional_notes}</p>
            </div>
          )}

          {images.length > 0 && (
            <div className="mt-2">
              <Label className="text-xs text-muted-foreground mb-2 block">{t("bookingRequests.images")} ({images.length})</Label>
              <div className="grid grid-cols-3 gap-2">
                {images.slice(0, 6).map((imageUrl: string, index: number) => (
                  <div key={index} className="relative w-full h-24 rounded-md overflow-hidden border">
                    <Image
                      src={imageUrl}
                      alt={`Request image ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Freelancer's Counter Offer (if exists) */}
        {request.status === 'counter_offered' && request.freelancer_proposed_date && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <Label className="text-sm font-medium text-blue-800 mb-2 block">{t("bookingRequests.yourCounterOffer")}</Label>
            <div className="space-y-2 text-sm">
              {request.freelancer_proposed_date && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span>{format(new Date(request.freelancer_proposed_date), "PPP")}</span>
                  {request.freelancer_proposed_start_time && request.freelancer_proposed_end_time && (
                    <span> • {request.freelancer_proposed_start_time} - {request.freelancer_proposed_end_time}</span>
                  )}
                </div>
              )}
              {request.freelancer_proposed_rate && (
                <div className="flex items-center gap-2">
                  <Euro className="h-4 w-4 text-blue-600" />
                  <span>{t("bookingRequests.rate")}: €{request.freelancer_proposed_rate.toFixed(2)}/hr</span>
                </div>
              )}
              {request.freelancer_proposed_total && (
                <div className="flex items-center gap-2">
                  <Euro className="h-4 w-4 text-blue-600" />
                  <span>{t("bookingRequests.total")}: €{request.freelancer_proposed_total.toFixed(2)}</span>
                </div>
              )}
              {request.freelancer_response_notes && (
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground">{t("bookingRequests.notes")}:</p>
                  <p className="text-sm">{request.freelancer_response_notes}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {request.status === 'pending' && (
          <div className="flex gap-2 pt-4 border-t">
            <Dialog open={counterOfferOpen} onOpenChange={setCounterOfferOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex-1" disabled={loading}>
                  <Send className="h-4 w-4 mr-2" />
                  {t("bookingRequests.actions.counterOffer")}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{t("bookingRequests.counterOffer.title")}</DialogTitle>
                  <DialogDescription>{t("bookingRequests.counterOffer.description")}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="proposed-date">{t("bookingRequests.proposedDate")}</Label>
                      <Input
                        id="proposed-date"
                        type="date"
                        value={proposedDate}
                        onChange={(e) => setProposedDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label htmlFor="proposed-start-time">{t("bookingRequests.proposedStartTime")}</Label>
                        <Input
                          id="proposed-start-time"
                          type="time"
                          value={proposedStartTime}
                          onChange={(e) => setProposedStartTime(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="proposed-end-time">{t("bookingRequests.proposedEndTime")}</Label>
                        <Input
                          id="proposed-end-time"
                          type="time"
                          value={proposedEndTime}
                          onChange={(e) => setProposedEndTime(e.target.value)}
                          min={proposedStartTime || undefined}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="proposed-rate">{t("bookingRequests.proposedRate")} (€/hr)</Label>
                      <Input
                        id="proposed-rate"
                        type="number"
                        step="0.01"
                        value={proposedRate}
                        onChange={(e) => setProposedRate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="proposed-total">{t("bookingRequests.proposedTotal")} (€)</Label>
                      <Input
                        id="proposed-total"
                        type="number"
                        step="0.01"
                        value={proposedTotal}
                        onChange={(e) => setProposedTotal(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="response-notes">{t("bookingRequests.responseNotes")}</Label>
                    <Textarea
                      id="response-notes"
                      rows={4}
                      value={responseNotes}
                      onChange={(e) => setResponseNotes(e.target.value)}
                      placeholder={t("bookingRequests.responseNotesPlaceholder")}
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setCounterOfferOpen(false)}
                      className="flex-1"
                    >
                      {t("bookingRequests.cancel")}
                    </Button>
                    <Button
                      onClick={handleCounterOffer}
                      disabled={loading || !proposedDate || !proposedStartTime || !proposedEndTime || !proposedRate || !proposedTotal}
                      className="flex-1"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {t("bookingRequests.processing")}
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          {t("bookingRequests.submitCounterOffer")}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              variant="outline"
              className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => setRejectDialogOpen(true)}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <X className="h-4 w-4 mr-2" />
              )}
              {t("bookingRequests.actions.reject")}
            </Button>

            <Button
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              onClick={() => setAcceptDialogOpen(true)}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              {t("bookingRequests.actions.accept")}
            </Button>
          </div>
        )}

        {request.status === 'accepted' && !request.converted_booking_id && (
          <div className="pt-4 border-t space-y-4">
            {/* Timeline Header */}
            <div className="flex items-center gap-2 text-sm text-green-600 mb-3">
              <CheckCircle className="h-4 w-4" />
              <span className="font-medium">{t("bookingRequests.freelancer.counterOfferAccepted")}</span>
            </div>
            
            {/* Accepted Details Timeline */}
            <div className="bg-green-50 border border-green-200 rounded-md p-4 space-y-3">
              <div className="flex items-start gap-2">
                <div className="mt-0.5">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <Label className="text-xs font-medium text-green-800 mb-2 block">
                    {t("bookingRequests.acceptedDetails")}
                  </Label>
                  
                  {request.freelancer_proposed_date && (
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4 text-green-700" />
                      <span className="text-sm text-green-900">
                        {format(new Date(request.freelancer_proposed_date), "EEEE, MMMM d, yyyy")}
                        {request.freelancer_proposed_start_time && request.freelancer_proposed_end_time && (
                          <> • {request.freelancer_proposed_start_time} - {request.freelancer_proposed_end_time}</>
                        )}
                      </span>
                    </div>
                  )}
                  
                  {request.freelancer_proposed_rate && (
                    <div className="flex items-center gap-2 mb-2">
                      <Euro className="h-4 w-4 text-green-700" />
                      <span className="text-sm text-green-900">
                        {t("bookingRequests.rate")}: €{request.freelancer_proposed_rate.toFixed(2)}/hr
                      </span>
                    </div>
                  )}
                  
                  {request.freelancer_proposed_total && (
                    <div className="flex items-center gap-2 mb-2">
                      <Euro className="h-4 w-4 text-green-700" />
                      <span className="text-sm font-medium text-green-900">
                        {t("bookingRequests.total")}: €{request.freelancer_proposed_total.toFixed(2)}
                      </span>
                    </div>
                  )}
                  
                  {request.freelancer_response_notes && (
                    <div className="mt-2 pt-2 border-t border-green-200">
                      <Label className="text-xs text-green-700 mb-1 block">{t("bookingRequests.notes")}:</Label>
                      <p className="text-sm text-green-900">{request.freelancer_response_notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Convert to Booking Button */}
            <div className="flex gap-2">
              <Button
                className="w-full bg-[#33CC99] hover:bg-[#2BB88A] text-white"
                onClick={() => setConvertDialogOpen(true)}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t("bookingRequests.processing")}
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {t("bookingRequests.actions.convertToBooking")}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {request.status === 'accepted' && request.converted_booking_id && (
          <div className="pt-4 border-t">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.location.href = `/bookings/${request.converted_booking_id}`}
            >
              {t("bookingRequests.viewBooking")}
            </Button>
          </div>
        )}
      </CardContent>

      {/* Accept Request Dialog */}
      <AlertDialog open={acceptDialogOpen} onOpenChange={setAcceptDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("bookingRequests.actions.acceptAndConvert")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("bookingRequests.confirm.acceptAndConvert")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>
              {t("bookingRequests.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAccept}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("bookingRequests.processing")}
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {t("bookingRequests.actions.accept")}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Request Dialog */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("bookingRequests.actions.reject")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("bookingRequests.confirm.reject")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>
              {t("bookingRequests.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("bookingRequests.processing")}
                </>
              ) : (
                <>
                  <X className="h-4 w-4 mr-2" />
                  {t("bookingRequests.actions.reject")}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Convert to Booking Dialog */}
      <AlertDialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("bookingRequests.actions.convertToBooking")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("bookingRequests.confirm.convertToBooking")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>
              {t("bookingRequests.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConvertToBooking}
              disabled={loading}
              className="bg-[#33CC99] hover:bg-[#2BB88A]"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("bookingRequests.processing")}
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {t("bookingRequests.actions.convertToBooking")}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

