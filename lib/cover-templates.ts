import { COVER_TEMPLATES, type CoverTemplate } from "@/components/cover-template-selector"

export function getCoverTemplate(templateId: string | null): CoverTemplate | null {
  if (!templateId) return null
  return COVER_TEMPLATES.find(template => template.id === templateId) || null
}

export function getDefaultCoverTemplate(): CoverTemplate {
  return COVER_TEMPLATES[0] // Modern Gradient as default
}

export function renderCoverBackground(templateId: string | null): React.CSSProperties {
  const template = getCoverTemplate(templateId) || getDefaultCoverTemplate()
  
  return {
    background: template.pattern,
    backgroundSize: template.id.includes("gradient") ? "cover" : "20px 20px"
  }
}

export function getCoverColors(templateId: string | null) {
  const template = getCoverTemplate(templateId) || getDefaultCoverTemplate()
  return template.colors
}

export { COVER_TEMPLATES }
export type { CoverTemplate } 