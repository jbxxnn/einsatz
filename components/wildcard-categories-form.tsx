"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "@/lib/toast"
import { useOptimizedSupabase } from "@/components/optimized-supabase-provider"
import { useOptimizedUser } from "@/components/optimized-user-provider"
import type { Database } from "@/lib/database.types"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]

interface WildcardCategoriesFormProps {
  profile: Profile
}

interface WildcardCategory {
  id: string
  label: string
  description: string
}

const wildcardCategories: WildcardCategory[] = [
  {
    id: "physical_work",
    label: "Physical Work",
    description: "I'm able-bodied and can perform physical tasks",
  },
  {
    id: "customer_facing",
    label: "Customer-Facing Work",
    description: "I have good representation and communication skills",
  },
  {
    id: "outdoor_work",
    label: "Outdoor Work",
    description: "I don't mind working in different weather conditions",
  },
  {
    id: "odd_hours",
    label: "Flexible Hours",
    description: "I'm available to work early mornings, late nights, or weekends",
  },
  {
    id: "repetitive_work",
    label: "Repetitive Tasks",
    description: "I don't mind repetitive or routine work",
  },
  {
    id: "analytical_work",
    label: "Analytical Work",
    description: "I have problem-solving and analytical skills",
  },
  {
    id: "creative_work",
    label: "Creative Work",
    description: "I have creative skills and innovative thinking",
  },
]

export default function WildcardCategoriesForm({ profile }: WildcardCategoriesFormProps) {
  const { supabase } = useOptimizedSupabase()
  const { user } = useOptimizedUser()

  const [isLoading, setIsLoading] = useState(false)
  const [wildcards, setWildcards] = useState<Record<string, boolean>>({
    physical_work: false,
    customer_facing: false,
    outdoor_work: false,
    odd_hours: false,
    repetitive_work: false,
    analytical_work: false,
    creative_work: false,
  })
  const [isWildcardEnabled, setIsWildcardEnabled] = useState(false)

  // Fetch current wildcard settings when component mounts
  useEffect(() => {
    const fetchWildcardSettings = async () => {
      if (!user?.id) return

      try {
        const { data, error } = await supabase.from("profiles").select("wildcard_categories, wildcard_enabled").eq("id", user.id).single()

        if (error) throw error

        if (data?.wildcard_categories) {
          setWildcards(data.wildcard_categories)
        }
        if (data?.wildcard_enabled !== undefined) {
          setIsWildcardEnabled(data.wildcard_enabled)
        }
      } catch (error) {
        console.error("Error fetching wildcard settings:", error)
      }
    }

    fetchWildcardSettings()
  }, [user?.id, supabase])

  const handleToggleWildcard = (wildcardId: string) => {
    setWildcards((prev) => ({
      ...prev,
      [wildcardId]: !prev[wildcardId],
    }))
  }

  const handleSave = async () => {
    if (!user?.id) return

    setIsLoading(true)

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          wildcard_categories: wildcards,
          wildcard_enabled: isWildcardEnabled,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (error) throw error

      toast.success("Your wildcard settings have been updated successfully.")
    } catch (error) {
      console.error("Error saving wildcard settings:", error)
      toast.error("Failed to save your wildcard settings. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wildcard Categories</CardTitle>
        <CardDescription>
          Select the types of work you're willing to do. This helps clients find you even if they don't know your
          specific skills.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Master Switch */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Wildcard Matching</Label>
              <p className="text-sm text-muted-foreground">
                Allow clients to find you through wildcard categories
              </p>
            </div>
            <Switch
              checked={isWildcardEnabled}
              onCheckedChange={setIsWildcardEnabled}
            />
          </div>

          {isWildcardEnabled && (
            <>
              <Separator />
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Categories</Label>
                  <p className="text-sm text-muted-foreground">
                    Choose the types of work you're willing to do
                  </p>
                </div>
                <div className="grid gap-4">
                  {Object.entries(wildcards).map(([key, value]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Checkbox
                        id={key}
                        checked={value}
                        onCheckedChange={(checked) => handleToggleWildcard(key)}
                      />
                      <Label htmlFor={key} className="text-sm font-normal cursor-pointer">
                        {wildcardCategories.find(c => c.id === key)?.label}
                      </Label>
                      <p className="text-sm text-muted-foreground"> - {wildcardCategories.find(c => c.id === key)?.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <Button onClick={handleSave} disabled={isLoading} className="mt-4">
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
