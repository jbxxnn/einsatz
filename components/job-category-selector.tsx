"use client"

import { useState, useEffect } from "react"
import { useCategories } from "@/lib/data-fetching"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import type { Database } from "@/lib/database.types"

type JobCategory = Database["public"]["Tables"]["job_categories"]["Row"]

interface JobCategorySelectorProps {
  selectedCategories: string[]
  onChange: (categories: string[]) => void
  multiple?: boolean
  className?: string
}

export default function JobCategorySelector({
  selectedCategories = [],
  onChange,
  multiple = true,
  className,
}: JobCategorySelectorProps) {
  const [open, setOpen] = useState(false)
  const { data: categories, isLoading: loading } = useCategories()

  const handleSelect = (categoryId: string) => {
    if (multiple) {
      if (selectedCategories.includes(categoryId)) {
        onChange(selectedCategories.filter((id) => id !== categoryId))
      } else {
        onChange([...selectedCategories, categoryId])
      }
    } else {
      onChange([categoryId])
      setOpen(false)
    }
  }

  const getSelectedCategoryNames = () => {
    return categories?.filter((category) => selectedCategories.includes(category.id)).map((category) => category.name) || []
  }

  return (
    <div className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between bg-transparent text-black hover:bg-transparent hover:text-black border border-brand-green"
            disabled={loading}
          >
            {selectedCategories.length > 0 ? (
              multiple ? (
                <div className="flex flex-wrap gap-1 max-w-2xl overflow-hidden">
                  {getSelectedCategoryNames().map((name) => (
                    <Badge key={name} variant="secondary">
                      {name}
                    </Badge>
                  ))}
                </div>
              ) : (
                getSelectedCategoryNames()[0]
              )
            ) : (
              "Select job categories..."
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0">
          <Command>
            <CommandInput placeholder="Search categories..." />
            <CommandList>
              <CommandEmpty>No category found.</CommandEmpty>
              <CommandGroup>
                {categories?.map((category) => (
                  <CommandItem key={category.id} value={category.name} onSelect={() => handleSelect(category.id)}>
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedCategories.includes(category.id) ? "opacity-100" : "opacity-0",
                      )}
                    />
                    {category.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}

