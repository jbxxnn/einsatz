-- Create storage bucket for booking images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('booking-images', 'booking-images', true);

-- Add images field to bookings table
ALTER TABLE bookings 
ADD COLUMN images JSONB DEFAULT '[]'::jsonb;

-- Create RLS policy for booking images
CREATE POLICY "Users can upload booking images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'booking-images');

CREATE POLICY "Users can view booking images" ON storage.objects
FOR SELECT USING (bucket_id = 'booking-images');

CREATE POLICY "Users can delete their own booking images" ON storage.objects
FOR DELETE USING (bucket_id = 'booking-images');
