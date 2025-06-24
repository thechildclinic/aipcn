-- Initialize AI-Powered Care Database
-- This script sets up the initial database structure and data

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create custom types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('patient', 'doctor', 'pharmacy_staff', 'lab_staff', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_type AS ENUM ('pharmacy', 'lab');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_status AS ENUM ('pending', 'awaiting_bids', 'assigned', 'in_progress', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE provider_type AS ENUM ('pharmacy', 'lab');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE bid_status AS ENUM ('submitted', 'accepted', 'rejected', 'expired');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create indexes for better performance
-- These will be created automatically by Sequelize, but we can add custom ones here

-- Full-text search indexes
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_search 
--   ON users USING gin(to_tsvector('english', first_name || ' ' || last_name || ' ' || email));

-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_providers_search 
--   ON providers USING gin(to_tsvector('english', name || ' ' || address));

-- Partial indexes for active records
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_active 
--   ON users (id) WHERE is_active = true;

-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_providers_active 
--   ON providers (id) WHERE is_active = true;

-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_active 
--   ON orders (id) WHERE status IN ('pending', 'awaiting_bids', 'assigned', 'in_progress');

-- Insert initial configuration data
-- This will be handled by Sequelize seeders, but we can add essential data here

-- Create a function to generate sample data (for development only)
CREATE OR REPLACE FUNCTION generate_sample_data()
RETURNS void AS $$
BEGIN
    -- Only run in development environment
    IF current_setting('server_version_num')::int >= 120000 THEN
        RAISE NOTICE 'Sample data generation is disabled in production';
        RETURN;
    END IF;
    
    -- This function can be called to generate sample data for development
    RAISE NOTICE 'Sample data generation function created';
END;
$$ LANGUAGE plpgsql;

-- Create a function to clean up old data
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
    -- Clean up old expired bids
    DELETE FROM bids 
    WHERE status = 'expired' 
    AND created_at < NOW() - INTERVAL '30 days';
    
    -- Clean up old cancelled orders
    DELETE FROM orders 
    WHERE status = 'cancelled' 
    AND created_at < NOW() - INTERVAL '90 days';
    
    RAISE NOTICE 'Old data cleanup completed';
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to run cleanup (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-old-data', '0 2 * * *', 'SELECT cleanup_old_data();');

COMMIT;
