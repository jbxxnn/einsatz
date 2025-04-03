"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { MapPin, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { searchLocations, geocodeAddress } from "@/lib/geocoding"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState(value || "")
  const [suggestions, setSuggestions] = useState<{ id: string; name: string; description: string }[]>([])
  const [loading, setLoading] = useState(false)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [forceKeepOpen, setForceKeepOpen] = useState(false)

  // Update input value when prop value changes
  useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value || "")
    }
  }, [value])

  // Handle input change with debounce
  const handleInputChange = (newValue: string) => {
    setInputValue(newValue)

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
          if (results.length > 0) {
            setOpen(true)
          }
        } catch (error) {
          console.error("Error searching locations:", error)
          setSuggestions([])
        } finally {
          setLoading(false)
        }
      } else {
        setSuggestions([])
      }
    }, 500) // 500ms debounce
  }

  // Handle suggestion selection
  const handleSelectSuggestion = async (suggestion: { id: string; name: string; description: string }) => {
    setInputValue(suggestion.description)
    setOpen(false)
    setForceKeepOpen(false)

    // Geocode the selected address
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

  // Handle manual input submission
  const handleManualSubmit = async () => {
    if (!inputValue) return

    try {
      setLoading(true)
      const result = await geocodeAddress(inputValue)
      if (result.success) {
        onChange(inputValue, {
          lat: result.latitude,
          lng: result.longitude,
          formattedAddress: result.formattedAddress,
        })
      } else {
        onChange(inputValue)
      }
    } catch (error) {
      console.error("Error geocoding address:", error)
      onChange(inputValue)
    } finally {
      setLoading(false)
    }
  }

  const handleFocus = () => {
    if (inputValue.length >= 3) {
      setOpen(true)
      setForceKeepOpen(true)
    }
  }

  const handleBlur = () => {
    // Only close if we're not forcing it to stay open
    if (!forceKeepOpen) {
      setTimeout(() => setOpen(false), 200)
    }
  }

  // Handle clicks inside the popover to prevent closing
  const handlePopoverInteraction = () => {
    setForceKeepOpen(true)
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label htmlFor="location">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}

      <div className="flex flex-col space-y-2">
        <Popover
          open={open}
          onOpenChange={(isOpen) => {
            // Only allow external changes to close the popover if we're not forcing it open
            if (!isOpen && forceKeepOpen) return
            setOpen(isOpen)
          }}
        >
          <PopoverTrigger asChild>
            <div className="flex">
              <div className="relative flex-1">
                <MapPin className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="location"
                  ref={inputRef}
                  placeholder={placeholder}
                  value={inputValue}
                  onChange={(e) => handleInputChange(e.target.value)}
                  className="pl-8"
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleManualSubmit()
                      setOpen(false)
                      setForceKeepOpen(false)
                    }
                  }}
                  onClick={() => {
                    if (inputValue.length >= 3) {
                      setOpen(true)
                      setForceKeepOpen(true)
                    }
                  }}
                />
                {loading && <Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />}
              </div>
              <Button
                type="button"
                variant="secondary"
                className="ml-2"
                onClick={handleManualSubmit}
                disabled={loading || !inputValue}
              >
                Verify
              </Button>
            </div>
          </PopoverTrigger>
          <PopoverContent
            className="p-0"
            align="start"
            side="bottom"
            sideOffset={5}
            onInteractOutside={(e) => {
              // Prevent closing when clicking inside
              if (forceKeepOpen) {
                e.preventDefault()
              }
            }}
            onMouseDown={handlePopoverInteraction}
          >
            <Command>
              <CommandInput placeholder="Search locations..." autoFocus={false} />
              <CommandList>
                <CommandEmpty>No locations found.</CommandEmpty>
                <CommandGroup>
                  {suggestions.map((suggestion) => (
                    <CommandItem
                      key={suggestion.id}
                      value={suggestion.description}
                      onSelect={() => handleSelectSuggestion(suggestion)}
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
          </PopoverContent>
        </Popover>

        {showRadius && onRadiusChange && (
          <div className="flex items-center space-x-2 mt-2">
            <Label htmlFor="radius" className="whitespace-nowrap">
              Service radius:
            </Label>
            <Select value={radiusValue.toString()} onValueChange={(value) => onRadiusChange(Number.parseInt(value))}>
              <SelectTrigger id="radius" className="w-[180px]">
                <SelectValue placeholder="Select radius" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 miles</SelectItem>
                <SelectItem value="10">10 miles</SelectItem>
                <SelectItem value="15">15 miles</SelectItem>
                <SelectItem value="25">25 miles</SelectItem>
                <SelectItem value="50">50 miles</SelectItem>
                <SelectItem value="100">100 miles</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  )
}

