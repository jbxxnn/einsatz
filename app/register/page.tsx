"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useOptimizedSupabase } from "@/components/optimized-supabase-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/lib/toast"
import { useTranslation } from "@/lib/i18n"
import Link from "next/link"
import { Loader2 } from "lucide-react"

export default function Register() {
  const router = useRouter()
  const { supabase } = useOptimizedSupabase()
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const userType = "freelancer" as const

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
      
      // Map Supabase errors to translated messages
      let errorMessage = t("register.errors.generic")
      
      if (error?.message) {
        const errorMsg = error.message.toLowerCase()
        
        // Check for specific error patterns
        if (errorMsg.includes('already registered') || errorMsg.includes('user already registered') || errorMsg.includes('email address is already')) {
          errorMessage = t("register.errors.emailAlreadyRegistered")
        } else if (errorMsg.includes('invalid email') || errorMsg.includes('email format')) {
          errorMessage = t("register.errors.invalidEmail")
        } else if (errorMsg.includes('password') && (errorMsg.includes('weak') || errorMsg.includes('short') || errorMsg.includes('minimum'))) {
          errorMessage = t("register.errors.weakPassword")
        } else if (errorMsg.includes('network') || errorMsg.includes('fetch') || errorMsg.includes('connection')) {
          errorMessage = t("register.errors.networkError")
        } else if (errorMsg.includes('signup disabled') || errorMsg.includes('registration disabled')) {
          errorMessage = t("register.errors.signupDisabled")
        } else {
          // For other errors, try to use a more user-friendly message
          errorMessage = error.message
        }
      }
      
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container flex items-center justify-center py-10 md:py-20">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">{t("register.title")}</CardTitle>
          <CardDescription>{t("register.description")}</CardDescription>
        </CardHeader>
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
        </CardContent>
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

