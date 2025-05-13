// Simple geocoding service using OpenStreetMap's Nominatim API
// This is free to use with appropriate attribution and rate limiting

// Cache for geocoding results to minimize API calls
const geocodeCache = new Map<string, GeocodingResult>()

export interface GeocodingResult {
  latitude: number
  longitude: number
  formattedAddress: string
  success: boolean
  error?: string
}

// Rate limiting helper
let lastRequestTime = 0
const MIN_REQUEST_GAP = 1000 // 1 second between requests (Nominatim requires 1 request per second)

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function geocodeAddress(address: string): Promise<GeocodingResult> {
  if (!address || address.trim() === "") {
    return {
      latitude: 0,
      longitude: 0,
      formattedAddress: "",
      success: false,
      error: "Empty address",
    }
  }

  // Check cache first
  const cachedResult = geocodeCache.get(address.toLowerCase())
  if (cachedResult) {
    return cachedResult
  }

  try {
    // Rate limiting
    const now = Date.now()
    const timeSinceLastRequest = now - lastRequestTime
    if (timeSinceLastRequest < MIN_REQUEST_GAP) {
      await wait(MIN_REQUEST_GAP - timeSinceLastRequest)
    }

    // Update last request time
    lastRequestTime = Date.now()

    // Encode the address for URL
    const encodedAddress = encodeURIComponent(address)

    // Use OpenStreetMap's Nominatim API (free, no API key required)
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`, {
      headers: {
        "User-Agent": "Einsatz Platform/1.0", // Nominatim requires a User-Agent
        "Accept-Language": "en", // Prefer English results
      },
    })

    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.statusText}`)
    }

    const data = await response.json()

    if (!data || data.length === 0) {
      return {
        latitude: 0,
        longitude: 0,
        formattedAddress: "",
        success: false,
        error: "Address not found",
      }
    }

    const result = {
      latitude: Number.parseFloat(data[0].lat),
      longitude: Number.parseFloat(data[0].lon),
      formattedAddress: data[0].display_name,
      success: true,
    }

    // Cache the result
    geocodeCache.set(address.toLowerCase(), result)

    return result
  } catch (error) {
    console.error("Geocoding error:", error)
    return {
      latitude: 0,
      longitude: 0,
      formattedAddress: "",
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// Function to search for locations with autocomplete
export async function searchLocations(query: string): Promise<
  {
    id: string
    name: string
    description: string
  }[]
> {
  if (!query || query.length < 3) {
    return []
  }

  try {
    // Rate limiting
    const now = Date.now()
    const timeSinceLastRequest = now - lastRequestTime
    if (timeSinceLastRequest < MIN_REQUEST_GAP) {
      await wait(MIN_REQUEST_GAP - timeSinceLastRequest)
    }

    // Update last request time
    lastRequestTime = Date.now()

    const encodedQuery = encodeURIComponent(query)
    // Add viewbox parameter to restrict results to Kampen area
    // Kampen coordinates: approximately 52.55°N, 5.91°E
    // Using a 10km radius around Kampen
    const viewbox = "5.76,52.45,6.06,52.65" // left,bottom,right,top
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}&limit=5&viewbox=${viewbox}&bounded=1`,
      {
        headers: {
          "User-Agent": "Einsatz Platform/1.0",
          "Accept-Language": "en",
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Location search failed: ${response.statusText}`)
    }

    const data = await response.json()

    return data.map((item: any) => ({
      id: item.place_id,
      name: item.display_name.split(",")[0],
      description: item.display_name,
    }))
  } catch (error) {
    console.error("Location search error:", error)
    return []
  }
}

// Calculate distance between two points in miles using the Haversine formula
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  // Convert latitude and longitude from degrees to radians
  const radLat1 = (lat1 * Math.PI) / 180
  const radLon1 = (lon1 * Math.PI) / 180
  const radLat2 = (lat2 * Math.PI) / 180
  const radLon2 = (lon2 * Math.PI) / 180

  // Haversine formula
  const dLat = radLat2 - radLat1
  const dLon = radLon2 - radLon1
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(radLat1) * Math.cos(radLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  // Earth radius in miles
  const R = 3959

  // Distance in miles
  return R * c
}

// Format distance for display
export function formatDistance(distance: number | null): string {
  if (distance === null) return "Unknown distance"

  if (distance < 0.1) {
    return "Less than 0.1 miles away"
  } else if (distance < 1) {
    return `${(Math.round(distance * 10) / 10).toFixed(1)} miles away`
  } else {
    return `${distance.toFixed(1)} miles away`
  }
}

