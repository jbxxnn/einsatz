-- Add detailed package items system for job offerings
-- This allows freelancers to create packages with detailed line items (labour, materials, others)
-- Each package can have multiple items with type, offering, price per unit, and unit type

-- Create unit types reference table
CREATE TABLE IF NOT EXISTS public.unit_types (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL UNIQUE,
  symbol text NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT unit_types_pkey PRIMARY KEY (id)
);

-- Insert common unit types
INSERT INTO public.unit_types (name, symbol, description) VALUES
('square_meters', 'm²', 'Square meters'),
('meters', 'm', 'Meters'),
('hours', 'hrs', 'Hours'),
('pieces', 'pcs', 'Pieces'),
('rounds', 'rounds', 'Revision rounds'),
('units', 'units', 'Generic units'),
('days', 'days', 'Days'),
('weeks', 'weeks', 'Weeks'),
('months', 'months', 'Months'),
('kg', 'kg', 'Kilograms'),
('liters', 'L', 'Liters'),
('each', 'each', 'Each item'),
('per_project', 'project', 'Per project'),
('per_room', 'room', 'Per room'),
('per_sqft', 'sqft', 'Per square foot')
ON CONFLICT (name) DO NOTHING;

-- Create job_offering_package_items table
CREATE TABLE IF NOT EXISTS public.job_offering_package_items (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  package_id uuid NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['labour'::text, 'materials'::text, 'others'::text])),
  offering text NOT NULL,
  price_per_unit numeric NOT NULL,
  unit_type text NOT NULL,
  display_order integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT job_offering_package_items_pkey PRIMARY KEY (id),
  CONSTRAINT job_offering_package_items_package_id_fkey FOREIGN KEY (package_id) REFERENCES public.job_offering_packages(id) ON DELETE CASCADE
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_job_offering_package_items_package_id ON public.job_offering_package_items(package_id);
CREATE INDEX IF NOT EXISTS idx_job_offering_package_items_display_order ON public.job_offering_package_items(package_id, display_order);
CREATE INDEX IF NOT EXISTS idx_job_offering_package_items_type ON public.job_offering_package_items(type);

-- Add comments for documentation
COMMENT ON TABLE public.unit_types IS 'Reference table for unit types used in package items';
COMMENT ON TABLE public.job_offering_package_items IS 'Detailed line items for each job offering package (labour, materials, others)';

COMMENT ON COLUMN public.job_offering_package_items.type IS 'Type of item: labour, materials, or others';
COMMENT ON COLUMN public.job_offering_package_items.offering IS 'Description of the specific service or material';
COMMENT ON COLUMN public.job_offering_package_items.price_per_unit IS 'Price for one unit of this item';
COMMENT ON COLUMN public.job_offering_package_items.unit_type IS 'Unit of measurement (e.g., m², hours, pieces)';

-- Add RLS policies if needed (adjust based on your RLS setup)
-- ALTER TABLE public.job_offering_package_items ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.unit_types ENABLE ROW LEVEL SECURITY;

-- Create a view for easy package totals calculation
CREATE OR REPLACE VIEW public.package_totals AS
SELECT 
  p.id as package_id,
  p.package_name,
  p.job_offering_id,
  COUNT(i.id) as item_count,
  COALESCE(SUM(i.price_per_unit), 0) as total_price,
  COALESCE(SUM(CASE WHEN i.type = 'labour' THEN i.price_per_unit ELSE 0 END), 0) as labour_total,
  COALESCE(SUM(CASE WHEN i.type = 'materials' THEN i.price_per_unit ELSE 0 END), 0) as materials_total,
  COALESCE(SUM(CASE WHEN i.type = 'others' THEN i.price_per_unit ELSE 0 END), 0) as others_total
FROM public.job_offering_packages p
LEFT JOIN public.job_offering_package_items i ON p.id = i.package_id
GROUP BY p.id, p.package_name, p.job_offering_id;

COMMENT ON VIEW public.package_totals IS 'View to calculate totals for packages including breakdown by type';

