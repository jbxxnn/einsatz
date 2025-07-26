"use client"

import React, { useState, useEffect } from "react"
import { useOptimizedUser } from "@/components/optimized-user-provider"
import { useOptimizedSupabase } from "@/components/optimized-supabase-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/lib/toast"
import { Skeleton } from "@/components/ui/skeleton"
import { useTranslation } from "@/lib/i18n"
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarInset
} from "@/components/ui/sidebar"
import ModernSidebarNav from "@/components/modern-sidebar-nav"
import OptimizedHeader from "@/components/optimized-header"

// Skeleton for immediate loading
function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex gap-4">
          <div className="h-8 w-32 bg-muted rounded animate-pulse" />
          <div className="h-8 w-32 bg-muted rounded animate-pulse" />
        </div>
        <div className="h-4 w-48 bg-muted rounded animate-pulse mt-2" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="h-[400px] w-full bg-muted rounded animate-pulse" />
        <div className="h-[400px] w-full bg-muted rounded animate-pulse" />
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const { t } = useTranslation()
  const { profile, isLoading, isProfileLoading } = useOptimizedUser()
  const { supabase } = useOptimizedSupabase()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [saving, setSaving] = useState(false)
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
  })

  // Load notification settings from profile metadata
  useEffect(() => {
    if (profile?.metadata && typeof profile.metadata === "object" && (profile.metadata as any).notifications) {
      setNotifications({
        ...notifications,
        ...(profile.metadata as any).notifications,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile])

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      toast.error(t("dashboard.settings.newPasswordsDoNotMatch"))
      return
    }

    setSaving(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) throw error

      toast.success(t("dashboard.settings.passwordUpdated"))

      // Clear form
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error: any) {
      toast.error(error.message || t("dashboard.settings.failedToUpdatePassword"))
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

      toast.success(t("dashboard.settings.notificationSettingsUpdated"))

      // Update local state
      setNotifications({
        ...notifications,
        ...metadata.notifications,
      })
    } catch (error: any) {
      toast.error(error.message || t("dashboard.settings.failedToUpdateNotificationSettings"))
    } finally {
      setSaving(false)
    }
  }

  if (isLoading || isProfileLoading) {
    return (
      <SidebarProvider className="w-full">
        <div className="flex min-h-screen bg-muted/30 w-full">
          <Sidebar>
            {/* Show minimal sidebar during loading */}
            <div className="p-4">
              <div className="h-8 w-8 rounded-lg bg-muted animate-pulse" />
            </div>
          </Sidebar>
          <SidebarInset className="w-full">
            <OptimizedHeader />
            <div className="p-6">
              <SettingsSkeleton />
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    )
  }

  if (!profile) {
    return (
      <div className="container py-10 text-center">
        <h1 className="text-2xl font-bold mb-4">Profile not found</h1>
        <Button onClick={() => window.location.href = "/"}>Go to Home</Button>
      </div>
    )
  }

  return (
    <SidebarProvider className="w-full">
      <div className="flex min-h-screen bg-muted/30 w-full">
        <Sidebar>
          {profile && <ModernSidebarNav profile={profile} />}
        </Sidebar>
        <SidebarInset className="w-full">
          <OptimizedHeader />
          <div className="lg:col-span-3 space-y-6 p-6 pb-20 bg-[#f7f7f7] h-full">
            <div className="flex flex-1 flex-col gap-6 p-6 pt-0">
              <Tabs defaultValue="account" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="account">Account</TabsTrigger>
                  <TabsTrigger value="notifications">Notifications</TabsTrigger>
                  <TabsTrigger value="security">Security</TabsTrigger>
                  {profile.user_type === "freelancer" && <TabsTrigger value="payments">Payment Methods</TabsTrigger>}
                </TabsList>
                <TabsContent value="account" className="space-y-4">
                  <div className="p-6 bg-background rounded-lg overflow-hidden">
                    <div className="flex flex-col items-center justify-center mb-4">
                      <div className="text-lg font-medium text-black">
                        Account Information
                      </div>
                      <div className="text-xs text-black">
                        Update your account information and preferences.
                      </div>
                    </div>
                    <div className="space-y-4 mt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name</Label>
                          <Input id="firstName" value={profile.first_name || ""} disabled />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input id="lastName" value={profile.last_name || ""} disabled />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" value={profile.email || ""} disabled />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="userType">User Type</Label>
                        <Input id="userType" value={profile.user_type || ""} disabled />
                      </div>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="notifications" className="space-y-4">
                  <div className="p-6 bg-background rounded-lg overflow-hidden">
                    <div className="flex flex-col items-center justify-center mb-4">
                      <div className="text-lg font-medium text-black">
                        Notification Preferences
                      </div>
                      <div className="text-xs text-black">
                        Choose how you want to receive notifications.
                      </div>
                    </div>
                    <div className="flex flex-col items-center justify-center mt-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Email Notifications</Label>
                          <p className="text-sm text-muted-foreground">
                            Receive notifications via email
                          </p>
                        </div>
                        <Switch
                          checked={notifications.email}
                          onCheckedChange={(checked) =>
                            setNotifications({ ...notifications, email: checked })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Push Notifications</Label>
                          <p className="text-sm text-muted-foreground">
                            Receive push notifications in your browser
                          </p>
                        </div>
                        <Switch
                          checked={notifications.push}
                          onCheckedChange={(checked) =>
                            setNotifications({ ...notifications, push: checked })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>SMS Notifications</Label>
                          <p className="text-sm text-muted-foreground">
                            Receive notifications via SMS
                          </p>
                        </div>
                        <Switch
                          checked={notifications.sms}
                          onCheckedChange={(checked) =>
                            setNotifications({ ...notifications, sms: checked })
                          }
                        />
                      </div>
                      <Button onClick={handleUpdateNotifications} disabled={saving}>
                        {saving ? "Saving..." : "Save Notification Settings"}
                      </Button>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="security" className="space-y-4">
                    <div className="p-6 bg-background rounded-lg overflow-hidden">
                    <div className="flex flex-col items-center justify-center mb-4">
                      <div className="text-lg font-medium text-black">
                        Change Password
                      </div>
                      <div className="text-xs text-black">
                        Update your password to keep your account secure.
                      </div>
                    </div>
                    <div className="flex flex-col items-center justify-center mt-4">
                      <form onSubmit={handleUpdatePassword} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="currentPassword">Current Password</Label>
                          <Input
                            id="currentPassword"
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="newPassword">New Password</Label>
                          <Input
                            id="newPassword"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword">Confirm New Password</Label>
                          <Input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                          />
                        </div>
                        <Button type="submit" disabled={saving}>
                          {saving ? "Updating..." : "Update Password"}
                        </Button>
                      </form>
                    </div>
                  </div>
                </TabsContent>
                {profile.user_type === "freelancer" && (
                  <TabsContent value="payments" className="space-y-4">
                    <div className="p-6 bg-background rounded-lg overflow-hidden">
                      <div className="flex flex-col items-center justify-center mb-4">
                        <div className="text-lg font-medium text-black">
                          Payment Methods
                        </div>
                        <div className="text-xs text-black">
                          Manage your payment methods for receiving payments.
                        </div>
                      </div>
                      <div className="flex flex-col items-center justify-center mt-4 space-y-4">
                        <p className="text-muted-foreground">
                          Payment method management will be available soon.
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                )}
              </Tabs>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}

