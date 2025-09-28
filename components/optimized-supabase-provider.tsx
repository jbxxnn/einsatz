"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { SupabaseClient, Session } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/lib/database.types"

type SupabaseContextType = {
  supabase: SupabaseClient<Database>
  session: Session | null
  isLoading: boolean
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined)

export function OptimizedSupabaseProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createClientComponentClient<Database>())
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasCheckedSession, setHasCheckedSession] = useState(false)

  useEffect(() => {
    // Set a longer timeout to match profile loading timeout
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        console.warn("Session loading timed out")
        setIsLoading(false)
      }
    }, 3000) // 3 seconds to allow proper session restoration

    const getSession = async () => {
      try {
        const { data } = await supabase.auth.getSession()
        setSession(data.session)
        setHasCheckedSession(true)
        
        // If we have a session, we can stop loading immediately
        if (data.session) {
          setIsLoading(false)
          clearTimeout(timeoutId)
        } else {
          // Even if no session, we've checked and can stop loading
          setIsLoading(false)
          clearTimeout(timeoutId)
        }
      } catch (error) {
        console.error("Error fetching session:", error)
        setHasCheckedSession(true)
        setIsLoading(false)
        clearTimeout(timeoutId)
      }
    }

    getSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setHasCheckedSession(true)
      // Stop loading when we get a definitive session state (even if null)
      if (isLoading) {
        setIsLoading(false)
        clearTimeout(timeoutId)
      }
    })

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeoutId)
    }
  }, [supabase, isLoading])

  return <SupabaseContext.Provider value={{ supabase, session, isLoading }}>{children}</SupabaseContext.Provider>
}

export const useOptimizedSupabase = () => {
  const context = useContext(SupabaseContext)
  if (context === undefined) {
    throw new Error("useOptimizedSupabase must be used inside OptimizedSupabaseProvider")
  }
  return context
}
