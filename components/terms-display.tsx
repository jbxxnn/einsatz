"use client"

import { useState, useEffect } from "react"
import { useOptimizedSupabase } from "@/components/optimized-supabase-provider"
import { useTranslation } from "@/lib/i18n"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { FileText, Eye, Check } from "lucide-react"

interface TermsDisplayProps {
  freelancerId: string
  onTermsAccepted?: (accepted: boolean) => void
  showAcceptance?: boolean
  className?: string
}

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

export default function TermsDisplay({ 
  freelancerId, 
  onTermsAccepted, 
  showAcceptance = false,
  className = ""
}: TermsDisplayProps) {
  const { t } = useTranslation()
  const { supabase } = useOptimizedSupabase()
  
  const [loading, setLoading] = useState(true)
  const [terms, setTerms] = useState<PlatformTerms | FreelancerTerms | null>(null)
  const [isCustomTerms, setIsCustomTerms] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [accepted, setAccepted] = useState(false)

  useEffect(() => {
    loadTerms()
  }, [freelancerId])

  const loadTerms = async () => {
    try {
      setLoading(true)

      // First check if freelancer uses custom terms
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("use_custom_terms")
        .eq("id", freelancerId)
        .single()

      if (profileError) {
        console.error("Error loading profile:", profileError)
        return
      }

      if (profile.use_custom_terms) {
        // Load custom terms
        const { data: customTerms, error: customError } = await supabase
          .from("freelancer_terms")
          .select("*")
          .eq("freelancer_id", freelancerId)
          .eq("is_active", true)
          .single()

        if (customError && customError.code !== "PGRST116") {
          console.error("Error loading custom terms:", customError)
          return
        }

        if (customTerms) {
          setTerms(customTerms)
          setIsCustomTerms(true)
        } else {
          // Fallback to platform terms if custom terms not found
          await loadPlatformTerms()
        }
      } else {
        // Load platform terms
        await loadPlatformTerms()
      }

    } catch (error) {
      console.error("Error loading terms:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadPlatformTerms = async () => {
    const { data: platformTerms, error: platformError } = await supabase
      .from("platform_terms")
      .select("*")
      .eq("is_active", true)
      .single()

    if (platformError) {
      console.error("Error loading platform terms:", platformError)
      return
    }

    setTerms(platformTerms)
    setIsCustomTerms(false)
  }

  const handleAcceptanceChange = (checked: boolean) => {
    setAccepted(checked)
    onTermsAccepted?.(checked)
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

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <Card>
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!terms) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <FileText className="h-8 w-8 mx-auto text-gray-400 mb-2" />
          <p className="text-gray-500">{t("terms.noTermsAvailable")}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      {/* <CardHeader>
        <div className="flex flex-col justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t("terms.title")}
            </CardTitle>
          </div>
        </div>
      </CardHeader> */}
      
      <CardContent>

        {/* Acceptance Checkbox */}
        {showAcceptance && (
          <div className="flex items-start space-x-2">
            <Checkbox
              id="terms-acceptance"
              checked={accepted}
              onCheckedChange={handleAcceptanceChange}
            />
            <div className="grid gap-1.5 leading-none">
              <label
                htmlFor="terms-acceptance"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {t("terms.acceptTerms")}
              </label>
              <p className="text-xs text-muted-foreground">
                {t("terms.acceptTermsDescription")}
              </p>
              <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
              <DialogTrigger asChild>
                <p className="text-xs text-blue-500 cursor-pointer">
                  {t("terms.viewFull")}
                </p>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{t("terms.fullTerms")}</DialogTitle>
                  <DialogDescription>
                    {isCustomTerms ? t("terms.freelancerTermsDescription") : t("terms.platformTermsDescription")}
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                  <div className="text-sm text-gray-600 mb-4">
                    {t("terms.version")}: {"version" in terms ? terms.version : "1.0"} | 
                    {t("terms.lastUpdated")}: {new Date(terms.updated_at).toLocaleDateString()}
                  </div>
                  <div className="prose prose-sm max-w-none">
                    {formatContent(terms.content)}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
