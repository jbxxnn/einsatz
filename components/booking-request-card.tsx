"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
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
  ChevronDown
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
  const [expanded, setExpanded] = useState(false)
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
  const hasCounterOffer =
    !!request.freelancer_proposed_date ||
    !!request.freelancer_proposed_start_time ||
    !!request.freelancer_proposed_end_time ||
    !!request.freelancer_proposed_rate ||
    !!request.freelancer_proposed_total ||
    request.status === "counter_offered"
  const descriptionPreview =
    request.description && request.description.length > 180
      ? `${request.description.slice(0, 180)}…`
      : request.description

  return (
    <Card className="group overflow-hidden rounded-2xl border border-slate-200/70 bg-white/90 shadow-sm backdrop-blur transition hover:shadow-md">
      <CardHeader className="border-b border-slate-200/70 bg-slate-50/80 pb-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-1 flex-col gap-2">
            <div className="flex flex-wrap items-center gap-3">
              {request.job_categories?.icon && (
                <span className="text-2xl leading-none">{request.job_categories.icon}</span>
              )}
              <CardTitle className="text-lg font-semibold text-slate-900 md:text-xl">
                {request.job_categories?.name || "Custom Service"}
              </CardTitle>
              {getStatusBadge()}
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <MessageSquare className="h-4 w-4" />
              <span>
                {t("bookingRequests.from")} {clientName}
              </span>
            </div>
          </div>
          <div className="hidden md:block text-xs text-slate-500">
            {t("bookingRequests.requestedOn")} {format(new Date(request.created_at), "PPP")}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-center gap-3">
            {request.profiles?.avatar_url ? (
              <div className="relative h-12 w-12 overflow-hidden rounded-full border border-slate-200 shadow-sm">
                <Image
                  src={request.profiles.avatar_url}
                  alt={clientName}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-sm font-medium text-slate-500">
                {clientName
                  .split(" ")
                  .map((name) => name[0])
                  .join("")
                  .slice(0, 2)}
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-slate-900 md:text-base">{clientName}</p>
              <p className="text-xs text-slate-500 md:hidden">
                {t("bookingRequests.requestedOn")} {format(new Date(request.created_at), "PPP")}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-start gap-2 md:items-end">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 md:text-sm">
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                {t("bookingRequests.idLabel")}: {request.id.slice(0, 6)}…
              </span>
              {request.viewed_by_freelancer ? (
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700">
                  {t("bookingRequests.viewed")}
                </span>
              ) : (
                <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-700">
                  {t("bookingRequests.new")}
                </span>
              )}
              <span className="hidden rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 md:inline">
                {t("bookingRequests.requestedOn")} {format(new Date(request.created_at), "PPP")}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded((prev) => !prev)}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
            >
              {expanded ? t("bookingRequests.hideDetails") : t("bookingRequests.viewDetails")}
              <ChevronDown
                className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
              />
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {request.location && (
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 md:text-sm">
              <MapPin className="h-4 w-4 text-slate-500" />
              {request.location}
            </span>
          )}

          {request.preferred_date && (
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 md:text-sm">
              <Calendar className="h-4 w-4 text-slate-500" />
              <span>
                {format(new Date(request.preferred_date), "PPP")}
                {request.preferred_start_time && request.preferred_end_time && (
                  <span className="hidden md:inline">
                    {" "}
                    · {request.preferred_start_time} – {request.preferred_end_time}
                  </span>
                )}
              </span>
            </span>
          )}

          {request.preferred_start_time && request.preferred_end_time && (
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 md:hidden">
              <Clock className="h-4 w-4 text-slate-500" />
              {request.preferred_start_time} – {request.preferred_end_time}
            </span>
          )}

          {request.budget_amount && (
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 md:text-sm">
              <Euro className="h-4 w-4 text-slate-500" />
              €{request.budget_amount.toFixed(2)}
              {request.budget_is_flexible && (
                <Badge
                  variant="outline"
                  className="ml-1 border-emerald-200 bg-emerald-50 text-[10px] uppercase tracking-wide text-emerald-700"
                >
                  {t("bookingRequests.flexible")}
                </Badge>
              )}
            </span>
          )}

          {hasCounterOffer && request.freelancer_proposed_total && (
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 md:text-sm">
              <Euro className="h-4 w-4 text-blue-500" />
              {t("bookingRequests.total")}: €{request.freelancer_proposed_total.toFixed(2)}
            </span>
          )}
        </div>

        {!expanded && descriptionPreview && (
          <p className="text-sm leading-relaxed text-slate-600">{descriptionPreview}</p>
        )}

        {!expanded && hasCounterOffer && (
          <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 text-sm text-blue-900">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold">{t("bookingRequests.counterOfferSnapshot")}</span>
              {request.freelancer_proposed_total && (
                <span>€{request.freelancer_proposed_total.toFixed(2)}</span>
              )}
            </div>
            {request.freelancer_proposed_date && (
              <p className="mt-1 text-xs text-blue-700">
                {format(new Date(request.freelancer_proposed_date), "PPP")}
                {request.freelancer_proposed_start_time && request.freelancer_proposed_end_time && (
                  <>
                    {" "}
                    · {request.freelancer_proposed_start_time} – {request.freelancer_proposed_end_time}
                  </>
                )}
              </p>
            )}
          </div>
        )}

        {expanded && (
          <div className="space-y-5">
            <section className="space-y-4 rounded-2xl border border-slate-200/70 bg-slate-50/50 p-5">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm">
                  <FileText className="h-5 w-5 text-slate-500" />
                </span>
                <div className="flex-1 space-y-2">
                  <Label className="text-xs uppercase tracking-wide text-slate-500">
                    {t("bookingRequests.description")}
                  </Label>
                  <p className="text-sm leading-relaxed text-slate-700">{request.description}</p>
                </div>
              </div>

              {request.additional_notes && (
                <div className="rounded-xl border border-slate-200 bg-white/70 p-4">
                  <Label className="text-xs uppercase tracking-wide text-slate-500">
                    {t("bookingRequests.additionalNotes")}
                  </Label>
                  <p className="mt-2 text-sm text-slate-700">{request.additional_notes}</p>
                </div>
              )}

              {images.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-xs uppercase tracking-wide text-slate-500">
                    {t("bookingRequests.images")} ({images.length})
                  </Label>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {images.slice(0, 6).map((imageUrl: string, index: number) => (
                      <div
                        key={index}
                        className="relative h-24 w-full overflow-hidden rounded-xl border border-slate-200 shadow-sm"
                      >
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
            </section>

            <section className="space-y-3 rounded-2xl border border-slate-200/70 bg-white/70 p-5">
              <div className="flex items-start gap-3 rounded-xl bg-slate-50/70 p-3">
                <MapPin className="mt-1 h-5 w-5 text-slate-500" />
                <div>
                  <Label className="text-xs uppercase tracking-wide text-slate-500">
                    {t("bookingRequests.location")}
                  </Label>
                  <p className="mt-1 text-sm text-slate-700">{request.location}</p>
                </div>
              </div>

              {(request.preferred_date || request.preferred_start_time) && (
                <div className="flex items-start gap-3 rounded-xl bg-slate-50/70 p-3">
                  <Calendar className="mt-1 h-5 w-5 text-slate-500" />
                  <div>
                    <Label className="text-xs uppercase tracking-wide text-slate-500">
                      {t("bookingRequests.preferredDate")}
                    </Label>
                    <p className="mt-1 text-sm text-slate-700">
                      {request.preferred_date
                        ? format(new Date(request.preferred_date), "PPP")
                        : t("bookingRequests.notProvided")}
                      {request.preferred_start_time && request.preferred_end_time && (
                        <span className="block text-xs text-slate-500 md:text-sm">
                          {request.preferred_start_time} – {request.preferred_end_time}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              )}

              {request.budget_amount && (
                <div className="flex items-start gap-3 rounded-xl bg-slate-50/70 p-3">
                  <Euro className="mt-1 h-5 w-5 text-slate-500" />
                  <div>
                    <Label className="text-xs uppercase tracking-wide text-slate-500">
                      {t("bookingRequests.budget")}
                    </Label>
                    <p className="mt-1 text-sm text-slate-700">
                      €{request.budget_amount.toFixed(2)}
                      {request.budget_is_flexible && (
                        <Badge
                          variant="outline"
                          className="ml-2 border-emerald-200 bg-emerald-50 text-xs text-emerald-700"
                        >
                          {t("bookingRequests.flexible")}
                        </Badge>
                      )}
                    </p>
                  </div>
                </div>
              )}
            </section>

            {request.status === "counter_offered" && request.freelancer_proposed_date && (
              <section className="rounded-2xl border border-blue-200/70 bg-blue-50/60 p-5 shadow-sm">
                <Label className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                  {t("bookingRequests.yourCounterOffer")}
                </Label>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {request.freelancer_proposed_date && (
                    <div className="flex items-center gap-3 rounded-xl bg-white/70 p-3">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      <div className="text-sm text-blue-900">
                        {format(new Date(request.freelancer_proposed_date), "PPP")}
                        {request.freelancer_proposed_start_time && request.freelancer_proposed_end_time && (
                          <span className="block text-xs text-blue-700">
                            {request.freelancer_proposed_start_time} – {request.freelancer_proposed_end_time}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  {request.freelancer_proposed_rate && (
                    <div className="flex items-center gap-3 rounded-xl bg-white/70 p-3">
                      <Euro className="h-5 w-5 text-blue-600" />
                      <span className="text-sm text-blue-900">
                        {t("bookingRequests.rate")}: €{request.freelancer_proposed_rate.toFixed(2)}/hr
                      </span>
                    </div>
                  )}
                  {request.freelancer_proposed_total && (
                    <div className="flex items-center gap-3 rounded-xl bg-white/70 p-3">
                      <Euro className="h-5 w-5 text-blue-600" />
                      <span className="text-sm font-semibold text-blue-900">
                        {t("bookingRequests.total")}: €{request.freelancer_proposed_total.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {request.freelancer_response_notes && (
                    <div className="rounded-xl bg-white/70 p-3 text-sm text-blue-900 md:col-span-2">
                      <p className="text-xs font-medium uppercase tracking-wide text-blue-600">
                        {t("bookingRequests.notes")}
                      </p>
                      <p className="mt-2">{request.freelancer_response_notes}</p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {request.status === "accepted" && (
              <section className="space-y-4 rounded-2xl border border-emerald-200/70 bg-emerald-50/60 p-5 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-medium text-emerald-700">
                  <CheckCircle className="h-4 w-4" />
                  {t("bookingRequests.freelancer.counterOfferAccepted")}
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {request.freelancer_proposed_date && (
                    <div className="flex items-center gap-3 rounded-xl bg-white/80 p-3 text-sm text-emerald-900">
                      <Calendar className="h-5 w-5 text-emerald-600" />
                      <div>
                        {format(new Date(request.freelancer_proposed_date), "PPP")}
                        {request.freelancer_proposed_start_time && request.freelancer_proposed_end_time && (
                          <span className="block text-xs text-emerald-700">
                            {request.freelancer_proposed_start_time} – {request.freelancer_proposed_end_time}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  {request.freelancer_proposed_rate && (
                    <div className="flex items-center gap-3 rounded-xl bg-white/80 p-3 text-sm text-emerald-900">
                      <Euro className="h-5 w-5 text-emerald-600" />
                      <span>
                        {t("bookingRequests.rate")}: €{request.freelancer_proposed_rate.toFixed(2)}/hr
                      </span>
                    </div>
                  )}
                  {request.freelancer_proposed_total && (
                    <div className="flex items-center gap-3 rounded-xl bg-white/80 p-3 text-sm font-semibold text-emerald-900">
                      <Euro className="h-5 w-5 text-emerald-600" />
                      <span>
                        {t("bookingRequests.total")}: €{request.freelancer_proposed_total.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {request.freelancer_response_notes && (
                    <div className="rounded-xl bg-white/80 p-3 text-sm text-emerald-900 md:col-span-2">
                      <p className="text-xs font-medium uppercase tracking-wide text-emerald-600">
                        {t("bookingRequests.notes")}
                      </p>
                      <p className="mt-2">{request.freelancer_response_notes}</p>
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>
        )}
      </CardContent>

      {request.status === "pending" && (
        <CardFooter className="flex flex-col gap-3 border-t border-slate-200/70 bg-slate-50/80 p-6 md:flex-row md:items-center">
          <Dialog open={counterOfferOpen} onOpenChange={setCounterOfferOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="flex-1 border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                disabled={loading}
              >
                <Send className="mr-2 h-4 w-4" />
                {t("bookingRequests.actions.counterOffer")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{t("bookingRequests.counterOffer.title")}</DialogTitle>
                <DialogDescription>{t("bookingRequests.counterOffer.description")}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="proposed-date">{t("bookingRequests.proposedDate")}</Label>
                    <Input
                      id="proposed-date"
                      type="date"
                      value={proposedDate}
                      onChange={(e) => setProposedDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
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

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="proposed-rate">
                      {t("bookingRequests.proposedRate")} (€/hr)
                    </Label>
                    <Input
                      id="proposed-rate"
                      type="number"
                      step="0.01"
                      value={proposedRate}
                      onChange={(e) => setProposedRate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="proposed-total">
                      {t("bookingRequests.proposedTotal")} (€)
                    </Label>
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

                <div className="flex flex-col gap-2 pt-4 md:flex-row">
                  <Button
                    variant="outline"
                    onClick={() => setCounterOfferOpen(false)}
                    className="flex-1 border-slate-200"
                  >
                    {t("bookingRequests.cancel")}
                  </Button>
                  <Button
                    onClick={handleCounterOffer}
                    disabled={
                      loading ||
                      !proposedDate ||
                      !proposedStartTime ||
                      !proposedEndTime ||
                      !proposedRate ||
                      !proposedTotal
                    }
                    className="flex-1 bg-slate-900 hover:bg-slate-800"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t("bookingRequests.processing")}
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        {t("bookingRequests.submitCounterOffer")}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <div className="flex w-full flex-col gap-3 md:flex-row">
            <Button
              variant="outline"
              className="flex-1 border-red-200 bg-white text-red-600 hover:bg-red-50"
              onClick={() => setRejectDialogOpen(true)}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <X className="mr-2 h-4 w-4" />
              )}
              {t("bookingRequests.actions.reject")}
            </Button>

            <Button
              className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={() => setAcceptDialogOpen(true)}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="mr-2 h-4 w-4" />
              )}
              {t("bookingRequests.actions.accept")}
            </Button>
          </div>
        </CardFooter>
      )}

      {request.status === "accepted" && !request.converted_booking_id && (
        <CardFooter className="flex flex-col gap-4 border-t border-emerald-200/70 bg-emerald-50/60 p-6">
          <Button
            className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
            onClick={() => setConvertDialogOpen(true)}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("bookingRequests.processing")}
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                {t("bookingRequests.actions.convertToBooking")}
              </>
            )}
          </Button>
        </CardFooter>
      )}

      {request.status === "accepted" && request.converted_booking_id && (
        <CardFooter className="border-t border-slate-200/70 bg-slate-50/80 p-6">
          <Button
            variant="outline"
            className="w-full border-slate-200"
            onClick={() => (window.location.href = `/bookings/${request.converted_booking_id}`)}
          >
            {t("bookingRequests.viewBooking")}
          </Button>
        </CardFooter>
      )}

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


