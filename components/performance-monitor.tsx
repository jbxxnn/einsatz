"use client"

import { useEffect } from "react"
import { initPerformanceMonitoring } from "@/lib/performance-monitoring"

export default function PerformanceMonitor() {
  useEffect(() => {
    initPerformanceMonitoring()
  }, [])

  // This is a utility component that doesn't render anything
  return null
}
