import enMessages from '@/messages/en.json'
import nlMessages from '@/messages/nl.json'

const messages = {
  en: enMessages,
  nl: nlMessages,
}

export type Locale = 'en' | 'nl'

// Server-side translation function
export function serverTranslate(locale: Locale = 'en', key: string, params?: Record<string, any>) {
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

// Get messages for a specific locale
export function getMessages(locale: Locale = 'en') {
  return messages[locale]
}
















