-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.availability_schedules (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  freelancer_id uuid NOT NULL,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time without time zone NOT NULL,
  end_time time without time zone NOT NULL,
  is_available boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT availability_schedules_pkey PRIMARY KEY (id),
  CONSTRAINT availability_schedules_freelancer_id_fkey FOREIGN KEY (freelancer_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.bookings (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  client_id uuid NOT NULL,
  freelancer_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  status USER-DEFINED NOT NULL DEFAULT 'pending'::booking_status,
  start_time timestamp with time zone NOT NULL,
  end_time timestamp with time zone NOT NULL,
  location text,
  hourly_rate numeric NOT NULL,
  total_amount numeric NOT NULL,
  payment_status USER-DEFINED NOT NULL DEFAULT 'unpaid'::payment_status,
  payment_intent_id text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  category_id uuid,
  payment_method character varying DEFAULT 'online'::character varying CHECK (payment_method::text = ANY (ARRAY['online'::character varying, 'offline'::character varying]::text[])),
  booking_status USER-DEFINED DEFAULT 'pending_payment'::booking_status_enum,
  has_dba_disputes boolean DEFAULT false,
  dba_disputes_resolved boolean DEFAULT false,
  dispute_resolution_deadline timestamp with time zone,
  CONSTRAINT bookings_pkey PRIMARY KEY (id),
  CONSTRAINT bookings_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.job_categories(id),
  CONSTRAINT bookings_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(id),
  CONSTRAINT bookings_freelancer_id_fkey FOREIGN KEY (freelancer_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.conversation_participants (
  conversation_id uuid NOT NULL,
  profile_id uuid NOT NULL,
  joined_at timestamp with time zone DEFAULT now(),
  CONSTRAINT conversation_participants_pkey PRIMARY KEY (conversation_id, profile_id),
  CONSTRAINT conversation_participants_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id),
  CONSTRAINT conversation_participants_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id)
);
CREATE TABLE public.conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  booking_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT conversations_pkey PRIMARY KEY (id),
  CONSTRAINT conversations_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id)
);
CREATE TABLE public.dba_answer_disputes (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  booking_id uuid NOT NULL,
  question_group_id uuid NOT NULL,
  freelancer_answer text NOT NULL,
  client_answer text NOT NULL,
  dispute_score integer NOT NULL,
  resolution_status text DEFAULT 'unresolved'::text CHECK (resolution_status = ANY (ARRAY['unresolved'::text, 'acknowledged'::text, 'resolved'::text])),
  resolution_notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT dba_answer_disputes_pkey PRIMARY KEY (id),
  CONSTRAINT dba_answer_disputes_question_group_id_fkey FOREIGN KEY (question_group_id) REFERENCES public.dba_question_groups(id),
  CONSTRAINT dba_answer_disputes_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id)
);
CREATE TABLE public.dba_audit_logs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  booking_id uuid,
  user_id uuid NOT NULL,
  action text NOT NULL,
  details jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT dba_audit_logs_pkey PRIMARY KEY (id),
  CONSTRAINT dba_audit_logs_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id),
  CONSTRAINT dba_audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.dba_booking_answers (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  booking_id uuid NOT NULL,
  client_id uuid NOT NULL,
  freelancer_id uuid NOT NULL,
  question_id uuid,
  answer_value text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  question_group_id uuid,
  CONSTRAINT dba_booking_answers_pkey PRIMARY KEY (id),
  CONSTRAINT fk_booking_answers_question_group FOREIGN KEY (question_group_id) REFERENCES public.dba_question_groups(id),
  CONSTRAINT dba_booking_answers_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id),
  CONSTRAINT dba_booking_answers_freelancer_id_fkey FOREIGN KEY (freelancer_id) REFERENCES public.profiles(id),
  CONSTRAINT dba_booking_answers_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.dba_questions(id),
  CONSTRAINT dba_booking_answers_question_group_id_fkey FOREIGN KEY (question_group_id) REFERENCES public.dba_question_groups(id),
  CONSTRAINT dba_booking_answers_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.dba_booking_dispute_summary (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL UNIQUE,
  total_disputes integer NOT NULL DEFAULT 0,
  critical_disputes integer NOT NULL DEFAULT 0,
  moderate_disputes integer NOT NULL DEFAULT 0,
  minor_disputes integer NOT NULL DEFAULT 0,
  resolved_disputes integer NOT NULL DEFAULT 0,
  resolution_progress numeric DEFAULT 0.00,
  all_disputes_resolved boolean DEFAULT false,
  client_acknowledged boolean DEFAULT false,
  freelancer_acknowledged boolean DEFAULT false,
  resolution_started_at timestamp with time zone,
  resolution_completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT dba_booking_dispute_summary_pkey PRIMARY KEY (id),
  CONSTRAINT dba_booking_dispute_summary_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id)
);
CREATE TABLE public.dba_dispute_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  dispute_id uuid NOT NULL,
  booking_id uuid NOT NULL,
  sender_type text NOT NULL CHECK (sender_type = ANY (ARRAY['client'::text, 'freelancer'::text])),
  sender_id uuid NOT NULL,
  message_type text NOT NULL DEFAULT 'text'::text CHECK (message_type = ANY (ARRAY['text'::text, 'answer_proposal'::text, 'acceptance'::text, 'rejection'::text])),
  message_content text NOT NULL,
  proposed_answer text,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT dba_dispute_messages_pkey PRIMARY KEY (id),
  CONSTRAINT dba_dispute_messages_dispute_id_fkey FOREIGN KEY (dispute_id) REFERENCES public.dba_question_disputes(id),
  CONSTRAINT dba_dispute_messages_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id)
);
CREATE TABLE public.dba_freelancer_answers (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  freelancer_id uuid NOT NULL,
  job_category_id uuid NOT NULL,
  question_id uuid,
  answer_value text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  question_group_id uuid,
  CONSTRAINT dba_freelancer_answers_pkey PRIMARY KEY (id),
  CONSTRAINT dba_freelancer_answers_job_category_id_fkey FOREIGN KEY (job_category_id) REFERENCES public.job_categories(id),
  CONSTRAINT dba_freelancer_answers_question_group_id_fkey FOREIGN KEY (question_group_id) REFERENCES public.dba_question_groups(id),
  CONSTRAINT fk_freelancer_answers_question_group FOREIGN KEY (question_group_id) REFERENCES public.dba_question_groups(id),
  CONSTRAINT dba_freelancer_answers_freelancer_id_fkey FOREIGN KEY (freelancer_id) REFERENCES public.profiles(id),
  CONSTRAINT dba_freelancer_answers_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.dba_questions(id)
);
CREATE TABLE public.dba_migration_log (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  booking_id uuid,
  freelancer_id uuid,
  migration_status text CHECK (migration_status = ANY (ARRAY['pending'::text, 'migrated'::text, 'failed'::text])),
  migration_date timestamp with time zone,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT dba_migration_log_pkey PRIMARY KEY (id),
  CONSTRAINT dba_migration_log_freelancer_id_fkey FOREIGN KEY (freelancer_id) REFERENCES public.profiles(id),
  CONSTRAINT dba_migration_log_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id)
);
CREATE TABLE public.dba_question_disputes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL,
  question_group_id uuid NOT NULL,
  freelancer_answer text NOT NULL,
  client_answer text NOT NULL,
  dispute_severity text NOT NULL CHECK (dispute_severity = ANY (ARRAY['minor'::text, 'moderate'::text, 'critical'::text])),
  resolution_status text NOT NULL DEFAULT 'pending'::text CHECK (resolution_status = ANY (ARRAY['pending'::text, 'negotiating'::text, 'resolved'::text, 'accepted_difference'::text])),
  resolved_answer text,
  resolution_method text CHECK (resolution_method = ANY (ARRAY['freelancer_accepted'::text, 'client_accepted'::text, 'negotiated'::text, 'agreed_difference'::text])),
  resolved_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT dba_question_disputes_pkey PRIMARY KEY (id),
  CONSTRAINT dba_question_disputes_question_group_id_fkey FOREIGN KEY (question_group_id) REFERENCES public.dba_question_groups(id),
  CONSTRAINT dba_question_disputes_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id)
);
CREATE TABLE public.dba_question_groups (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  base_question_en text NOT NULL,
  base_question_nl text NOT NULL,
  category USER-DEFINED NOT NULL,
  weight integer DEFAULT 1,
  audience text NOT NULL CHECK (audience = ANY (ARRAY['freelancer'::text, 'client'::text, 'both'::text])),
  options_json jsonb NOT NULL,
  score_mapping jsonb NOT NULL,
  order_index integer NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT dba_question_groups_pkey PRIMARY KEY (id)
);
CREATE TABLE public.dba_questions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  category USER-DEFINED NOT NULL,
  question_text_en text NOT NULL,
  question_text_nl text NOT NULL,
  question_type text NOT NULL DEFAULT 'boolean'::text,
  options jsonb,
  weight integer DEFAULT 1,
  is_freelancer_question boolean NOT NULL,
  is_required boolean DEFAULT true,
  order_index integer NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  audience text DEFAULT 'freelancer'::text CHECK (audience = ANY (ARRAY['freelancer'::text, 'client'::text, 'both'::text])),
  options_json jsonb,
  score_mapping jsonb,
  question_group_id uuid,
  CONSTRAINT dba_questions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.dba_reports (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  booking_id uuid NOT NULL,
  freelancer_id uuid NOT NULL,
  client_id uuid NOT NULL,
  score integer NOT NULL CHECK (score >= 0),
  risk_level USER-DEFINED NOT NULL,
  answers_json jsonb NOT NULL,
  pdf_url text,
  contract_pdf_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  dispute_count integer DEFAULT 0,
  dispute_score integer DEFAULT 0,
  methodology_version text DEFAULT 'v2_dutch_compliant'::text,
  CONSTRAINT dba_reports_pkey PRIMARY KEY (id),
  CONSTRAINT dba_reports_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(id),
  CONSTRAINT dba_reports_freelancer_id_fkey FOREIGN KEY (freelancer_id) REFERENCES public.profiles(id),
  CONSTRAINT dba_reports_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id)
);
CREATE TABLE public.dba_waivers (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  booking_id uuid NOT NULL,
  client_id uuid NOT NULL,
  waiver_reason text,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT dba_waivers_pkey PRIMARY KEY (id),
  CONSTRAINT dba_waivers_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(id),
  CONSTRAINT dba_waivers_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id)
);
CREATE TABLE public.feature_flags (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  flag_name text NOT NULL UNIQUE,
  is_enabled boolean DEFAULT false,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT feature_flags_pkey PRIMARY KEY (id)
);
CREATE TABLE public.freelancer_availability (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  freelancer_id uuid NOT NULL,
  category_id uuid,
  start_time timestamp with time zone NOT NULL,
  end_time timestamp with time zone NOT NULL,
  is_recurring boolean NOT NULL DEFAULT false,
  recurrence_pattern text,
  recurrence_end_date timestamp with time zone,
  certainty_level text NOT NULL DEFAULT 'guaranteed'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT freelancer_availability_pkey PRIMARY KEY (id),
  CONSTRAINT freelancer_availability_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.job_categories(id),
  CONSTRAINT freelancer_availability_freelancer_id_fkey FOREIGN KEY (freelancer_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.freelancer_global_availability (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  availability_group_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  freelancer_id uuid NOT NULL,
  start_time timestamp with time zone NOT NULL,
  end_time timestamp with time zone NOT NULL,
  is_recurring boolean DEFAULT false,
  recurrence_pattern text CHECK (recurrence_pattern = ANY (ARRAY['weekly'::text, 'biweekly'::text, 'monthly'::text])),
  recurrence_end_date timestamp with time zone,
  certainty_level text DEFAULT 'guaranteed'::text CHECK (certainty_level = ANY (ARRAY['guaranteed'::text, 'tentative'::text, 'unavailable'::text])),
  service_id uuid NOT NULL,
  category_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT freelancer_global_availability_pkey PRIMARY KEY (id),
  CONSTRAINT freelancer_global_availability_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.job_categories(id),
  CONSTRAINT freelancer_global_availability_freelancer_id_fkey FOREIGN KEY (freelancer_id) REFERENCES public.profiles(id),
  CONSTRAINT freelancer_global_availability_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.freelancer_job_offerings(id)
);
CREATE TABLE public.freelancer_job_offerings (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  freelancer_id uuid NOT NULL,
  category_id uuid NOT NULL,
  hourly_rate numeric,
  fixed_rate numeric,
  is_available_now boolean DEFAULT false,
  description text,
  experience_years numeric,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  subcategory_id uuid,
  metadata jsonb,
  display_order integer,
  CONSTRAINT freelancer_job_offerings_pkey PRIMARY KEY (id),
  CONSTRAINT freelancer_job_offerings_subcategory_id_fkey FOREIGN KEY (subcategory_id) REFERENCES public.job_subcategories(id),
  CONSTRAINT freelancer_job_offerings_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.job_categories(id),
  CONSTRAINT freelancer_job_offerings_freelancer_id_fkey FOREIGN KEY (freelancer_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.invoices (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  booking_id uuid NOT NULL,
  client_id uuid NOT NULL,
  freelancer_id uuid NOT NULL,
  amount numeric NOT NULL,
  status USER-DEFINED NOT NULL DEFAULT 'draft'::invoice_status,
  due_date timestamp with time zone,
  paid_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT invoices_pkey PRIMARY KEY (id),
  CONSTRAINT invoices_freelancer_id_fkey FOREIGN KEY (freelancer_id) REFERENCES public.profiles(id),
  CONSTRAINT invoices_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(id),
  CONSTRAINT invoices_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id)
);
CREATE TABLE public.job_categories (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  icon text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT job_categories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.job_offering_availability_settings (
  freelancer_id uuid NOT NULL,
  job_offering_id uuid NOT NULL,
  use_global_availability boolean DEFAULT true,
  CONSTRAINT job_offering_availability_settings_pkey PRIMARY KEY (freelancer_id, job_offering_id),
  CONSTRAINT job_offering_availability_settings_freelancer_id_fkey FOREIGN KEY (freelancer_id) REFERENCES public.profiles(id),
  CONSTRAINT job_offering_availability_settings_job_offering_id_fkey FOREIGN KEY (job_offering_id) REFERENCES public.freelancer_job_offerings(id)
);
CREATE TABLE public.job_subcategories (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  category_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT job_subcategories_pkey PRIMARY KEY (id),
  CONSTRAINT job_subcategories_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.job_categories(id)
);
CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  content text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id),
  CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  first_name text,
  last_name text,
  email text NOT NULL,
  user_type text NOT NULL,
  avatar_url text,
  bio text,
  skills ARRAY,
  hourly_rate numeric,
  location text,
  availability jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  metadata jsonb,
  latitude double precision,
  longitude double precision,
  service_radius integer DEFAULT 10,
  formatted_address text,
  phone text,
  wildcard_categories jsonb DEFAULT '{"odd_hours": false, "outdoor_work": false, "creative_work": false, "physical_work": false, "analytical_work": false, "customer_facing": false, "repetitive_work": false}'::jsonb,
  wildcard_enabled boolean DEFAULT false,
  profile_completeness integer DEFAULT 0,
  is_verified boolean DEFAULT false,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.real_time_availability (
  freelancer_id uuid NOT NULL,
  is_available_now boolean DEFAULT false,
  last_updated timestamp with time zone DEFAULT now(),
  CONSTRAINT real_time_availability_pkey PRIMARY KEY (freelancer_id),
  CONSTRAINT real_time_availability_freelancer_id_fkey FOREIGN KEY (freelancer_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.reviews (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  booking_id uuid NOT NULL,
  reviewer_id uuid NOT NULL,
  reviewee_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT reviews_pkey PRIMARY KEY (id),
  CONSTRAINT reviews_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES public.profiles(id),
  CONSTRAINT reviews_reviewee_id_fkey FOREIGN KEY (reviewee_id) REFERENCES public.profiles(id),
  CONSTRAINT reviews_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id)
);