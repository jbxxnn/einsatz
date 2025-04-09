"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useSupabase } from "./supabase-provider"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Pencil, Upload, Loader2 } from "lucide-react"
import Image from "next/image"

interface AvatarUploadProps {
  userId: string
  avatarUrl: string | null
  firstName: string
  onAvatarChange: (url: string) => void
}

export function AvatarUpload({ userId, avatarUrl, firstName, onAvatarChange }: AvatarUploadProps) {
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(avatarUrl)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return
    }

    const file = e.target.files[0]
    const fileSize = file.size / 1024 / 1024 // size in MB

    // Validate file size (max 5MB)
    if (fileSize > 5) {
      toast({
        title: "File too large",
        description: "Please select an image under 5MB",
        variant: "destructive",
      })
      return
    }

    // Create a preview
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)

    // Upload to Supabase
    await uploadAvatar(file)
  }

  const uploadAvatar = async (file: File) => {
    try {
      setUploading(true)

      if (!userId) {
        throw new Error("User ID is required")
      }

      // Create a unique file name
      const fileExt = file.name.split(".").pop()
      const fileName = `${userId}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `avatars/${fileName}`

      // Upload the file to Supabase Storage
      const { error: uploadError } = await supabase.storage.from("profiles").upload(filePath, file, { upsert: true })

      if (uploadError) {
        throw uploadError
      }

      // Get the public URL
      const { data: publicUrlData } = supabase.storage.from("profiles").getPublicUrl(filePath)

      if (!publicUrlData || !publicUrlData.publicUrl) {
        throw new Error("Failed to get public URL")
      }

      // Call the callback with the new URL
      onAvatarChange(publicUrlData.publicUrl)

      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated successfully",
      })
    } catch (error: any) {
      console.error("Error uploading avatar:", error)
      toast({
        title: "Upload failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      })

      // Revert to previous avatar if upload fails
      setPreviewUrl(avatarUrl)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <div className="relative">
        <div
          className="h-24 w-24 rounded-full border-4 border-background overflow-hidden bg-background cursor-pointer"
          onClick={handleAvatarClick}
        >
          <Image
            src={previewUrl || `/placeholder.svg?height=96&width=96&text=${firstName.charAt(0) || "U"}`}
            alt={firstName || "User"}
            fill
            className="object-cover"
          />
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
          )}
        </div>
        <button
          onClick={handleAvatarClick}
          className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1.5 shadow-sm"
          disabled={uploading}
          title="avatar"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          disabled={uploading}
          title="file"
        />
      </div>
      <div className="mt-4">
        <Button variant="outline" size="sm" onClick={handleAvatarClick} disabled={uploading}>
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload New
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
