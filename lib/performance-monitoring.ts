// Simple performance monitoring utility

// Store initial load time
let initialLoadTime = 0
let firstContentfulPaint = 0
let timeToInteractive = 0

// Initialize performance monitoring
export function initPerformanceMonitoring() {
  if (typeof window !== "undefined") {
    // Record initial load time
    initialLoadTime = Date.now()

    // Listen for first contentful paint
    const observer = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (entry.name === "first-contentful-paint") {
          firstContentfulPaint = entry.startTime
          console.log(`First Contentful Paint: ${Math.round(firstContentfulPaint)}ms`)
        }
      }
    })

    observer.observe({ type: "paint", buffered: true })

    // Approximate Time to Interactive
    window.addEventListener("load", () => {
      setTimeout(() => {
        timeToInteractive = Date.now() - initialLoadTime
        console.log(`Approximate Time to Interactive: ${timeToInteractive}ms`)

        // Send metrics to analytics or logging service
        logPerformanceMetrics({
          initialLoadTime,
          firstContentfulPaint,
          timeToInteractive,
          url: window.location.pathname,
        })
      }, 100)
    })
  }
}

// Log performance metrics
function logPerformanceMetrics(metrics: any) {
  // In a real app, send these metrics to your analytics service
  console.log("Performance Metrics:", metrics)

  // Example: Send to a hypothetical API endpoint
  // fetch('/api/performance-metrics', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(metrics),
  // });
}

// Track component render time
export function trackComponentRender(componentName: string) {
  const startTime = performance.now()

  return () => {
    const endTime = performance.now()
    const renderTime = endTime - startTime
    console.log(`Component ${componentName} rendered in ${Math.round(renderTime)}ms`)
  }
}
