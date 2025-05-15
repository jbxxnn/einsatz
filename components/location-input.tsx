"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { MapPin, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { searchLocations, geocodeAddress } from "@/lib/geocoding"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTranslation } from "@/lib/i18n"

interface LocationInputProps {
  value: string
  onChange: (value: string, coordinates?: { lat: number; lng: number; formattedAddress: string }) => void
  showRadius?: boolean
  radiusValue?: number
  onRadiusChange?: (radius: number) => void
  className?: string
  placeholder?: string
  label?: string
  required?: boolean
}

export function LocationInput({
  value,
  onChange,
  showRadius = false,
  radiusValue = 10,
  onRadiusChange,
  className,
  placeholder = "Enter a location",
  label,
  required = false,
}: LocationInputProps) {
  const [inputValue, setInputValue] = useState(value || "")
  const [suggestions, setSuggestions] = useState<{ id: string; name: string; description: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const { t } = useTranslation()
  // Update input value when prop value changes
  useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value || "")
    }
  }, [value])

  // Handle input change with debounce
  const handleInputChange = (newValue: string) => {
    setInputValue(newValue)
    setIsOpen(true)

    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(async () => {
      if (newValue.length >= 3) {
        setLoading(true)
        try {
          const results = await searchLocations(newValue)
          setSuggestions(results)
        } catch (error) {
          console.error("Error searching locations:", error)
          setSuggestions([])
        } finally {
          setLoading(false)
        }
      } else {
        setSuggestions([])
      }
    }, 500)
  }

  // Handle suggestion selection
  const handleSelectSuggestion = async (suggestion: { id: string; name: string; description: string }) => {
    setInputValue(suggestion.description)
    setIsOpen(false)

    try {
      const result = await geocodeAddress(suggestion.description)
      if (result.success) {
        onChange(suggestion.description, {
          lat: result.latitude,
          lng: result.longitude,
          formattedAddress: result.formattedAddress,
        })
      } else {
        onChange(suggestion.description)
      }
    } catch (error) {
      console.error("Error geocoding address:", error)
      onChange(suggestion.description)
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label htmlFor="location">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}

      <div className="relative">
        <div className="flex">
          <div className="relative flex-1">
            <MapPin className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="location"
              placeholder={placeholder}
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              className="pl-8"
              onFocus={() => setIsOpen(true)}
              onBlur={() => setTimeout(() => setIsOpen(false), 200)}
            />
            {loading && <Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
        </div>

        {isOpen && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg">
            <Command>
              <CommandList>
                <CommandEmpty>{t("freelancer.filters.noLocationsFound")}</CommandEmpty>
                <CommandGroup>
                  {suggestions.map((suggestion) => (
                    <CommandItem
                      key={suggestion.id}
                      value={suggestion.description}
                      onSelect={() => handleSelectSuggestion(suggestion)}
                      onClick={() => handleSelectSuggestion(suggestion)}
                      className="cursor-pointer"
                    >
                      <MapPin className="mr-2 h-4 w-4" />
                      <div className="flex flex-col">
                        <span>{suggestion.name}</span>
                        <span className="text-xs text-muted-foreground truncate max-w-[250px]">
                          {suggestion.description}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </div>
        )}
      </div>

      {showRadius && onRadiusChange && (
        <div className="flex items-center space-x-2 mt-2">
          <Label htmlFor="radius" className="whitespace-nowrap">
            {t("freelancer.filters.serviceRadius")}
          </Label>
          <Select value={radiusValue.toString()} onValueChange={(value) => onRadiusChange(Number.parseInt(value))}>
            <SelectTrigger id="radius" className="w-[180px]">
              <SelectValue placeholder={t("freelancer.filters.selectRadius")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 km</SelectItem>
              <SelectItem value="10">10 km</SelectItem>
              <SelectItem value="15">15 km</SelectItem>
              <SelectItem value="20">20 km</SelectItem>
              <SelectItem value="30">30 km</SelectItem>
              <SelectItem value="50">50 km</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )
}

