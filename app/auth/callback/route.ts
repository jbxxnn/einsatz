import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import type { NextRequest } from "next/server"
import type { Database } from "@/lib/database.types"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const userType = requestUrl.searchParams.get("user_type") || "client"

  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })

    // Exchange the code for a session
    await supabase.auth.exchangeCodeForSession(code)

    // Get the user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      // Check if the user already has a profile
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

      // If no profile exists, create one
      if (!profile) {
        const { error } = await supabase.from("profiles").insert({
          id: user.id,
          email: user.email,
          user_type: userType,
        })

        if (error) {
          console.error("Error creating profile:", error)
        }

        // If freelancer, redirect to complete profile
        if (userType === "freelancer") {
          return NextResponse.redirect(new URL("/profile/edit", requestUrl.origin))
        }
      } else if (profile.user_type === "freelancer" && !profile.skills) {
        // If freelancer with incomplete profile
        return NextResponse.redirect(new URL("/profile/edit", requestUrl.origin))
      }
    }
  }

  // Redirect to the dashboard by default
  return NextResponse.redirect(new URL("/dashboard", requestUrl.origin))
}

