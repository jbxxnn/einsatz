"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  User
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
  const { supabase } = useOptimizedSupabase()
  const [loading, setLoading] = useState(false)
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)

  // Fetch freelancer info if not provided
  const fetchFreelancerInfo = async () => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, avatar_url")
        .eq("id", request.freelancer_id)
        .single()
      
      return data
    } catch (error) {
      console.error("Error fetching freelancer info:", error)
      return null
    }
  }

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

  const images = Array.isArray(request.images) ? request.images : []
  
  // Get freelancer name from API response
  const freelancerName = request.freelancer 
    ? (request.freelancer.first_name && request.freelancer.last_name
      ? `${request.freelancer.first_name} ${request.freelancer.last_name}`
      : request.freelancer.first_name || t("bookingRequests.unknownFreelancer"))
    : t("bookingRequests.unknownFreelancer")

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
              <User className="h-4 w-4" />
              <span>{t("bookingRequests.to")} {freelancerName}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Your Request Details */}
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <FileText className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div>
              <Label className="text-xs text-muted-foreground">{t("bookingRequests.yourRequest")}</Label>
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
            <Label className="text-sm font-medium text-blue-800 mb-2 block">
              <AlertCircle className="h-4 w-4 inline mr-2" />
              {t("bookingRequests.client.counterOfferReceived")}
            </Label>
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
                  <Label className="text-xs text-muted-foreground">{t("bookingRequests.notes")}:</Label>
                  <p className="text-sm">{request.freelancer_response_notes}</p>
                </div>
              )}
            </div>

            {/* Action buttons for counter offer */}
            <div className="flex gap-2 mt-4">
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
                {t("bookingRequests.client.rejectCounter")}
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
                {t("bookingRequests.client.acceptCounter")}
              </Button>
            </div>
          </div>
        )}

        {/* Status messages */}
        {request.status === 'pending' && (
          <div className="pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{t("bookingRequests.client.waitingForFreelancer")}</span>
            </div>
          </div>
        )}

        {request.status === 'accepted' && (
          <div className="pt-4 border-t space-y-4">
            {/* Timeline Header */}
            <div className="flex items-center gap-2 text-sm text-green-600 mb-3">
              <CheckCircle className="h-4 w-4" />
              <span className="font-medium">{t("bookingRequests.client.acceptedByFreelancer")}</span>
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
            
            <p className="text-xs text-muted-foreground">{t("bookingRequests.client.waitingForBooking")}</p>
          </div>
        )}

        {request.status === 'rejected' && (
          <div className="pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-red-600">
              <X className="h-4 w-4" />
              <span>{t("bookingRequests.client.rejectedByFreelancer")}</span>
            </div>
          </div>
        )}

        {request.status === 'converted_to_booking' && request.converted_booking_id && (
          <div className="pt-4 border-t">
            <Button
              variant="outline"
              className="w-full"
              asChild
            >
              <Link href={`/bookings/${request.converted_booking_id}`}>
                {t("bookingRequests.viewBooking")}
              </Link>
            </Button>
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

