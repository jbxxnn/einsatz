'use client'

import { useTranslation } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, MessageCircle } from "lucide-react"
import { useFreelancers } from "@/hooks/use-freelancers"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"

const LogoIcon = (props: React.SVGProps<SVGSVGElement>) => (

  <svg 
  // xmlns:xlink="http://www.w3.org/1999/xlink" 
  xmlns="http://www.w3.org/2000/svg" 
  id="Layer_1" 
  viewBox="20 -30 300 380.6" 
  width="auto" 
  height="50">
    
    <path fill="#33CC99" d="M72.48,211.58v-91.22l-59.89-30.97c-3.82-1.9-8.33.79-8.33,5.03v129.28c0,5.12,2.86,9.72,7.46,12.06l109.19,56.31c3.82,1.9,8.24-.79,8.24-5.03v-38.06l-49.64-25.6c-7.03-5.19-7.03-10.89-7.03-11.8Z"></path>
    <path fill="#33CC99" d="M165.53,215.71V71.85L80.82,28.04c-3.82-2-8.33.78-8.33,5.12v87.29l49.38,25.51c4.51,2.34,7.29,7.03,7.29,12.15v90.96l84.8,43.64c3.82,1.9,8.33-.87,8.33-5.12v-34.65l-49.64-25.6c-4.43-2.26-7.12-6.77-7.12-11.63Z"></path>
    <path fill="#33CC99" d="M299.55,72.45L173.86,7.56c-3.82-2-8.33.79-8.33,5.12v59.17l49.65,25.68c4.34,2.26,7.11,6.68,7.11,11.54v143.85l76.12,39.22c3.82,1.9,8.42-.87,8.42-5.12V84.34c0-5.03-2.87-9.63-7.29-11.89Z"></path>
    </svg>
  
      )

export default function Home() {
  const { t } = useTranslation()
  const { data, error, isLoading } = useFreelancers({})
  const freelancers = (data as any)?.freelancers || []

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
      <header className="py-8 px-[7%] w-full">
        <div className="flex items-center justify-between bg-[#0e2316] rounded-xl p-4 border border-[#3e4f454d]">
          {/* Logo */}
          <div className="flex items-center gap-2">
            {/* <div className="w-3 h-3 bg-[#33CC99] rounded-full flex items-center justify-center animate-pulse" > */}
              <LogoIcon />
            {/* </div> */}
            <div>
              <h1 className="text-xl font-bold font-mono">Einsatz</h1>
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
      <section className="w-full flex items-center justify-center min-h-[80vh] px-8">
        <div className="text-center space-y-8 max-w-4xl">
          {/* Company Label */}
          {/* <div className="text-sm uppercase tracking-wider text-gray-300 font-medium">
            Platform
          </div> */}
          
          {/* Main Headline */}
          <h1 className="text-5xl lg:text-7xl font-bold leading-tight text-white">
            Let's change{' '}
            <span className="italic text-[#33CC99]">freelancing</span>{' '}
            for the{' '}
            <span className="italic text-[#F2C94C]">better</span>
          </h1>
          
          {/* Description */}
          <p className="text-lg font-light text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Connect with skilled professionals and build amazing projects together. 
            We're making freelance work accessible to everyone.
          </p>
          
          {/* CTA Button */}
          <div className="pt-4">
            <Link href="/register">
              <Button size="lg" className="bg-[#33CC99] text-[#1A302B] hover:bg-[#2BB88A] px-8 py-4 text-lg font-semibold rounded-lg">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Star Elements */}
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex items-center gap-8">
          {/* Left Star */}
          <div className="w-4 h-4">
            <svg viewBox="0 0 24 24" fill="#33CC99" className="w-full h-full opacity-60">
              <path d="M12 2L15.09 8.26L22 9L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9L8.91 8.26L12 2Z"/>
            </svg>
          </div>
          
          {/* Center Star */}
          <div className="w-6 h-6">
            <svg viewBox="0 0 24 24" fill="#F2C94C" className="w-full h-full">
              <path d="M12 2L15.09 8.26L22 9L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9L8.91 8.26L12 2Z"/>
            </svg>
          </div>
          
          {/* Right Star */}
          <div className="w-4 h-4">
            <svg viewBox="0 0 24 24" fill="#33CC99" className="w-full h-full opacity-60">
              <path d="M12 2L15.09 8.26L22 9L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9L8.91 8.26L12 2Z"/>
            </svg>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      {/* <section className="w-full py-20 bg-white">
        <div className="container mx-auto px-8">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            // Left Column
            <div className="flex-1 space-y-8">
              // Section Label
              <div className="text-sm uppercase tracking-wider text-[#33CC99] font-semibold">
                What We Do
              </div>
              
              // Main Headline
              <h2 className="text-4xl lg:text-5xl font-bold leading-tight text-gray-900">
                Change the way world
                <br />
                connects with talent
              </h2>
              
              // Team Photo Placeholder
              <div className="w-full h-64 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <div className="w-16 h-16 bg-[#33CC99] rounded-full mx-auto mb-4 flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <p className="text-sm">Team collaboration image</p>
                </div>
              </div>
            </div>

            // Right Column
            <div className="flex-1 space-y-8 justify-center items-center">
              // Description Text
              <div className="space-y-6 text-gray-700 leading-relaxed">
                <p className="text-lg">
                  We're building the platform infrastructure to make freelance work easy to find, 
                  quick to access, and open to all professionals and businesses. Our mission is to 
                  empower freelancers and clients to connect seamlessly, regardless of their background 
                  or experience level.
                </p>
                
                <p className="text-lg">
                  Through our innovative platform, we enable businesses to bring their vision to life 
                  by connecting them with skilled professionals who can execute their projects 
                  efficiently and effectively. We believe in creating opportunities for everyone.
                </p>
              </div>
              
              // Statistics
              <div className="flex gap-12 pt-8">
                <div className="text-center">
                  <div className="text-4xl font-bold text-gray-900 mb-2">500+</div>
                  <div className="text-sm text-gray-600">Active freelancers</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-gray-900 mb-2">2y+</div>
                  <div className="text-sm text-gray-600">Years in operation</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section> */}

        {/* // Our Team Section */}
      {/* <section className="w-full py-20 bg-gray-50">
        <div className="container mx-auto px-8">
          // Section Header
          <div className="text-center mb-16">
            <div className="text-sm uppercase tracking-wider text-[#33CC99] font-semibold mb-4">
              Our Freelancers
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold leading-tight text-gray-900 mb-6">
              Amazing people behind
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our talented freelancers have years of combined experience across various industries and skills.
            </p>
          </div>

          // Freelancers Grid
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {isLoading ? (
              // Loading skeletons
              Array.from({ length: 12 }, (_, i) => (
                <div key={i} className="text-center">
                  <Skeleton className="w-48 h-48 mx-auto mb-4 rounded-lg" />
                  <Skeleton className="h-6 w-32 mx-auto mb-2" />
                  <Skeleton className="h-4 w-24 mx-auto mb-4" />
                  <div className="flex items-center justify-center gap-2">
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-3 w-3 rounded-full" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ))
            ) : error ? (
              <div className="col-span-full text-center text-gray-500">
                Unable to load freelancers
              </div>
            ) : freelancers.length === 0 ? (
              <div className="col-span-full text-center text-gray-500">
                No freelancers available
              </div>
            ) : (
              freelancers.slice(0, 12).map((freelancer: any) => (
                <div key={freelancer.id} className="text-center">
                  // Profile Image
                  <div className="w-48 h-48 mx-auto mb-4 rounded-lg overflow-hidden">
                    <Avatar className="w-full h-full">
                      <AvatarImage 
                        src={freelancer.avatar_url || "/placeholder-user.jpg"} 
                        alt={`${freelancer.first_name} ${freelancer.last_name}`} 
                      />
                      <AvatarFallback className="w-full h-full text-2xl bg-gradient-to-br from-gray-200 to-gray-300">
                        {freelancer.first_name?.[0]}{freelancer.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  
                  // Name
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {freelancer.first_name} {freelancer.last_name}
                  </h3>
                  
                  // Role - Show first job category or default
                  <p className="text-gray-600 mb-4">
                    {freelancer.job_offerings?.[0]?.category_name || 'Freelancer'}
                  </p>
                  
                  // Contact Links
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <a href={`mailto:${freelancer.email}`} className="text-gray-700 hover:text-[#33CC99] underline">EMAIL</a>
                    <div className="w-1 h-1 bg-[#33CC99] rounded-full"></div>
                    <Link href={`/freelancers/${freelancer.id}`} className="text-gray-700 hover:text-[#33CC99] underline">PROFILE</Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      // CTA Banner
      <section className="w-full py-16 bg-[#1A302B] relative overflow-hidden">
        Background Pattern
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `repeating-linear-gradient(45deg, #33CC99, #33CC99 2px, transparent 2px, transparent 8px)`,
            backgroundSize: '8px 8px'
          }}></div>
        </div>
        
        <div className="container mx-auto px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            Left Content
            <div className="flex items-center gap-6">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-[#1A302B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Join our platform now!</h3>
                <p className="text-gray-300">You'll be joining a community where you can showcase your skills and grow your business.</p>
              </div>
            </div>
            
            // Right Button
            <Link href="/register?type=freelancer">
              <Button size="lg" className="bg-white text-[#1A302B] hover:bg-gray-100 px-8 py-4 text-lg font-semibold rounded-lg">
                Join Now
              </Button>
            </Link>
          </div>
        </div>
      </section> */}

      {/* // Why Choose Einsatz Section */}
      {/* <section className="w-full py-20 bg-white">
        <div className="container mx-auto px-8">
          // Header Area
          <div className="flex flex-col lg:flex-row items-start gap-12 mb-16">
            // Left Side - Title
            <div className="flex-1">
              <div className="text-sm uppercase tracking-wider text-[#33CC99] font-semibold mb-4">
                Why Choose Einsatz
              </div>
              <h2 className="text-4xl lg:text-5xl font-bold leading-tight text-gray-900">
                Our values reflect
                <br />
                experience
              </h2>
            </div>
            
            // Right Side - Description
            <div className="flex-1">
              <p className="text-lg text-gray-600 leading-relaxed">
                We provide a comprehensive freelance platform that prioritizes security, 
                transparency, and seamless booking experiences for both freelancers and clients.
              </p>
            </div>
          </div>

          // Feature Cards
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            // Card 1 - Direct Booking
            <div className="bg-white border border-gray-200 rounded-lg p-8 hover:shadow-lg transition-shadow">
              // Icon
              <div className="w-12 h-12 mx-auto mb-6 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              
              // Title
              <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
                Direct Booking
              </h3>
              
              // Description
              <p className="text-gray-600 text-center mb-6">
                Skip the middleman and connect directly with skilled freelancers. 
                Our streamlined booking process ensures quick, efficient project initiation.
              </p>
              
              // Action Button
              <div className="flex justify-center">
                <button 
                  className="w-10 h-10 border border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors"
                  aria-label="Learn more about Direct Booking"
                >
                  <svg className="w-4 h-4 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H7M17 7V17" />
                  </svg>
                </button>
              </div>
            </div>

            // Card 2 - Security within the DBA Act
            <div className="bg-white border border-gray-200 rounded-lg p-8 hover:shadow-lg transition-shadow">
              // Icon
              <div className="w-12 h-12 mx-auto mb-6 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              
              // Title
              <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
                Security within the DBA Act
              </h3>
              
              // Description
              <p className="text-gray-600 text-center mb-6">
                Full compliance with the Dutch Business Act (DBA) ensures legal protection 
                and secure transactions for all parties involved in freelance work.
              </p>
              
              // Action Button
              <div className="flex justify-center">
                <button 
                  className="w-10 h-10 border border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors"
                  aria-label="Learn more about DBA Act Security"
                >
                  <svg className="w-4 h-4 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H7M17 7V17" />
                  </svg>
                </button>
              </div>
            </div>

            // Card 3 - Secure Platform
            <div className="bg-[#f8f9fa] border border-[#33CC99] rounded-lg p-8 hover:shadow-lg transition-shadow relative">
              // Special corner accent
              <div className="absolute top-0 right-0 w-8 h-8 bg-[#33CC99] rounded-bl-lg"></div>
              
              // Icon
              <div className="w-12 h-12 mx-auto mb-6 flex items-center justify-center">
                <svg className="w-8 h-8 text-[#33CC99]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              
              // Title
              <h3 className="text-xl font-bold text-[#33CC99] mb-4 text-center">
                Secure Platform
              </h3>
              
              // Description
              <p className="text-[#1A302B] text-center mb-6">
                Advanced security measures protect your data and transactions. 
                Our platform ensures safe, reliable connections between freelancers and clients.
              </p>
              
              // Action Button
              <div className="flex justify-center">
                <button 
                  className="w-10 h-10 bg-[#33CC99] rounded-full flex items-center justify-center hover:bg-[#2BB88A] transition-colors"
                  aria-label="Learn more about Secure Platform"
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H7M17 7V17" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section> */}

      {/* Footer */}
      <footer className="w-full bg-gray-50 border-t border-gray-200">
        {/* Upper Footer Section */}
        <div className="container mx-auto px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            {/* Left Side - Logo and Address */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-[#33CC99] rounded-lg flex items-center justify-center">
                  <span className="text-[#1A302B] font-bold text-sm">E</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#1A302B]">Einsatz</h3>
                  <p className="text-xs text-gray-500">Freelance Platform</p>
                </div>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">
                Connecting skilled professionals with businesses.<br />
                Building the future of freelance work.
              </p>
            </div>

            {/* Navigation Links */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Account</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="/profile" className="hover:text-[#33CC99] transition-colors">Profile</a></li>
                <li><a href="/dashboard" className="hover:text-[#33CC99] transition-colors">Dashboard</a></li>
                <li><a href="/bookings" className="hover:text-[#33CC99] transition-colors">Bookings</a></li>
                <li><a href="/payments" className="hover:text-[#33CC99] transition-colors">Payments</a></li>
                <li><a href="/settings" className="hover:text-[#33CC99] transition-colors">Settings</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Help</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="/support" className="hover:text-[#33CC99] transition-colors">Support</a></li>
                <li><a href="/faq" className="hover:text-[#33CC99] transition-colors">FAQ</a></li>
                <li><a href="/blog" className="hover:text-[#33CC99] transition-colors">Blog</a></li>
                <li><a href="/contact" className="hover:text-[#33CC99] transition-colors">Contact</a></li>
                <li><a href="/community" className="hover:text-[#33CC99] transition-colors">Community</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="/freelancers" className="hover:text-[#33CC99] transition-colors">Find Freelancers</a></li>
                <li><a href="/job-offerings" className="hover:text-[#33CC99] transition-colors">Job Offerings</a></li>
                <li><a href="/categories" className="hover:text-[#33CC99] transition-colors">Categories</a></li>
                <li><a href="/dba" className="hover:text-[#33CC99] transition-colors">DBA Compliance</a></li>
                <li><a href="/security" className="hover:text-[#33CC99] transition-colors">Security</a></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Footer Section */}
        <div className="border-t border-gray-200">
          <div className="container mx-auto px-8 py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Copyright */}
              <div className="text-sm text-gray-500">
                © Einsatz Platform 2024. All rights reserved.
              </div>

              {/* Legal Links */}
              <div className="flex items-center gap-6 text-sm text-gray-600">
                <a href="/privacy" className="hover:text-[#33CC99] transition-colors">Privacy Policy</a>
                <div className="w-px h-4 bg-gray-300"></div>
                <a href="/terms" className="hover:text-[#33CC99] transition-colors">Terms of Use</a>
                <div className="w-px h-4 bg-gray-300"></div>
                <a href="/disclosure" className="hover:text-[#33CC99] transition-colors">Disclosure</a>
              </div>
            </div>
          </div>
        </div>
      </footer>

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
