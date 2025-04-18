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

  useEffect(() => {
    // Set a timeout to prevent long loading states
    const timeoutId = setTimeout(() => {
      if (isLoading) setIsLoading(false)
    }, 1000) // 1 second max loading time for critical UI

    const getSession = async () => {
      try {
        const { data } = await supabase.auth.getSession()
        setSession(data.session)
      } catch (error) {
        console.error("Error fetching session:", error)
      } finally {
        setIsLoading(false)
        clearTimeout(timeoutId)
      }
    }

    getSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
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
