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

export default function Login() {
  const router = useRouter()
  const { supabase } = useOptimizedSupabase()
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }

      router.push("/dashboard")
      router.refresh()
    } catch (error: any) {
      console.error('Login error:', error)
      
      // Map Supabase errors to translated messages
      let errorMessage = t("login.errors.generic")
      
      if (error?.message) {
        const errorMsg = error.message.toLowerCase()
        
        // Check for specific error patterns
        if (errorMsg.includes('invalid login') || errorMsg.includes('invalid credentials') || errorMsg.includes('invalid email or password')) {
          errorMessage = t("login.errors.invalidCredentials")
        } else if (errorMsg.includes('email not confirmed') || errorMsg.includes('email not verified') || errorMsg.includes('email_not_confirmed')) {
          errorMessage = t("login.errors.emailNotVerified")
        } else if (errorMsg.includes('too many requests') || errorMsg.includes('rate limit')) {
          errorMessage = t("login.errors.tooManyRequests")
        } else if (errorMsg.includes('network') || errorMsg.includes('fetch') || errorMsg.includes('connection')) {
          errorMessage = t("login.errors.networkError")
        } else if (errorMsg.includes('invalid email') || errorMsg.includes('email format')) {
          errorMessage = t("login.errors.invalidEmail")
        } else if (errorMsg.includes('user not found') || errorMsg.includes('no user found')) {
          errorMessage = t("login.errors.userNotFound")
        } else {
          // For other errors, try to use a more user-friendly message
          errorMessage = error.message
        }
      }
      
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        throw error
      }
    } catch (error: any) {
      console.error('Google sign in error:', error)
      
      // Map Supabase errors to translated messages
      let errorMessage = t("login.errors.generic")
      
      if (error?.message) {
        const errorMsg = error.message.toLowerCase()
        
        // Check for specific error patterns
        if (errorMsg.includes('network') || errorMsg.includes('fetch') || errorMsg.includes('connection')) {
          errorMessage = t("login.errors.networkError")
        } else if (errorMsg.includes('popup') || errorMsg.includes('blocked')) {
          errorMessage = t("login.errors.generic")
        } else {
          errorMessage = error.message
        }
      }
      
      toast.error(errorMessage)
    }
  }

  return (
    <div className="container flex items-center justify-center py-10 md:py-20">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">{t("login.title")}</CardTitle>
          <CardDescription>{t("login.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("login.emailLabel")}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t("login.emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{t("login.passwordLabel")}</Label>
                <Link href="/reset-password" className="text-xs text-primary underline underline-offset-4">
                  {t("login.forgotPasswordLink")}
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder={t("login.passwordPlaceholder")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("login.loggingIn")}
                </>
              ) : (
                t("login.submit")
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
          <Button variant="outline" className="w-full" onClick={handleGoogleSignIn}>
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
        <CardFooter className="flex flex-col items-center">
          <p className="mt-2 text-center text-sm text-muted-foreground">
            {t("login.noAccount")}{" "}
            <Link href="/register" className="text-primary underline underline-offset-4">
              {t("login.registerLink")}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

