import enMessages from '@/messages/en.json'
import nlMessages from '@/messages/nl.json'
import { useEffect, useState } from 'react'

const messages = {
  en: enMessages,
  nl: nlMessages,
}

export type Locale = 'en' | 'nl'

// Create a custom event for language changes
const LANGUAGE_CHANGE_EVENT = 'languageChange'

export function useTranslation() {
  const [mounted, setMounted] = useState(false)
  const [locale, setLocale] = useState<Locale>('nl')

  useEffect(() => {
    // Get the stored locale from localStorage or default to 'nl'
    const storedLocale = localStorage.getItem('locale') as Locale
    if (storedLocale && (storedLocale === 'en' || storedLocale === 'nl')) {
      setLocale(storedLocale)
    } else {
      // If no stored locale, set to 'nl' and store it
      localStorage.setItem('locale', 'nl')
    }
    setMounted(true)

    // Listen for language changes
    const handleLanguageChange = (event: CustomEvent<Locale>) => {
      setLocale(event.detail)
    }

    window.addEventListener(LANGUAGE_CHANGE_EVENT, handleLanguageChange as EventListener)
    return () => {
      window.removeEventListener(LANGUAGE_CHANGE_EVENT, handleLanguageChange as EventListener)
    }
  }, [])

  const t = (key: string, params?: Record<string, any>) => {
    const keys = key.split('.')
    let value: any = messages[locale]

    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k]
      } else {
        return key
      }
    }

    if (!value) return key

    if (params) {
      return Object.entries(params).reduce((str, [key, val]) => {
        return str.replace(`{${key}}`, String(val))
      }, value)
    }

    return value
  }

  const changeLocale = (newLocale: Locale) => {
    if (!mounted) return
    setLocale(newLocale)
    localStorage.setItem('locale', newLocale)
    // Dispatch a custom event to notify all components
    window.dispatchEvent(new CustomEvent(LANGUAGE_CHANGE_EVENT, { detail: newLocale }))
  }

  return {
    t,
    locale,
    changeLocale,
  }
} 