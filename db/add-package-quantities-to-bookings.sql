-- Migration: Add package quantities to bookings table
-- This migration adds a field to store the selected package quantities for each booking

-- Add package_quantities field to store the quantities selected by the client
-- This will be a JSONB field storing: { "item_id": quantity, "item_id": quantity, ... }
ALTER TABLE public.bookings 
ADD COLUMN package_quantities jsonb DEFAULT '{}'::jsonb;

-- Add a comment to explain the field
COMMENT ON COLUMN public.bookings.package_quantities IS 'Stores the quantities selected by the client for each package item. Format: {"item_id": quantity, ...}';

-- Create an index for better query performance on package_quantities
CREATE INDEX idx_bookings_package_quantities ON public.bookings USING gin (package_quantities);

-- Update existing bookings that have package_id but no quantities to have empty quantities
UPDATE public.bookings 
SET package_quantities = '{}'::jsonb 
WHERE package_id IS NOT NULL AND package_quantities IS NULL;
