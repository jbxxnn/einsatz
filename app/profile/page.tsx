"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/supabase-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import {
  User,
  Briefcase,
  Clock,
  DollarSign,
  Calendar,
  Settings,
  CreditCard,
  Upload,
  Globe,
  Plus,
  X,
  Pencil,
  Loader2,
  LogOut,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import JobOfferingsManager from "@/components/job-offerings-manager"
import type { Database } from "@/lib/database.types"
import { LocationInput } from "@/components/location-input"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]

export default function ProfilePage() {
  const router = useRouter()
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [bio, setBio] = useState("")
  const [location, setLocation] = useState("")
  const [coordinates, setCoordinates] = useState<{
    lat: number | null
    lng: number | null
    formattedAddress: string | null
  }>({
    lat: null,
    lng: null,
    formattedAddress: null,
  })
  const [serviceRadius, setServiceRadius] = useState(10)
  const [hourlyRate, setHourlyRate] = useState("")
  const [skills, setSkills] = useState<string[]>([])
  const [newSkill, setNewSkill] = useState("")
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

  // Industry/interests options
  const industryOptions = [
    "UI Design",
    "UX Design",
    "Web Development",
    "Mobile Apps",
    "Graphic Design",
    "Marketing",
    "Writing",
    "Translation",
    "Video Editing",
    "Photography",
    "Music",
    "Voice Over",
    "Data Entry",
    "Virtual Assistant",
    "Customer Service",
    "Consulting",
  ]

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
        toast({
          title: "Error",
          description: "Could not load your profile. Please try again.",
          variant: "destructive",
        })
      } else if (data) {
        setProfile(data)
        setFirstName(data.first_name || "")
        setLastName(data.last_name || "")
        setBio(data.bio || "")
        setLocation(data.location || "")
        setHourlyRate(data.hourly_rate?.toString() || "")
        setSkills(data.skills || [])
        setAvatarUrl(data.avatar_url)
        setServiceRadius(data.service_radius || 10)

        // Set coordinates if available
        setCoordinates({
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

  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()])
      setNewSkill("")
    }
  }

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((skill) => skill !== skillToRemove))
  }

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
      setCoordinates({
        lat: coords.lat,
        lng: coords.lng,
        formattedAddress: coords.formattedAddress,
      })
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdating(true)

    try {
      // Upload avatar if changed
      const newAvatarUrl = await uploadAvatar()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error("User not found")

      const updates = {
        id: user.id,
        first_name: firstName,
        last_name: lastName,
        bio,
        location,
        hourly_rate: hourlyRate ? Number.parseFloat(hourlyRate) : null,
        skills,
        avatar_url: newAvatarUrl,
        updated_at: new Date().toISOString(),
        metadata: {
          ...(typeof profile?.metadata === 'object' && profile.metadata !== null ? profile.metadata : {}),
          ...socialLinks,
        },
        // Add location data
        latitude: coordinates.lat,
        longitude: coordinates.lng,
        formatted_address: coordinates.formattedAddress,
        service_radius: profile?.user_type === "freelancer" ? serviceRadius : null,
      }

      const { error } = await supabase.from("profiles").update(updates).eq("id", user.id)

      if (error) throw error

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      })

      // Update local state
      setProfile({
        ...profile!,
        ...updates,
      } as Profile)
    } catch (error: any) {
      console.error("Error updating profile:", error)
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="container py-10 flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="container py-10 text-center">
        <h1 className="text-2xl font-bold mb-4">Profile not found</h1>
        <Button onClick={() => router.push("/")}>Go to Home</Button>
      </div>
    )
  }

  return (
    <div className="bg-muted/30 min-h-screen">
      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-background rounded-lg shadow-sm border p-6 sticky top-20">
              <div className="flex flex-col items-center mb-6">
                <div className="relative h-20 w-20 rounded-full overflow-hidden mb-3">
                  <Image
                    src={avatarUrl || `/placeholder.svg?height=80&width=80&text=${firstName.charAt(0) || "U"}`}
                    alt={firstName || "User"}
                    fill
                    className="object-cover"
                  />
                </div>
                <h3 className="font-medium text-lg">
                  {firstName} {lastName}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {profile.user_type === "freelancer" ? "Freelancer" : "Client"}
                </p>
              </div>

              <nav className="space-y-1">
                <Link
                  href="/dashboard"
                  className="flex items-center p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                >
                  <Briefcase className="h-4 w-4 mr-3" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  href="/profile"
                  className="flex items-center p-2 rounded-md bg-primary/10 text-primary font-medium"
                >
                  <User className="h-4 w-4 mr-3" />
                  <span>My Profile</span>
                </Link>
                {profile.user_type === "freelancer" && (
                  <Link
                    href="/profile/availability"
                    className="flex items-center p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                  >
                    <Calendar className="h-4 w-4 mr-3" />
                    <span>Availability</span>
                  </Link>
                )}
                <Link
                  href="/bookings"
                  className="flex items-center p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                >
                  <Clock className="h-4 w-4 mr-3" />
                  <span>Bookings</span>
                </Link>
                <Link
                  href="/payments"
                  className="flex items-center p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                >
                  <CreditCard className="h-4 w-4 mr-3" />
                  <span>Payments</span>
                </Link>
                <Link
                  href="/settings"
                  className="flex items-center p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                >
                  <Settings className="h-4 w-4 mr-3" />
                  <span>Settings</span>
                </Link>
                <button
                  onClick={async () => {
                    await supabase.auth.signOut()
                    router.push("/")
                  }}
                  className="flex items-center p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground w-full text-left"
                >
                  <LogOut className="h-4 w-4 mr-3" />
                  <span>Logout</span>
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">Edit Profile</h1>
              {profile.user_type === "freelancer" && (
                <Link href={`/freelancers/${profile.id}`}>
                  <Button variant="outline">Preview Profile</Button>
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
                <h2 className="text-xl font-semibold mb-6">Your Photo</h2>
                <p className="text-sm text-muted-foreground mb-4">This will be displayed on your profile</p>
                <div className="flex gap-3">
                  <Button type="button" variant="outline" size="sm" onClick={handleAvatarClick}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload New
                  </Button>
                </div>
              </div>
            </div>

            <form onSubmit={handleUpdateProfile}>
              <div className="space-y-6">
                {/* Personal Information */}
                <div className="bg-background rounded-lg shadow-sm border p-8">
                  <h2 className="text-xl font-semibold mb-6">Personal Information</h2>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input id="email" type="email" value={profile.email} disabled />
                    </div>

                    {/* New Location Input Component */}
                    <LocationInput
                      value={location}
                      onChange={handleLocationChange}
                      label="Location"
                      placeholder="Enter your location"
                      required={false}
                      showRadius={profile.user_type === "freelancer"}
                      radiusValue={serviceRadius}
                      onRadiusChange={setServiceRadius}
                      className="space-y-2"
                    />

                    {profile.user_type === "freelancer" && coordinates.lat && coordinates.lng && (
                      <div className="text-sm text-muted-foreground">
                        <p>
                          Your location has been verified. Clients will be able to find you based on your location and
                          service radius.
                        </p>
                      </div>
                    )}

                    {profile.user_type === "freelancer" && (
                      <div className="space-y-2">
                        <Label htmlFor="role">Professional Title</Label>
                        <Input
                          id="role"
                          placeholder="e.g. Senior Product Designer"
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
                  <h2 className="text-xl font-semibold mb-6">Bio</h2>
                  <div className="space-y-2">
                    <Textarea
                      id="bio"
                      placeholder="Tell clients about yourself, your experience, and expertise..."
                      rows={6}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      A good bio helps clients understand your background and skills.
                    </p>
                  </div>
                </div>

                {/* Professional Information (for freelancers) */}
                {profile.user_type === "freelancer" && (
                  <>
                    <div className="bg-background rounded-lg shadow-sm border p-8">
                      <h2 className="text-xl font-semibold mb-6">Professional Information</h2>

                      <div className="space-y-6">
                        <div className="space-y-2">
                          <Label htmlFor="hourlyRate">Default Hourly Rate (€)</Label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="hourlyRate"
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="45.00"
                              value={hourlyRate}
                              onChange={(e) => setHourlyRate(e.target.value)}
                              className="pl-10"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            This is your default rate. You can set specific rates for each job category.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label>Industry/Interests</Label>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {industryOptions.map((industry) => {
                              const isSelected = skills.includes(industry)
                              return (
                                <Badge
                                  key={industry}
                                  variant={isSelected ? "default" : "outline"}
                                  className="cursor-pointer"
                                  onClick={() => {
                                    if (isSelected) {
                                      handleRemoveSkill(industry)
                                    } else {
                                      setSkills([...skills, industry])
                                    }
                                  }}
                                >
                                  {industry}
                                  {isSelected && <X className="ml-1 h-3 w-3" />}
                                </Badge>
                              )
                            })}
                          </div>
                          <div className="flex gap-2">
                            <Input
                              placeholder="Add a custom skill"
                              value={newSkill}
                              onChange={(e) => setNewSkill(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault()
                                  handleAddSkill()
                                }
                              }}
                            />
                            <Button type="button" onClick={handleAddSkill}>
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-background rounded-lg shadow-sm border p-8">
                      <h2 className="text-xl font-semibold mb-6">Social Media Accounts</h2>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="website">Personal Website</Label>
                          <div className="relative">
                            <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="website"
                              placeholder="https://yourwebsite.com"
                              value={socialLinks.website}
                              onChange={(e) => setSocialLinks({ ...socialLinks, website: e.target.value })}
                              className="pl-10"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="linkedin">LinkedIn</Label>
                          <div className="relative">
                            <svg
                              className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"
                              xmlns="http://www.w3.org/2000/svg"
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                              <rect x="2" y="9" width="4" height="12"></rect>
                              <circle cx="4" cy="4" r="2"></circle>
                            </svg>
                            <Input
                              id="linkedin"
                              placeholder="https://linkedin.com/in/username"
                              value={socialLinks.linkedin}
                              onChange={(e) => setSocialLinks({ ...socialLinks, linkedin: e.target.value })}
                              className="pl-10"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="twitter">Twitter</Label>
                          <div className="relative">
                            <svg
                              className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"
                              xmlns="http://www.w3.org/2000/svg"
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                            </svg>
                            <Input
                              id="twitter"
                              placeholder="https://twitter.com/username"
                              value={socialLinks.twitter}
                              onChange={(e) => setSocialLinks({ ...socialLinks, twitter: e.target.value })}
                              className="pl-10"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="instagram">Instagram</Label>
                          <div className="relative">
                            <svg
                              className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"
                              xmlns="http://www.w3.org/2000/svg"
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                            </svg>
                            <Input
                              id="instagram"
                              placeholder="https://instagram.com/username"
                              value={socialLinks.instagram}
                              onChange={(e) => setSocialLinks({ ...socialLinks, instagram: e.target.value })}
                              className="pl-10"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-background rounded-lg shadow-sm border p-8">
                      <h2 className="text-xl font-semibold mb-6">Job Offerings</h2>
                      <p className="text-muted-foreground mb-6">
                        Add job categories you offer and set your availability for each one.
                      </p>

                      <JobOfferingsManager freelancerId={profile.id} />
                    </div>
                  </>
                )}

                <div className="flex justify-end">
                  <Button type="submit" size="lg" disabled={updating}>
                    {updating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
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

