-- Messaging System Database Functions Only
-- This file only creates the functions, assuming RLS policies already exist

-- Function to create or get existing conversation between two users
CREATE OR REPLACE FUNCTION create_or_get_conversation(
  p_user_id UUID,
  p_recipient_id UUID,
  p_booking_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_conversation_id UUID;
  v_existing_conversation_id UUID;
  v_result JSON;
BEGIN
  -- Check if conversation already exists between these users
  SELECT cp1.conversation_id INTO v_existing_conversation_id
  FROM conversation_participants cp1
  JOIN conversation_participants cp2 ON cp1.conversation_id = cp2.conversation_id
  WHERE cp1.profile_id = p_user_id 
    AND cp2.profile_id = p_recipient_id
    AND cp1.conversation_id = cp2.conversation_id
  LIMIT 1;

  -- If conversation exists, return it
  IF v_existing_conversation_id IS NOT NULL THEN
    v_conversation_id := v_existing_conversation_id;
  ELSE
    -- Create new conversation
    INSERT INTO conversations (id, booking_id, created_at, updated_at)
    VALUES (gen_random_uuid(), p_booking_id, NOW(), NOW())
    RETURNING id INTO v_conversation_id;

    -- Add both users as participants
    INSERT INTO conversation_participants (conversation_id, profile_id)
    VALUES 
      (v_conversation_id, p_user_id),
      (v_conversation_id, p_recipient_id);
  END IF;

  -- Return conversation info
  v_result := json_build_object(
    'conversation_id', v_conversation_id,
    'created', v_existing_conversation_id IS NULL
  );

  RETURN v_result;
END;
$$;

-- Function to add a message to a conversation
CREATE OR REPLACE FUNCTION add_message(
  p_conversation_id UUID,
  p_sender_id UUID,
  p_content TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert the message
  INSERT INTO messages (id, conversation_id, sender_id, content, read, created_at)
  VALUES (gen_random_uuid(), p_conversation_id, p_sender_id, p_content, false, NOW());

  -- Update conversation timestamp
  UPDATE conversations 
  SET updated_at = NOW()
  WHERE id = p_conversation_id;
END;
$$;

-- Function to get user conversations with last message and participant info
CREATE OR REPLACE FUNCTION get_user_conversations(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
BEGIN
  WITH user_conversations AS (
    SELECT 
      c.id as conversation_id,
      c.booking_id,
      c.updated_at,
      -- Get the other participant
      CASE 
        WHEN cp1.profile_id = p_user_id THEN cp2.profile_id
        ELSE cp1.profile_id
      END as other_user_id,
      -- Get last message
      m.content as last_message_content,
      m.created_at as last_message_created_at,
      m.sender_id as last_message_sender_id,
      -- Get unread count
      COUNT(CASE WHEN m2.read = false AND m2.sender_id != p_user_id THEN 1 END) as unread_count
    FROM conversations c
    JOIN conversation_participants cp1 ON c.id = cp1.conversation_id
    JOIN conversation_participants cp2 ON c.id = cp2.conversation_id
    LEFT JOIN LATERAL (
      SELECT content, created_at, sender_id
      FROM messages 
      WHERE conversation_id = c.id 
      ORDER BY created_at DESC 
      LIMIT 1
    ) m ON true
    LEFT JOIN messages m2 ON c.id = m2.conversation_id
    WHERE cp1.profile_id = p_user_id 
      AND cp2.profile_id != p_user_id
      AND cp1.profile_id != cp2.profile_id
    GROUP BY c.id, c.booking_id, c.updated_at, cp1.profile_id, cp2.profile_id, 
             m.content, m.created_at, m.sender_id
  )
  SELECT json_agg(
    json_build_object(
      'id', uc.conversation_id,
      'booking_id', uc.booking_id,
      'updated_at', uc.updated_at,
      'other_user', json_build_object(
        'id', p.id,
        'first_name', p.first_name,
        'last_name', p.last_name,
        'avatar_url', p.avatar_url,
        'user_type', p.user_type
      ),
      'last_message', CASE 
        WHEN uc.last_message_content IS NOT NULL THEN
          json_build_object(
            'content', uc.last_message_content,
            'created_at', uc.last_message_created_at,
            'sender_id', uc.last_message_sender_id
          )
        ELSE NULL
      END,
      'unread_count', uc.unread_count
    )
    ORDER BY uc.updated_at DESC
  ) INTO v_result
  FROM user_conversations uc
  JOIN profiles p ON uc.other_user_id = p.id;

  RETURN COALESCE(v_result, '[]'::json);
END;
$$;

-- Grant necessary permissions on the functions
GRANT EXECUTE ON FUNCTION create_or_get_conversation(UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION add_message(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_conversations(UUID) TO authenticated;


























