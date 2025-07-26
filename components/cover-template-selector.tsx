"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Check, Palette } from "lucide-react"
import { cn } from "@/lib/utils"

export interface CoverTemplate {
  id: string
  name: string
  description: string
  colors: {
    primary: string
    secondary: string
    accent: string
  }
  pattern: string
  category: string
}

const COVER_TEMPLATES: CoverTemplate[] = [
  {
    id: "lavender-sky",
    name: "Lavender Sky",
    description: "Soft lavender to sky blue gradient",
    colors: { primary: "hsla(277, 79%, 84%, 1)", secondary: "hsla(204, 95%, 77%, 1)", accent: "hsla(277, 79%, 84%, 1)" },
    pattern: "linear-gradient(90deg, hsla(277, 79%, 84%, 1) 0%, hsla(204, 95%, 77%, 1) 100%)",
    category: "Soft"
  },
  {
    id: "pink-sunset",
    name: "Pink Sunset",
    description: "Vibrant pink to coral gradient",
    colors: { primary: "hsla(303, 79%, 76%, 1)", secondary: "hsla(360, 86%, 67%, 1)", accent: "hsla(303, 79%, 76%, 1)" },
    pattern: "linear-gradient(90deg, hsla(303, 79%, 76%, 1) 0%, hsla(360, 86%, 67%, 1) 100%)",
    category: "Vibrant"
  },
  {
    id: "purple-dream",
    name: "Purple Dream",
    description: "Deep purple to soft pink gradient",
    colors: { primary: "hsla(266, 75%, 55%, 1)", secondary: "hsla(340, 47%, 77%, 1)", accent: "hsla(266, 75%, 55%, 1)" },
    pattern: "linear-gradient(90deg, hsla(266, 75%, 55%, 1) 0%, hsla(340, 47%, 77%, 1) 100%)",
    category: "Dreamy"
  },
  {
    id: "rose-mint",
    name: "Rose Mint",
    description: "Soft rose to mint green gradient",
    colors: { primary: "hsla(332, 53%, 82%, 1)", secondary: "hsla(176, 57%, 89%, 1)", accent: "hsla(332, 53%, 82%, 1)" },
    pattern: "linear-gradient(90deg, hsla(332, 53%, 82%, 1) 0%, hsla(176, 57%, 89%, 1) 100%)",
    category: "Pastel"
  },
  {
    id: "golden-hour",
    name: "Golden Hour",
    description: "Warm golden to orange gradient",
    colors: { primary: "hsla(45, 100%, 70%, 1)", secondary: "hsla(25, 95%, 60%, 1)", accent: "hsla(45, 100%, 70%, 1)" },
    pattern: "linear-gradient(90deg, hsla(45, 100%, 70%, 1) 0%, hsla(25, 95%, 60%, 1) 100%)",
    category: "Warm"
  },
  {
    id: "ocean-breeze",
    name: "Ocean Breeze",
    description: "Cool teal to blue gradient",
    colors: { primary: "hsla(180, 70%, 75%, 1)", secondary: "hsla(210, 80%, 70%, 1)", accent: "hsla(180, 70%, 75%, 1)" },
    pattern: "linear-gradient(90deg, hsla(180, 70%, 75%, 1) 0%, hsla(210, 80%, 70%, 1) 100%)",
    category: "Cool"
  },
  {
    id: "sunset-blaze",
    name: "Sunset Blaze",
    description: "Fiery red to orange gradient",
    colors: { primary: "hsla(0, 85%, 65%, 1)", secondary: "hsla(30, 90%, 60%, 1)", accent: "hsla(0, 85%, 65%, 1)" },
    pattern: "linear-gradient(90deg, hsla(0, 85%, 65%, 1) 0%, hsla(30, 90%, 60%, 1) 100%)",
    category: "Bold"
  },
  {
    id: "forest-mist",
    name: "Forest Mist",
    description: "Deep green to emerald gradient",
    colors: { primary: "hsla(150, 60%, 45%, 1)", secondary: "hsla(160, 70%, 55%, 1)", accent: "hsla(150, 60%, 45%, 1)" },
    pattern: "linear-gradient(90deg, hsla(150, 60%, 45%, 1) 0%, hsla(160, 70%, 55%, 1) 100%)",
    category: "Nature"
  },
  {
    id: "midnight-sky",
    name: "Midnight Sky",
    description: "Deep blue to purple gradient",
    colors: { primary: "hsla(240, 70%, 40%, 1)", secondary: "hsla(280, 60%, 50%, 1)", accent: "hsla(240, 70%, 40%, 1)" },
    pattern: "linear-gradient(90deg, hsla(240, 70%, 40%, 1) 0%, hsla(280, 60%, 50%, 1) 100%)",
    category: "Dark"
  },
  {
    id: "cotton-candy",
    name: "Cotton Candy",
    description: "Soft pink to lavender gradient",
    colors: { primary: "hsla(320, 70%, 85%, 1)", secondary: "hsla(270, 60%, 80%, 1)", accent: "hsla(320, 70%, 85%, 1)" },
    pattern: "linear-gradient(90deg, hsla(320, 70%, 85%, 1) 0%, hsla(270, 60%, 80%, 1) 100%)",
    category: "Sweet"
  },
  {
    id: "autumn-leaves",
    name: "Autumn Leaves",
    description: "Warm brown to orange gradient",
    colors: { primary: "hsla(35, 60%, 55%, 1)", secondary: "hsla(20, 70%, 50%, 1)", accent: "hsla(35, 60%, 55%, 1)" },
    pattern: "linear-gradient(90deg, hsla(35, 60%, 55%, 1) 0%, hsla(20, 70%, 50%, 1) 100%)",
    category: "Warm"
  },
  {
    id: "arctic-ice",
    name: "Arctic Ice",
    description: "Cool white to blue gradient",
    colors: { primary: "hsla(200, 30%, 90%, 1)", secondary: "hsla(220, 40%, 80%, 1)", accent: "hsla(200, 30%, 90%, 1)" },
    pattern: "linear-gradient(90deg, hsla(200, 30%, 90%, 1) 0%, hsla(220, 40%, 80%, 1) 100%)",
    category: "Cool"
  }
]

interface CoverTemplateSelectorProps {
  selectedTemplate: string | null
  onTemplateSelect: (templateId: string) => void
  className?: string
}

export default function CoverTemplateSelector({
  selectedTemplate,
  onTemplateSelect,
  className
}: CoverTemplateSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  const categories = ["all", ...Array.from(new Set(COVER_TEMPLATES.map(t => t.category)))]

  const filteredTemplates = selectedCategory === "all" 
    ? COVER_TEMPLATES 
    : COVER_TEMPLATES.filter(t => t.category === selectedCategory)

  return (
    <div className={cn("space-y-6", className)}>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => (
          <Card
            key={template.id}
            className={cn(
              "cursor-pointer transition-all duration-200 hover:shadow-md",
              selectedTemplate === template.id && "ring-2 ring-primary"
            )}
            onClick={() => onTemplateSelect(template.id)}
          >
            <CardContent className="p-0">
              {/* Cover Preview */}
              <div 
                className="h-32 rounded-t-lg relative overflow-hidden"
                style={{
                  backgroundImage: template.pattern,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat"
                }}
              >
                {/* Pattern Overlay */}
                <div className="absolute inset-0 opacity-20">
                  <div className="w-full h-full" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                  }}></div>
                </div>

                {/* Selection Indicator */}
                {selectedTemplate === template.id && (
                  <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                    <Check className="h-4 w-4" />
                  </div>
                )}
              </div>

              {/* Template Info */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-medium text-sm">{template.name}</h3>
                  <div className="flex gap-1">
                    <div 
                      className="w-3 h-3 rounded-full border border-border"
                      style={{ backgroundColor: template.colors.primary }}
                    />
                    <div 
                      className="w-3 h-3 rounded-full border border-border"
                      style={{ backgroundColor: template.colors.secondary }}
                    />
                    <div 
                      className="w-3 h-3 rounded-full border border-border"
                      style={{ backgroundColor: template.colors.accent }}
                    />
                  </div>
                </div>
                <p className="text-xs text-black">{template.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export { COVER_TEMPLATES } 