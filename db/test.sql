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
  CONSTRAINT bookings_pkey PRIMARY KEY (id),
  CONSTRAINT bookings_freelancer_id_fkey FOREIGN KEY (freelancer_id) REFERENCES public.profiles(id),
  CONSTRAINT bookings_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.job_categories(id),
  CONSTRAINT bookings_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(id)
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
  CONSTRAINT dba_audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT dba_audit_logs_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id)
);
CREATE TABLE public.dba_booking_answers (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  booking_id uuid NOT NULL,
  client_id uuid NOT NULL,
  freelancer_id uuid NOT NULL,
  question_id uuid NOT NULL,
  answer_value text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT dba_booking_answers_pkey PRIMARY KEY (id),
  CONSTRAINT dba_booking_answers_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.dba_questions(id),
  CONSTRAINT dba_booking_answers_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id),
  CONSTRAINT dba_booking_answers_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(id),
  CONSTRAINT dba_booking_answers_freelancer_id_fkey FOREIGN KEY (freelancer_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.dba_freelancer_answers (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  freelancer_id uuid NOT NULL,
  job_category_id uuid NOT NULL,
  question_id uuid NOT NULL,
  answer_value text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT dba_freelancer_answers_pkey PRIMARY KEY (id),
  CONSTRAINT dba_freelancer_answers_freelancer_id_fkey FOREIGN KEY (freelancer_id) REFERENCES public.profiles(id),
  CONSTRAINT dba_freelancer_answers_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.dba_questions(id),
  CONSTRAINT dba_freelancer_answers_job_category_id_fkey FOREIGN KEY (job_category_id) REFERENCES public.job_categories(id)
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
  CONSTRAINT dba_reports_pkey PRIMARY KEY (id),
  CONSTRAINT dba_reports_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id),
  CONSTRAINT dba_reports_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(id),
  CONSTRAINT dba_reports_freelancer_id_fkey FOREIGN KEY (freelancer_id) REFERENCES public.profiles(id)
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
  CONSTRAINT dba_waivers_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id),
  CONSTRAINT dba_waivers_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(id)
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
  CONSTRAINT freelancer_availability_freelancer_id_fkey FOREIGN KEY (freelancer_id) REFERENCES public.profiles(id),
  CONSTRAINT freelancer_availability_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.job_categories(id)
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
  CONSTRAINT freelancer_global_availability_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.freelancer_job_offerings(id),
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
  CONSTRAINT freelancer_job_offerings_pkey PRIMARY KEY (id),
  CONSTRAINT freelancer_job_offerings_freelancer_id_fkey FOREIGN KEY (freelancer_id) REFERENCES public.profiles(id),
  CONSTRAINT freelancer_job_offerings_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.job_categories(id),
  CONSTRAINT freelancer_job_offerings_subcategory_id_fkey FOREIGN KEY (subcategory_id) REFERENCES public.job_subcategories(id)
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
  CONSTRAINT job_offering_availability_settings_job_offering_id_fkey FOREIGN KEY (job_offering_id) REFERENCES public.freelancer_job_offerings(id),
  CONSTRAINT job_offering_availability_settings_freelancer_id_fkey FOREIGN KEY (freelancer_id) REFERENCES public.profiles(id)
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
  CONSTRAINT reviews_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id),
  CONSTRAINT reviews_reviewee_id_fkey FOREIGN KEY (reviewee_id) REFERENCES public.profiles(id)
);