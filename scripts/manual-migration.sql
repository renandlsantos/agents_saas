-- Manual migration script for adding category and isDomain fields to agents table
-- Run this script in your PostgreSQL database

-- Add category and isDomain fields to agents table
ALTER TABLE agents 
ADD COLUMN IF NOT EXISTS category VARCHAR(50),
ADD COLUMN IF NOT EXISTS is_domain BOOLEAN DEFAULT FALSE;

-- Add index for better performance when filtering by category
CREATE INDEX IF NOT EXISTS idx_agents_category ON agents(category);

-- Add index for domain agents
CREATE INDEX IF NOT EXISTS idx_agents_is_domain ON agents(is_domain);

-- Update existing agents to have a default category if needed
UPDATE agents 
SET category = 'general' 
WHERE category IS NULL;

-- Show the updated table structure
\d agents