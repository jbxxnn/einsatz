-- Create job subcategories table
CREATE TABLE job_subcategories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES job_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(category_id, name)
);

-- Add updated_at trigger
CREATE TRIGGER update_job_subcategories_updated_at
BEFORE UPDATE ON job_subcategories
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Modify freelancer_job_offerings to include subcategory
ALTER TABLE freelancer_job_offerings 
ADD COLUMN subcategory_id UUID REFERENCES job_subcategories(id) ON DELETE SET NULL;

-- Set up RLS policies for subcategories
ALTER TABLE job_subcategories ENABLE ROW LEVEL SECURITY;

-- Job subcategories policies (anyone can view)
CREATE POLICY "Anyone can view job subcategories"
ON job_subcategories FOR SELECT USING (true);

-- Insert the categories and subcategories
-- First, clear existing categories to avoid duplicates
DELETE FROM job_categories;

-- Insert main categories
INSERT INTO job_categories (id, name, description, icon) VALUES
('1f8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e', 'Logistics & Warehousing', 'Warehouse operations, inventory management, and logistics support', 'package'),
('2f8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e', 'Hospitality & Food', 'Restaurant, hotel, and food service positions', 'utensils'),
('3f8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e', 'Retail & Customer Support', 'Retail store operations and customer service roles', 'shopping-bag'),
('4f8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e', 'Construction & Trade Labor', 'Construction sites and skilled trade work', 'hard-hat'),
('5f8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e', 'Facilities Maintenance & Cleaning', 'Janitorial, maintenance, and cleaning services', 'spray-can'),
('6f8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e', 'Events & Entertainment', 'Event staffing and entertainment industry support', 'music'),
('7f8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e', 'Security & Safety', 'Security personnel and safety monitoring', 'shield'),
('8f8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e', 'Agriculture & Outdoor Work', 'Farm work, landscaping, and outdoor labor', 'tree'),
('9f8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e', 'Manufacturing & Assembly', 'Factory work, assembly lines, and production', 'factory'),
('af8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e', 'Transportation & Delivery', 'Driving, delivery, and transportation services', 'truck'),
('bf8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e', 'Administrative & Office Support', 'Office administration and clerical work', 'briefcase');

-- Insert subcategories
-- Logistics & Warehousing
INSERT INTO job_subcategories (category_id, name) VALUES
('1f8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e', 'Forklift Driver'),
('1f8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e', 'Inventory Control'),
('1f8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e', 'Package Handler'),
('1f8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e', 'Order Picker'),
('1f8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e', 'Shipping / Receiving Clerk');

-- Hospitality & Food
INSERT INTO job_subcategories (category_id, name) VALUES
('2f8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e', 'Waiter'),
('2f8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e', 'Bartender'),
('2f8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e', 'Line Cook'),
('2f8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e', 'Kitchen Assistant'),
('2f8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e', 'Front Desk Staff'),
('2f8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e', 'Banquet Server'),
('2f8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e', 'Barista');

-- Retail & Customer Support
INSERT INTO job_subcategories (category_id, name) VALUES
('3f8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e', 'Cashier'),
('3f8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e', 'Shelf Stocker'),
('3f8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e', 'Customer Service Associate'),
('3f8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e', 'Merchandise Display Staff'),
('3f8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e', 'Store Greeter');

-- Construction & Trade Labor
INSERT INTO job_subcategories (category_id, name) VALUES
('4f8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e', 'Carpentry'),
('4f8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e', 'Painting'),
('4f8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e', 'Flooring'),
('4f8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e', 'Electrician'),
('4f8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e', 'Plumbing'),
('4f8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e', 'Welding'),
('4f8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e', 'Masonry'),
('4f8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e', 'Street Paving'),
('4f8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e', 'Ground Work');

-- Facilities Maintenance & Cleaning
INSERT INTO job_subcategories (category_id, name) VALUES
('5f8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e', 'Housekeeping'),
('5f8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e', 'Janitor'),
('5f8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e', 'Custodian'),
('5f8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e', 'Groundskeeping'),
('5f8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e', 'Window Cleaning'),
('5f8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e', 'Specialty Cleaning');

-- Events & Entertainment
INSERT INTO job_subcategories (category_id, name) VALUES
('6f8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e', 'Setup/Teardown Crew'),
('6f8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e', 'Ushering'),
('6f8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e', 'Stage Hand'),
('6f8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e', 'Ticket Staffing'),
('6f8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e', 'Coat Check Attendant'),
('6f8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e', 'Brand Ambassador');

-- Security & Safety
INSERT INTO job_subcategories (category_id, name) VALUES
('7f8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e', 'Security Guard'),
('7f8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e', 'Bouncer'),
('7f8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e', 'Parking Lot Attendant'),
('7f8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e', 'Event Security'),
('7f8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e', 'Night Watch');

-- Agriculture & Outdoor Work
INSERT INTO job_subcategories (category_id, name) VALUES
('8f8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e', 'Farmhand'),
('8f8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e', 'Landscaping'),
('8f8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e', 'Groundwork'),
('8f8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e', 'Harvest Work'),
('8f8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e', 'Nursery/Greenhouse Work'),
('8f8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e', 'Groundskeeping Work');

-- Manufacturing & Assembly
INSERT INTO job_subcategories (category_id, name) VALUES
('9f8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e', 'Machine Operator'),
('9f8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e', 'Assembly Line Work'),
('9f8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e', 'Quality Control'),
('9f8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e', 'Packaging');

-- Transportation & Delivery
INSERT INTO job_subcategories (category_id, name) VALUES
('af8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e', 'Delivery Driver - Van'),
('af8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e', 'Delivery Driver - Truck'),
('af8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e', 'Delivery Driver - Bike'),
('af8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e', 'Delivery Door to Door'),
('af8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e', 'Dispatcher');

-- Administrative & Office Support
INSERT INTO job_subcategories (category_id, name) VALUES
('bf8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e', 'Receptionist'),
('bf8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e', 'Office Work'),
('bf8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e', 'Clerical Staff'),
('bf8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e', 'Data Entry'),
('bf8f7a9a-0d9c-4b5c-8f1e-6b9c0d5c8f1e', 'Mailroom Staff');

