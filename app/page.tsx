'use client'

import { Hero } from "@/components/animated-hero"

export default function Home() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] transform bg-white bg-[radial-gradient(60%_120%_at_50%_50%,hsla(0,0%,100%,0)_0,rgba(252,205,238,.5)_100%)]">
      <section className="w-full">
        <Hero />
      </section>
    </div>
  )
}
