"use client"

import React, { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useOptimizedSupabase } from "@/components/optimized-supabase-provider"
import { useOptimizedUser } from "@/components/optimized-user-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  User,
  Briefcase,
  Clock,
  Calendar,
  Settings,
  CreditCard,
  MapPin,
  Mail,
  Phone,
  Globe,
  Linkedin,
  Github,
  Twitter,
  Instagram,
  Facebook,
  Youtube,
  Twitch,
  Slack,
  Signal,
  Rocket,
  Send,
  Share2,
  Link2,
  Copy,
  Check,
  X,
  AlertCircle,
  Info,
  HelpCircle,
  Loader,
  Pencil,
  Upload,
  LogOut,
  ReceiptEuro
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import type { Database } from "@/lib/database.types"
import { LocationInput } from "@/components/location-input"
import { AvatarUpload } from "@/components/avatar-upload"
import { toast } from "@/lib/toast"
import { useTranslation } from "@/lib/i18n"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import FreelancerOnboardingProgress from "@/components/freelancer-onboarding-progress"
import CoverTemplateSelector from "@/components/cover-template-selector"
import { getCoverTemplate } from "@/lib/cover-templates"
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarInset,
  useSidebar
} from "@/components/ui/sidebar"
import ModernSidebarNav from "@/components/modern-sidebar-nav"
import OptimizedHeader from "@/components/optimized-header"
import TermsAndConditionsManager from "@/components/terms-and-conditions-manager"


// Custom header component that uses sidebar's mobile state
function MobileHeader() {
  const { openMobile, setOpenMobile } = useSidebar()
  
  return (
    <OptimizedHeader 
      isMobileMenuOpen={openMobile}
      setIsMobileMenuOpen={setOpenMobile}
    />
  )
}

type Profile = Database["public"]["Tables"]["profiles"]["Row"]

// Skeleton components for immediate loading
function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-20 w-20 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-4 w-[150px]" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Skeleton className="h-[400px] w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { supabase } = useOptimizedSupabase()
  const { profile, isLoading: isProfileLoading } = useOptimizedUser()
  const [updating, setUpdating] = useState(false)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [bio, setBio] = useState("")
  const [location, setLocation] = useState("")
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number; formattedAddress: string } | null>(null)
  const [jobCategories, setJobCategories] = useState<string[]>([])
  const [jobSubcategories, setJobSubcategories] = useState<string[]>([])
  const [availability, setAvailability] = useState<{ start: string; end: string }[]>([])
  const [jobOfferings, setJobOfferings] = useState<any[]>([])
  const [availabilitySchedule, setAvailabilitySchedule] = useState<any[]>([])
  const [serviceRadius, setServiceRadius] = useState(10)
  const [hourlyRate, setHourlyRate] = useState("")
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [activeTab, setActiveTab] = useState("profile")
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [socialLinks, setSocialLinks] = useState({
    website: "",
    linkedin: "",
    twitter: "",
    instagram: "",
  })
  const [selectedCoverTemplate, setSelectedCoverTemplate] = useState<string | null>(null)
  const [showCoverSelector, setShowCoverSelector] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Redirect to login if no profile found - with more patient logic
  React.useEffect(() => {
    // Don't redirect if we're still loading
    if (isProfileLoading) {
      return;
    }

    // Don't redirect if we have a profile
    if (profile) {
      return;
    }

    // Add a small delay to prevent race conditions during session restoration
    const redirectTimeout = setTimeout(() => {
      // Double-check loading states before redirecting
      if (!isProfileLoading && !profile) {
        console.log("Redirecting to login - no profile found after loading completed");
        router.push("/login");
      }
    }, 100); // 100ms delay to allow for session restoration

    return () => clearTimeout(redirectTimeout);
  }, [isProfileLoading, profile, router]);

  // Initialize form state from profile data
  React.useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || "")
      setLastName(profile.last_name || "")
      setEmail(profile.email || "")
      setPhone(profile.phone || "")
      setBio(profile.bio || "")
      setLocation(profile.location || "")
      setHourlyRate(profile.hourly_rate?.toString() || "")
      setAvatarUrl(profile.avatar_url)
      setServiceRadius(profile.service_radius || 10)

        // Set coordinates if available
        setLocationCoords({
          lat: profile.latitude || 0,
          lng: profile.longitude || 0,
          formattedAddress: profile.formatted_address || "",
        })

      // Extract social links and cover template from metadata if available
      if (profile.metadata && typeof profile.metadata === "object") {
        const metadata = profile.metadata as any
        setSocialLinks({
          website: metadata.website || "",
          linkedin: metadata.linkedin || "",
          twitter: metadata.twitter || "",
          instagram: metadata.instagram || "",
        })
        setSelectedCoverTemplate(metadata.coverTemplate || null)
      }
    }
  }, [profile])

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      setAvatarFile(file)

      // Create a preview URL
      const objectUrl = URL.createObjectURL(file)
      setAvatarUrl(objectUrl)
    }
  }

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile) return avatarUrl

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error("User not found")

      const fileExt = avatarFile.name.split(".").pop()
      const filePath = `avatars/${user.id}/${Math.random().toString(36).substring(2)}.${fileExt}`

      const { error: uploadError } = await supabase.storage.from("profiles").upload(filePath, avatarFile)

      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from("profiles").getPublicUrl(filePath)

      return publicUrl
    } catch (error) {
      console.error("Error uploading avatar:", error)
      return null
    }
  }

  const handleLocationChange = (value: string, coords?: { lat: number; lng: number; formattedAddress: string }) => {
    setLocation(value)
    if (coords) {
      setLocationCoords({
        lat: coords.lat,
        lng: coords.lng,
        formattedAddress: coords.formattedAddress,
      })
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdating(true)
    console.log('Update started')

    try {
      // Upload avatar if changed
      const newAvatarUrl = await uploadAvatar()
      console.log('Avatar uploaded:', newAvatarUrl)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error('User not found')

      // Calculate profile completeness
      const fields = [
        firstName,
        lastName,
        email,
        phone,
        bio,
        location,
        newAvatarUrl,
      ]

      // Add freelancer-specific fields
      if (profile?.user_type === 'freelancer') {
        fields.push(
          hourlyRate?.toString() || null,
          (profile.metadata as any)?.role || null,
          locationCoords?.lat?.toString() || null,
          locationCoords?.lng?.toString() || null
        )
      }

      const completedFields = fields.filter(field => field && field.toString().trim() !== '').length
      const profileCompleteness = Math.round((completedFields / fields.length) * 100)

      // Check for completed bookings if freelancer
      let isVerified = profileCompleteness >= 90
      if (profile?.user_type === 'freelancer') {
        const { data: completedBookings } = await supabase
          .from('bookings')
          .select('id')
          .eq('freelancer_id', user.id)
          .eq('status', 'completed')
        
        isVerified = isVerified || Boolean(completedBookings?.length)
      }

      const updates = {
        id: user.id,
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        bio,
        location,
        hourly_rate: hourlyRate ? Number.parseFloat(hourlyRate) : null,
        avatar_url: newAvatarUrl,
        updated_at: new Date().toISOString(),
        metadata: {
          ...(typeof profile?.metadata === 'object' && profile.metadata !== null ? profile.metadata : {}),
          ...socialLinks,
          coverTemplate: selectedCoverTemplate,
        },
        // Add location data
        latitude: locationCoords?.lat,
        longitude: locationCoords?.lng,
        formatted_address: locationCoords?.formattedAddress,
        service_radius: profile?.user_type === 'freelancer' ? serviceRadius : null,
        // Add profile completeness and verification status
        profile_completeness: profileCompleteness,
        is_verified: isVerified,
      }

      const { error } = await supabase.from('profiles').update(updates).eq('id', user.id)
      console.log('Profile updated')

      if (error) throw error

      toast.success(t("profile.updateSuccess"))

      // Note: Profile will be updated automatically by the useOptimizedUser hook
    } catch (error: any) {
      console.error('Error updating profile:', error)
      toast.error(error.message || t("profile.updateError"))
    } finally {
      setUpdating(false)
      console.log('Update finished')
    }
  }

  if (isProfileLoading) {
    return (
      <SidebarProvider className="w-full">
        <div className="flex min-h-screen bg-muted/30 w-full">
          <Sidebar>
            <ModernSidebarNav profile={null} />
          </Sidebar>
          
          <SidebarInset className="w-full">
            <MobileHeader />
            <div className="p-6">
              <ProfileSkeleton />
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    )
  }

  if (!profile) {
    return (
      <SidebarProvider className="w-full">
        <div className="flex min-h-screen bg-muted/30 w-full">
          <Sidebar>
            <ModernSidebarNav profile={null} />
          </Sidebar>
          
          <SidebarInset className="w-full">
            <div className="flex flex-col justify-center items-center min-h-screen">
              <div className="text-center">
                <Loader className="h-8 w-8 animate-spin mx-auto mb-4" />
                <h1 className="text-xl font-semibold mb-2">{t("profile.redirectingToLogin")}</h1>
                <p className="text-muted-foreground">{t("profile.pleaseWait")}</p>
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider className="w-full">
      <div className="flex min-h-screen bg-muted/30 w-full">
        <Sidebar>
          {profile && <ModernSidebarNav profile={profile} />}
        </Sidebar>

          {/* Main Content */}
          <SidebarInset className="w-full">
          <MobileHeader />
          <div className="lg:col-span-3 space-y-6 p-6 pb-20 bg-[#f7f7f7]">
            <div className="flex items-center justify-between">
              {/* <h1 className="text-3xl font-bold">{t("profile.title")}</h1> */}
              {/* {profile.user_type === "freelancer" && (
                <Link href={`/freelancers/${profile.id}`}>
                  <Button variant="outline">{t("profile.previewProfile")}</Button>
                </Link>
              )} */}
            </div>
            {profile.user_type === "freelancer" && (
              <FreelancerOnboardingProgress profile={profile} />
            )}

            <div className="bg-background rounded-lg overflow-hidden">
              {/* Banner and Photo */}
              <div className="relative">
                <div 
                  className="h-32 relative overflow-hidden"
                  style={{
                    background: getCoverTemplate(selectedCoverTemplate)?.pattern || "linear-gradient(135deg, #1e293b 0%, #334155 50%, #64748b 100%)",
                    backgroundSize: "cover"
                  }}
                >
                  {/* Pattern Overlay */}
                  <div className="absolute inset-0 opacity-20">
                    <div className="w-full h-full" style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                    }}></div>
                  </div>
                </div>
                <div className="absolute bottom-0 left-8 transform translate-y-1/2">
                  <div className="relative">
                    <div className="h-24 w-24 rounded-full border-4 border-background overflow-hidden bg-background">
                      <Image
                        src={avatarUrl || `/placeholder.svg?height=96&width=96&text=${firstName.charAt(0) || "U"}`}
                        alt={firstName || "User"}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <button
                      onClick={handleAvatarClick}
                      className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1 shadow-sm hover:bg-primary/90 transition-colors"
                      title={t("profile.editAvatar")}
                      type="button"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                      title={t("profile.editAvatar")}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-16 px-8 pb-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold mb-1">{t("profile.yourPhoto")}</h2>
                    <p className="text-xs text-black">{t("profile.yourPhotoDescription")}</p>
                  </div>
                  <div className="flex gap-3">
                    <Button type="button" variant="outline" size="sm" onClick={handleAvatarClick}>
                      <Upload className="h-4 w-4 mr-2" />
                      {t("profile.uploadNew")}
                    </Button>
                  </div>
                </div>

                {/* Profile Completeness */}
                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium">{t("profile.completeness.title")}</h3>
                    <span className="text-sm font-medium text-primary">
                      {calculateProfileCompleteness(profile)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#15dda9] transition-all duration-300"
                      style={{ width: `${calculateProfileCompleteness(profile)}%` }}
                    />
                  </div>
                  <div className="mt-2 text-xs text-black">
                    {getCompletenessMessage(calculateProfileCompleteness(profile), t)}
                  </div>
                </div>
              </div>
            </div>

            {/* Cover Template Selection (for freelancers) */}
            {profile.user_type === "freelancer" && (
              <div className="bg-background rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold mb-1">{t("profile.coverDesign")}</h2>
                    <p className="text-xs text-black">
                      {t("profile.coverDesignDescription")}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCoverSelector(!showCoverSelector)}
                  >
                    {showCoverSelector ? t("profile.hideOptions") : t("profile.chooseCover")}
                  </Button>
                </div>
                
                {/* Collapsible Template Selector */}
                {showCoverSelector && (
                  <div className="border-t pt-4">
                    <CoverTemplateSelector
                      selectedTemplate={selectedCoverTemplate}
                      onTemplateSelect={setSelectedCoverTemplate}
                    />
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleUpdateProfile}>
              <div className="space-y-6">
                {/* Personal Information */}
                <div className="bg-background rounded-lg p-8">
                  <h2 className="text-lg font-semibold mb-6">{t("profile.personalInformation")}</h2>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="firstName" className="text-xs text-black">{t("profile.firstName")}</Label>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <HelpCircle className="h-4 w-4 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{t("profile.hints.firstName")}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <Input
                          id="firstName"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          required
                          className="rounded-lg text-xs border-brand-green focus-visible:border-none focus-visible:ring-0 focus-visible:ring-brand-green focus-visible:outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="lastName" className="text-xs text-black">{t("profile.lastName")}</Label>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <HelpCircle className="h-4 w-4 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{t("profile.hints.lastName")}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required className="rounded-lg text-xs border-brand-green focus-visible:border-none focus-visible:ring-0 focus-visible:ring-brand-green focus-visible:outline-none" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="email" className="text-xs text-black">{t("profile.email")}</Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <HelpCircle className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{t("profile.hints.email")}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-lg text-xs border-brand-green focus-visible:border-none focus-visible:ring-0 focus-visible:ring-brand-green focus-visible:outline-none"/>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="phone" className="text-xs text-black">{t("profile.phone")}</Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <HelpCircle className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{t("profile.hints.phone")}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="rounded-lg text-xs border-brand-green focus-visible:border-none focus-visible:ring-0 focus-visible:ring-brand-green focus-visible:outline-none" />
                    </div>
                    </div>

                    {/* New Location Input Component */}
                    
                    <LocationInput
                      value={location}
                      onChange={handleLocationChange}
                      label={t("profile.location")}
                      placeholder={t("profile.locationPlaceholder")}
                      required={false}
                      showRadius={profile.user_type === "freelancer"}
                      radiusValue={serviceRadius}
                      onRadiusChange={setServiceRadius}
                      className="rounded-lg text-xs border-brand-green focus-visible:border-none focus-visible:ring-0 focus-visible:ring-brand-green focus-visible:outline-none"
                    />

                    {profile.user_type === "freelancer" && locationCoords && locationCoords.lat && locationCoords.lng && (
                      <div className="text-sm text-muted-foreground">
                        <p>
                          {t("profile.locationVerified")}
                        </p>
                      </div>
                    )}

                    {profile.user_type === "freelancer" && (
                      <div className="space-y-2">
                        <Label htmlFor="role" className="text-xs text-black">{t("profile.professionalTitle")}</Label>
                        <Input
                          id="role"
                          placeholder={t("profile.professionalTitlePlaceholder")}
                          value={(profile.metadata as { role?: string })?.role || ""}
                          onChange={(e) => {
                            const updatedMetadata = { ...(profile.metadata as object), role: e.target.value }
                            // Note: Profile will be updated when form is submitted
                          }}
                          className="rounded-lg text-xs border-brand-green focus-visible:border-none focus-visible:ring-0 focus-visible:ring-brand-green focus-visible:outline-none"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Bio */}
                <div className="bg-background rounded-lg shadow-sm border p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold">{t("profile.bio")}</h2>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-sm">
                          <p>{t("profile.hints.bio")}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="space-y-4">
                    <Textarea
                      id="bio"
                      placeholder={t("profile.bioPlaceholder")}
                      rows={6}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="resize-none rounded-lg text-xs border-brand-green focus-visible:border-none focus-visible:ring-0 focus-visible:ring-brand-green focus-visible:outline-none"
                    />
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <div className="space-y-1">
                        <p>{t("profile.hints.bioTips")}</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>{t("profile.hints.bioTip1")}</li>
                          <li>{t("profile.hints.bioTip2")}</li>
                          <li>{t("profile.hints.bioTip3")}</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Professional Information (for freelancers) */}
                {profile.user_type === "freelancer" && (
                  <>
                    <div className="bg-background rounded-lg shadow-sm border p-8">
                      <h2 className="text-xl font-semibold mb-6">{t("profile.professionalInformation")}</h2>

                      <div className="space-y-6">
                        <div className="space-y-2">
                          <Label htmlFor="hourlyRate">{t("profile.defaultHourlyRate")}</Label>
                          <div className="relative">
                            <ReceiptEuro className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="hourlyRate"
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder={t("profile.defaultHourlyRatePlaceholder")}
                              value={hourlyRate}
                              onChange={(e) => setHourlyRate(e.target.value)}
                              className="pl-10 rounded-lg text-xs border-brand-green focus-visible:border-none focus-visible:ring-0 focus-visible:ring-brand-green focus-visible:outline-none"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {t("profile.defaultHourlyRateDescription")}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-background rounded-lg shadow-sm border p-8">
                      <h2 className="text-xl font-semibold mb-6">{t("profile.jobOfferings")}</h2>
                      <p className="text-muted-foreground mb-6">
                        {t("profile.jobOfferingsDescription")}
                      </p>
                      <Link href="/job-offerings">
                        <Button>
                          <Briefcase className="h-4 w-4 mr-2" />
                          {t("profile.manageJobOfferings")}
                        </Button>
                      </Link>
                    </div>

                    {/* Terms and Conditions Management */}
                    <div className="bg-background rounded-lg shadow-sm border p-8">
                      <TermsAndConditionsManager freelancerId={profile.id} />
                    </div>
                  </>
                )}

                <div className="flex justify-end">
                  <Button type="submit" size="lg" disabled={updating}>
                    {updating ? (
                      <>
                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                        {t("profile.saving")}
                      </>
                    ) : (
                      t("profile.saveChanges")
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>
          </SidebarInset>
        </div>
    </SidebarProvider>
  )
}

function calculateProfileCompleteness(profile: Profile | null): number {
  if (!profile) return 0

  const fields = [
    profile.first_name,
    profile.last_name,
    profile.email,
    profile.phone,
    profile.bio,
    profile.location,
    profile.avatar_url,
  ]

  // Add freelancer-specific fields
  if (profile.user_type === 'freelancer') {
    fields.push(
      profile.hourly_rate?.toString() || null,
      (profile.metadata as any)?.role || null,
      profile.latitude?.toString() || null,
      profile.longitude?.toString() || null
    )
  }

  const completedFields = fields.filter(field => field && field.toString().trim() !== '').length
  return Math.round((completedFields / fields.length) * 100)
}

function getCompletenessMessage(percentage: number, t: (key: string) => string): string {
  if (percentage >= 90) return t("profile.completeness.complete")
  if (percentage >= 70) return t("profile.completeness.good")
  if (percentage >= 40) return t("profile.completeness.partial")
  return t("profile.completeness.needsInfo")
}

