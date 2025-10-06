"use client"

import { useState, useEffect } from "react"
import { useOptimizedSupabase } from "@/components/optimized-supabase-provider"
import { useTranslation } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Loader2, FileText, Edit, Save, X, Eye } from "lucide-react"
import { toast } from "sonner"

interface PlatformTerms {
  id: string
  content: string
  version: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface FreelancerTerms {
  id: string
  freelancer_id: string
  content: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface TermsAndConditionsManagerProps {
  freelancerId: string
}

export default function TermsAndConditionsManager({ freelancerId }: TermsAndConditionsManagerProps) {
  const { t } = useTranslation()
  const { supabase } = useOptimizedSupabase()
  
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [platformTerms, setPlatformTerms] = useState<PlatformTerms | null>(null)
  const [freelancerTerms, setFreelancerTerms] = useState<FreelancerTerms | null>(null)
  const [useCustomTerms, setUseCustomTerms] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false)
  const [customContent, setCustomContent] = useState("")
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    setMounted(true)
    loadTermsData()
  }, [freelancerId])

  const loadTermsData = async () => {
    try {
      setLoading(true)

      // Load platform terms
      const { data: platformData, error: platformError } = await supabase
        .from("platform_terms")
        .select("*")
        .eq("is_active", true)
        .single()

      if (platformError) {
        console.error("Error loading platform terms:", platformError)
        toast.error(t("terms.failedToLoadPlatformTerms"))
        return
      }

      setPlatformTerms(platformData)

      // Load freelancer profile to check custom terms setting
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("use_custom_terms")
        .eq("id", freelancerId)
        .single()

      if (profileError) {
        console.error("Error loading profile:", profileError)
        return
      }

      setUseCustomTerms(profile.use_custom_terms || false)

      // Load freelancer custom terms if they exist
      if (profile.use_custom_terms) {
        const { data: customData, error: customError } = await supabase
          .from("freelancer_terms")
          .select("*")
          .eq("freelancer_id", freelancerId)
          .eq("is_active", true)
          .single()

        if (customError && customError.code !== "PGRST116") {
          console.error("Error loading custom terms:", customError)
          toast.error(t("terms.failedToLoadCustomTerms"))
          return
        }

        setFreelancerTerms(customData)
        if (customData) {
          setCustomContent(customData.content)
        }
      }

    } catch (error) {
      console.error("Error loading terms data:", error)
      toast.error(t("terms.failedToLoadTerms"))
    } finally {
      setLoading(false)
    }
  }

  const handleToggleCustomTerms = async (enabled: boolean) => {
    try {
      setSaving(true)

      // Update profile setting
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ use_custom_terms: enabled })
        .eq("id", freelancerId)

      if (profileError) {
        console.error("Error updating profile:", profileError)
        toast.error(t("terms.failedToUpdateProfile"))
        return
      }

      setUseCustomTerms(enabled)

      if (enabled) {
        // If enabling custom terms, create default custom terms based on platform terms
        if (platformTerms) {
          // First, check if there's an existing record for this freelancer
          const { data: existingTerms, error: fetchError } = await supabase
            .from("freelancer_terms")
            .select("*")
            .eq("freelancer_id", freelancerId)
            .single()

          if (fetchError && fetchError.code !== "PGRST116") {
            console.error("Error fetching existing terms:", fetchError)
            toast.error(t("terms.failedToLoadCustomTerms"))
            return
          }

          let data, error

          if (existingTerms) {
            // Update existing record
            const { data: updateData, error: updateError } = await supabase
              .from("freelancer_terms")
              .update({
                content: platformTerms.content,
                is_active: true
              })
              .eq("id", existingTerms.id)
              .select()
              .single()

            data = updateData
            error = updateError
          } else {
            // Create new record
            const { data: insertData, error: insertError } = await supabase
              .from("freelancer_terms")
              .insert({
                freelancer_id: freelancerId,
                content: platformTerms.content,
                is_active: true
              })
              .select()
              .single()

            data = insertData
            error = insertError
          }

          if (error) {
            console.error("Error creating/updating custom terms:", error)
            toast.error(t("terms.failedToCreateCustomTerms"))
            return
          }

          setFreelancerTerms(data)
          setCustomContent(data.content)
        }
      } else {
        // If disabling custom terms, deactivate them
        if (freelancerTerms) {
          const { error } = await supabase
            .from("freelancer_terms")
            .update({ is_active: false })
            .eq("id", freelancerTerms.id)

          if (error) {
            console.error("Error deactivating custom terms:", error)
            toast.error(t("terms.failedToDeactivateCustomTerms"))
            return
          }
        }
      }

      toast.success(enabled ? t("terms.customTermsEnabled") : t("terms.customTermsDisabled"))

    } catch (error) {
      console.error("Error toggling custom terms:", error)
      toast.error(t("terms.failedToToggleCustomTerms"))
    } finally {
      setSaving(false)
    }
  }

  const handleSaveCustomTerms = async () => {
    try {
      setSaving(true)

      if (!customContent.trim()) {
        toast.error(t("terms.contentRequired"))
        return
      }

      // Check if there's an existing record for this freelancer
      const { data: existingTerms, error: fetchError } = await supabase
        .from("freelancer_terms")
        .select("*")
        .eq("freelancer_id", freelancerId)
        .single()

      if (fetchError && fetchError.code !== "PGRST116") {
        console.error("Error fetching existing terms:", fetchError)
        toast.error(t("terms.failedToLoadCustomTerms"))
        return
      }

      let data, error

      if (existingTerms) {
        // Update existing record
        const { data: updateData, error: updateError } = await supabase
          .from("freelancer_terms")
          .update({
            content: customContent.trim(),
            is_active: true
          })
          .eq("id", existingTerms.id)
          .select()
          .single()

        data = updateData
        error = updateError
      } else {
        // Create new record
        const { data: insertData, error: insertError } = await supabase
          .from("freelancer_terms")
          .insert({
            freelancer_id: freelancerId,
            content: customContent.trim(),
            is_active: true
          })
          .select()
          .single()

        data = insertData
        error = insertError
      }

      if (error) {
        console.error("Error saving custom terms:", error)
        toast.error(t("terms.failedToSaveCustomTerms"))
        return
      }

      setFreelancerTerms(data)
      setEditDialogOpen(false)
      setIsEditing(false)
      toast.success(t("terms.customTermsSaved"))

    } catch (error) {
      console.error("Error saving custom terms:", error)
      toast.error(t("terms.failedToSaveCustomTerms"))
    } finally {
      setSaving(false)
    }
  }

  const handleStartEditing = () => {
    setIsEditing(true)
    setEditDialogOpen(true)
  }

  const handleCancelEditing = () => {
    setIsEditing(false)
    setEditDialogOpen(false)
    // Reset content to current terms
    if (freelancerTerms) {
      setCustomContent(freelancerTerms.content)
    }
  }

  const getCurrentTerms = () => {
    return useCustomTerms && freelancerTerms ? freelancerTerms : platformTerms
  }

  const formatContent = (content: string) => {
    return content.split('\n').map((line, index) => {
      if (line.trim() === '') return <br key={index} />
      
      // Check if line is a section header (starts with a word and ends with no period)
      const isHeader = /^[A-Za-z\s&]+$/.test(line.trim()) && !line.includes('.') && line.length < 50
      
      if (isHeader) {
        return (
          <h3 key={index} className="text-lg font-semibold mt-6 mb-3 text-gray-900">
            {line}
          </h3>
        )
      }
      
      return (
        <p key={index} className="mb-2 text-gray-700 leading-relaxed">
          {line}
        </p>
      )
    })
  }

  if (!mounted || loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  const currentTerms = getCurrentTerms()

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t("terms.title")}
          </CardTitle>
          <CardDescription>
            {t("terms.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Terms Type Selection */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label htmlFor="custom-terms-toggle" className="text-base font-medium">
                {t("terms.useCustomTerms")}
              </Label>
              <p className="text-sm text-gray-600">
                {t("terms.customTermsDescription")}
              </p>
            </div>
            <Switch
              id="custom-terms-toggle"
              checked={useCustomTerms}
              onCheckedChange={handleToggleCustomTerms}
              disabled={saving}
            />
          </div>

          {/* Current Terms Display */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">
                  {t("terms.currentTerms")}
                </h3>
                <Badge variant={useCustomTerms ? "default" : "secondary"}>
                  {useCustomTerms ? t("terms.custom") : t("terms.platform")}
                </Badge>
              </div>
              
              <div className="flex gap-2">
                <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      {t("terms.preview")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{t("terms.termsPreview")}</DialogTitle>
                      <DialogDescription>
                        {t("terms.termsPreviewDescription")}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                      {currentTerms && formatContent(currentTerms.content)}
                    </div>
                  </DialogContent>
                </Dialog>

                {useCustomTerms && (
                  <Button onClick={handleStartEditing} size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    {t("terms.edit")}
                  </Button>
                )}
              </div>
            </div>

            {currentTerms && (
              <div className="p-4 border rounded-lg bg-gray-50 max-h-96 overflow-y-auto">
                <div className="text-sm text-gray-600 mb-2">
                  {t("terms.version")}: {"version" in currentTerms ? currentTerms.version : "1.0"} | 
                  {t("terms.lastUpdated")}: {new Date(currentTerms.updated_at).toLocaleDateString()}
                </div>
                <div className="prose prose-sm max-w-none">
                  {formatContent(currentTerms.content)}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Custom Terms Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{t("terms.editCustomTerms")}</DialogTitle>
            <DialogDescription>
              {t("terms.editCustomTermsDescription")}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="custom-content">{t("terms.termsContent")}</Label>
              <Textarea
                id="custom-content"
                value={customContent}
                onChange={(e) => setCustomContent(e.target.value)}
                placeholder={t("terms.termsContentPlaceholder")}
                rows={20}
                className="font-mono text-sm"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={handleCancelEditing}
                disabled={saving}
              >
                <X className="h-4 w-4 mr-2" />
                {t("terms.cancel")}
              </Button>
              <Button
                onClick={handleSaveCustomTerms}
                disabled={saving || !customContent.trim()}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {t("terms.save")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
