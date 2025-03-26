export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          first_name: string | null
          last_name: string | null
          email: string
          user_type: "client" | "freelancer"
          avatar_url: string | null
          bio: string | null
          skills: string[] | null
          hourly_rate: number | null
          location: string | null
          availability: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          first_name?: string | null
          last_name?: string | null
          email: string
          user_type: "client" | "freelancer"
          avatar_url?: string | null
          bio?: string | null
          skills?: string[] | null
          hourly_rate?: number | null
          location?: string | null
          availability?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string | null
          last_name?: string | null
          email?: string
          user_type?: "client" | "freelancer"
          avatar_url?: string | null
          bio?: string | null
          skills?: string[] | null
          hourly_rate?: number | null
          location?: string | null
          availability?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          client_id: string
          freelancer_id: string
          title: string
          description: string | null
          status: "pending" | "confirmed" | "completed" | "cancelled" | "disputed"
          start_time: string
          end_time: string
          location: string | null
          hourly_rate: number
          total_amount: number
          payment_status: "unpaid" | "paid" | "refunded"
          payment_intent_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          freelancer_id: string
          title: string
          description?: string | null
          status?: "pending" | "confirmed" | "completed" | "cancelled" | "disputed"
          start_time: string
          end_time: string
          location?: string | null
          hourly_rate: number
          total_amount: number
          payment_status?: "unpaid" | "paid" | "refunded"
          payment_intent_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          freelancer_id?: string
          title?: string
          description?: string | null
          status?: "pending" | "confirmed" | "completed" | "cancelled" | "disputed"
          start_time?: string
          end_time?: string
          location?: string | null
          hourly_rate?: number
          total_amount?: number
          payment_status?: "unpaid" | "paid" | "refunded"
          payment_intent_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          booking_id: string
          reviewer_id: string
          reviewee_id: string
          rating: number
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          reviewer_id: string
          reviewee_id: string
          rating: number
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          reviewer_id?: string
          reviewee_id?: string
          rating?: number
          comment?: string | null
          created_at?: string
        }
      }
      invoices: {
        Row: {
          id: string
          booking_id: string
          client_id: string
          freelancer_id: string
          amount: number
          status: "draft" | "sent" | "paid" | "cancelled"
          due_date: string | null
          paid_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          client_id: string
          freelancer_id: string
          amount: number
          status?: "draft" | "sent" | "paid" | "cancelled"
          due_date?: string | null
          paid_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          client_id?: string
          freelancer_id?: string
          amount?: number
          status?: "draft" | "sent" | "paid" | "cancelled"
          due_date?: string | null
          paid_at?: string | null
          created_at?: string
        }
      }
    }
  }
}

