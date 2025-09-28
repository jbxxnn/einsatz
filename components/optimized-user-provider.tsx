"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
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
  refetchProfile: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

// Cache key for profile data
const PROFILE_CACHE_KEY = 'einsatz_profile_cache'
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// Helper to get cached profile
const getCachedProfile = (userId: string): Profile | null => {
  try {
    const cached = localStorage.getItem(`${PROFILE_CACHE_KEY}_${userId}`)
    if (!cached) return null
    
    const { profile, timestamp } = JSON.parse(cached)
    if (Date.now() - timestamp > CACHE_DURATION) {
      localStorage.removeItem(`${PROFILE_CACHE_KEY}_${userId}`)
      return null
    }
    
    return profile
  } catch {
    return null
  }
}

// Helper to cache profile
const cacheProfile = (userId: string, profile: Profile) => {
  try {
    localStorage.setItem(`${PROFILE_CACHE_KEY}_${userId}`, JSON.stringify({
      profile,
      timestamp: Date.now()
    }))
  } catch {
    // Ignore localStorage errors
  }
}

export function OptimizedUserProvider({ children }: { children: React.ReactNode }) {
  const { supabase, session, isLoading: isSessionLoading } = useOptimizedSupabase()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isProfileLoading, setIsProfileLoading] = useState(false)
  const [userType, setUserType] = useState<"client" | "freelancer" | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  // Refetch profile function for manual refresh
  const refetchProfile = useCallback(async () => {
    if (!user) return
    
    setIsProfileLoading(true)
    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (error) throw error

      if (profile) {
        setProfile(profile)
        setUserType(profile.user_type || null)
        cacheProfile(user.id, profile)
        setRetryCount(0) // Reset retry count on success
      }
    } catch (error) {
      console.error("Error refetching profile:", error)
    } finally {
      setIsProfileLoading(false)
    }
  }, [user, supabase])

  // Combined effect to handle both user and profile loading
  useEffect(() => {
    // If we're still loading the session, don't do anything yet
    if (isSessionLoading) {
      return
    }

    // Set user from session
    const currentUser = session?.user || null
    setUser(currentUser)

    // If no user after session loaded, we're done loading
    if (!currentUser) {
      setProfile(null)
      setUserType(null)
      setIsProfileLoading(false)
      setRetryCount(0)
      return
    }

    // If we have a user but session is still loading, wait a bit more
    if (currentUser && isSessionLoading) {
      const waitTimeout = setTimeout(() => {
        // If session is still loading after 500ms, proceed anyway
        if (isSessionLoading) {
          console.warn("Proceeding with profile loading despite session still loading")
        }
      }, 500)
      return () => clearTimeout(waitTimeout)
    }

    // Check cache first for instant loading
    const cachedProfile = getCachedProfile(currentUser.id)
    if (cachedProfile) {
      setProfile(cachedProfile)
      setUserType(cachedProfile.user_type || null)
      setIsProfileLoading(false)
      // Still fetch fresh data in background
    }

    // Set a timeout that matches session loading timeout
    const timeoutId = setTimeout(() => {
      // Only timeout if we're not still loading the session
      if (isProfileLoading && !isSessionLoading) {
        setIsProfileLoading(false)
        console.warn("Profile loading timed out")
      }
    }, 3000) // 3 seconds to match session loading timeout

    const fetchProfile = async () => {
      // Don't fetch if we already have cached data and it's recent
      if (cachedProfile) {
        clearTimeout(timeoutId)
        return
      }

      // Don't fetch if we're still loading the session
      if (isSessionLoading) {
        return
      }

      setIsProfileLoading(true)
      try {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", currentUser.id)
          .single()

        if (error) throw error

        if (profile) {
          setProfile(profile)
          setUserType(profile.user_type || null)
          cacheProfile(currentUser.id, profile)
          setRetryCount(0) // Reset retry count on success
        }
      } catch (error) {
        console.error("Error loading profile:", error)
        
        // Retry logic for network errors
        if (retryCount < 2) {
          setTimeout(() => {
            setRetryCount(prev => prev + 1)
          }, 1000 * (retryCount + 1)) // Exponential backoff
        }
      } finally {
        // Only set loading to false if we're not still loading the session
        if (!isSessionLoading) {
          setIsProfileLoading(false)
        }
        clearTimeout(timeoutId)
      }
    }

    fetchProfile()

    return () => {
      clearTimeout(timeoutId)
    }
  }, [session, isSessionLoading, supabase, retryCount])

  return (
    <UserContext.Provider
      value={{
        user,
        profile,
        isLoading: isSessionLoading,
        isProfileLoading,
        userType,
        refetchProfile,
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
