# Domain Agents Guide

## Overview

Domain agents are AI assistants created by administrators that are visible to all users in the Agents SaaS platform. They appear in the `/discover/assistants` page organized by categories.

## How It Works

### 1. Creating Domain Agents (Admin Panel)

1. Go to Admin Panel → Agents

2. Click "Criar Agente" (Create Agent)

3. Fill in the agent details:
   - **Name**: Agent name
   - **Description**: What the agent does
   - **System Prompt**: The agent's behavior instructions
   - **Category**: Select from the dropdown (Acadêmico, Marketing, etc.)
   - **Tags**: Comma-separated keywords
   - **Domain Agent Toggle**: Turn ON to make visible to all users
   - **Knowledge Bank**: Upload files for the agent's knowledge base

4. Click "Criar Agente" to save

### 2. Database Structure

The agents table now includes:

- `category`: VARCHAR(50) - The agent's category (academic, marketing, etc.)
- `isDomain`: BOOLEAN - Whether this is a domain agent visible to all users

### 3. Discovery Integration

Domain agents automatically appear in:

- `/discover/assistants` - All agents page
- `/discover/assistants/[category]` - Category-specific pages

The system merges:

1. External agents from the agent store (filtered by "Agents SaaS" author)
2. Domain agents from the database

### 4. Categories

The available categories match the discover page:

- `academic` - Acadêmico 🔬
- `career` - Carreira 💼
- `copywriting` - Redação ✏️
- `design` - Design 🎨
- `education` - Educação 🎓
- `emotions` - Emoções 😊
- `entertainment` - Entretenimento 🎭
- `games` - Jogos 🎮
- `general` - Geral 📚
- `life` - Vida ☕
- `marketing` - Marketing 💰
- `office` - Escritório 🖨️
- `programming` - Programação 💻
- `translation` - Tradução 🌐

## Running the Migration

Before using domain agents, run the database migration:

### Option 1: Using pnpm (when database is running)

```bash
pnpm db:migrate
```

### Option 2: Manual SQL

```sql
-- Run in your PostgreSQL database
ALTER TABLE agents
ADD COLUMN IF NOT EXISTS category VARCHAR(50),
ADD COLUMN IF NOT EXISTS is_domain BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_agents_category ON agents(category);
CREATE INDEX IF NOT EXISTS idx_agents_is_domain ON agents(is_domain);
```

## Technical Implementation

### DomainAgentsService

- Fetches domain agents from the database
- Transforms them to DiscoverAssistantItem format
- Located at: `/src/server/services/discover/domainAgents.ts`

### DiscoverService Integration

- Modified to include domain agents in `getAssistantList()`
- Merges external and domain agents
- Removes duplicates based on identifier
- Category filtering works automatically

### Admin API Endpoints

- `getAgents` - List domain agents with pagination
- `createAgent` - Create new domain agent with knowledge base
- `updateAgent` - Update existing domain agent
- `deleteAgent` - Remove domain agent
- `getAgentCategories` - Get available categories

## Testing

1. Create a domain agent in the admin panel
2. Visit `/discover/assistants` - should see all domain agents
3. Click on a category - should see filtered domain agents
4. All users should see the same domain agents

## Troubleshooting

### Agents not appearing in discover

1. Ensure `isDomain` is set to `true`
2. Check that `category` is set to a valid value
3. Verify the database migration has run

### Category filtering not working

1. Ensure the category matches exactly (case-sensitive)
2. Check the AssistantCategory enum values

### Knowledge base not working

1. File upload creates metadata only (actual upload to S3 needs implementation)
2. Knowledge base is created but file content storage needs to be implemented
