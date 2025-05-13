"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useOptimizedUser } from "./optimized-user-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useOptimizedSupabase } from "./optimized-supabase-provider"
import { useRouter } from "next/navigation"
import { toast } from "@/lib/toast"
import LoadingSpinner from "./loading-spinner"
import { Suspense } from "react"
import LanguageSwitcher from "@/components/language-switcher"
import { useTranslation } from "@/lib/i18n"

// Non-authenticated navigation links - always visible
function PublicNavLinks() {
  const { t } = useTranslation()
  const pathname = usePathname()
  const { userType } = useOptimizedUser()

  // Don't show Find Freelancers link for freelancers
  if (userType === "freelancer") {
    return null
  }

  return (
    <nav className="hidden gap-6 md:flex">
      <Link
        href="/freelancers"
        className={`text-sm font-medium transition-colors hover:text-primary ${
          pathname === "/freelancers" ? "text-primary" : "text-muted-foreground"
        }`}
      >
        {t("header.findFreelancers")}
      </Link>
    </nav>
  )
}

// Auth-dependent navigation links - only visible when authenticated
function AuthNavLinks() {
  const { t } = useTranslation()
  const pathname = usePathname()
  const { user, isLoading } = useOptimizedUser()

  if (isLoading || !user) return null

  return (
    <>
      <Link
        href="/dashboard"
        className={`text-sm font-medium transition-colors hover:text-primary ${
          pathname === "/dashboard" ? "text-primary" : "text-muted-foreground"
        }`}
      >
        {t("header.dashboard")}
      </Link>
      <Link
        href="/bookings"
        className={`text-sm font-medium transition-colors hover:text-primary ${
          pathname === "/bookings" ? "text-primary" : "text-muted-foreground"
        }`}
      >
        {t("header.bookings")}
      </Link>
      <Link
        href="/messages"
        className={`text-sm font-medium transition-colors hover:text-primary ${
          pathname === "/messages" ? "text-primary" : "text-muted-foreground"
        }`}
      >
        {t("header.messages")}
      </Link>
    </>
  )
}

// Login/Signup buttons - shown immediately when not authenticated
function LoginButtons() {
  const { t } = useTranslation()
  return (
    <>
      <Link href="/login">
        <Button variant="ghost">{t("header.login")}</Button>
      </Link>
      <Link href="/register">
        <Button>{t("header.signup")}</Button>
      </Link>
    </>
  )
}

// User profile dropdown - shown when authenticated
function UserDropdown() {
  const { t } = useTranslation()
  const { user, profile } = useOptimizedUser()
  const { supabase } = useOptimizedSupabase()
  const router = useRouter()

  if (!user) return null

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
    toast.success(t("header.signedOutSuccessfully"))
  }

  const getInitials = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase()
    }
    return user?.email?.substring(0, 2).toUpperCase() || "??"
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={profile?.avatar_url || ""} alt={profile?.first_name || "User"} />
            <AvatarFallback>{getInitials()}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {profile?.first_name} {profile?.last_name}
            </p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
        <Link href="/profile">{t("header.profile")}</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings">{t("header.settings")}</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>{t("header.signOut")}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Auth section with progressive rendering
function AuthSection() {
  const { t } = useTranslation()
  const { user, isLoading } = useOptimizedUser()

  // Show login buttons immediately if not authenticated
  if (!isLoading && !user) {
    return <LoginButtons />
  }

  // Show user dropdown if authenticated
  if (user) {
    return <UserDropdown />
  }

  // Show minimal loading state if still determining auth status
  return <LoadingSpinner size="small" />
}

export default function OptimizedHeader() {
  return (
    <header className="border-b">
      <div className="container flex h-16 items-center justify-between py-4">
        <div className="flex items-center gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold">Einsatz</span>
          </Link>
          <PublicNavLinks />
          <Suspense fallback={null}>
            <AuthNavLinks />
          </Suspense>
        </div>
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <Suspense fallback={<LoginButtons />}>
            <AuthSection />
          </Suspense>
        </div>
      </div>
    </header>
  )
}
