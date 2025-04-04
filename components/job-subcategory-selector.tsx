"use client"

import { useState, useEffect } from "react"
import { useSupabase } from "@/components/supabase-provider"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { Database } from "@/lib/database.types"

type JobSubcategory = Database["public"]["Tables"]["job_subcategories"]["Row"]

interface JobSubcategorySelectorProps {
  categoryId: string | null
  selectedSubcategory: string | null
  onChange: (subcategoryId: string | null) => void
  className?: string
}

export default function JobSubcategorySelector({
  categoryId,
  selectedSubcategory,
  onChange,
  className,
}: JobSubcategorySelectorProps) {
  const { supabase } = useSupabase()
  const [open, setOpen] = useState(false)
  const [subcategories, setSubcategories] = useState<JobSubcategory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSubcategories = async () => {
      setLoading(true)

      if (!categoryId) {
        setSubcategories([])
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from("job_subcategories")
        .select("*")
        .eq("category_id", categoryId)
        .order("name")

      if (!error && data) {
        setSubcategories(data)
      }
      setLoading(false)
    }

    fetchSubcategories()
  }, [supabase, categoryId])

  const handleSelect = (subcategoryId: string) => {
    onChange(subcategoryId === selectedSubcategory ? null : subcategoryId)
    setOpen(false)
  }

  const getSelectedSubcategoryName = () => {
    const selected = subcategories.find((subcategory) => subcategory.id === selectedSubcategory)
    return selected ? selected.name : ""
  }

  return (
    <div className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={loading || !categoryId}
          >
            {selectedSubcategory ? (
              getSelectedSubcategoryName()
            ) : (
              <span className="text-muted-foreground">
                {categoryId ? "Select a subcategory..." : "Select a category first"}
              </span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandInput placeholder="Search subcategories..." />
            <CommandList>
              <CommandEmpty>No subcategory found.</CommandEmpty>
              <CommandGroup>
                {subcategories.map((subcategory) => (
                  <CommandItem
                    key={subcategory.id}
                    value={subcategory.name}
                    onSelect={() => handleSelect(subcategory.id)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedSubcategory === subcategory.id ? "opacity-100" : "opacity-0",
                      )}
                    />
                    {subcategory.name}
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

