'use client'

import { useTranslation } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, MessageCircle } from "lucide-react"

export default function Home() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-[#0e2316] text-white relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/Hero-BG-Pattern-31kpi5Kk.webp)'
        }}
      ></div>
      
      {/* Dark Overlay for better text readability */}
      <div className="absolute inset-0 bg-[#0e2316]/20"></div>
      
      {/* Content */}
      <div className="relative z-10">
      {/* Header */}
      <header className="py-8 px-[15%] w-full">
        <div className="flex items-center justify-between bg-[#0e2316] rounded-xl p-4 border border-[#3e4f454d]">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-[#33CC99] rounded-full flex items-center justify-center animate-pulse" >
              {/* <span className="text-[#1A302B] font-bold text-sm">E</span> */}
            </div>
            <div>
              <h1 className="text-xl font-bold">Einsatz</h1>
              <p className="text-xs text-gray-300">Freelance Platform</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            <div className="flex items-center gap-2 bg-[#3e4f4566] px-6 py-3 rounded-lg">
              <a href="/freelancers"><span className="text-xs">Find Freelancers</span></a>
            </div>
            <div className="flex items-center gap-2 bg-[#3e4f4566] px-6 py-3 rounded-lg">
              <a href="/login"><span className="text-xs">Jobs Offerings</span></a>
            </div>
            <div className="flex items-center gap-2 bg-[#3e4f4566] px-6 py-3 rounded-lg">
              <a href="#"><span className="text-xs">Learn more</span></a>
            </div>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" className="text-[#1A302B] bg-[#ecf7e9] hover:bg-[#33CC99] px-10 rounded-lg">
                Login
              </Button>
            </Link>
            <Link href="/register">
            <Button className="bg-[#33CC99] text-[#1A302B] hover:bg-[#ecf7e9] px-10 rounded-lg">
              Open an account
            </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="w-full px-8 py-20">
        
        <div className="container mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            {/* Left Side - Text Content */}
            <div className="flex-1 space-y-8">
              <div className="space-y-4">
                <h1 className="text-5xl lg:text-5xl font-semibold leading-tight font-playfair">
                  <span className="block">
                  Connect with skilled professionals for your projects.</span>
                </h1>
              </div>
              
              <p className="text-lg font-regular text-white max-w-2xl leading-relaxed font-helvetica">
              Freelancers with commitment. Locally and directly deployable.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/freelancers">
                  <Button size="lg" className="bg-[#33CC99] text-[#1A302B] hover:bg-[#2BB88A] px-8 py-4 text-lg font-semibold">
                  Find Freelancers <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Side - Visual Collage */}
            <div className="flex-1 relative">
              <div className="relative w-full h-[600px]">
                {/* Abstract Shape Container */}
                <div className="absolute inset-0">
                  <svg viewBox="0 0 600 600" className="w-full h-full">
                    <defs>
                      <linearGradient id="shapeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#33CC99" stopOpacity="0.1" />
                        <stop offset="100%" stopColor="#F2C94C" stopOpacity="0.1" />
                      </linearGradient>
                    </defs>
                    
                    {/* Main abstract shape */}
                    <path
                      d="M50 100 L200 50 L350 80 L450 150 L500 300 L450 450 L300 500 L150 480 L80 350 L50 100 Z"
                      fill="url(#shapeGradient)"
                      stroke="#33CC99"
                      strokeWidth="2"
                      opacity="0.3"
                    />
                    
                    {/* Additional geometric elements */}
                    <rect x="100" y="120" width="120" height="80" fill="#33CC99" opacity="0.2" rx="8" />
                    <polygon points="300,200 350,150 400,200 350,250" fill="#F2C94C" opacity="0.2" />
                    <circle cx="400" cy="350" r="60" fill="#33CC99" opacity="0.15" />
                  </svg>
                </div>

                {/* Image Placeholders */}
                <div className="absolute top-20 left-20 w-32 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg shadow-lg">
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-white text-xs font-medium">Freelancers</span>
                  </div>
                </div>

                <div className="absolute top-40 left-40 w-40 h-32 bg-gradient-to-br from-green-400 to-green-600 rounded-lg shadow-lg">
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-white text-xs font-medium">Projects</span>
                  </div>
                </div>

                <div className="absolute top-60 right-20 w-48 h-36 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg shadow-lg">
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-white text-xs font-medium">Collaboration</span>
                  </div>
                </div>

                <div className="absolute bottom-40 left-60 w-36 h-28 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg shadow-lg">
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-white text-xs font-medium">Success</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Support Chat Icon */}
      <div className="fixed bottom-8 right-8">
        <button 
          className="w-12 h-12 bg-[#33CC99] rounded-full flex items-center justify-center shadow-lg hover:bg-[#2BB88A] transition-colors"
          aria-label="Support chat"
        >
          <MessageCircle className="w-6 h-6 text-[#1A302B]" />
        </button>
      </div>
      </div>
    </div>
  )
}
