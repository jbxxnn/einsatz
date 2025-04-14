-- Add payment_method field to bookings table
ALTER TABLE public.bookings 
ADD COLUMN payment_method VARCHAR(20) DEFAULT 'online' CHECK (payment_method IN ('online', 'offline'));

-- Update RLS policies to include the new field
ALTER POLICY "Clients can view their own bookings" ON public.bookings 
USING (auth.uid() = client_id);

ALTER POLICY "Freelancers can view bookings where they are the freelancer" ON public.bookings 
USING (auth.uid() = freelancer_id);



-- Add payment_method column to bookings table
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS payment_method TEXT CHECK (payment_method IN ('online', 'offline'));

-- Set default value for existing records
UPDATE bookings 
SET payment_method = 'online' 
WHERE payment_method IS NULL;

-- Add comment to explain the column
COMMENT ON COLUMN bookings.payment_method IS 'Payment method selected by the client: online (platform payment) or offline (direct payment to freelancer)';
