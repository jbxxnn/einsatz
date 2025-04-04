-- Drop existing tables related to availability
DROP TABLE IF EXISTS "public"."availability_schedules" CASCADE;
DROP TABLE IF EXISTS "public"."real_time_availability" CASCADE;

-- Create new availability table with enhanced flexibility
CREATE TABLE "public"."freelancer_availability" (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
  "freelancer_id" UUID NOT NULL REFERENCES "public"."profiles"("id") ON DELETE CASCADE,
  "category_id" UUID NOT NULL REFERENCES "public"."job_categories"("id") ON DELETE CASCADE,
  "start_time" TIMESTAMPTZ NOT NULL,
  "end_time" TIMESTAMPTZ NOT NULL,
  "is_recurring" BOOLEAN NOT NULL DEFAULT false,
  "recurrence_pattern" TEXT, -- 'weekly', 'biweekly', 'monthly'
  "recurrence_end_date" TIMESTAMPTZ,
  "certainty_level" TEXT NOT NULL DEFAULT 'guaranteed', -- 'guaranteed', 'tentative', 'unavailable'
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "valid_time_range" CHECK ("end_time" > "start_time")
);

-- Add RLS policies
ALTER TABLE "public"."freelancer_availability" ENABLE ROW LEVEL SECURITY;

-- Policy for select
CREATE POLICY "Anyone can view availability" 
ON "public"."freelancer_availability" 
FOR SELECT USING (true);

-- Policy for insert/update/delete
CREATE POLICY "Freelancers can manage their own availability" 
ON "public"."freelancer_availability" 
FOR ALL USING (
  auth.uid() = freelancer_id
);

-- Create index for faster queries
CREATE INDEX "idx_freelancer_availability_freelancer_id" ON "public"."freelancer_availability" ("freelancer_id");
CREATE INDEX "idx_freelancer_availability_category_id" ON "public"."freelancer_availability" ("category_id");
CREATE INDEX "idx_freelancer_availability_time_range" ON "public"."freelancer_availability" ("start_time", "end_time");

