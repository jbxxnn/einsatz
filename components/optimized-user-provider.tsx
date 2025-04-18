"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useOptimizedSupabase } from "./optimized-supabase-provider"
import type { User } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/lib/database.types"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]

type UserContextType = {
  user: User | null
  profile: Profile | null
  isLoading: boolean
  isProfileLoading: boolean
  userType: "client" | "freelancer" | null
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function OptimizedUserProvider({ children }: { children: React.ReactNode }) {
  const { supabase, session, isLoading: isSessionLoading } = useOptimizedSupabase()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isProfileLoading, setIsProfileLoading] = useState(false)
  const [userType, setUserType] = useState<"client" | "freelancer" | null>(null)

  // Set user from session immediately
  useEffect(() => {
    if (session) {
      setUser(session.user)
    } else if (!isSessionLoading) {
      setUser(null)
    }
  }, [session, isSessionLoading])

  // Fetch profile data separately, only if we have a user
  useEffect(() => {
    // Don't fetch profile if no user
    if (!user) {
      setProfile(null)
      setUserType(null)
      return
    }

    // Set a timeout to prevent long loading states
    const timeoutId = setTimeout(() => {
      if (isProfileLoading) setIsProfileLoading(false)
    }, 2000) // 2 seconds max loading time for profile data

    const fetchProfile = async () => {
      setIsProfileLoading(true)
      try {
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

        if (profile) {
          setProfile(profile)
          setUserType(profile.user_type || null)
        }
      } catch (error) {
        console.error("Error loading profile:", error)
      } finally {
        setIsProfileLoading(false)
        clearTimeout(timeoutId)
      }
    }

    fetchProfile()

    return () => {
      clearTimeout(timeoutId)
    }
  }, [user, supabase])

  return (
    <UserContext.Provider
      value={{
        user,
        profile,
        isLoading: isSessionLoading,
        isProfileLoading,
        userType,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export const useOptimizedUser = () => {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useOptimizedUser must be used inside OptimizedUserProvider")
  }
  return context
}
