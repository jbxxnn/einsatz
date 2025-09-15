-- Migration: Add quantity_type to package items
-- This migration adds a field to distinguish between fixed and variable quantity items

-- Add quantity_type field to job_offering_package_items table
ALTER TABLE public.job_offering_package_items 
ADD COLUMN quantity_type text NOT NULL DEFAULT 'variable' CHECK (quantity_type = ANY (ARRAY['fixed'::text, 'variable'::text]));

-- Add fixed_quantity field for fixed items
ALTER TABLE public.job_offering_package_items 
ADD COLUMN fixed_quantity numeric DEFAULT NULL;

-- Add a comment to explain the fields
COMMENT ON COLUMN public.job_offering_package_items.quantity_type IS 'Type of quantity: fixed (predetermined) or variable (client adjustable)';
COMMENT ON COLUMN public.job_offering_package_items.fixed_quantity IS 'Fixed quantity for fixed-type items. NULL for variable-type items.';

-- Update existing items to be variable by default
UPDATE public.job_offering_package_items 
SET quantity_type = 'variable' 
WHERE quantity_type IS NULL;
