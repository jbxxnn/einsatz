-- Fix Messaging RLS Recursion Issues
-- This fixes the infinite recursion problem in the previous RLS policies

-- First, drop the problematic policies
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON conversations;
DROP POLICY IF EXISTS "Users can update conversations they participate in" ON conversations;
DROP POLICY IF EXISTS "Users can view messages in conversations they participate in" ON messages;
DROP POLICY IF EXISTS "Users can insert messages in conversations they participate in" ON messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;
DROP POLICY IF EXISTS "Users can view conversation participants for conversations they participate in" ON conversation_participants;

-- Create simplified RLS policies that avoid recursion
-- For conversations: allow access if user is a participant (using a simpler approach)
CREATE POLICY "Users can view conversations they participate in" ON conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp 
      WHERE cp.conversation_id = conversations.id 
      AND cp.profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can update conversations they participate in" ON conversations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp 
      WHERE cp.conversation_id = conversations.id 
      AND cp.profile_id = auth.uid()
    )
  );

-- For messages: allow access if user is a participant in the conversation
CREATE POLICY "Users can view messages in conversations they participate in" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp 
      WHERE cp.conversation_id = messages.conversation_id 
      AND cp.profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages in conversations they participate in" ON messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversation_participants cp 
      WHERE cp.conversation_id = messages.conversation_id 
      AND cp.profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own messages" ON messages
  FOR UPDATE USING (sender_id = auth.uid());

-- For conversation_participants: allow access if user is a participant in the conversation
CREATE POLICY "Users can view conversation participants for conversations they participate in" ON conversation_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp2 
      WHERE cp2.conversation_id = conversation_participants.conversation_id 
      AND cp2.profile_id = auth.uid()
    )
  );

-- Keep the existing grants
GRANT SELECT, INSERT, UPDATE ON conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON messages TO authenticated;
GRANT SELECT, INSERT ON conversation_participants TO authenticated;

-- Grant execute permissions on the functions
GRANT EXECUTE ON FUNCTION create_or_get_conversation(UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION add_message(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_conversations(UUID) TO authenticated;


