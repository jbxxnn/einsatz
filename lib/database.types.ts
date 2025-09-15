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
          phone: string | null
          created_at: string
          updated_at: string
          metadata: Json | null
          latitude: number | null
          longitude: number | null
          formatted_address: string | null
          service_radius: number | null
          wildcard_categories: {
            physical_work: boolean
            customer_facing: boolean
            outdoor_work: boolean
            odd_hours: boolean
            repetitive_work: boolean
            analytical_work: boolean
            creative_work: boolean
          } | null
          wildcard_enabled: boolean
          profile_completeness: number
          is_verified: boolean
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
          phone?: string | null
          created_at?: string
          updated_at?: string
          metadata?: Json | null
          latitude?: number | null
          longitude?: number | null
          formatted_address?: string | null
          service_radius?: number | null
          wildcard_categories?: {
            physical_work: boolean
            customer_facing: boolean
            outdoor_work: boolean
            odd_hours: boolean
            repetitive_work: boolean
            analytical_work: boolean
            creative_work: boolean
          } | null
          wildcard_enabled?: boolean
          profile_completeness?: number
          is_verified?: boolean
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
          phone?: string | null
          created_at?: string
          updated_at?: string
          metadata?: Json | null
          latitude?: number | null
          longitude?: number | null
          formatted_address?: string | null
          service_radius?: number | null
          wildcard_categories?: {
            physical_work: boolean
            customer_facing: boolean
            outdoor_work: boolean
            odd_hours: boolean
            repetitive_work: boolean
            analytical_work: boolean
            creative_work: boolean
          } | null
          wildcard_enabled?: boolean
          profile_completeness?: number
          is_verified?: boolean
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
          booking_status: "pending_payment" | "payment_completed" | "pending_freelancer_review" | "dispute_resolution" | "pending_acceptance" | "active" | "completed" | "cancelled" | null
          has_dba_disputes: boolean | null
          dba_disputes_resolved: boolean | null
          dispute_resolution_deadline: string | null
          start_time: string
          end_time: string
          location: string | null
          hourly_rate: number | null
          total_amount: number
          payment_status: "unpaid" | "paid" | "refunded"
          payment_intent_id: string | null
          created_at: string
          updated_at: string
          category_id: string | null
          payment_method: "online" | "offline" | null
          package_id: string | null
          package_name: string | null
          package_description: string | null
          package_quantities: Json | null
        }
        Insert: {
          id?: string
          client_id: string
          freelancer_id: string
          title: string
          description?: string | null
          status?: "pending" | "confirmed" | "completed" | "cancelled" | "disputed"
          booking_status?: "pending_payment" | "payment_completed" | "pending_freelancer_review" | "dispute_resolution" | "pending_acceptance" | "active" | "completed" | "cancelled" | null
          has_dba_disputes?: boolean | null
          dba_disputes_resolved?: boolean | null
          dispute_resolution_deadline?: string | null
          start_time: string
          end_time: string
          location?: string | null
          hourly_rate?: number | null
          total_amount: number
          payment_status?: "unpaid" | "paid" | "refunded"
          payment_intent_id?: string | null
          created_at?: string
          updated_at?: string
          category_id?: string | null
          payment_method?: "online" | "offline" | null
          package_id?: string | null
          package_name?: string | null
          package_description?: string | null
          package_quantities?: Json | null
        }
        Update: {
          id?: string
          client_id?: string
          freelancer_id?: string
          title?: string
          description?: string | null
          status?: "pending" | "confirmed" | "completed" | "cancelled" | "disputed"
          booking_status?: "pending_payment" | "payment_completed" | "pending_freelancer_review" | "dispute_resolution" | "pending_acceptance" | "active" | "completed" | "cancelled" | null
          has_dba_disputes?: boolean | null
          dba_disputes_resolved?: boolean | null
          dispute_resolution_deadline?: string | null
          start_time?: string
          end_time?: string
          location?: string | null
          hourly_rate?: number | null
          total_amount?: number
          payment_status?: "unpaid" | "paid" | "refunded"
          payment_intent_id?: string | null
          created_at?: string
          updated_at?: string
          category_id?: string | null
          payment_method?: "online" | "offline" | null
          package_id?: string | null
          package_name?: string | null
          package_description?: string | null
          package_quantities?: Json | null
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
      conversations: {
        Row: {
          id: string
          booking_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          booking_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          booking_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          content: string
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          content: string
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          content?: string
          read?: boolean
          created_at?: string
        }
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          profile_id: string
        }
        Insert: {
          conversation_id: string
          profile_id: string
        }
        Update: {
          conversation_id?: string
          profile_id?: string
        }
      }
      job_categories: {
        Row: {
          id: string
          name: string
          description: string | null
          icon: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          icon?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          icon?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      job_subcategories: {
        Row: {
          id: string
          category_id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          category_id: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          category_id?: string
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      freelancer_job_offerings: {
        Row: {
          id: string
          freelancer_id: string
          category_id: string
          subcategory_id: string | null
          hourly_rate: number | null
          fixed_rate: number | null
          pricing_type: "hourly" | "packages"
          is_available_now: boolean
          description: string | null
          experience_years: number | null
          metadata: Json | null
          display_order: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          freelancer_id: string
          category_id: string
          subcategory_id?: string | null
          hourly_rate?: number | null
          fixed_rate?: number | null
          pricing_type?: "hourly" | "packages"
          is_available_now?: boolean
          description?: string | null
          experience_years?: number | null
          metadata?: Json | null
          display_order?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          freelancer_id?: string
          category_id?: string
          subcategory_id?: string | null
          hourly_rate?: number | null
          fixed_rate?: number | null
          pricing_type?: "hourly" | "packages"
          is_available_now?: boolean
          description?: string | null
          experience_years?: number | null
          metadata?: Json | null
          display_order?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      availability_schedules: {
        Row: {
          id: string
          freelancer_id: string
          category_id: string
          day_of_week: number
          start_time: string
          end_time: string
          is_available: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          freelancer_id: string
          category_id: string
          day_of_week: number
          start_time: string
          end_time: string
          is_available?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          freelancer_id?: string
          category_id?: string
          day_of_week?: number
          start_time?: string
          end_time?: string
          is_available?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      freelancer_availability: {
        Row: {
          id: string
          freelancer_id: string
          category_id: string | null
          start_time: string
          end_time: string
          is_recurring: boolean
          recurrence_pattern: string | null
          recurrence_end_date: string | null
          certainty_level: "guaranteed" | "tentative" | "unavailable"
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          freelancer_id: string
          category_id?: string | null
          start_time: string
          end_time: string
          is_recurring?: boolean
          recurrence_pattern?: string | null
          recurrence_end_date?: string | null
          certainty_level?: "guaranteed" | "tentative" | "unavailable"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          freelancer_id?: string
          category_id?: string | null
          start_time?: string
          end_time?: string
          is_recurring?: boolean
          recurrence_pattern?: string | null
          recurrence_end_date?: string | null
          certainty_level?: "guaranteed" | "tentative" | "unavailable"
          created_at?: string
          updated_at?: string
        }
      }
      real_time_availability: {
        Row: {
          freelancer_id: string
          is_available_now: boolean
          last_updated: string
        }
        Insert: {
          freelancer_id: string
          is_available_now?: boolean
          last_updated?: string
        }
        Update: {
          freelancer_id?: string
          is_available_now?: boolean
          last_updated?: string
        }
      }
      dba_questions: {
        Row: {
          id: string
          category: "control" | "substitution" | "tools" | "risk" | "economic_independence"
          question_text_en: string
          question_text_nl: string
          question_type: string
          options: Json | null
          weight: number
          is_freelancer_question: boolean
          is_required: boolean
          order_index: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          category: "control" | "substitution" | "tools" | "risk" | "economic_independence"
          question_text_en: string
          question_text_nl: string
          question_type?: string
          options?: Json | null
          weight?: number
          is_freelancer_question: boolean
          is_required?: boolean
          order_index: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          category?: "control" | "substitution" | "tools" | "risk" | "economic_independence"
          question_text_en?: string
          question_text_nl?: string
          question_type?: string
          options?: Json | null
          weight?: number
          is_freelancer_question?: boolean
          is_required?: boolean
          order_index?: number
          created_at?: string
          updated_at?: string
        }
      }
      dba_freelancer_answers: {
        Row: {
          id: string
          freelancer_id: string
          job_category_id: string
          question_id: string
          answer_value: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          freelancer_id: string
          job_category_id: string
          question_id: string
          answer_value: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          freelancer_id?: string
          job_category_id?: string
          question_id?: string
          answer_value?: string
          created_at?: string
          updated_at?: string
        }
      }
      dba_booking_answers: {
        Row: {
          id: string
          booking_id: string
          client_id: string
          freelancer_id: string
          question_id: string
          answer_value: string
          created_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          client_id: string
          freelancer_id: string
          question_id: string
          answer_value: string
          created_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          client_id?: string
          freelancer_id?: string
          question_id?: string
          answer_value?: string
          created_at?: string
        }
      }
      dba_reports: {
        Row: {
          id: string
          booking_id: string
          freelancer_id: string
          client_id: string
          score: number
          risk_level: "safe" | "doubtful" | "high_risk"
          answers_json: Json
          pdf_url: string | null
          contract_pdf_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          freelancer_id: string
          client_id: string
          score: number
          risk_level: "safe" | "doubtful" | "high_risk"
          answers_json: Json
          pdf_url?: string | null
          contract_pdf_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          freelancer_id?: string
          client_id?: string
          score?: number
          risk_level?: "safe" | "doubtful" | "high_risk"
          answers_json?: Json
          pdf_url?: string | null
          contract_pdf_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      dba_waivers: {
        Row: {
          id: string
          booking_id: string
          client_id: string
          waiver_reason: string | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          client_id: string
          waiver_reason?: string | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          client_id?: string
          waiver_reason?: string | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
      dba_audit_logs: {
        Row: {
          id: string
          booking_id: string | null
          user_id: string
          action: string
          details: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          booking_id?: string | null
          user_id: string
          action: string
          details?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          booking_id?: string | null
          user_id?: string
          action?: string
          details?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
      freelancer_global_availability: {
        Row: {
          id: string
          availability_group_id: string
          freelancer_id: string
          start_time: string
          end_time: string
          is_recurring: boolean
          recurrence_pattern: string | null
          recurrence_end_date: string | null
          certainty_level: "guaranteed" | "tentative" | "unavailable"
          service_id: string
          category_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          availability_group_id?: string
          freelancer_id: string
          start_time: string
          end_time: string
          is_recurring?: boolean
          recurrence_pattern?: string | null
          recurrence_end_date?: string | null
          certainty_level?: string
          service_id: string
          category_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          availability_group_id?: string
          freelancer_id?: string
          start_time?: string
          end_time?: string
          is_recurring?: boolean
          recurrence_pattern?: string | null
          recurrence_end_date?: string | null
          certainty_level?: string
          service_id?: string
          category_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      job_offering_availability_settings: {
        Row: {
          freelancer_id: string
          job_offering_id: string
          use_global_availability: boolean
        }
        Insert: {
          freelancer_id: string
          job_offering_id: string
          use_global_availability?: boolean
        }
        Update: {
          freelancer_id?: string
          job_offering_id?: string
          use_global_availability?: boolean
        }
      }
      dba_question_disputes: {
        Row: {
          id: string
          booking_id: string
          question_group_id: string
          freelancer_answer: string
          client_answer: string
          dispute_severity: 'minor' | 'moderate' | 'critical'
          resolution_status: 'pending' | 'negotiating' | 'resolved' | 'accepted_difference'
          resolved_answer: string | null
          resolution_method: 'freelancer_accepted' | 'client_accepted' | 'negotiated' | 'agreed_difference' | null
          resolved_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          question_group_id: string
          freelancer_answer: string
          client_answer: string
          dispute_severity: 'minor' | 'moderate' | 'critical'
          resolution_status?: 'pending' | 'negotiating' | 'resolved' | 'accepted_difference'
          resolved_answer?: string | null
          resolution_method?: 'freelancer_accepted' | 'client_accepted' | 'negotiated' | 'agreed_difference' | null
          resolved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          question_group_id?: string
          freelancer_answer?: string
          client_answer?: string
          dispute_severity?: 'minor' | 'moderate' | 'critical'
          resolution_status?: 'pending' | 'negotiating' | 'resolved' | 'accepted_difference'
          resolved_answer?: string | null
          resolution_method?: 'freelancer_accepted' | 'client_accepted' | 'negotiated' | 'agreed_difference' | null
          resolved_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      dba_dispute_messages: {
        Row: {
          id: string
          dispute_id: string
          booking_id: string
          sender_type: 'client' | 'freelancer'
          sender_id: string
          message_type: 'text' | 'answer_proposal' | 'acceptance' | 'rejection'
          message_content: string
          proposed_answer: string | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          dispute_id: string
          booking_id: string
          sender_type: 'client' | 'freelancer'
          sender_id: string
          message_type?: 'text' | 'answer_proposal' | 'acceptance' | 'rejection'
          message_content: string
          proposed_answer?: string | null
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          dispute_id?: string
          booking_id?: string
          sender_type?: 'client' | 'freelancer'
          sender_id?: string
          message_type?: 'text' | 'answer_proposal' | 'acceptance' | 'rejection'
          message_content?: string
          proposed_answer?: string | null
          is_read?: boolean
          created_at?: string
        }
      }
      dba_booking_dispute_summary: {
        Row: {
          id: string
          booking_id: string
          total_disputes: number
          critical_disputes: number
          moderate_disputes: number
          minor_disputes: number
          resolved_disputes: number
          resolution_progress: number
          all_disputes_resolved: boolean
          client_acknowledged: boolean
          freelancer_acknowledged: boolean
          resolution_started_at: string | null
          resolution_completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          total_disputes?: number
          critical_disputes?: number
          moderate_disputes?: number
          minor_disputes?: number
          resolved_disputes?: number
          resolution_progress?: number
          all_disputes_resolved?: boolean
          client_acknowledged?: boolean
          freelancer_acknowledged?: boolean
          resolution_started_at?: string | null
          resolution_completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          total_disputes?: number
          critical_disputes?: number
          moderate_disputes?: number
          minor_disputes?: number
          resolved_disputes?: number
          resolution_progress?: number
          all_disputes_resolved?: boolean
          client_acknowledged?: boolean
          freelancer_acknowledged?: boolean
          resolution_started_at?: string | null
          resolution_completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      job_offering_packages: {
        Row: {
          id: string
          job_offering_id: string
          package_name: string
          short_description: string | null
          price: number
          display_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          job_offering_id: string
          package_name: string
          short_description?: string | null
          price: number
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          job_offering_id?: string
          package_name?: string
          short_description?: string | null
          price?: number
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      job_offering_package_items: {
        Row: {
          id: string
          package_id: string
          type: "labour" | "materials" | "others"
          offering: string
          price_per_unit: number
          unit_type: string
          quantity_type: "fixed" | "variable"
          fixed_quantity: number | null
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          package_id: string
          type: "labour" | "materials" | "others"
          offering: string
          price_per_unit: number
          unit_type: string
          quantity_type: "fixed" | "variable"
          fixed_quantity?: number | null
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          package_id?: string
          type?: "labour" | "materials" | "others"
          offering?: string
          price_per_unit?: number
          unit_type?: string
          quantity_type?: "fixed" | "variable"
          fixed_quantity?: number | null
          display_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      unit_types: {
        Row: {
          id: string
          name: string
          symbol: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          symbol: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          symbol?: string
          description?: string | null
          created_at?: string
        }
      }
    }
    Functions: {
      get_user_conversations: {
        Args: {
          user_id: string
        }
        Returns: Json
      }
      create_or_get_conversation: {
        Args: {
          p_user_id: string
          p_recipient_id: string
          p_booking_id: string
        }
        Returns: Json
      }
      add_message: {
        Args: {
          p_conversation_id: string
          p_sender_id: string
          p_content: string
        }
        Returns: void
      }
    }
  }
}
