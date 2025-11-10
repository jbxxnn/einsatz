"use client"

import type React from "react"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useOptimizedSupabase } from "@/components/optimized-supabase-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/lib/toast"
import { useTranslation } from "@/lib/i18n"
import Link from "next/link"
import { Loader2 } from "lucide-react"

export default function Register() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultType = searchParams.get("type") || "client"
  const { supabase } = useOptimizedSupabase()
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [userType, setUserType] = useState<"client" | "freelancer">(
    defaultType === "freelancer" ? "freelancer" : "client",
  )

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      console.log('Starting signup process...')
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            user_type: userType,
          },
        },
      })

      if (error) {
        console.error('Signup error:', error)
        throw error
      }

      if (data.user) {
        console.log('User created successfully:', data.user.id)
        
        // Wait a moment to allow the database trigger to complete
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Verify the profile was created
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()

        if (profileError) {
          console.error('Error checking profile:', profileError)
          throw profileError
        }

        console.log('Profile status:', profile ? 'Found' : 'Not found')

        toast.success(t("register.toastSuccess"))
        toast.info(t("register.toastVerification"))
        
        // Clear the form
        setEmail("")
        setPassword("")
        setFirstName("")
        setLastName("")
        
        // Don't redirect, let them stay on the page to read the verification message
      }
    } catch (error: any) {
      console.error('Registration error:', error)
      toast.error(error.message || t("register.errors.generic"))
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            user_type: userType,
          },
        },
      })

      if (error) {
        throw error
      }
    } catch (error: any) {
      toast.error(error.message || t("register.errors.generic"))
    }
  }

  return (
    <div className="container flex items-center justify-center py-10 md:py-20">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">{t("register.title")}</CardTitle>
          <CardDescription>{t("register.description")}</CardDescription>
        </CardHeader>
        <Tabs defaultValue={userType} onValueChange={(value) => setUserType(value as "client" | "freelancer")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="client">{t("register.tabClient")}</TabsTrigger>
            <TabsTrigger value="freelancer">{t("register.tabFreelancer")}</TabsTrigger>
          </TabsList>
          <TabsContent value="client">
            <CardContent className="space-y-4 pt-4">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">{t("register.firstNameLabel")}</Label>
                    <Input
                      id="firstName"
                      placeholder={t("register.firstNamePlaceholder")}
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">{t("register.lastNameLabel")}</Label>
                    <Input
                      id="lastName"
                      placeholder={t("register.lastNamePlaceholder")}
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t("register.emailLabel")}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={t("register.emailPlaceholder")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">{t("register.passwordLabel")}</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder={t("register.passwordPlaceholder")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("register.creatingAccount")}
                    </>
                  ) : (
                    t("register.signUp")
                  )}
                </Button>
              </form>
              {/* <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>
              <Button variant="outline" className="w-full" onClick={handleGoogleSignUp}>
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                  <path d="M1 1h22v22H1z" fill="none" />
                </svg>
                Google
              </Button> */}
            </CardContent>
          </TabsContent>
          <TabsContent value="freelancer">
            <CardContent className="space-y-4 pt-4">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">{t("register.firstNameLabel")}</Label>
                    <Input
                      id="firstName"
                      placeholder={t("register.firstNamePlaceholder")}
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">{t("register.lastNameLabel")}</Label>
                    <Input
                      id="lastName"
                      placeholder={t("register.lastNamePlaceholder")}
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t("register.emailLabel")}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={t("register.emailPlaceholder")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">{t("register.passwordLabel")}</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder={t("register.passwordPlaceholder")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("register.creatingAccount")}
                    </>
                  ) : (
                    t("register.signUp")
                  )}
                </Button>
              </form>
              {/* <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>
              <Button variant="outline" className="w-full" onClick={handleGoogleSignUp}>
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                  <path d="M1 1h22v22H1z" fill="none" />
                </svg>
                Google
              </Button> */}
            </CardContent>
          </TabsContent>
        </Tabs>
        <CardFooter className="flex flex-col items-center">
          <p className="mt-2 text-center text-sm text-muted-foreground">
            {t("register.alreadyHaveAccount")}{" "}
            <Link href="/login" className="text-primary underline underline-offset-4">
              {t("register.loginLink")}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

