"use client"

import { getCoverTemplate } from "@/lib/cover-templates"
import type { CoverTemplate } from "@/components/cover-template-selector"

interface CoverPreviewProps {
  templateId: string | null
  freelancerName?: string
  className?: string
}

export default function CoverPreview({ 
  templateId, 
  freelancerName = "Freelancer",
  className = "" 
}: CoverPreviewProps) {
  const template = getCoverTemplate(templateId)
  
  if (!template) {
    return (
      <div className={`h-32 bg-gradient-to-r from-slate-800 to-slate-900 rounded-lg ${className}`}>
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
      </div>
    )
  }

  return (
    <div 
      className={`h-32 rounded-lg relative overflow-hidden ${className}`}
      style={{
        background: template.pattern,
        backgroundSize: template.id.includes("gradient") ? "cover" : "20px 20px"
      }}
    >
      {/* Pattern Overlay */}
      <div className="absolute inset-0 opacity-20">
        <div className="w-full h-full" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>

      {/* Optional: Add freelancer name overlay */}
      {freelancerName && (
        <div className="absolute bottom-4 left-4 text-white">
          <h3 className="text-lg font-semibold drop-shadow-lg">{freelancerName}</h3>
        </div>
      )}
    </div>
  )
} 