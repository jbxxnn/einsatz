"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, Database, Clock, TrendingDown } from 'lucide-react'

interface PerformanceMetrics {
  totalApiCalls: number
  cacheHits: number
  lastRefresh: Date
  estimatedEgressSaved: number // in MB
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    totalApiCalls: 0,
    cacheHits: 0,
    lastRefresh: new Date(),
    estimatedEgressSaved: 0
  })

  useEffect(() => {
    // Track actual API calls by intercepting fetch
    const originalFetch = window.fetch
    let callCount = 0
    
    window.fetch = function(...args) {
      callCount++
      console.log('🌐 Fetch call #', callCount, 'at:', new Date().toLocaleTimeString(), 'to:', args[0])
      
      // Update metrics
      setMetrics(prev => ({
        ...prev,
        totalApiCalls: callCount,
        lastRefresh: new Date()
      }))
      
      return originalFetch.apply(this, args)
    }
    
    // This is a simple demo - in production you'd want to track actual metrics
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        cacheHits: prev.cacheHits + Math.floor(Math.random() * 3), // Simulate cache hits
        estimatedEgressSaved: prev.estimatedEgressSaved + 0.5 // Simulate MB saved
      }))
    }, 30000) // Update every 30 seconds

    return () => {
      clearInterval(interval)
      window.fetch = originalFetch // Restore original fetch
    }
  }, [])

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <TrendingDown className="h-4 w-4" />
          Performance Monitor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            <Database className="h-3 w-3" />
            API Calls
          </span>
          <Badge variant="outline">{metrics.totalApiCalls}</Badge>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            <RefreshCw className="h-3 w-3" />
            Cache Hits
          </span>
          <Badge variant="secondary">{metrics.cacheHits}</Badge>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            <Clock className="h-3 w-3" />
            Last Refresh
          </span>
          <span className="text-xs text-gray-600">
            {metrics.lastRefresh.toLocaleTimeString()}
          </span>
        </div>
        
        <div className="pt-2 border-t">
          <div className="text-xs text-green-600 font-medium">
            Estimated Egress Saved: {metrics.estimatedEgressSaved.toFixed(1)} MB
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
