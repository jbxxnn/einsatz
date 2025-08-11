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
import MessagesNotificationBadge from "@/components/messages-notification-badge"



const CustomMessagesIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg 
  className={props.className}
  xmlns="http://www.w3.org/2000/svg" 
  width="24" 
  height="24" 
  viewBox="0 0 24 24" 
  fill="none">
    <path opacity=".4" d="M2 12.97V6.99C2 4.23 4.24 2 7 2h10c2.76 0 5 2.23 5 4.99v6.98c0 2.75-2.24 4.98-5 4.98h-1.5c-.31 0-.61.15-.8.4l-1.5 1.99c-.66.88-1.74.88-2.4 0l-1.5-1.99c-.16-.22-.52-.4-.8-.4H7c-2.76 0-5-2.23-5-4.98v-1Z" 
    fill="currentColor">
      </path>
      <path d="M12 12c-.56 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.44 1-1 1ZM16 12c-.56 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.44 1-1 1ZM8 12c-.56 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.44 1-1 1Z" 
      fill="currentColor">
        </path>
        </svg>
)

const CustomHomeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    className={props.className}
    {...props}
  >
    <path
      opacity=".4"
      d="m20.83 8.01-6.55-5.24C13 1.75 11 1.74 9.73 2.76L3.18 8.01c-.94.75-1.51 2.25-1.31 3.43l1.26 7.54C3.42 20.67 4.99 22 6.7 22h10.6c1.69 0 3.29-1.36 3.58-3.03l1.26-7.54c.18-1.17-.39-2.67-1.31-3.42Z"
      fill="currentColor"
    ></path>
    <path
      d="M12 18.75c-.41 0-.75-.34-.75-.75v-3c0-.41.34-.75.75-.75s.75.34.75.75v3c0 .41-.34.75-.75.75Z"
      fill="currentColor"
    ></path>
  </svg>
)

const CustomBookingsIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg 
  className={props.className}
  xmlns="http://www.w3.org/2000/svg" 
  width="18" 
  height="18" 
  viewBox="0 0 24 24" 
  fill="none">
    <path opacity=".4" d="M17.53 7.77a.739.739 0 0 0-.21 0 2.874 2.874 0 0 1-2.78-2.88C14.54 3.3 15.83 2 17.43 2c1.59 0 2.89 1.29 2.89 2.89a2.89 2.89 0 0 1-2.79 2.88ZM20.792 14.7c-1.12.75-2.69 1.03-4.14.84.38-.82.58-1.73.59-2.69 0-1-.22-1.95-.64-2.78 1.48-.2 3.05.08 4.18.83 1.58 1.04 1.58 2.75.01 3.8ZM6.438 7.77c.07-.01.14-.01.21 0a2.874 2.874 0 0 0 2.78-2.88C9.428 3.3 8.138 2 6.538 2c-1.59 0-2.89 1.29-2.89 2.89a2.89 2.89 0 0 0 2.79 2.88ZM6.551 12.85c0 .97.21 1.89.59 2.72-1.41.15-2.88-.15-3.96-.86-1.58-1.05-1.58-2.76 0-3.81 1.07-.72 2.58-1.01 4-.85-.41.84-.63 1.79-.63 2.8Z" 
    fill="currentColor"
    ></path>
    <path d="M12.12 15.87a1.13 1.13 0 0 0-.26 0 3.425 3.425 0 0 1-3.31-3.43c0-1.9 1.53-3.44 3.44-3.44 1.9 0 3.44 1.54 3.44 3.44 0 1.86-1.46 3.37-3.31 3.43ZM8.87 17.94c-1.51 1.01-1.51 2.67 0 3.67 1.72 1.15 4.54 1.15 6.26 0 1.51-1.01 1.51-2.67 0-3.67-1.71-1.15-4.53-1.15-6.26 0Z" 
    fill="currentColor">
      </path>
      </svg>
)

// Non-authenticated navigation links - always visible
function PublicNavLinks() {
  const { t } = useTranslation()
  const pathname = usePathname()
  const { userType, isLoading, isProfileLoading } = useOptimizedUser()

  // Don't show anything while loading
  if (isLoading || isProfileLoading) {
    return null
  }

  // Don't show Find Freelancers link for freelancers
  if (userType === "freelancer") {
    return null
  }

  return (
    <nav className="hidden gap-6 md:flex">
      <Link
        href="/freelancers"
        className={`flex items-center gap-1 text-xs font-medium transition-colors hover:text-[#33CC99] ${
          pathname === "/freelancers" ? "text-[#33CC99]" : "text-black"
        }`}
      >
        <CustomBookingsIcon className="h-4 w-4 mr-2" />
        {t("header.findFreelancers")}
      </Link>
    </nav>
  )
}

// Auth-dependent navigation links - only visible when authenticated
function AuthNavLinks() {
  const { t } = useTranslation()
  const pathname = usePathname()
  const { user, isLoading, isProfileLoading } = useOptimizedUser()

  if (isLoading || isProfileLoading || !user) return null

  return (
    <>
      <Link
        href="/dashboard"
        className={`flex items-center text-xs font-medium transition-colors hover:text-[#33CC99] ${
          pathname === "/dashboard" ? "text-[#33CC99]" : "text-black"
        }`}
      >
        <CustomHomeIcon className="h-4 w-4 mr-2" />
        {t("header.dashboard")}
      </Link>
      <Link
        href="/messages"
          className={`flex items-center text-xs font-medium transition-colors hover:text-[#33CC99] ${
          pathname === "/messages" ? "text-[#33CC99]" : "text-black"
        }`}
      >
        <div className="relative">
          <CustomMessagesIcon className="h-4 w-4 mr-2" />
          <MessagesNotificationBadge />
        </div>
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
  const { user, isLoading, isProfileLoading } = useOptimizedUser()

  // Don't show anything while loading
  if (isLoading || isProfileLoading) {
    return <LoadingSpinner size="small" />
  }

  // Show login buttons if not authenticated
  if (!user) {
    return <LoginButtons />
  }

  // Show user dropdown if authenticated
    return <UserDropdown />
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
