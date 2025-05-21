"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { toast } from "@/lib/toast"
import { useOptimizedSupabase } from "@/components/optimized-supabase-provider"
import { useOptimizedUser } from "@/components/optimized-user-provider"
import type { Database } from "@/lib/database.types"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { HelpCircle, Dumbbell, Users, Sun, Clock, Repeat, Brain, Palette } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]

interface WildcardCategoriesFormProps {
  profile: Profile
}

interface WildcardCategory {
  id: string
  label: string
  description: string
  icon: React.ElementType
}

const wildcardCategories: WildcardCategory[] = [
  {
    id: "physical_work",
    label: "Physical Work",
    description: "I'm able-bodied and can perform physical tasks",
    icon: Dumbbell,
  },
  {
    id: "customer_facing",
    label: "Customer-Facing Work",
    description: "I have good representation and communication skills",
    icon: Users,
  },
  {
    id: "outdoor_work",
    label: "Outdoor Work",
    description: "I don't mind working in different weather conditions",
    icon: Sun,
  },
  {
    id: "odd_hours",
    label: "Flexible Hours",
    description: "I'm available to work early mornings, late nights, or weekends",
    icon: Clock,
  },
  {
    id: "repetitive_work",
    label: "Repetitive Tasks",
    description: "I don't mind repetitive or routine work",
    icon: Repeat,
  },
  {
    id: "analytical_work",
    label: "Analytical Work",
    description: "I have problem-solving and analytical skills",
    icon: Brain,
  },
  {
    id: "creative_work",
    label: "Creative Work",
    description: "I have creative skills and innovative thinking",
    icon: Palette,
  },
]

export default function WildcardCategoriesForm({ profile }: WildcardCategoriesFormProps) {
  const { supabase } = useOptimizedSupabase()
  const { user } = useOptimizedUser()
  const { t } = useTranslation()

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

      toast.success(t("profile.wildcardCategories.updateSuccess"))
    } catch (error) {
      console.error("Error saving wildcard settings:", error)
      toast.error(t("profile.wildcardCategories.updateError"))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("profile.wildcardCategories.title")}</CardTitle>
        <CardDescription>{t("profile.wildcardCategories.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Master Switch with Tooltip */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Label>{t("profile.wildcardCategories.enableWildcard")}</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t("profile.wildcardCategories.enableWildcardTooltip")}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="text-sm text-muted-foreground">
                {t("profile.wildcardCategories.enableWildcardDescription")}
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
                  <Label>{t("profile.wildcardCategories.selectCategories")}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t("profile.wildcardCategories.selectCategoriesDescription")}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {wildcardCategories.map((category) => {
                    const Icon = category.icon
                    return (
                      <button
                        key={category.id}
                        onClick={() => handleToggleWildcard(category.id)}
                        className={cn(
                          "relative p-4 rounded-lg border transition-all duration-200 text-left",
                          "hover:border-primary/50 hover:shadow-sm",
                          wildcards[category.id] 
                            ? "border-primary bg-primary/5" 
                            : "border-border"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "p-2 rounded-md",
                            wildcards[category.id] 
                              ? "bg-primary/10 text-primary" 
                              : "bg-muted text-muted-foreground"
                          )}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="space-y-1">
                            <h4 className="font-medium leading-none">{t(`profile.wildcardCategories.categories.${category.id}.label`)}</h4>
                            <p className="text-sm text-muted-foreground">{t(`profile.wildcardCategories.categories.${category.id}.description`)}</p>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </>
          )}

          <Button onClick={handleSave} disabled={isLoading} className="mt-4">
            {isLoading ? t("profile.wildcardCategories.saving") : t("profile.wildcardCategories.saveChanges")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
