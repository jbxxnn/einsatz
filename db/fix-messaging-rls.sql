-- Fix Messaging RLS Issues
-- Run this to resolve the table access problems

-- First, temporarily disable RLS to allow access
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants DISABLE ROW LEVEL SECURITY;

-- Grant basic permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON messages TO authenticated;
GRANT SELECT, INSERT ON conversation_participants TO authenticated;

-- Now enable RLS again
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies that allow authenticated users to access their data
CREATE POLICY "Users can view conversations they participate in" ON conversations
  FOR SELECT USING (
    id IN (
      SELECT conversation_id 
      FROM conversation_participants 
      WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert conversations" ON conversations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update conversations they participate in" ON conversations
  FOR UPDATE USING (
    id IN (
      SELECT conversation_id 
      FROM conversation_participants 
      WHERE profile_id = auth.uid()
    )
  );

-- RLS Policies for messages
CREATE POLICY "Users can view messages in conversations they participate in" ON messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT conversation_id 
      FROM conversation_participants 
      WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages in conversations they participate in" ON messages
  FOR INSERT WITH CHECK (
    conversation_id IN (
      SELECT conversation_id 
      FROM conversation_participants 
      WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own messages" ON messages
  FOR UPDATE USING (sender_id = auth.uid());

-- RLS Policies for conversation_participants
CREATE POLICY "Users can view conversation participants for conversations they participate in" ON conversation_participants
  FOR SELECT USING (
    conversation_id IN (
      SELECT conversation_id 
      FROM conversation_participants 
      WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert conversation participants" ON conversation_participants
  FOR INSERT WITH CHECK (true);

-- Grant execute permissions on the functions
GRANT EXECUTE ON FUNCTION create_or_get_conversation(UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION add_message(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_conversations(UUID) TO authenticated;





















