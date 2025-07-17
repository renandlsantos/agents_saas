-- Add category and isDomain fields to agents table
ALTER TABLE agents 
ADD COLUMN category VARCHAR(50),
ADD COLUMN is_domain BOOLEAN DEFAULT FALSE;

-- Add index for better performance when filtering by category
CREATE INDEX idx_agents_category ON agents(category);

-- Add index for domain agents
CREATE INDEX idx_agents_is_domain ON agents(is_domain);