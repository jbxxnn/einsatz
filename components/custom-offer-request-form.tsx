"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useOptimizedSupabase } from "./optimized-supabase-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/lib/toast"
import { ArrowLeft, MapPin, Calendar, Clock, Euro, Upload, X, Loader2, Image as ImageIcon } from "lucide-react"
import { format } from "date-fns"
import { useTranslation } from "@/lib/i18n"
import type { Database } from "@/lib/database.types"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]

interface CustomOfferRequestFormProps {
  freelancer: Profile
  categoryId: string
  categoryName: string
  onBack: () => void
  onSuccess: () => void
}

export default function CustomOfferRequestForm({
  freelancer,
  categoryId,
  categoryName,
  onBack,
  onSuccess
}: CustomOfferRequestFormProps) {
  const router = useRouter()
  const { supabase } = useOptimizedSupabase()
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [preferredDate, setPreferredDate] = useState<string>("")
  const [preferredStartTime, setPreferredStartTime] = useState<string>("")
  const [preferredEndTime, setPreferredEndTime] = useState<string>("")
  const [budgetAmount, setBudgetAmount] = useState<string>("")
  const [budgetIsFlexible, setBudgetIsFlexible] = useState(true)
  const [additionalNotes, setAdditionalNotes] = useState("")
  const [uploadedImages, setUploadedImages] = useState<Array<{url: string, path: string, file?: File}>>([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const [tempImages, setTempImages] = useState<File[]>([])

  // Image upload functions
  const handleImageUpload = async (files: FileList) => {
    const fileArray = Array.from(files)
    
    if (tempImages.length + fileArray.length > 5) {
      toast.error(t("bookingform.images.maxImagesAllowed"))
      return
    }

    for (const file of fileArray) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        toast.error(`${file.name}: ${t("bookingform.images.invalidFileType")}`)
        return
      }

      if (file.size > 2 * 1024 * 1024) {
        toast.error(`${file.name}: ${t("bookingform.images.fileSizeTooLarge")}`)
        return
      }
    }

    const newTempImages = [...tempImages, ...fileArray]
    setTempImages(newTempImages)

    const previewImages = fileArray.map(file => ({
      url: URL.createObjectURL(file),
      path: '',
      file: file
    }))

    setUploadedImages(prev => [...prev, ...previewImages])
    toast.success(`${fileArray.length} ${t("bookingform.images.imagesAddedSuccessfully")}`)
  }

  const handleImageRemove = (imageIndex: number) => {
    const imageToRemove = uploadedImages[imageIndex]
    
    if (imageToRemove.file) {
      const newTempImages = tempImages.filter((_, index) => index !== (tempImages.length - uploadedImages.length + imageIndex))
      setTempImages(newTempImages)
      setUploadedImages(prev => prev.filter((_, index) => index !== imageIndex))
      URL.revokeObjectURL(imageToRemove.url)
      toast.success(t("bookingform.images.imageRemovedSuccessfully"))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!description.trim()) {
      toast.error(t("bookingform.validation.enterJobDescriptionBeforeBooking"))
      return
    }

    if (!location.trim()) {
      toast.error(t("bookingform.validation.enterLocationBeforeBooking"))
      return
    }

    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        toast.error(t("bookingform.authenticationRequired"))
        router.push("/login")
        return
      }

      // Create booking request via API
      const response = await fetch('/api/booking-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          freelancer_id: freelancer.id,
          category_id: categoryId,
          description,
          location,
          preferred_date: preferredDate || null,
          preferred_start_time: preferredStartTime || null,
          preferred_end_time: preferredEndTime || null,
          budget_amount: budgetAmount || null,
          budget_is_flexible: budgetIsFlexible,
          additional_notes: additionalNotes || null,
          images: [] // Will be updated after image upload
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create booking request')
      }

      const { request } = await response.json()
      const requestId = request.id

      // Upload images if any
      if (tempImages.length > 0) {
        setUploadingImages(true)
        try {
          const uploadPromises = tempImages.map(async (file) => {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('bookingRequestId', requestId)

            const response = await fetch('/api/upload-booking-request-image', {
              method: 'POST',
              body: formData,
            })

            if (!response.ok) {
              throw new Error(t("bookingform.images.uploadFailed"))
            }

            return response.json()
          })

          const results = await Promise.all(uploadPromises)
          const uploadedImageUrls = results.map(result => result.url)
          
          // Update request with image URLs
          await supabase
            .from("booking_requests")
            .update({ images: uploadedImageUrls })
            .eq("id", requestId)
        } catch (uploadError: any) {
          console.error("Image upload error:", uploadError)
          // Don't fail the whole request if image upload fails
        } finally {
          setUploadingImages(false)
        }
      }

      toast.success(t("bookingform.wildcard.customOfferSubmittedSuccessfully"))
      onSuccess()

      // TODO: Send notification to freelancer
      
    } catch (error: any) {
      console.error("Error creating booking request:", error)
      toast.error(error.message || t("bookingform.somethingWentWrong"))
    } finally {
      setLoading(false)
    }
  }

  // Get today's date in YYYY-MM-DD format for min date
  const today = format(new Date(), 'yyyy-MM-dd')

  return (
    <div className="space-y-6">
      <Button type="button" variant="ghost" size="sm" className="-ml-2 text-muted-foreground" onClick={onBack}>
        <ArrowLeft className="h-4 w-4 mr-1" />
        {t("bookingform.back")}
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("bookingform.wildcard.requestCustomOffer")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-xs text-black">{t("bookingform.jobDescription")}</Label>
              <Textarea
                id="description"
                placeholder={t("bookingform.describeJob")}
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="text-xs"
              />
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location" className="text-xs text-black">{t("bookingform.location")}</Label>
              <div className="relative">
                <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="location"
                  placeholder={t("bookingform.enterAddress")}
                  className="pl-8 text-xs"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Preferred Date */}
            <div className="space-y-2">
              <Label htmlFor="preferred-date" className="text-xs text-black">{t("bookingform.wildcard.preferredDate")} ({t("bookingform.wildcard.optional")})</Label>
              <div className="relative">
                <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="preferred-date"
                  type="date"
                  min={today}
                  className="pl-8 text-xs"
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                />
              </div>
            </div>

            {/* Preferred Time Range */}
            {(preferredDate || preferredStartTime || preferredEndTime) && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="preferred-start-time" className="text-xs text-black">{t("bookingform.wildcard.preferredStartTime")} ({t("bookingform.wildcard.optional")})</Label>
                  <div className="relative">
                    <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="preferred-start-time"
                      type="time"
                      className="pl-8 text-xs"
                      value={preferredStartTime}
                      onChange={(e) => setPreferredStartTime(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="preferred-end-time" className="text-xs text-black">{t("bookingform.wildcard.preferredEndTime")} ({t("bookingform.wildcard.optional")})</Label>
                  <div className="relative">
                    <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="preferred-end-time"
                      type="time"
                      className="pl-8 text-xs"
                      value={preferredEndTime}
                      onChange={(e) => setPreferredEndTime(e.target.value)}
                      min={preferredStartTime || undefined}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Budget */}
            <div className="space-y-2">
              <Label htmlFor="budget" className="text-xs text-black">{t("bookingform.wildcard.budget")} ({t("bookingform.wildcard.optional")})</Label>
              <div className="relative">
                <Euro className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="budget"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="pl-8 text-xs"
                  value={budgetAmount}
                  onChange={(e) => setBudgetAmount(e.target.value)}
                />
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <input
                  type="checkbox"
                  id="budget-flexible"
                  checked={budgetIsFlexible}
                  onChange={(e) => setBudgetIsFlexible(e.target.checked)}
                  className="h-4 w-4"
                />
                <Label htmlFor="budget-flexible" className="text-xs text-muted-foreground cursor-pointer">
                  {t("bookingform.wildcard.budgetIsFlexible")}
                </Label>
              </div>
            </div>

            {/* Additional Notes */}
            <div className="space-y-2">
              <Label htmlFor="additional-notes" className="text-xs text-black">{t("bookingform.wildcard.additionalNotes")} ({t("bookingform.wildcard.optional")})</Label>
              <Textarea
                id="additional-notes"
                placeholder={t("bookingform.wildcard.additionalNotesPlaceholder")}
                rows={3}
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                className="text-xs"
              />
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <Label className="text-xs text-black">{t("bookingform.images.jobImages")}</Label>
              <div className="border rounded-md p-3">
                <div className="space-y-3">
                  <div className="flex items-center justify-center w-full">
                    <label
                      htmlFor="image-upload-custom"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-4 text-gray-500" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">{t("bookingform.images.clickToUpload")}</span> {t("bookingform.images.dragAndDrop")}
                        </p>
                        <p className="text-xs text-gray-500">
                          {t("bookingform.images.supportedFormats")}
                        </p>
                      </div>
                      <input
                        id="image-upload-custom"
                        type="file"
                        className="hidden"
                        multiple
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                        disabled={uploadingImages || uploadedImages.length >= 5}
                      />
                    </label>
                  </div>

                  {uploadingImages && (
                    <div className="flex items-center justify-center py-2">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span className="text-sm text-gray-600">{t("bookingform.images.uploadingImages")}</span>
                    </div>
                  )}

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
                            title={t("bookingform.images.removeImage")}
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

                  <div className="text-xs text-gray-500 text-center">
                    {uploadedImages.length}/5 {t("bookingform.images.imagesUploaded")}
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                className="flex-1"
              >
                {t("bookingform.back")}
              </Button>
              <Button
                type="submit"
                disabled={loading || uploadingImages || !description.trim() || !location.trim()}
                className="flex-1 bg-[#33CC99] hover:bg-[#2BB88A] text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t("bookingform.processing")}
                  </>
                ) : (
                  t("bookingform.wildcard.submitCustomOffer")
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

