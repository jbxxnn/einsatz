'use client'

import { useTranslation } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, HelpCircleIcon,LogOutIcon,  FolderIcon, SettingsIcon, MessageCircleIcon, MessageCircle, UserIcon, Menu, X } from "lucide-react"
import { useState } from "react"
import { useFreelancers } from "@/hooks/use-freelancers"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid"
import { IconSignature } from "@tabler/icons-react"

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

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
      <header className="py-4 md:py-8 px-4 md:px-[7%] w-full relative">
        <div className="flex items-center justify-between bg-[#0e2316] rounded-xl p-3 md:p-4 border border-[#3e4f454d]">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <LogoIcon />
            <div>
              <h1 className="text-lg md:text-xl font-bold font-mono">Einsatz</h1>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2">
          <div className="flex items-center gap-2 bg-[#3e4f4566] px-6 py-3 rounded-lg">
              <a href="/dashboard"><span className="text-xs">{t("home.navigation.dashboard")}</span></a>
            </div>
            <div className="flex items-center gap-2 bg-[#3e4f4566] px-6 py-3 rounded-lg">
              <a href="/freelancers"><span className="text-xs">{t("home.navigation.findFreelancers")}</span></a>
            </div>
            <div className="flex items-center gap-2 bg-[#3e4f4566] px-6 py-3 rounded-lg">
              <a href="#"><span className="text-xs">{t("home.navigation.learnMore")}</span></a>
            </div>
          </nav>

          {/* Desktop Action Buttons */}
          <div className="hidden md:flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" className="text-[#1A302B] bg-[#ecf7e9] hover:bg-[#33CC99] px-10 rounded-lg">
                {t("home.navigation.login")}
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-[#33CC99] text-[#1A302B] hover:bg-[#ecf7e9] px-10 rounded-lg">
                {t("home.navigation.openAccount")}
              </Button>
            </Link>
          </div>

          {/* Mobile Hamburger Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-[#3e4f4566] hover:bg-[#3e4f4588] transition-colors"
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6 text-white" />
            ) : (
              <Menu className="h-6 w-6 text-white" />
            )}
          </button>
        </div>

        {/* Mobile Slide-out Menu */}
        <div className={`fixed inset-y-0 right-0 z-50 w-80 bg-[#0e2316] border-l border-[#3e4f454d] transform transition-transform duration-300 ease-in-out md:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
          {/* Mobile Menu Header */}
          <div className="flex items-center justify-between p-6 border-b border-[#3e4f454d]">
            <div className="flex items-center gap-2">
              <LogoIcon />
              <h1 className="text-xl font-bold font-mono">Einsatz</h1>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 rounded-lg bg-[#3e4f4566] hover:bg-[#3e4f4588] transition-colors"
              aria-label="Close mobile menu"
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>

          {/* Mobile Menu Content */}
          <div className="flex flex-col h-full p-6">
            {/* Navigation Links */}
            <nav className="flex flex-col gap-4 mb-6">
            <a 
                href="/dashboard/" 
                className="flex items-center gap-3 p-4 rounded-lg bg-[#3e4f4566] hover:bg-[#3e4f4588] transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="text-white font-medium">{t("home.navigation.dashboard")}</span>
              </a>
              <a 
                href="/freelancers" 
                className="flex items-center gap-3 p-4 rounded-lg bg-[#3e4f4566] hover:bg-[#3e4f4588] transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="text-white font-medium">{t("home.navigation.findFreelancers")}</span>
              </a>
              <a 
                href="#" 
                className="flex items-center gap-3 p-4 rounded-lg bg-[#3e4f4566] hover:bg-[#3e4f4588] transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="text-white font-medium">{t("home.navigation.learnMore")}</span>
              </a>
            </nav>

            {/* Action Buttons - Positioned to stay visible */}
            <div className="flex flex-col gap-3 mt-auto pb-32">
              <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full text-[#1A302B] bg-[#ecf7e9] hover:bg-[#33CC99] py-3 rounded-lg font-medium">
                  {t("home.navigation.login")}
                </Button>
              </Link>
              {/* <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
                <Button className="w-full bg-[#33CC99] text-[#1A302B] hover:bg-[#ecf7e9] py-3 rounded-lg font-medium">
                  {t("home.navigation.openAccount")}
                </Button>
              </Link> */}
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </header>

      {/* Hero Section */}
      <section className="w-full flex items-center justify-center min-h-[60vh] md:min-h-[80vh] px-8">
        <div className="text-center space-y-8 max-w-4xl">
          {/* Company Label */}
          {/* <div className="text-sm uppercase tracking-wider text-gray-300 font-medium">
            Platform
          </div> */}
          
          {/* Main Headline */}
          <h1 className="text-5xl lg:text-7xl font-bold leading-tight text-white">
            {t("home.mainHero.title")}{' '}
            <span className="italic text-[#33CC99]">{t("home.mainHero.freelancing")}</span>{' '}
            {t("home.mainHero.titlePart2")}{' '}
            <span className="italic text-[#F2C94C]">{t("home.mainHero.better")}</span>
          </h1>
          
          {/* Description */}
          <p className="text-lg font-light text-gray-300 max-w-2xl mx-auto leading-relaxed">
            {t("home.mainHero.description")}
          </p>
          
          {/* CTA Button */}
          <div className="pt-4">
            <Link href="/freelancers">
              <Button size="lg" className="bg-[#33CC99] text-[#1A302B] hover:bg-[#2BB88A] px-8 py-4 text-lg font-semibold rounded-lg">
{t("home.mainHero.getStarted")}
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Star Elements */}
        
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

        {/* Freelancers */}
      <section className="w-full py-20 bg-gray-50">
        <div className="container mx-auto px-8">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="text-sm uppercase tracking-wider text-[#33CC99] font-semibold mb-4">
              {t("home.freelancers.title")}
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold leading-tight text-gray-900 mb-6">
              {t("home.freelancers.subtitle")}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t("home.freelancers.description")}
            </p>
          </div>

          {/* Freelancers BentoGrid */}
          {isLoading ? (
            // Loading skeletons using BentoGrid
            <BentoGrid className="mb-16">
              {Array.from({ length: 12 }, (_, i) => (
                <BentoGridItem
                  key={i}
                  title={<div className="h-6 w-32 bg-neutral-200 rounded animate-pulse"></div>}
                  description={<div className="h-4 w-24 bg-neutral-200 rounded animate-pulse"></div>}
                  header={
                    <div className="flex flex-col items-center justify-center h-full space-y-4 p-4">
                      <div className="w-32 h-32 bg-neutral-200 rounded-lg animate-pulse"></div>
                      <div className="h-6 w-32 bg-neutral-200 rounded animate-pulse"></div>
                      <div className="h-4 w-24 bg-neutral-200 rounded animate-pulse"></div>
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-12 bg-neutral-200 rounded animate-pulse"></div>
                        <div className="h-3 w-3 bg-neutral-200 rounded-full animate-pulse"></div>
                        <div className="h-3 w-16 bg-neutral-200 rounded animate-pulse"></div>
                      </div>
                    </div>
                  }
                  icon={<div className="h-4 w-4 bg-neutral-200 rounded animate-pulse"></div>}
                  className="h-full"
                />
              ))}
            </BentoGrid>
          ) : error ? (
            <div className="text-center text-gray-500 mb-16">
              {t("home.freelancers.unableToLoad")}
            </div>
          ) : freelancers.length === 0 ? (
            <div className="text-center text-gray-500 mb-16">
              {t("home.freelancers.noneAvailable")}
            </div>
          ) : (
            <BentoGrid className="mb-16">
              {freelancers.slice(0, 12).map((freelancer: any, i: number) => (
                <Link key={freelancer.id} href={`/freelancers/${freelancer.id}`}>
                  <BentoGridItem
                    title={`${freelancer.first_name} ${freelancer.last_name}`}
                    hour={freelancer.hourly_rate}
                    description={freelancer.job_offerings?.map((job: any) => job.category_name).join(', ') || t("home.freelancers.freelancer")}
                    header={
                      <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-lg bg-dot-black/[0.2] flex-col space-y-2">
                        {/* Profile Image */}
                        <div className="rounded-lg overflow-hidden">
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
                      </div>
                    }
                    icon={
                      <IconSignature className="h-4 w-4 text-neutral-500" />
                    }
                    className="h-full hover:shadow-lg transition-all duration-200 cursor-pointer"
                  />
                </Link>
              ))}
            </BentoGrid>
          )}
        </div>
      </section>

      {/* CTA Banner
    {/*   <section className="w-full py-16 bg-[#1A302B] relative overflow-hidden">
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
      <section className="w-full py-20 bg-white">
        <div className="container mx-auto px-8">
          // Header Area
          <div className="flex flex-col lg:flex-row items-start gap-12 mb-16">
            // Left Side - Title
            <div className="flex-1">
              <div className="text-sm uppercase tracking-wider text-[#33CC99] font-semibold mb-4">
                {t("home.whyChoose.title")}
              </div>
              <h2 className="text-4xl lg:text-5xl font-bold leading-tight text-gray-900">
                {t("home.whyChoose.subtitle")}
              </h2>
            </div>
            
            // Right Side - Description
            <div className="flex-1">
              <p className="text-lg text-gray-600 leading-relaxed">
                {t("home.whyChoose.description")}
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
                {t("home.whyChoose.directBooking.title")}
              </h3>
              
              // Description
              <p className="text-gray-600 text-center mb-6">
                {t("home.whyChoose.directBooking.description")}
              </p>
              
              // Action Button
              <div className="flex justify-center">
                <button 
                  className="w-10 h-10 border border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors"
                  aria-label={t("home.whyChoose.directBooking.ariaLabel")}
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
                {t("home.whyChoose.dbaSecurity.title")}
              </h3>
              
              // Description
              <p className="text-gray-600 text-center mb-6">
                {t("home.whyChoose.dbaSecurity.description")}
              </p>
              
              // Action Button
              <div className="flex justify-center">
                <button 
                  className="w-10 h-10 border border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors"
                  aria-label={t("home.whyChoose.dbaSecurity.ariaLabel")}
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
                {t("home.whyChoose.securePlatform.title")}
              </h3>
              
              // Description
              <p className="text-[#1A302B] text-center mb-6">
                {t("home.whyChoose.securePlatform.description")}
              </p>
              
              // Action Button
              <div className="flex justify-center">
                <button 
                  className="w-10 h-10 bg-[#33CC99] rounded-full flex items-center justify-center hover:bg-[#2BB88A] transition-colors"
                  aria-label={t("home.whyChoose.securePlatform.ariaLabel")}
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H7M17 7V17" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full bg-gray-50 border-t border-gray-200">
        {/* Upper Footer Section */}
        <div className="container mx-auto px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            {/* Left Side - Logo and Address */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-2">
              {/* <LogoIcon /> */}
              <div>
              <h1 className="text-xl font-bold font-mono text-[#000000]">Einsatz</h1>
            </div>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">
                {t("home.footer.description")}
              </p>
            </div>

            {/* Navigation Links */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">{t("home.footer.account")}</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="/profile" className="hover:text-[#33CC99] transition-colors">{t("home.footer.profile")}</a></li>
                <li><a href="/dashboard" className="hover:text-[#33CC99] transition-colors">{t("home.footer.dashboard")}</a></li>
                <li><a href="/bookings" className="hover:text-[#33CC99] transition-colors">{t("home.footer.bookings")}</a></li>
                <li><a href="/payments" className="hover:text-[#33CC99] transition-colors">{t("home.footer.payments")}</a></li>
                <li><a href="/settings" className="hover:text-[#33CC99] transition-colors">{t("home.footer.settings")}</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-4">{t("home.footer.help")}</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="/support" className="hover:text-[#33CC99] transition-colors">{t("home.footer.support")}</a></li>
                <li><a href="/faq" className="hover:text-[#33CC99] transition-colors">{t("home.footer.faq")}</a></li>
                <li><a href="/blog" className="hover:text-[#33CC99] transition-colors">{t("home.footer.blog")}</a></li>
                <li><a href="/contact" className="hover:text-[#33CC99] transition-colors">{t("home.footer.contact")}</a></li>
                <li><a href="/community" className="hover:text-[#33CC99] transition-colors">{t("home.footer.community")}</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-4">{t("home.footer.platform")}</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="/freelancers" className="hover:text-[#33CC99] transition-colors">{t("home.footer.findFreelancers")}</a></li>
                <li><a href="/job-offerings" className="hover:text-[#33CC99] transition-colors">{t("home.footer.jobOfferings")}</a></li>
                <li><a href="/categories" className="hover:text-[#33CC99] transition-colors">{t("home.footer.categories")}</a></li>
                <li><a href="/dba" className="hover:text-[#33CC99] transition-colors">{t("home.footer.dbaCompliance")}</a></li>
                <li><a href="/security" className="hover:text-[#33CC99] transition-colors">{t("home.footer.security")}</a></li>
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
                {t("home.footer.copyright")}
              </div>

              {/* Legal Links */}
              <div className="flex items-center gap-6 text-sm text-gray-600">
                <a href="/privacy" className="hover:text-[#33CC99] transition-colors">{t("home.footer.privacyPolicy")}</a>
                <div className="w-px h-4 bg-gray-300"></div>
                <a href="/terms" className="hover:text-[#33CC99] transition-colors">{t("home.footer.termsOfUse")}</a>
                <div className="w-px h-4 bg-gray-300"></div>
                <a href="/disclosure" className="hover:text-[#33CC99] transition-colors">{t("home.footer.disclosure")}</a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Support Chat Icon */}
      <div className="fixed bottom-8 right-8">
        <button 
          className="w-12 h-12 bg-[#33CC99] rounded-full flex items-center justify-center shadow-lg hover:bg-[#2BB88A] transition-colors"
          aria-label={t("home.footer.supportChat")}
        >
          <MessageCircle className="w-6 h-6 text-[#1A302B]" />
        </button>
      </div>
      </div>
    </div>
  )
}
