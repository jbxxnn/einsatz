import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const freelancerId = searchParams.get('freelancer_id')
    const jobCategoryId = searchParams.get('job_category_id')

    console.log('🔍 [DEBUG] Testing freelancer DBA table access...')
    console.log('🔍 [DEBUG] Parameters:', { freelancerId, jobCategoryId })

    // Test 1: Check if we can read any freelancer_dba_completions using RPC
    console.log('🔍 [DEBUG] Test 1: Reading all freelancer_dba_completions...')
    const { data: allCompletionsRPC, error: allRPCError } = await supabase
      .rpc('get_freelancer_dba_debug', {
        p_freelancer_id: freelancerId || null,
        p_job_category_id: jobCategoryId || null
      })

    // Also try direct table access for comparison
    const { data: allCompletions, error: allError } = await supabase
      .from('freelancer_dba_completions')
      .select('*')
      .limit(5)

    console.log('🔍 [DEBUG] All completions result:', { 
      count: allCompletions?.length, 
      data: allCompletions, 
      error: allError 
    })

    // Test 2: Check if we can read freelancer_dba_answers
    console.log('🔍 [DEBUG] Test 2: Reading freelancer_dba_answers...')
    const { data: allAnswers, error: answersError } = await supabase
      .from('freelancer_dba_answers')
      .select('*')
      .limit(5)

    console.log('🔍 [DEBUG] All answers result:', { 
      count: allAnswers?.length, 
      data: allAnswers, 
      error: answersError 
    })

    // Test 3: If specific freelancer provided, try to get their data
    let specificData = null
    let specificError = null
    if (freelancerId) {
      console.log(`🔍 [DEBUG] Test 3: Looking for specific freelancer ${freelancerId}...`)
      const { data, error } = await supabase
        .from('freelancer_dba_completions')
        .select('*')
        .eq('freelancer_id', freelancerId)

      specificData = data
      specificError = error
      console.log('🔍 [DEBUG] Specific freelancer result:', { 
        freelancer_id: freelancerId,
        count: data?.length, 
        data, 
        error 
      })

      // Test 4: Also check their answers
      const { data: freelancerAnswers, error: freelancerAnswersError } = await supabase
        .from('freelancer_dba_answers')
        .select('*')
        .eq('freelancer_id', freelancerId)

      console.log('🔍 [DEBUG] Specific freelancer answers:', { 
        freelancer_id: freelancerId,
        count: freelancerAnswers?.length, 
        data: freelancerAnswers, 
        error: freelancerAnswersError 
      })
    }

    // Test 5: Check if specific category combination exists
    let categoryData = null
    let categoryError = null
    if (freelancerId && jobCategoryId) {
      console.log(`🔍 [DEBUG] Test 5: Looking for freelancer ${freelancerId} + category ${jobCategoryId}...`)
      const { data, error } = await supabase
        .from('freelancer_dba_completions')
        .select('*')
        .eq('freelancer_id', freelancerId)
        .eq('job_category_id', jobCategoryId)

      categoryData = data
      categoryError = error
      console.log('🔍 [DEBUG] Category-specific result:', { 
        freelancer_id: freelancerId,
        job_category_id: jobCategoryId,
        count: data?.length, 
        data, 
        error 
      })
    }

    // Test 6: Check current user info
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    console.log('🔍 [DEBUG] Current user:', { 
      user_id: user?.id, 
      email: user?.email, 
      error: userError 
    })

    return NextResponse.json({
      success: true,
      debug_results: {
        // Direct table access (limited by RLS)
        direct_access: {
          all_completions: {
            count: allCompletions?.length,
            error: allError?.message,
            sample: allCompletions?.[0]
          },
          all_answers: {
            count: allAnswers?.length,
            error: answersError?.message,
            sample: allAnswers?.[0]
          },
          specific_freelancer: freelancerId ? {
            freelancer_id: freelancerId,
            count: specificData?.length,
            error: specificError?.message,
            data: specificData
          } : null,
          category_specific: (freelancerId && jobCategoryId) ? {
            freelancer_id: freelancerId,
            job_category_id: jobCategoryId,
            count: categoryData?.length,
            error: categoryError?.message,
            data: categoryData
          } : null
        },
        // RPC access (with elevated privileges)
        rpc_access: {
          data: allCompletionsRPC,
          error: allRPCError?.message
        },
        current_user: {
          user_id: user?.id,
          email: user?.email,
          error: userError?.message
        }
      }
    })

  } catch (error) {
    console.error('🔍 [DEBUG] Unexpected error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
