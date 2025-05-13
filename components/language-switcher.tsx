"use client"

import { Button } from "@/components/ui/button"
import { useTranslation } from "@/lib/i18n"
import { Globe } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function LanguageSwitcher() {
  const [mounted, setMounted] = useState(false)
  const { locale, changeLocale } = useTranslation()
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLanguageChange = (newLocale: "en" | "nl") => {
    changeLocale(newLocale)
    // Force a re-render of the page to update all translations
    router.refresh()
  }

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <Globe className="h-4 w-4" />
        <span className="sr-only">Switch language</span>
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Globe className="h-4 w-4" />
          <span className="sr-only">Switch language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => handleLanguageChange("en")}
          className={locale === "en" ? "bg-accent" : ""}
        >
          English
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleLanguageChange("nl")}
          className={locale === "nl" ? "bg-accent" : ""}
        >
          Nederlands
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 