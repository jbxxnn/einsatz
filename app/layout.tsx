import type React from "react"
import { GeistSans } from "geist/font/sans"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from "@/components/theme-provider"
import OptimizedHeader from "@/components/optimized-header"
import Footer from "@/components/footer"
import { OptimizedSupabaseProvider } from "@/components/optimized-supabase-provider"
import { OptimizedUserProvider } from "@/components/optimized-user-provider"
import { Suspense } from "react"
import PerformanceMonitor from "@/components/performance-monitor"
import { QueryProvider } from "@/components/query-provider"

export const metadata = {
  title: "Einsatz - Instant Freelancer Booking",
  description: "Book local, in-person freelancers for urgent jobs instantly",
}

// Simple loading skeleton for the main content
function LoadingSkeleton() {
  return (
    <div className="container py-10 space-y-4">
      <div className="h-8 w-1/3 bg-muted animate-pulse rounded-md"></div>
      <div className="h-4 w-2/3 bg-muted animate-pulse rounded-md"></div>
      <div className="h-4 w-1/2 bg-muted animate-pulse rounded-md"></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 bg-muted animate-pulse rounded-md"></div>
        ))}
      </div>
    </div>
  )
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${GeistSans.className} min-h-screen flex flex-col`}>
        <OptimizedSupabaseProvider>
          <OptimizedUserProvider>
            <QueryProvider>
              <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
                {/* <OptimizedHeader /> */}
                <main className="flex-1">
                  <Suspense fallback={<LoadingSkeleton />}>{children}</Suspense>
                </main>
                {/* <Footer /> */}
                <Toaster />
                <PerformanceMonitor />
              </ThemeProvider>
            </QueryProvider>
          </OptimizedUserProvider>
        </OptimizedSupabaseProvider>
      </body>
    </html>
  )
}
