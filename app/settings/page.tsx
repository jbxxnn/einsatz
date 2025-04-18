"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useOptimizedSupabase } from "@/components/optimized-supabase-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, CreditCard } from "lucide-react"
import type { Database } from "@/lib/database.types"
import LoadingSpinner from "@/components/loading-spinner"
import SidebarNav from "@/components/sidebar-nav"
import { toast } from "@/lib/toast"

export default function SettingsPage() {
  const router = useRouter()
  const { supabase } = useOptimizedSupabase()
  const [profile, setProfile] = useState<Database["public"]["Tables"]["profiles"]["Row"] | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
  })

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true)

      try {
        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push("/login")
          return
        }

        // Get profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()

        if (profileError) {
          throw profileError
        }

        setProfile(profileData)

        // Load notification settings from metadata if available
        if (profileData.metadata && typeof profileData.metadata === "object" && profileData.metadata.notifications) {
          setNotifications({
            ...notifications,
            ...profileData.metadata.notifications,
          })
        }
      } catch (error) {
        console.error("Error fetching profile:", error)
        toast.error("Failed to load settings")
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [supabase, router, toast])

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match")
      return
    }

    setSaving(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) throw error

      toast.success("Your password has been updated")

      // Clear form
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error: any) {
      toast.error(error.message || "Failed to update password")
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateNotifications = async () => {
    if (!profile) return

    setSaving(true)

    try {
      // Update profile metadata with notification settings
      const metadata = {
        ...(typeof profile.metadata === 'object' && profile.metadata !== null ? profile.metadata : {}),
        notifications: notifications,
      }

      const { error } = await supabase.from("profiles").update({ metadata }).eq("id", profile.id)

      if (error) throw error

      toast.success("Notification settings updated")

      // Update local state
      setProfile({
        ...profile,
        metadata,
      })
    } catch (error: any) {
      toast.error(error.message || "Failed to update notification settings")
    } finally {
      setSaving(false)
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
            <SidebarNav profile={profile} />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">Settings</h1>
            </div>

            <Tabs defaultValue="account">
              <TabsList className="mb-6">
                <TabsTrigger value="account">Account</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
                {profile.user_type === "freelancer" && <TabsTrigger value="payments">Payment Methods</TabsTrigger>}
              </TabsList>

              <TabsContent value="account" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Account Information</CardTitle>
                    <CardDescription>Manage your account details and email address</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input id="email" value={profile.email} disabled />
                      <p className="text-sm text-muted-foreground">
                        To change your email address, please contact support.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Delete Account</CardTitle>
                    <CardDescription>Permanently delete your account and all associated data</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Once you delete your account, there is no going back. This action cannot be undone.
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button variant="destructive">Delete Account</Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              <TabsContent value="notifications" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Email Notifications</CardTitle>
                    <CardDescription>Manage which emails you receive from us</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="booking-notifications">Booking Updates</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive emails about your booking status changes
                        </p>
                      </div>
                      <Switch
                        id="booking-notifications"
                        checked={notifications.email}
                        onCheckedChange={(checked) =>
                          setNotifications({ ...notifications, email: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="message-notifications">Messages</Label>
                        <p className="text-sm text-muted-foreground">Receive emails when you get new messages</p>
                      </div>
                      <Switch
                        id="message-notifications"
                        checked={notifications.push}
                        onCheckedChange={(checked) =>
                          setNotifications({ ...notifications, push: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="payment-notifications">Payment Updates</Label>
                        <p className="text-sm text-muted-foreground">Receive emails about payment status changes</p>
                      </div>
                      <Switch
                        id="payment-notifications"
                        checked={notifications.sms}
                        onCheckedChange={(checked) =>
                          setNotifications({ ...notifications, sms: checked })
                        }
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button onClick={handleUpdateNotifications} disabled={saving}>
                      {saving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              <TabsContent value="security" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Change Password</CardTitle>
                    <CardDescription>Update your password to keep your account secure</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleUpdatePassword} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="current-password">Current Password</Label>
                        <Input
                          id="current-password"
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input
                          id="new-password"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                        <Input
                          id="confirm-password"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                        />
                      </div>
                      <Button type="submit" disabled={saving}>
                        {saving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          "Update Password"
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Two-Factor Authentication</CardTitle>
                    <CardDescription>Add an extra layer of security to your account</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Two-Factor Authentication</Label>
                        <p className="text-sm text-muted-foreground">
                          Protect your account with an additional security layer
                        </p>
                      </div>
                      <Button variant="outline">Set Up</Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {profile.user_type === "freelancer" && (
                <TabsContent value="payments" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Payment Methods</CardTitle>
                      <CardDescription>Manage how you receive payments for your services</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="bg-muted p-2 rounded-md">
                            <CreditCard className="h-6 w-6" />
                          </div>
                          <div>
                            <p className="font-medium">Bank Account</p>
                            <p className="text-sm text-muted-foreground">
                              Connect your bank account to receive payments
                            </p>
                          </div>
                        </div>
                        <Button variant="outline">Connect</Button>
                      </div>
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="bg-muted p-2 rounded-md">
                            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path
                                d="M19 14V6M19 14C19 15.1046 18.1046 16 17 16H3C1.89543 16 1 15.1046 1 14V6C1 4.89543 1.89543 4 3 4H17C18.1046 4 19 4.89543 19 6M19 14V22M23 10H19M15 10H9"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium">PayPal</p>
                            <p className="text-sm text-muted-foreground">
                              Connect your PayPal account for faster payments
                            </p>
                          </div>
                        </div>
                        <Button variant="outline">Connect</Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Payout Settings</CardTitle>
                      <CardDescription>Configure how and when you receive your payments</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="payout-threshold">Payout Threshold</Label>
                        <Input id="payout-threshold" type="number" placeholder="50.00" />
                        <p className="text-sm text-muted-foreground">
                          Minimum amount required before automatic payout (in €)
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="payout-frequency">Payout Frequency</Label>
                        <select id="payout-frequency" className="w-full p-2 border rounded-md" title="Payout Frequency">
                          <option value="weekly">Weekly</option>
                          <option value="biweekly">Bi-weekly</option>
                          <option value="monthly">Monthly</option>
                        </select>
                        <p className="text-sm text-muted-foreground">How often you want to receive your payments</p>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button>Save Payout Settings</Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
              )}
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}

