"use client"

import { usePathname } from "next/navigation"
import { useOptimizedSupabase } from "./optimized-supabase-provider"
import { User, Briefcase, Calendar, Clock, CreditCard, Settings, LogOut, Home, Loader, TrendingUp, Sidebar, FileText } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import type { Database } from "@/lib/database.types"
import { useTranslation } from "@/lib/i18n"
import BookingRequestsNotificationBadge from "./booking-requests-notification-badge"
import MyBookingRequestsNotificationBadge from "./my-booking-requests-notification-badge"
import {
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]

interface ModernSidebarNavProps {
  profile: Profile | null
}

// Add the custom Home SVG as a React component
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

const CustomProfileIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg 
  className={props.className}
  xmlns="http://www.w3.org/2000/svg" 
  width="18" 
  height="18" 
  viewBox="0 0 24 24" 
  fill="none">
    <path opacity=".4" d="M12 2C9.38 2 7.25 4.13 7.25 6.75c0 2.57 2.01 4.65 4.63 4.74.08-.01.16-.01.22 0h.07a4.738 4.738 0 0 0 4.58-4.74C16.75 4.13 14.62 2 12 2Z" 
    fill="currentColor"
    ></path>
    <path d="M17.08 14.149c-2.79-1.86-7.34-1.86-10.15 0-1.27.85-1.97 2-1.97 3.23s.7 2.37 1.96 3.21c1.4.94 3.24 1.41 5.08 1.41 1.84 0 3.68-.47 5.08-1.41 1.26-.85 1.96-1.99 1.96-3.23-.01-1.23-.7-2.37-1.96-3.21Z" 
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

const CustomAvailabilityIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg 
  className={props.className}
  xmlns="http://www.w3.org/2000/svg" 
  width="18" 
  height="18" 
  viewBox="0 0 24 24" 
  fill="none">
    <path opacity=".4" d="M18 3H6C3.79 3 2 4.78 2 6.97v10.06C2 19.22 3.79 21 6 21h12c2.21 0 4-1.78 4-3.97V6.97C22 4.78 20.21 3 18 3Z" 
    fill="currentColor">
      </path>
      <path d="M19 8.75h-5c-.41 0-.75-.34-.75-.75s.34-.75.75-.75h5c.41 0 .75.34.75.75s-.34.75-.75.75ZM19 12.75h-4c-.41 0-.75-.34-.75-.75s.34-.75.75-.75h4c.41 0 .75.34.75.75s-.34.75-.75.75ZM19 16.75h-2c-.41 0-.75-.34-.75-.75s.34-.75.75-.75h2c.41 0 .75.34.75.75s-.34.75-.75.75ZM8.5 11.792a2.31 2.31 0 1 0 0-4.62 2.31 2.31 0 0 0 0 4.62ZM9.3 13.112a8.66 8.66 0 0 0-1.61 0c-1.68.16-3.03 1.49-3.19 3.17-.01.14.03.28.13.38.1.1.23.17.37.17h7c.14 0 .28-.06.37-.16.09-.1.14-.24.13-.38a3.55 3.55 0 0 0-3.2-3.18Z" 
      fill="currentColor">
        </path>
        </svg>
)

const CustomPaymentsIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg 
  className={props.className}
  xmlns="http://www.w3.org/2000/svg" 
  width="18" 
  height="18" 
  viewBox="0 0 24 24" 
  fill="none">
    <path opacity=".4" d="M19.3 7.92v5.15c0 3.08-1.76 4.4-4.4 4.4H6.11c-.45 0-.88-.04-1.28-.13-.25-.04-.49-.11-.71-.19-1.5-.56-2.41-1.86-2.41-4.08V7.92c0-3.08 1.76-4.4 4.4-4.4h8.79c2.24 0 3.85.95 4.28 3.12.07.4.12.81.12 1.28Z" 
    fill="currentColor">
      </path>
      <path d="M22.298 10.92v5.15c0 3.08-1.76 4.4-4.4 4.4h-8.79c-.74 0-1.41-.1-1.99-.32-1.19-.44-2-1.35-2.29-2.81.4.09.83.13 1.28.13h8.79c2.64 0 4.4-1.32 4.4-4.4V7.92c0-.47-.04-.89-.12-1.28 1.9.4 3.12 1.74 3.12 4.28Z" 
      fill="currentColor">
        </path>
        <path d="M10.5 13.14a2.64 2.64 0 1 0 0-5.28 2.64 2.64 0 0 0 0 5.28ZM4.781 8.25c-.41 0-.75.34-.75.75v3c0 .41.34.75.75.75s.75-.34.75-.75V9c0-.41-.33-.75-.75-.75ZM16.21 8.25c-.41 0-.75.34-.75.75v3c0 .41.34.75.75.75s.75-.34.75-.75V9c0-.41-.33-.75-.75-.75Z" 
        fill="currentColor">
          </path>
          </svg>
)

const CustomMessagesIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg 
  className={props.className}
  xmlns="http://www.w3.org/2000/svg" 
  width="18" 
  height="18" 
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

const CustomFindFreelancersIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg 
  className={props.className}
  xmlns="http://www.w3.org/2000/svg" 
  width="18" 
  height="18" 
  viewBox="0 0 24 24" 
  fill="none">
    <path opacity=".4" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4Zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4Z" 
    fill="currentColor">
      </path>
      <path d="M16.5 7.5c0 2.49-2.01 4.5-4.5 4.5S7.5 9.99 7.5 7.5 9.51 3 12 3s4.5 2.01 4.5 4.5Z" 
      fill="currentColor">
        </path>
      <path d="M12 14c-1.66 0-3 1.34-3 3v1h6v-1c0-1.66-1.34-3-3-3Z" 
      fill="currentColor">
        </path>
        </svg>
)

const CustomJobOfferingsIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg 
  className={props.className}
  xmlns="http://www.w3.org/2000/svg" 
  width="18" 
  height="18" 
  viewBox="0 0 24 24" 
  fill="none">
    <path fill="currentColor" d="M22 10.76a.86.86 0 00-.86-.86H2.86c-.48 0-.86.38-.86.86 0 5.89 4.11 10 10 10s10-4.12 10-10z" 
    opacity=".4">
      </path>
      <path fill="currentColor" d="M12.53 3.46l2.85 2.84c.29.29.29.77 0 1.06-.29.29-.77.29-1.06 0L12.75 5.8v9.57c0 .41-.34.75-.75.75s-.75-.34-.75-.75V5.8L9.69 7.37c-.29.29-.77.29-1.06 0a.753.753 0 01-.23-.53c0-.19.07-.38.22-.53l2.85-2.84c.29-.3.77-.3 1.06-.01z">
        </path>
        </svg>
)

export default function ModernSidebarNav({ profile }: ModernSidebarNavProps) {
  const pathname = usePathname()
  const { supabase } = useOptimizedSupabase()
  const { t } = useTranslation()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  // Return early if no profile
  if (!profile) {
    return (
      <Sidebar>
        <SidebarContent>
          <div className="flex items-center justify-center h-16">
            <Loader className="h-4 w-4 animate-spin" />
          </div>
        </SidebarContent>
      </Sidebar>
    )
  }
  
  const isActive = (path: string) => {
    // For profile, only match exact path to avoid conflicts with sub-pages
    if (path === "/profile") {
      return pathname === path
    }
    // For other paths, use startsWith to include sub-pages
    return pathname === path || pathname?.startsWith(`${path}/`)
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await supabase.auth.signOut()
      window.location.href = "/"
    } catch (error) {
      console.error("Logout error:", error)
      setIsLoggingOut(false)
    }
  }

  return (
    <>
      <SidebarHeader className="border-b bg-sidebar p-4">
        <div className="flex items-center gap-2">
          <div className="relative h-8 w-8 rounded-lg overflow-hidden">
            <Image
              src={
                profile.avatar_url || `/placeholder.svg?height=32&width=32&text=${profile.first_name?.charAt(0) || "U"}`
              }
              alt={profile.first_name || "User"}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex flex-col">
            <p className="text-sm font-medium leading-none">
              {profile.first_name} {profile.last_name}
            </p>
            <p className="text-xs text-sidebar-foreground/70">
              {profile.user_type === "freelancer" ? t("sidebar.freelancer") : t("sidebar.client")}
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t("sidebar.navigation")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="p-4 gap-4">
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  isActive={isActive("/dashboard")} 
                  tooltip={t("sidebar.dashboard")}
                  className={isActive("/dashboard") ? "!bg-[#15dda9] !text-white hover:!bg-[#15dda9] hover:!text-black !rounded-lg" : "hover:!bg-[#d0f8ee] hover:!text-black hover:!rounded-lg"}
                >
                  <Link href="/dashboard">
                  <CustomHomeIcon className={`h-4 w-4 ${isActive("/dashboard") ? "text-black" : "text-[#15dda9]"}`} />
                    <span className="text-xs font-light">{t("sidebar.dashboard")}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  isActive={isActive("/profile")} 
                  tooltip={t("sidebar.profile")}
                  className={isActive("/profile") ? "!bg-[#15dda9] !text-white hover:!bg-[#15dda9] hover:!text-black !rounded-lg" : "hover:!bg-[#d0f8ee] hover:!text-black hover:!rounded-lg"}
                >
                  <Link href="/profile">
                    <CustomProfileIcon className={`h-4 w-4 ${isActive("/profile") ? "text-black" : "text-[#15dda9]"}`} />
                    <span className="text-xs font-light">{t("sidebar.profile")}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {profile.user_type === "client" && (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive("/freelancers")} 
                      tooltip={t("sidebar.findFreelancers")}
                      className={isActive("/freelancers") ? "!bg-[#15dda9] !text-white hover:!bg-[#15dda9] hover:!text-black !rounded-lg" : "hover:!bg-[#d0f8ee] hover:!text-black hover:!rounded-lg"}
                    >
                      <Link href="/freelancers">
                        <CustomFindFreelancersIcon className={`h-4 w-4 ${isActive("/freelancers") ? "text-black" : "text-[#15dda9]"}`} />
                        <span className="text-xs font-light">{t("sidebar.findFreelancers")}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive("/my-booking-requests")} 
                      tooltip={t("sidebar.myBookingRequests")}
                      className={isActive("/my-booking-requests") ? "!bg-[#15dda9] !text-white hover:!bg-[#15dda9] hover:!text-black !rounded-lg" : "hover:!bg-[#d0f8ee] hover:!text-black hover:!rounded-lg"}
                    >
                      <Link href="/my-booking-requests">
                        <div className="relative">
                          <FileText className={`h-4 w-4 ${isActive("/my-booking-requests") ? "text-black" : "text-[#15dda9]"}`} />
                          
                        </div>
                        <span className="text-xs font-light">{t("sidebar.myBookingRequests")}</span>
                        <MyBookingRequestsNotificationBadge />
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              )}

              {profile.user_type === "freelancer" && (
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive("/job-offerings")} 
                    tooltip={t("sidebar.jobOfferings")}
                    className={isActive("/job-offerings") ? "!bg-[#15dda9] !text-white hover:!bg-[#15dda9] hover:!text-black !rounded-lg" : "hover:!bg-[#d0f8ee] hover:!text-black hover:!rounded-lg"}
                  >
                    <Link href="/job-offerings">
                      <CustomJobOfferingsIcon className={`h-4 w-4 ${isActive("/job-offerings") ? "text-black" : "text-[#15dda9]"}`} />
                      <span className="text-xs font-light">{t("sidebar.jobOfferings")}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {profile.user_type === "freelancer" && (
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive("/profile/availability")} 
                    tooltip={t("sidebar.availability")}
                    className={isActive("/profile/availability") ? "!bg-[#15dda9] !text-white hover:!bg-[#15dda9] hover:!text-black !rounded-lg" : "hover:!bg-[#d0f8ee] hover:!text-black hover:!rounded-lg"}
                  >
                    <Link href="/profile/availability">
                      <CustomAvailabilityIcon className={`h-4 w-4 ${isActive("/profile/availability") ? "text-black" : "text-[#15dda9]"}`} />
                      <span className="text-xs font-light">{t("sidebar.availability")}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {profile.user_type === "freelancer" && (
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive("/booking-requests")} 
                    tooltip={t("sidebar.bookingRequests")}
                    className={isActive("/booking-requests") ? "!bg-[#15dda9] !text-white hover:!bg-[#15dda9] hover:!text-black !rounded-lg" : "hover:!bg-[#d0f8ee] hover:!text-black hover:!rounded-lg"}
                  >
                    <Link href="/booking-requests">
                      <div className="relative">
                        <FileText className={`h-4 w-4 ${isActive("/booking-requests") ? "text-black" : "text-[#15dda9]"}`} />
                        
                      </div>
                      <span className="text-xs font-light">{t("sidebar.bookingRequests")}</span>
                      <BookingRequestsNotificationBadge />
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  isActive={isActive("/bookings")} 
                  tooltip={t("sidebar.bookings")}
                  className={isActive("/bookings") ? "!bg-[#15dda9] !text-white hover:!bg-[#15dda9] hover:!text-black !rounded-lg" : "hover:!bg-[#d0f8ee] hover:!text-black hover:!rounded-lg"}
                >
                  <Link href="/bookings">
                    <CustomBookingsIcon className={`h-4 w-4 ${isActive("/bookings") ? "text-black" : "text-[#15dda9]"}`} />
                    <span className="text-xs font-light">{t("sidebar.bookings")}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  isActive={isActive("/payments")} 
                  tooltip={t("sidebar.payments")}
                  className={isActive("/payments") ? "!bg-[#15dda9] !text-white hover:!bg-[#15dda9] hover:!text-black !rounded-lg" : "hover:!bg-[#d0f8ee] hover:!text-black hover:!rounded-lg"}
                >
                  <Link href="/payments">
                    <CustomPaymentsIcon className={`h-4 w-4 ${isActive("/payments") ? "text-black" : "text-[#15dda9]"}`} />
                    <span className="text-xs font-light">{t("sidebar.payments")}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  isActive={isActive("/messages")} 
                  tooltip={t("sidebar.messages")}
                  className={isActive("/messages") ? "!bg-[#15dda9] !text-white hover:!bg-[#15dda9] hover:!text-black !rounded-lg" : "hover:!bg-[#d0f8ee] hover:!text-black hover:!rounded-lg"}
                >
                  <Link href="/messages">
                    <CustomMessagesIcon className={`h-4 w-4 ${isActive("/messages") ? "text-black" : "text-[#15dda9]"}`} />
                    <span className="text-xs font-light">{t("sidebar.messages")}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{t("sidebar.account")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* <SidebarMenuItem className="p-4 pb-2 gap-4">
                <SidebarMenuButton 
                  asChild 
                  isActive={isActive("/settings")} 
                  tooltip={t("sidebar.settings")}
                  className={isActive("/settings") ? "!bg-[#15dda9] !text-black hover:!bg-[#15dda9] hover:!text-black !rounded-lg" : "hover:!bg-[#d0f8ee] hover:!text-black hover:!rounded-lg"}
                >
                  <Link href="/settings">
                    <CustomProfileIcon className={`h-4 w-4 ${isActive("/settings") ? "text-black" : "text-[#15dda9]"}`} />
                    <span className="text-xs font-light">{t("sidebar.settings")}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem> */}

              <SidebarMenuItem className="p-4 pt-0 gap-4">
                <SidebarMenuButton 
                  asChild 
                  tooltip={t("sidebar.home")}
                  className={isActive("/") ? "!bg-[#15dda9] !text-white hover:!bg-[#15dda9] hover:!text-black !rounded-lg" : "hover:!bg-[#d0f8ee] hover:!text-black hover:!rounded-lg"}
                >
                  <Link href="/">
                    <CustomHomeIcon className={`h-4 w-4 ${isActive("/") ? "text-black" : "text-[#15dda9]"}`} />
                    <span className="text-xs font-light">{t("sidebar.home")}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t bg-sidebar p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={handleLogout} 
              tooltip={t("sidebar.logout")}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? <Loader className="h-4 w-4 animate-spin" /> : <LogOut />}
              <span>{t("sidebar.logout")}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  )
} 