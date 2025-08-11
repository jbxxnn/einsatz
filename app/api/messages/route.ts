import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { recipientId, bookingId, message } = await request.json()

    if (!recipientId) {
      return NextResponse.json({ error: 'Recipient ID is required' }, { status: 400 })
    }

    // Create or get existing conversation
    const { data: conversationData, error: conversationError } = await supabase
      .rpc('create_or_get_conversation', {
        p_user_id: user.id,
        p_recipient_id: recipientId,
        p_booking_id: bookingId || null
      })

    if (conversationError) {
      console.error('Error creating conversation:', conversationError)
      return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 })
    }

    const conversationId = conversationData.conversation_id

    // If there's an initial message, add it
    if (message && message.trim()) {
      const { error: messageError } = await supabase
        .rpc('add_message', {
          p_conversation_id: conversationId,
          p_sender_id: user.id,
          p_content: message.trim()
        })

      if (messageError) {
        console.error('Error adding message:', messageError)
        // Don't fail the whole request if message fails
      }
    }

    return NextResponse.json({ 
      conversationId,
      success: true 
    })

  } catch (error) {
    console.error('Messages API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's conversations
    const { data: conversations, error: conversationsError } = await supabase
      .rpc('get_user_conversations', {
        p_user_id: user.id
      })

    if (conversationsError) {
      console.error('Error fetching conversations:', conversationsError)
      return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 })
    }

    return NextResponse.json({ conversations })

  } catch (error) {
    console.error('Messages API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
