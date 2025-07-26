-- Migration: Add cover template support to profiles table
-- This migration ensures the metadata field can store cover template selections

-- Add a comment to the metadata column to document the cover template field
COMMENT ON COLUMN public.profiles.metadata IS 'JSONB field containing user metadata including coverTemplate (string), social links, and other profile settings';

-- Create a GIN index on the full metadata field for better JSONB query performance
CREATE INDEX IF NOT EXISTS idx_profiles_metadata_gin 
ON public.profiles USING GIN (metadata);

-- Create a BTREE index specifically for cover template queries
CREATE INDEX IF NOT EXISTS idx_profiles_metadata_cover_template 
ON public.profiles USING BTREE ((metadata->>'coverTemplate'));

-- Update existing profiles to have a default cover template if none exists
UPDATE public.profiles 
SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"coverTemplate": "modern-gradient"}'::jsonb
WHERE user_type = 'freelancer' 
  AND (metadata IS NULL OR metadata->>'coverTemplate' IS NULL); 