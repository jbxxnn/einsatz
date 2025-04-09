import type React from "react"
import { GeistSans } from "geist/font/sans"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { SupabaseProvider } from "@/components/supabase-provider"
import { UserProvider } from "@/components/user-provider"

export const metadata = {
  title: "Einsatz - Instant Freelancer Booking",
  description: "Book local, in-person freelancers for urgent jobs instantly",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${GeistSans.className} min-h-screen flex flex-col`}>
        <SupabaseProvider>
          <UserProvider>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
              <Header />
              <main className="main-container">{children}</main>
              <Footer />
              <Toaster />
            </ThemeProvider>
          </UserProvider>
        </SupabaseProvider>
      </body>
    </html>
  )
}
