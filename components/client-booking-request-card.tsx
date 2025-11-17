"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
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
import type { Database } from "@/lib/database.types"
import {
  Calendar,
  MapPin,
  Euro,
  Clock,
  FileText,
  CheckCircle,
  X,
  AlertCircle,
  Loader2,
  User,
  ChevronDown
} from "lucide-react"
import Image from "next/image"
import { format } from "date-fns"
import Link from "next/link"

type BookingRequest = Database["public"]["Tables"]["booking_requests"]["Row"] & {
  profiles?: Database["public"]["Tables"]["profiles"]["Row"]
  freelancer?: Database["public"]["Tables"]["profiles"]["Row"] | {
    id: string
    first_name: string | null
    last_name: string | null
    avatar_url: string | null
  }
  job_categories?: {
    id: string
    name: string
    icon: string | null
  }
}

interface ClientBookingRequestCardProps {
  request: BookingRequest
  onUpdate: () => void
}

export default function ClientBookingRequestCard({ request, onUpdate }: ClientBookingRequestCardProps) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const handleAcceptCounterOffer = async () => {
    setAcceptDialogOpen(false)
    setLoading(true)
    try {
      const response = await fetch(`/api/booking-requests/${request.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'client_accept_counter'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to accept counter offer')
      }

      toast.success(t("bookingRequests.client.success.acceptedCounter"))
      onUpdate()
    } catch (error: any) {
      console.error("Error accepting counter offer:", error)
      toast.error(error.message || t("bookingRequests.client.error.failedToAcceptCounter"))
    } finally {
      setLoading(false)
    }
  }

  const handleRejectCounterOffer = async () => {
    setRejectDialogOpen(false)
    setLoading(true)
    try {
      const response = await fetch(`/api/booking-requests/${request.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'client_reject_counter'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to reject counter offer')
      }

      toast.success(t("bookingRequests.client.success.rejectedCounter"))
      onUpdate()
    } catch (error: any) {
      console.error("Error rejecting counter offer:", error)
      toast.error(error.message || t("bookingRequests.client.error.failedToRejectCounter"))
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

  const images = Array.isArray(request.images) 
    ? request.images.filter((img): img is string => typeof img === 'string')
    : []
  
  // Get freelancer name from API response
  const freelancerName = request.freelancer 
    ? (request.freelancer.first_name && request.freelancer.last_name
      ? `${request.freelancer.first_name} ${request.freelancer.last_name}`
      : request.freelancer.first_name || t("bookingRequests.unknownFreelancer"))
    : t("bookingRequests.unknownFreelancer")
  const freelancerAvatar =
    request.freelancer && "avatar_url" in request.freelancer ? request.freelancer.avatar_url : null
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
              <User className="h-4 w-4" />
              <span>
                {t("bookingRequests.to")} {freelancerName}
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
            {freelancerAvatar ? (
              <div className="relative h-12 w-12 overflow-hidden rounded-full border border-slate-200 shadow-sm">
                <Image
                  src={freelancerAvatar}
                  alt={freelancerName}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-sm font-medium text-slate-500">
                {freelancerName
                  .split(" ")
                  .map((name: string[]) => name[0])
                  .join("")
                  .slice(0, 2)}
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-slate-900 md:text-base">{freelancerName}</p>
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
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
                {format(new Date(request.created_at), "PPP p")}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded((prev) => !prev)}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
            >
              {expanded ? t("bookingRequests.hideDetails") : t("bookingRequests.viewDetails")}
              <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
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
                    {t("bookingRequests.yourRequest")}
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
                    {images.slice(0, 6).map((imageUrl, index) => (
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

            {(request.location || request.preferred_date || request.budget_amount) && (
              <section className="space-y-3 rounded-2xl border border-slate-200/70 bg-white/70 p-5">
                {request.location && (
                  <div className="flex items-start gap-3 rounded-xl bg-slate-50/70 p-3">
                    <MapPin className="mt-1 h-5 w-5 text-slate-500" />
                    <div>
                      <Label className="text-xs uppercase tracking-wide text-slate-500">
                        {t("bookingRequests.location")}
                      </Label>
                      <p className="mt-1 text-sm text-slate-700">{request.location}</p>
                    </div>
                  </div>
                )}

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
            )}

            {request.status === "counter_offered" && request.freelancer_proposed_date && (
              <section className="rounded-2xl border border-blue-200/70 bg-blue-50/60 p-5 shadow-sm">
                <Label className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                  {t("bookingRequests.client.counterOfferReceived")}
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
                  {t("bookingRequests.client.acceptedByFreelancer")}
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
                </div>
              </section>
            )}
          </div>
        )}

      </CardContent>

      {/* Accept Counter Offer Dialog */}
      <AlertDialog open={acceptDialogOpen} onOpenChange={setAcceptDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("bookingRequests.client.acceptCounter")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("bookingRequests.client.confirm.acceptCounter")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>
              {t("bookingRequests.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAcceptCounterOffer}
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
                  {t("bookingRequests.client.acceptCounter")}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Counter Offer Dialog */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("bookingRequests.client.rejectCounter")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("bookingRequests.client.confirm.rejectCounter")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>
              {t("bookingRequests.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRejectCounterOffer}
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
                  {t("bookingRequests.client.rejectCounter")}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

