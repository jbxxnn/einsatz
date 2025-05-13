"use client"

import { useRouter, usePathname } from "next/navigation"
import { useOptimizedSupabase } from "./optimized-supabase-provider"
import { User, Briefcase, Calendar, Clock, CreditCard, Settings, LogOut } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import type { Database } from "@/lib/database.types"
import { useTranslation } from "@/lib/i18n"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]

interface SidebarNavProps {
  profile: Profile
}

export default function SidebarNav({ profile }: SidebarNavProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { supabase } = useOptimizedSupabase()
  const { t } = useTranslation()
  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(`${path}/`)
  }

  return (
    <div className="bg-background rounded-lg shadow-sm border p-6 sticky top-20">
      <div className="flex flex-col items-center mb-6">
        <div className="relative h-20 w-20 rounded-full overflow-hidden mb-3">
          <Image
            src={
              profile.avatar_url || `/placeholder.svg?height=80&width=80&text=${profile.first_name?.charAt(0) || "U"}`
            }
            alt={profile.first_name || "User"}
            fill
            className="object-cover"
          />
        </div>
        <h3 className="font-medium text-lg">
          {profile.first_name} {profile.last_name}
        </h3>
        <p className="text-sm text-muted-foreground">{profile.user_type === "freelancer" ? "Freelancer" : "Client"}</p>
      </div>

      <nav className="space-y-1">
        <Link
          href="/dashboard"
          className={`flex items-center p-2 rounded-md ${isActive("/dashboard") ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted text-muted-foreground hover:text-foreground"}`}
        >
          <Briefcase className="h-4 w-4 mr-3" />
          <span>{t("sidebar.dashboard")}</span>
        </Link>
        <Link
          href="/profile"
          className={`flex items-center p-2 rounded-md ${isActive("/profile") ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted text-muted-foreground hover:text-foreground"}`}
        >
          <User className="h-4 w-4 mr-3" />
          <span>{t("sidebar.profile")}</span>
        </Link>
        {profile.user_type === "freelancer" && (
          <Link
            href="/job-offerings"
            className={`flex items-center p-2 rounded-md ${isActive("/job-offerings") ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted text-muted-foreground hover:text-foreground"}`}
          >
            <Calendar className="h-4 w-4 mr-3" />
            <span>{t("sidebar.jobOfferings")}</span>
          </Link>
        )}
        <Link
          href="/bookings"
          className={`flex items-center p-2 rounded-md ${isActive("/bookings") ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted text-muted-foreground hover:text-foreground"}`}
        >
          <Clock className="h-4 w-4 mr-3" />
          <span>{t("sidebar.bookings")}</span>
        </Link>
        <Link
          href="/payments"
          className={`flex items-center p-2 rounded-md ${isActive("/payments") ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted text-muted-foreground hover:text-foreground"}`}
        >
          <CreditCard className="h-4 w-4 mr-3" />
          <span>{t("sidebar.payments")}</span>
        </Link>
        <Link
          href="/settings"
          className={`flex items-center p-2 rounded-md ${isActive("/settings") ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted text-muted-foreground hover:text-foreground"}`}
        >
          <Settings className="h-4 w-4 mr-3" />
          <span>{t("sidebar.settings")}</span>
        </Link>
        <button
          onClick={async () => {
            await supabase.auth.signOut()
            router.push("/")
          }}
          className="flex items-center p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground w-full text-left"
        >
          <LogOut className="h-4 w-4 mr-3" />
          <span>{t("sidebar.logout")}</span>
        </button>
      </nav>
    </div>
  )
}

