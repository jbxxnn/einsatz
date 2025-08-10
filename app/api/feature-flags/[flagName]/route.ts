import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/lib/database.types'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ flagName: string }> }
) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
    
    const { flagName } = await params
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    let isEnabled = false
    
    if (user) {
      // Check user-specific flag first
      const { data: userFlag } = await supabase
        .from('user_feature_flags')
        .select('is_enabled')
        .eq('user_id', user.id)
        .eq('flag_name', flagName)
        .single()
      
      if (userFlag) {
        isEnabled = userFlag.is_enabled
      } else {
        // Fall back to global flag
        const { data: globalFlag } = await supabase
          .from('feature_flags')
          .select('is_enabled')
          .eq('flag_name', flagName)
          .single()
        
        isEnabled = globalFlag?.is_enabled || false
      }
    } else {
      // No user session, check global flag only
      const { data: globalFlag } = await supabase
        .from('feature_flags')
        .select('is_enabled')
        .eq('flag_name', flagName)
        .single()
      
      isEnabled = globalFlag?.is_enabled || false
    }
    
    return NextResponse.json({ 
      enabled: isEnabled,
      flagName,
      hasUserOverride: user ? await hasUserOverride(supabase, user.id, flagName) : false
    })
    
  } catch (error) {
    console.error('Error checking feature flag:', error)
    return NextResponse.json({ 
      enabled: false, 
      error: 'Failed to check feature flag' 
    }, { status: 500 })
  }
}

async function hasUserOverride(
  supabase: any, 
  userId: string, 
  flagName: string
): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('user_feature_flags')
      .select('id')
      .eq('user_id', userId)
      .eq('flag_name', flagName)
      .single()
    
    return !!data
  } catch {
    return false
  }
}
