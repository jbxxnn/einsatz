import { createClient } from "@/lib/supabase/client"

export interface PlatformTerms {
  id: string
  content: string
  version: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface FreelancerTerms {
  id: string
  freelancer_id: string
  content: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export class TermsAPI {
  private supabase = createClient()

  /**
   * Get active platform terms
   */
  async getPlatformTerms(): Promise<PlatformTerms | null> {
    const { data, error } = await this.supabase
      .from("platform_terms")
      .select("*")
      .eq("is_active", true)
      .single()

    if (error) {
      console.error("Error fetching platform terms:", error)
      return null
    }

    return data
  }

  /**
   * Get freelancer's custom terms
   */
  async getFreelancerTerms(freelancerId: string): Promise<FreelancerTerms | null> {
    const { data, error } = await this.supabase
      .from("freelancer_terms")
      .select("*")
      .eq("freelancer_id", freelancerId)
      .eq("is_active", true)
      .single()

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching freelancer terms:", error)
      return null
    }

    return data
  }

  /**
   * Get terms for a specific freelancer (custom or platform)
   */
  async getTermsForFreelancer(freelancerId: string): Promise<{
    terms: PlatformTerms | FreelancerTerms | null
    isCustom: boolean
  }> {
    // First check if freelancer uses custom terms
    const { data: profile, error: profileError } = await this.supabase
      .from("profiles")
      .select("use_custom_terms")
      .eq("id", freelancerId)
      .single()

    if (profileError) {
      console.error("Error fetching profile:", profileError)
      return { terms: null, isCustom: false }
    }

    if (profile.use_custom_terms) {
      const customTerms = await this.getFreelancerTerms(freelancerId)
      if (customTerms) {
        return { terms: customTerms, isCustom: true }
      }
    }

    // Fallback to platform terms
    const platformTerms = await this.getPlatformTerms()
    return { terms: platformTerms, isCustom: false }
  }

  /**
   * Create or update freelancer custom terms
   */
  async saveFreelancerTerms(
    freelancerId: string, 
    content: string
  ): Promise<FreelancerTerms | null> {
    const { data, error } = await this.supabase
      .from("freelancer_terms")
      .upsert({
        freelancer_id: freelancerId,
        content: content.trim(),
        is_active: true
      })
      .select()
      .single()

    if (error) {
      console.error("Error saving freelancer terms:", error)
      return null
    }

    return data
  }

  /**
   * Enable custom terms for freelancer
   */
  async enableCustomTerms(freelancerId: string): Promise<boolean> {
    // Update profile setting
    const { error: profileError } = await this.supabase
      .from("profiles")
      .update({ use_custom_terms: true })
      .eq("id", freelancerId)

    if (profileError) {
      console.error("Error updating profile:", profileError)
      return false
    }

    // Create default custom terms based on platform terms
    const platformTerms = await this.getPlatformTerms()
    if (platformTerms) {
      const customTerms = await this.saveFreelancerTerms(freelancerId, platformTerms.content)
      return customTerms !== null
    }

    return true
  }

  /**
   * Disable custom terms for freelancer
   */
  async disableCustomTerms(freelancerId: string): Promise<boolean> {
    // Update profile setting
    const { error: profileError } = await this.supabase
      .from("profiles")
      .update({ use_custom_terms: false })
      .eq("id", freelancerId)

    if (profileError) {
      console.error("Error updating profile:", profileError)
      return false
    }

    // Deactivate custom terms
    const { error: termsError } = await this.supabase
      .from("freelancer_terms")
      .update({ is_active: false })
      .eq("freelancer_id", freelancerId)

    if (termsError) {
      console.error("Error deactivating custom terms:", termsError)
      return false
    }

    return true
  }

  /**
   * Check if freelancer uses custom terms
   */
  async usesCustomTerms(freelancerId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from("profiles")
      .select("use_custom_terms")
      .eq("id", freelancerId)
      .single()

    if (error) {
      console.error("Error checking custom terms setting:", error)
      return false
    }

    return data.use_custom_terms || false
  }
}

// Export singleton instance
export const termsAPI = new TermsAPI()
