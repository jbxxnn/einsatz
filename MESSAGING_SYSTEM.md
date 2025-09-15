# Messaging System Implementation

This document describes the complete messaging system that has been implemented for the Einsatz platform.

## Overview

The messaging system allows users (clients and freelancers) to communicate with each other through private conversations. It includes real-time messaging, conversation management, and integration with the existing booking system.

## Features

### ✅ Implemented Features

1. **Conversation Management**
   - Create new conversations between users
   - View all user conversations
   - Real-time conversation updates

2. **Messaging**
   - Send and receive messages in real-time
   - Message read status tracking
   - Message timestamps
   - Support for text messages

3. **User Interface**
   - Messages list page (`/messages`)
   - Individual conversation pages (`/messages/[id]`)
   - Responsive chat interface
   - Message notification badges in header

4. **Real-time Updates**
   - Live message delivery using Supabase real-time subscriptions
   - Unread message counts
   - Conversation list updates

5. **Security**
   - Row Level Security (RLS) policies
   - User authentication required
   - Users can only access conversations they participate in

### 🚧 Planned Features (Future Implementation)

1. **File Attachments**
   - Image uploads
   - Document sharing
   - File preview

2. **Enhanced Messaging**
   - Emoji picker
   - Message reactions
   - Message editing/deletion

3. **Communication Features**
   - Voice calls
   - Video calls
   - Push notifications

4. **Advanced Features**
   - Message search
   - Conversation archiving
   - User blocking/reporting

## Architecture

### Database Schema

The messaging system uses three main tables:

```sql
-- Conversations table
conversations (
  id UUID PRIMARY KEY,
  booking_id UUID REFERENCES bookings(id),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Messages table
messages (
  id UUID PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id),
  sender_id UUID REFERENCES profiles(id),
  content TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP
)

-- Conversation participants table
conversation_participants (
  conversation_id UUID REFERENCES conversations(id),
  profile_id UUID REFERENCES profiles(id),
  PRIMARY KEY (conversation_id, profile_id)
)
```

### API Endpoints

- `POST /api/messages` - Create conversation and send initial message
- `GET /api/messages` - Get user's conversations

### Database Functions

- `create_or_get_conversation()` - Creates or retrieves existing conversation
- `add_message()` - Adds a message to a conversation
- `get_user_conversations()` - Retrieves user's conversations with metadata

## Usage

### For Users

1. **Starting a Conversation**
   - Click "Send Message" button on a freelancer profile or booking
   - The system automatically creates a conversation
   - You're redirected to the chat interface

2. **Viewing Conversations**
   - Navigate to `/messages` to see all conversations
   - Click on any conversation to open the chat

3. **Sending Messages**
   - Type your message in the input field
   - Press Enter or click Send
   - Messages are delivered in real-time

### For Developers

1. **Adding Message Button to Components**
   ```tsx
   import MessageButton from '@/components/message-button'
   
   <MessageButton
     bookingId="booking-uuid"
     clientId="client-uuid"
     freelancerId="freelancer-uuid"
   />
   ```

2. **Customizing Message Components**
   - All messaging components are in `components/messages/`
   - Styling uses Tailwind CSS classes
   - Components support internationalization

## Setup Instructions

### 1. Database Setup

Run the database functions to create the messaging system:

```bash
# Connect to your Supabase database and run:
\i db/messaging-functions.sql
```

### 2. Environment Variables

Ensure your Supabase environment variables are set:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Dependencies

The messaging system requires these packages (already in package.json):

- `@supabase/auth-helpers-nextjs`
- `@supabase/supabase-js`
- `date-fns`
- `lucide-react`

## File Structure

```
components/
├── messages/
│   ├── chat-header.tsx          # Individual conversation header
│   ├── chat-interface.tsx       # Main chat interface
│   ├── conversations-list.tsx   # List of all conversations
│   └── messages-header.tsx      # Messages page header
├── message-button.tsx            # Button to start conversations
└── messages-notification-badge.tsx # Unread message badge

app/
├── api/
│   └── messages/
│       └── route.ts             # Messages API endpoints
└── messages/
    ├── page.tsx                 # Main messages page
    └── [id]/
        └── page.tsx             # Individual conversation page

db/
└── messaging-functions.sql      # Database functions and policies

messages/
└── en.json                     # Translation keys for messaging
```

## Security Features

### Row Level Security (RLS)

- Users can only access conversations they participate in
- Messages are restricted to conversation participants
- Profile information is protected

### Authentication

- All messaging endpoints require user authentication
- User sessions are validated on each request
- Unauthorized access is blocked

## Performance Considerations

### Real-time Subscriptions

- Efficient Supabase real-time channels
- Automatic cleanup of subscriptions
- Optimized for concurrent users

### Database Queries

- Indexed queries on conversation_id and profile_id
- Efficient JOIN operations for conversation data
- Minimal data transfer

## Troubleshooting

### Common Issues

1. **Messages not appearing**
   - Check Supabase real-time subscriptions
   - Verify user authentication
   - Check browser console for errors

2. **Conversation creation fails**
   - Ensure database functions are installed
   - Check RLS policies
   - Verify user permissions

3. **Real-time updates not working**
   - Check Supabase project settings
   - Verify real-time is enabled
   - Check network connectivity

### Debug Mode

Enable debug logging by setting:

```env
NEXT_PUBLIC_DEBUG_MESSAGING=true
```

## Contributing

When adding new features to the messaging system:

1. Follow the existing component patterns
2. Add proper TypeScript interfaces
3. Include internationalization support
4. Add appropriate error handling
5. Update this documentation

## Support

For issues or questions about the messaging system:

1. Check the troubleshooting section
2. Review Supabase documentation
3. Check browser console for errors
4. Verify database function installation

---

**Last Updated**: December 2024
**Version**: 1.0.0































