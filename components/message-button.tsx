"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@/components/user-provider"
import { Button } from "@/components/ui/button"
import { useOptimizedSupabase } from "./optimized-supabase-provider"
import { toast } from "@/lib/toast"
import { MessageSquare, Loader2 } from "lucide-react"

interface MessageButtonProps {
  bookingId: string
  clientId: string
  freelancerId: string
}

export default function MessageButton({ bookingId, clientId, freelancerId }: MessageButtonProps) {
  const router = useRouter()
  const { user } = useUser()
  const { supabase } = useOptimizedSupabase()
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)

    try {
      if (!user) {
        router.push("/login")
        return
      }

      // Determine the recipient ID (the other user)
      const recipientId = user.id === clientId ? freelancerId : clientId

      // Use our API route instead of direct Supabase calls
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipientId,
          bookingId: bookingId === "new" ? null : bookingId,
          message: "", // Empty initial message, just to create the conversation
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create conversation")
      }

      // Navigate to the conversation
      router.push(`/messages/${data.conversationId}`)
      toast.success("Message sent successfully")
    } catch (error: any) {
      console.error("Error creating conversation:", error)
      toast.error(error.message || "Failed to send message")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="outline" className="w-full justify-start" onClick={handleClick} disabled={loading}>
      {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <MessageSquare className="h-4 w-4 mr-2" />}
      Send Message
    </Button>
  )
}
