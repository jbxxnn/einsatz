"use client"

import { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { HelpCircle } from "lucide-react"

export type WildcardCategory =
  | "physical_work"
  | "customer_facing"
  | "outdoor_work"
  | "odd_hours"
  | "repetitive_work"
  | "analytical_work"
  | "creative_work"

interface WildcardFilterProps {
  selectedWildcards: WildcardCategory[]
  onChange: (wildcards: WildcardCategory[]) => void
}

interface WildcardOption {
  id: WildcardCategory
  label: string
  description: string
}

const wildcardOptions: WildcardOption[] = [
  {
    id: "physical_work",
    label: "Physical Work",
    description: "Freelancers who can perform physical tasks and are able-bodied",
  },
  {
    id: "customer_facing",
    label: "Customer-Facing",
    description: "Freelancers with good representation and communication skills",
  },
  {
    id: "outdoor_work",
    label: "Outdoor Work",
    description: "Freelancers who don't mind working in different weather conditions",
  },
  {
    id: "odd_hours",
    label: "Flexible Hours",
    description: "Freelancers available to work early mornings, late nights, or weekends",
  },
  {
    id: "repetitive_work",
    label: "Repetitive Tasks",
    description: "Freelancers who don't mind repetitive or routine work",
  },
  {
    id: "analytical_work",
    label: "Analytical Work",
    description: "Freelancers with problem-solving and analytical skills",
  },
  {
    id: "creative_work",
    label: "Creative Work",
    description: "Freelancers with creative skills and innovative thinking",
  },
]

export default function WildcardFilter({ selectedWildcards, onChange }: WildcardFilterProps) {
  const [isOpen, setIsOpen] = useState(false)

  const toggleWildcard = (wildcardId: WildcardCategory) => {
    if (selectedWildcards.includes(wildcardId)) {
      onChange(selectedWildcards.filter((id) => id !== wildcardId))
    } else {
      onChange([...selectedWildcards, wildcardId])
    }
  }

  return (
    <div className="space-y-2">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="flex w-full items-center justify-between">
        <Label className="text-xs text-black font-bold">Wildcard Search</Label>
          <div
            role="button"
            tabIndex={0}
            className="p-0 h-7 flex items-center justify-center cursor-pointer rounded-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                setIsOpen(!isOpen)
              }
            }}
          >
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            <span className="sr-only">Toggle wildcard options</span>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 mt-2">
          {wildcardOptions.map((option) => (
            <div key={option.id} className="flex items-start space-x-2">
              <Checkbox
                id={`wildcard-${option.id}`}
                checked={selectedWildcards.includes(option.id)}
                onCheckedChange={() => toggleWildcard(option.id)}
              />
              <div className="grid gap-0.5">
                <Label htmlFor={`wildcard-${option.id}`} className="text-xs text-black font-bold cursor-pointer">
                  {option.label}
                </Label>
                <p className="text-xs text-black">{option.description}</p>
              </div>
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>
      {/* Show selected wildcards when collapsed */}
      {!isOpen && selectedWildcards.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {selectedWildcards.map((wildcardId) => {
            const option = wildcardOptions.find((opt) => opt.id === wildcardId)
            return option ? (
              <div key={wildcardId} className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                {option.label}
              </div>
            ) : null
          })}
        </div>
      )}
    </div>
  )
}
