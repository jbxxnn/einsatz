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
CREATE TABLE public.booking_dba_assessments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  booking_id uuid NOT NULL UNIQUE,
  job_category_id uuid NOT NULL,
  freelancer_id uuid NOT NULL,
  client_id uuid NOT NULL,
  client_total_score integer NOT NULL DEFAULT 0,
  freelancer_total_score integer NOT NULL DEFAULT 0,
  combined_score integer NOT NULL DEFAULT 0,
  risk_level text NOT NULL CHECK (risk_level = ANY (ARRAY['safe'::text, 'doubtful'::text, 'high_risk'::text])),
  risk_percentage numeric NOT NULL DEFAULT 0.00,
  has_freelancer_dba boolean NOT NULL DEFAULT false,
  freelancer_dba_completion_id uuid,
  client_decision text NOT NULL DEFAULT 'pending'::text CHECK (client_decision = ANY (ARRAY['pending'::text, 'proceed'::text, 'cancelled'::text, 'disputed'::text])),
  dispute_opened boolean NOT NULL DEFAULT false,
  dispute_opened_at timestamp with time zone,
  dispute_resolved_at timestamp with time zone,
  dispute_resolution_type text CHECK (dispute_resolution_type = ANY (ARRAY['freelancer_updated'::text, 'client_proceeded'::text, 'cancelled'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT booking_dba_assessments_pkey PRIMARY KEY (id),
  CONSTRAINT booking_dba_assessments_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id),
  CONSTRAINT booking_dba_assessments_freelancer_dba_completion_id_fkey FOREIGN KEY (freelancer_dba_completion_id) REFERENCES public.freelancer_dba_completions(id),
  CONSTRAINT booking_dba_assessments_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(id),
  CONSTRAINT booking_dba_assessments_freelancer_id_fkey FOREIGN KEY (freelancer_id) REFERENCES public.profiles(id),
  CONSTRAINT booking_dba_assessments_job_category_id_fkey FOREIGN KEY (job_category_id) REFERENCES public.job_categories(id)
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
  hourly_rate numeric,
  total_amount numeric NOT NULL,
  payment_status USER-DEFINED NOT NULL DEFAULT 'unpaid'::payment_status,
  payment_intent_id text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  category_id uuid,
  payment_method character varying DEFAULT 'online'::character varying CHECK (payment_method::text = ANY (ARRAY['online'::character varying, 'offline'::character varying]::text[])),
  booking_status USER-DEFINED DEFAULT 'pending_payment'::booking_status_enum,
  images jsonb DEFAULT '[]'::jsonb,
  package_id uuid,
  package_name text,
  package_description text,
  CONSTRAINT bookings_pkey PRIMARY KEY (id),
  CONSTRAINT bookings_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.job_categories(id),
  CONSTRAINT bookings_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(id),
  CONSTRAINT bookings_freelancer_id_fkey FOREIGN KEY (freelancer_id) REFERENCES public.profiles(id),
  CONSTRAINT bookings_package_id_fkey FOREIGN KEY (package_id) REFERENCES public.job_offering_packages(id)
);
CREATE TABLE public.client_dba_answers (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  booking_id uuid NOT NULL,
  question_id integer NOT NULL,
  selected_option_index integer NOT NULL,
  answer_score integer NOT NULL,
  answered_at timestamp with time zone DEFAULT now(),
  CONSTRAINT client_dba_answers_pkey PRIMARY KEY (id),
  CONSTRAINT client_dba_answers_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.dba_questions(id),
  CONSTRAINT client_dba_answers_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id)
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
CREATE TABLE public.dba_disputes (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  booking_id uuid NOT NULL UNIQUE,
  assessment_id uuid NOT NULL,
  client_id uuid NOT NULL,
  freelancer_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'open'::text CHECK (status = ANY (ARRAY['open'::text, 'resolved'::text, 'cancelled'::text])),
  resolution_type text CHECK (resolution_type = ANY (ARRAY['freelancer_updated'::text, 'client_proceeded'::text, 'cancelled'::text])),
  created_at timestamp with time zone DEFAULT now(),
  resolved_at timestamp with time zone,
  CONSTRAINT dba_disputes_pkey PRIMARY KEY (id),
  CONSTRAINT dba_disputes_freelancer_id_fkey FOREIGN KEY (freelancer_id) REFERENCES public.profiles(id),
  CONSTRAINT dba_disputes_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id),
  CONSTRAINT dba_disputes_assessment_id_fkey FOREIGN KEY (assessment_id) REFERENCES public.booking_dba_assessments(id),
  CONSTRAINT dba_disputes_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.dba_questions (
  id integer NOT NULL,
  question_text text NOT NULL,
  respondent_type USER-DEFINED NOT NULL,
  options_json jsonb NOT NULL,
  score_mapping jsonb NOT NULL,
  category text,
  display_order integer DEFAULT 0,
  is_visible boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT dba_questions_pkey PRIMARY KEY (id)
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
CREATE TABLE public.freelancer_dba_answers (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  freelancer_id uuid NOT NULL,
  job_category_id uuid NOT NULL,
  question_id integer NOT NULL,
  selected_option_index integer NOT NULL,
  answer_score integer NOT NULL,
  answered_at timestamp with time zone DEFAULT now(),
  CONSTRAINT freelancer_dba_answers_pkey PRIMARY KEY (id),
  CONSTRAINT freelancer_dba_answers_freelancer_id_fkey FOREIGN KEY (freelancer_id) REFERENCES public.profiles(id),
  CONSTRAINT freelancer_dba_answers_job_category_id_fkey FOREIGN KEY (job_category_id) REFERENCES public.job_categories(id),
  CONSTRAINT freelancer_dba_answers_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.dba_questions(id)
);
CREATE TABLE public.freelancer_dba_completions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  freelancer_id uuid NOT NULL,
  job_category_id uuid NOT NULL,
  total_questions integer NOT NULL DEFAULT 0,
  answered_questions integer NOT NULL DEFAULT 0,
  total_score integer NOT NULL DEFAULT 0,
  max_possible_score integer NOT NULL DEFAULT 0,
  risk_percentage numeric NOT NULL DEFAULT 0.00,
  risk_level text CHECK (risk_level = ANY (ARRAY['safe'::text, 'doubtful'::text, 'high_risk'::text])),
  is_completed boolean NOT NULL DEFAULT false,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT freelancer_dba_completions_pkey PRIMARY KEY (id),
  CONSTRAINT freelancer_dba_completions_job_category_id_fkey FOREIGN KEY (job_category_id) REFERENCES public.job_categories(id),
  CONSTRAINT freelancer_dba_completions_freelancer_id_fkey FOREIGN KEY (freelancer_id) REFERENCES public.profiles(id)
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
  CONSTRAINT freelancer_global_availability_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.freelancer_job_offerings(id),
  CONSTRAINT freelancer_global_availability_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.job_categories(id),
  CONSTRAINT freelancer_global_availability_freelancer_id_fkey FOREIGN KEY (freelancer_id) REFERENCES public.profiles(id)
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
  pricing_type text NOT NULL DEFAULT 'hourly'::text CHECK (pricing_type = ANY (ARRAY['hourly'::text, 'packages'::text])),
  CONSTRAINT freelancer_job_offerings_pkey PRIMARY KEY (id),
  CONSTRAINT freelancer_job_offerings_subcategory_id_fkey FOREIGN KEY (subcategory_id) REFERENCES public.job_subcategories(id),
  CONSTRAINT freelancer_job_offerings_freelancer_id_fkey FOREIGN KEY (freelancer_id) REFERENCES public.profiles(id),
  CONSTRAINT freelancer_job_offerings_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.job_categories(id)
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
  CONSTRAINT invoices_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id),
  CONSTRAINT invoices_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.job_categories (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  icon text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  name_nl text,
  name_en text,
  description_nl text,
  description_en text,
  CONSTRAINT job_categories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.job_offering_availability_settings (
  freelancer_id uuid NOT NULL,
  job_offering_id uuid NOT NULL,
  use_global_availability boolean DEFAULT true,
  CONSTRAINT job_offering_availability_settings_pkey PRIMARY KEY (freelancer_id, job_offering_id),
  CONSTRAINT job_offering_availability_settings_job_offering_id_fkey FOREIGN KEY (job_offering_id) REFERENCES public.freelancer_job_offerings(id),
  CONSTRAINT job_offering_availability_settings_freelancer_id_fkey FOREIGN KEY (freelancer_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.job_offering_packages (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  job_offering_id uuid NOT NULL,
  package_name text NOT NULL,
  short_description text,
  price numeric NOT NULL,
  display_order integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT job_offering_packages_pkey PRIMARY KEY (id),
  CONSTRAINT job_offering_packages_job_offering_id_fkey FOREIGN KEY (job_offering_id) REFERENCES public.freelancer_job_offerings(id)
);
CREATE TABLE public.job_subcategories (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  category_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  name_nl text,
  name_en text,
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
  CONSTRAINT reviews_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id),
  CONSTRAINT reviews_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES public.profiles(id),
  CONSTRAINT reviews_reviewee_id_fkey FOREIGN KEY (reviewee_id) REFERENCES public.profiles(id)
);