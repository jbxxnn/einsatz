"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useOptimizedSupabase } from "@/components/optimized-supabase-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  User,
  Briefcase,
  Clock,
  DollarSign,
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
  // Discord,
  Slack,
  // Skype,
  // Zoom,
  // Whatsapp,
  // Telegram,
  Signal,
  // Keybase,
  // Matrix,
  // Element,
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
  Loader2,
  Pencil,
  Upload,
  LogOut,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import type { Database } from "@/lib/database.types"
import { LocationInput } from "@/components/location-input"
import { AvatarUpload } from "@/components/avatar-upload"
import { toast } from "@/lib/toast"
import LoadingSpinner from "@/components/loading-spinner"
import SidebarNav from "@/components/sidebar-nav"
import { useTranslation } from "@/lib/i18n"
// import { LocationSearch } from "@/components/location-search"
// import { JobCategorySelector } from "@/components/job-category-selector"
// import { JobSubcategorySelector } from "@/components/job-subcategory-selector"
// import { AvailabilityCalendar } from "@/components/availability-calendar"
// import { AvailabilitySchedule } from "@/components/availability-schedule"
// import { LoadingSpinner } from "@/components/loading-spinner"
// import { SidebarNav } from "@/components/sidebar-nav"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]

export default function ProfilePage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { supabase } = useOptimizedSupabase()
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
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
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login")
        return
      }

      const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

      if (error) {
        console.error("Error fetching profile:", error)
        toast.error(t("profile.error"))
      } else if (data) {
        setProfile(data)
        setFirstName(data.first_name || "")
        setLastName(data.last_name || "")
        setEmail(data.email || "")
        setPhone(data.phone || "")
        setBio(data.bio || "")
        setLocation(data.location || "")
        setHourlyRate(data.hourly_rate?.toString() || "")
        setAvatarUrl(data.avatar_url)
        setServiceRadius(data.service_radius || 10)

        // Set coordinates if available
        setLocationCoords({
          lat: data.latitude || null,
          lng: data.longitude || null,
          formattedAddress: data.formatted_address || null,
        })

        // Extract social links from metadata if available
        if (data.metadata && typeof data.metadata === "object") {
          const metadata = data.metadata as any
          setSocialLinks({
            website: metadata.website || "",
            linkedin: metadata.linkedin || "",
            twitter: metadata.twitter || "",
            instagram: metadata.instagram || "",
          })
        }
      }

      setLoading(false)
    }

    fetchProfile()
  }, [supabase, router, toast])

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
        },
        // Add location data
        latitude: locationCoords?.lat,
        longitude: locationCoords?.lng,
        formatted_address: locationCoords?.formattedAddress,
        service_radius: profile?.user_type === 'freelancer' ? serviceRadius : null,
      }

      const { error } = await supabase.from('profiles').update(updates).eq('id', user.id)
      console.log('Profile updated')

      if (error) throw error

      toast.success(t("profile.updateSuccess"))

      // Update local state
      setProfile({
        ...profile!,
        ...updates,
      } as Profile)
    } catch (error: any) {
      console.error('Error updating profile:', error)
      toast.error(error.message || t("profile.updateError"))
    } finally {
      setUpdating(false)
      console.log('Update finished')
    }
  }

  if (loading) {
    return (
      <div className="container py-10 flex justify-center items-center min-h-[50vh]">
        <LoadingSpinner />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="container py-10 text-center">
        <h1 className="text-2xl font-bold mb-4">{t("profile.profileNotFound")}</h1>
        <Button onClick={() => router.push("/")}>{t("dashboard.goToHome")}</Button>
      </div>
    )
  }

  return (
    <div className="bg-muted/30 min-h-screen">
      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <SidebarNav profile={profile} />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">{t("profile.title")}</h1>
              {profile.user_type === "freelancer" && (
                <Link href={`/freelancers/${profile.id}`}>
                  <Button variant="outline">{t("profile.previewProfile")}</Button>
                </Link>
              )}
            </div>

            <div className="bg-background rounded-lg shadow-sm border overflow-hidden">
              {/* Banner and Photo */}
              <div className="relative">
                <div className="h-40 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400"></div>
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
                      className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1 shadow-sm"
                      title="Edit Avatar"
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
                      title="Edit"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-16 px-8 pb-8">
                <h2 className="text-xl font-semibold mb-6">{t("profile.yourPhoto")}</h2>
                <p className="text-sm text-muted-foreground mb-4">{t("profile.yourPhotoDescription")}</p>
                <div className="flex gap-3">
                  <Button type="button" variant="outline" size="sm" onClick={handleAvatarClick}>
                    <Upload className="h-4 w-4 mr-2" />
                    {t("profile.uploadNew")}
                  </Button>
                </div>
              </div>
            </div>

            <form onSubmit={handleUpdateProfile}>
              <div className="space-y-6">
                {/* Personal Information */}
                <div className="bg-background rounded-lg shadow-sm border p-8">
                  <h2 className="text-xl font-semibold mb-6">{t("profile.personalInformation")}</h2>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">{t("profile.firstName")}</Label>
                        <Input
                          id="firstName"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">{t("profile.lastName")}</Label>
                        <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">{t("profile.email")}</Label>
                      <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">{t("profile.phone")}</Label>
                      <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
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
                      className="space-y-2"
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
                        <Label htmlFor="role">{t("profile.professionalTitle")}</Label>
                        <Input
                          id="role"
                          placeholder={t("profile.professionalTitlePlaceholder")}
                          value={(profile.metadata as { role?: string })?.role || ""}
                          onChange={(e) => {
                            const updatedMetadata = { ...(profile.metadata as object), role: e.target.value }
                            setProfile({ ...profile, metadata: updatedMetadata })
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Bio */}
                <div className="bg-background rounded-lg shadow-sm border p-8">
                  <h2 className="text-xl font-semibold mb-6">{t("profile.bio")}</h2>
                  <div className="space-y-2">
                    <Textarea
                      id="bio"
                      placeholder={t("profile.bioPlaceholder")}
                      rows={6}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      {t("profile.bioDescription")}
                    </p>
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
                            <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="hourlyRate"
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder={t("profile.defaultHourlyRatePlaceholder")}
                              value={hourlyRate}
                              onChange={(e) => setHourlyRate(e.target.value)}
                              className="pl-10"
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
                  </>
                )}

                <div className="flex justify-end">
                  <Button type="submit" size="lg" disabled={updating}>
                    {updating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
        </div>
      </div>
    </div>
  )
}

