"use client"

import { useState, useEffect } from "react"
import { useOptimizedSupabase } from "@/components/optimized-supabase-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { FileText, ChevronDown, Trash2, Loader2, Save } from "lucide-react"
import { useTranslation } from "@/lib/i18n"
import type { Database } from "@/lib/database.types"

// Define BookingTemplate type since it might not be in generated types yet
type BookingTemplate = {
  id: string
  client_id: string
  template_name: string
  location: string | null
  description: string | null
  images: any
  preferred_start_time: string | null
  preferred_end_time: string | null
  payment_method: string | null
  created_at: string
  updated_at: string
}

interface BookingTemplateData {
  location: string
  description: string
  images: Array<{ url: string; path: string; file?: File }>
  selectedStartTime: string
  selectedEndTime: string
  paymentMethod: "online" | "offline"
}

interface BookingTemplateManagerProps {
  clientId: string
  onLoadTemplate?: (template: BookingTemplateData) => void
  onSaveTemplate?: () => Promise<BookingTemplateData | null>
  mode: "load" | "save"
}

export default function BookingTemplateManager({
  clientId,
  onLoadTemplate,
  onSaveTemplate,
  mode,
}: BookingTemplateManagerProps) {
  const { t } = useTranslation()
  const { supabase } = useOptimizedSupabase()
  const [templates, setTemplates] = useState<BookingTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null)

  const MAX_TEMPLATES = 3

  useEffect(() => {
    fetchTemplates()
  }, [clientId])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("booking_templates")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })

      if (error) throw error
      setTemplates(data || [])
    } catch (error) {
      console.error("Error fetching templates:", error)
      toast.error(t("bookingTemplates.fetchError"))
    } finally {
      setLoading(false)
    }
  }

  const handleSaveTemplate = async () => {
    if (!onSaveTemplate) return

    try {
      setSaving(true)

      // Check if max templates reached
      if (templates.length >= MAX_TEMPLATES) {
        toast.error(t("bookingTemplates.maxTemplatesReached", { max: MAX_TEMPLATES }))
        return
      }

      // Get current form data from parent
      const templateData = await onSaveTemplate()
      if (!templateData) {
        toast.error(t("bookingTemplates.noDataToSave"))
        return
      }

      // Upload images to permanent template storage
      let permanentImageUrls = []
      if (templateData.images && templateData.images.length > 0) {
        for (const image of templateData.images) {
          try {
            // If the image has a file object (not yet uploaded), upload it
            if (image.file) {
              const timestamp = Date.now()
              const randomString = Math.random().toString(36).substring(7)
              const fileExt = image.file.name.split('.').pop()
              const filePath = `template-images/${clientId}/${timestamp}-${randomString}.${fileExt}`

              // Upload file to Supabase storage
              const { data: uploadData, error: uploadError } = await supabase.storage
                .from('booking-images')
                .upload(filePath, image.file, {
                  cacheControl: '3600',
                  upsert: false
                })

              if (uploadError) {
                console.error('Error uploading template image:', uploadError)
                continue // Skip this image on error
              }

              // Get public URL
              const { data: { publicUrl } } = supabase.storage
                .from('booking-images')
                .getPublicUrl(filePath)

              permanentImageUrls.push({
                url: publicUrl,
                path: filePath
              })
            } else {
              // Image is already uploaded (has a path), just save the reference
              permanentImageUrls.push({
                url: image.url,
                path: image.path
              })
            }
          } catch (error) {
            console.error('Error processing template image:', error)
            // Continue with other images
          }
        }
      }

      // Auto-generate template name based on location and date
      let templateName = ""
      
      if (templateData.location) {
        // Extract city/area from location (take first part before comma)
        const locationParts = templateData.location.split(',')
        const cityOrArea = locationParts[0].trim()
        
        // Add date
        const now = new Date()
        const monthDay = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        
        templateName = `${cityOrArea} - ${monthDay}`
      } else {
        // Fallback to date-based name if no location
        const now = new Date()
        const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        templateName = `${t("bookingTemplates.template")} - ${dateStr}`
      }

      // Save to database
      const { data, error } = await supabase
        .from("booking_templates")
        .insert({
          client_id: clientId,
          template_name: templateName,
          location: templateData.location,
          description: templateData.description,
          images: permanentImageUrls,
          preferred_start_time: templateData.selectedStartTime,
          preferred_end_time: templateData.selectedEndTime,
          payment_method: templateData.paymentMethod,
        })
        .select()
        .single()

      if (error) throw error

      setTemplates([data, ...templates])
      toast.success(t("bookingTemplates.templateSaved"))
    } catch (error) {
      console.error("Error saving template:", error)
      toast.error(t("bookingTemplates.saveError"))
    } finally {
      setSaving(false)
    }
  }

  const handleLoadTemplate = (template: BookingTemplate) => {
    if (!onLoadTemplate) return

    try {
      const templateData: BookingTemplateData = {
        location: template.location || "",
        description: template.description || "",
        images: (template.images as any) || [],
        selectedStartTime: template.preferred_start_time || "",
        selectedEndTime: template.preferred_end_time || "",
        paymentMethod: (template.payment_method as "online" | "offline") || "offline",
      }

      onLoadTemplate(templateData)
      toast.success(t("bookingTemplates.templateLoaded"))
    } catch (error) {
      console.error("Error loading template:", error)
      toast.error(t("bookingTemplates.loadError"))
    }
  }

  const handleDeleteTemplate = async () => {
    if (!templateToDelete) return

    try {
      // Find the template to get its images
      const templateToDeleteObj = templates.find((t) => t.id === templateToDelete)
      
      // Delete associated images from storage first (if they're in template-images folder)
      if (templateToDeleteObj?.images && Array.isArray(templateToDeleteObj.images)) {
        const imagePaths = (templateToDeleteObj.images as any[])
          .filter(image => image.path && image.path.startsWith('template-images/'))
          .map(image => image.path)
        
        if (imagePaths.length > 0) {
          try {
            await supabase.storage
              .from('booking-images')
              .remove(imagePaths)
          } catch (storageError) {
            console.error('Error deleting template images:', storageError)
            // Continue with template deletion even if image deletion fails
          }
        }
      }

      // Delete template from database
      const { error } = await supabase
        .from("booking_templates")
        .delete()
        .eq("id", templateToDelete)

      if (error) throw error

      setTemplates(templates.filter((t) => t.id !== templateToDelete))
      toast.success(t("bookingTemplates.templateDeleted"))
    } catch (error) {
      console.error("Error deleting template:", error)
      toast.error(t("bookingTemplates.deleteError"))
    } finally {
      setDeleteDialogOpen(false)
      setTemplateToDelete(null)
    }
  }

  if (loading) {
    return (
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            <span className="text-sm text-blue-800">{t("bookingTemplates.loading")}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Render load mode (top of form)
  if (mode === "load") {
    return (
      <>
        {templates.length > 0 && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-1">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">
                    {t("bookingTemplates.savedTemplates")}
                  </span>
                  <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                    {templates.length}/{MAX_TEMPLATES}
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  {/* Load Template Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="text-blue-600 border-blue-300">
                        {t("bookingTemplates.loadTemplate")}
                        <ChevronDown className="h-4 w-4 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      {templates.map((template) => (
                        <div key={template.id} className="flex items-center">
                          <DropdownMenuItem
                            className="flex-1 cursor-pointer"
                            onClick={() => handleLoadTemplate(template)}
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">{template.template_name}</span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(template.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </DropdownMenuItem>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setTemplateToDelete(template.id)
                              setDeleteDialogOpen(true)
                            }}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("bookingTemplates.deleteConfirmTitle")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("bookingTemplates.deleteConfirmDescription")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteTemplate} className="bg-red-500 hover:bg-red-600">
                {t("common.delete")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    )
  }

  // Render save mode (bottom of form)
  return (
    <>
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-1">
              <FileText className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                {t("bookingTemplates.saveAsTemplate")}
              </span>
              {templates.length > 0 && (
                <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                  {templates.length}/{MAX_TEMPLATES}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Save Template Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveTemplate}
                disabled={saving || templates.length >= MAX_TEMPLATES}
                className="text-blue-600 border-blue-300"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    {t("bookingTemplates.saving")}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-1" />
                    {t("bookingTemplates.saveTemplate")}
                  </>
                )}
              </Button>
            </div>
          </div>

          {templates.length === 0 && (
            <p className="text-xs text-blue-700 mt-2">
              {t("bookingTemplates.noTemplates")}
            </p>
          )}
          
          {templates.length >= MAX_TEMPLATES && (
            <p className="text-xs text-orange-700 mt-2">
              {t("bookingTemplates.maxTemplatesInfo")}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("bookingTemplates.deleteConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("bookingTemplates.deleteConfirmDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTemplate} className="bg-red-500 hover:bg-red-600">
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

