# Einsatz Platform

## Instant Freelancer Booking Platform

Einsatz is a modern web application designed to connect clients with local, in-person freelancers for urgent jobs. The platform enables instant booking, real-time availability management, and seamless communication between clients and service providers.


## 🚀 Project Overview

Einsatz aims to revolutionize the way people find and book local freelance services by:

- Enabling clients to find available freelancers in their area instantly
- Allowing freelancers to manage their availability and services in real-time
- Facilitating direct communication between clients and freelancers
- Streamlining the booking and payment process

## 💻 Technologies Used

- **Frontend**:
  - [Next.js 14](https://nextjs.org/) (App Router)
  - [React 18](https://reactjs.org/)
  - [TypeScript](https://www.typescriptlang.org/)
  - [Tailwind CSS](https://tailwindcss.com/) for styling
  - [Shadcn UI](https://ui.shadcn.com/) for UI components
  - [Geist](https://vercel.com/font) font by Vercel

- **Backend**:
  - [Supabase](https://supabase.com/) for authentication, database, and storage
  - PostgreSQL database with Row Level Security (RLS)
  - Supabase Edge Functions for serverless functionality

- **Authentication**:
  - Supabase Auth with email/password and Google OAuth

- **State Management**:
  - React Context API
  - Server Components for data fetching

- **Deployment**:
  - [Vercel](https://vercel.com/) for hosting and deployment

## 🏗️ Architecture Overview

The Einsatz platform follows a modern web application architecture:

### Frontend Architecture

- **App Router**: Utilizes Next.js App Router for file-based routing
- **Server Components**: Leverages React Server Components for improved performance
- **Client Components**: Uses Client Components for interactive UI elements
- **API Routes**: Implements Next.js API routes for server-side operations

### Backend Architecture

- **Database Schema**: Comprehensive PostgreSQL schema with relations for:
  - User profiles (clients and freelancers)
  - Job categories and subcategories
  - Bookings and payments
  - Messaging system
  - Availability management
  - Location-based services

- **Security**: Implements Row Level Security (RLS) policies to ensure data privacy
- **Stored Procedures**: Uses PostgreSQL functions for complex operations

## ✨ Features Implemented

### User Management
- User registration and authentication (email/password and Google OAuth)
- User type selection (client or freelancer)
- Profile management with personal details and preferences

### Freelancer Features
- Job offering management with categories and subcategories
- Availability calendar with recurring availability patterns
- Location-based service area definition
- Real-time availability toggling

### Client Features
- Freelancer discovery and filtering
- Booking system with date and time selection
- Messaging system to communicate with freelancers
- Payment processing for services

### Location Services
- Geocoding for address to coordinates conversion
- Distance-based freelancer search
- Service radius definition for freelancers

### Messaging System
- Real-time messaging between clients and freelancers
- Conversation management with read/unread status
- Booking-related conversations

### Calendar and Scheduling
- Interactive calendar for availability management
- Date selection with availability indicators
- Time slot management for service bookings

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18.x or higher
- npm or yarn
- Supabase account
- Google OAuth credentials (optional, for Google sign-in)

