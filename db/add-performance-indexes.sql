-- Performance Indexes for Freelancers API
-- This script adds indexes to optimize the freelancers API queries

-- Index for filtering by user_type (freelancers)
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON profiles(user_type);

-- Index for hourly_rate range queries
CREATE INDEX IF NOT EXISTS idx_profiles_hourly_rate ON profiles(hourly_rate);

-- Composite index for user_type + hourly_rate (common filter combination)
CREATE INDEX IF NOT EXISTS idx_profiles_user_type_hourly_rate ON profiles(user_type, hourly_rate);

-- Index for real_time_availability queries
CREATE INDEX IF NOT EXISTS idx_real_time_availability_freelancer_available ON real_time_availability(freelancer_id, is_available_now);

-- Index for bookings status queries
CREATE INDEX IF NOT EXISTS idx_bookings_freelancer_status ON bookings(freelancer_id, status);

-- Index for freelancer_job_offerings (if not already exists)
CREATE INDEX IF NOT EXISTS idx_freelancer_job_offerings_freelancer_id ON freelancer_job_offerings(freelancer_id);

-- Index for job_categories name lookups
CREATE INDEX IF NOT EXISTS idx_job_categories_name ON job_categories(name);

-- Index for location-based queries (latitude, longitude)
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles(latitude, longitude);

-- Index for skills array queries (if using PostgreSQL array operations)
CREATE INDEX IF NOT EXISTS idx_profiles_skills_gin ON profiles USING GIN(skills);

-- Index for wildcard_categories (if using JSONB)
CREATE INDEX IF NOT EXISTS idx_profiles_wildcard_categories_gin ON profiles USING GIN(wildcard_categories);

-- Index for text search on first_name, last_name, bio
CREATE INDEX IF NOT EXISTS idx_profiles_text_search ON profiles USING GIN(to_tsvector('english', first_name || ' ' || last_name || ' ' || COALESCE(bio, '')));

-- Verify indexes were created
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('profiles', 'real_time_availability', 'bookings', 'freelancer_job_offerings', 'job_categories')
ORDER BY tablename, indexname; 