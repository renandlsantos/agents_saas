# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Reference Commands

### Docker-Based Development (Preferred)

```bash
# Setup & Installation
./setup-admin-environment.sh          # Initial setup
./setup-admin-environment.sh --rebuild # Rebuild existing
./docker-rebuild.sh                   # Quick Docker rebuild

# Docker Operations
docker-compose up -d                  # Start all services
docker-compose logs -f agents-chat    # View logs
docker-compose down                   # Stop services
docker exec -it agents-chat sh        # Shell into container
```

### Local Development (Legacy)

```bash
pnpm dev         # Development server (port 3010)
pnpm build       # Build application
pnpm start       # Production server (port 3210)
pnpm test        # Run tests
pnpm lint        # Run linting
pnpm db:migrate  # Run migrations
```

## Project Overview

**Agents SaaS** - AI chatbot platform built with Next.js 15, supporting 40+ AI providers.

### Tech Stack
- **Frontend**: Next.js 15, React 19, Ant Design, Zustand
- **Backend**: tRPC, Drizzle ORM, PostgreSQL
- **Docker**: All services containerized
- **AI**: Unified runtime for multiple providers

### Key Directories
- `/src/app` - Next.js App Router
- `/src/store` - Zustand state management
- `/src/services` - Business logic layer
- `/src/database` - Database models & schemas
- `/src/features` - React components
- `/src/libs` - External integrations

## Critical Security Guidelines

### Database Operations
**ALL database operations MUST include user permission checks:**

```typescript
// ✅ CORRECT - Always check userId
where: and(
  eq(table.id, id),
  eq(table.userId, this.userId)
)

// ❌ WRONG - Missing user check
where: eq(table.id, id)
```

### Admin Agent Protection
- Users cannot view/edit system prompts of admin-published agents
- Only admins can access all agent configurations
- Implemented via `useCanEditAgent` hook

## Docker Production Deployment

### Environment Setup
```bash
# Required in .env
DATABASE_URL=postgresql://postgres:PASSWORD@agents-chat-postgres:5432/agents_chat
KEY_VAULTS_SECRET=64_char_hex_key  # For API key encryption
NEXTAUTH_SECRET=64_char_hex_key    # For auth
S3_ENDPOINT=http://agents-chat-minio:9000
```

### Services Architecture
- **PostgreSQL 16** with pgvector (5432)
- **Redis 7** - Cache (6379)
- **MinIO** - S3 storage (9000/9001)
- **Next.js App** - Main app (3210)

### Common Operations
```bash
# Health checks
curl http://localhost:3210/api/health
docker exec agents-chat-postgres pg_isready

# Database backup
docker exec agents-chat-postgres pg_dump -U postgres agents_chat > backup.sql

# View all logs
docker-compose logs -f
```

## Admin Panel Features

### API Key Management
- Centralized AI provider configuration
- Encrypted storage with KEY_VAULTS_SECRET
- Priority: User keys → Admin keys → Env vars
- Access at `/admin/models`

### Admin User Setup
```bash
# First setup (interactive)
./setup-admin-environment.sh

# Skip admin creation on rebuilds
./setup-admin-environment.sh --rebuild --skip-admin
```

## Recent Important Changes

### 1. **Docker-Only Deployment**
- Removed local Node.js/pnpm dependencies
- All operations via Docker containers
- Use `docker-rebuild.sh` for quick rebuilds

### 2. **Security Enhancements**
- No emojis in system (professional UI)
- Plugins/providers temporarily disabled
- Admin agent access control implemented
- Domain agents cannot be edited by regular users

### 3. **Clean URLs**
- Removed URL variants (pt-BR__0__dark)
- Clean paths: `/login`, `/chat`, `/admin`

### 4. **Default Assistant Settings**
- Hidden tabs: Character config, Model config, Voice service
- Only Chat preferences remain visible
- Professional token icon replaces emoji in chat

## Testing Guidelines

```bash
# Client tests (Happy DOM, PGLite)
npx vitest run --config vitest.config.ts

# Server tests (Node.js, PostgreSQL)
npx vitest run --config vitest.config.server.ts
```

## Component Development

### Theme Usage
```tsx
import { useTheme } from 'antd-style';

const Component = () => {
  const theme = useTheme();
  return (
    <div style={{ 
      color: theme.colorPrimary,
      background: theme.colorBgContainer 
    }}>
  );
};
```

### State Management (Zustand)
```
src/store/[storeName]/
├── slices/
│   └── [sliceName]/
│       ├── action.ts
│       ├── initialState.ts
│       └── selectors.ts
└── store.ts
```

## Troubleshooting

### Build Issues
```bash
# Clean Docker cache
docker system prune -f
docker volume rm agents_saas_next-cache

# Memory issues
export NODE_OPTIONS="--max-old-space-size=8192"
```

### Database Issues
```bash
# Check pgvector extension
docker exec agents-chat-postgres psql -U postgres -d agents_chat -c "CREATE EXTENSION IF NOT EXISTS vector;"

# Fix missing columns
./setup-admin-environment.sh --rebuild
```

### Type Issues
- Database fields can be `null`, but TypeScript often expects `undefined`
- Use nullish coalescing (`??`) to convert: `value ?? undefined`
- Common with `isDomain` and other optional boolean fields

### ESLint Issues
- `unicorn/numeric-separators-style` - Use constants or disable per line
- For large numbers like 1000000, use: `// eslint-disable-next-line unicorn/numeric-separators-style`
- Alternative: Define constants like `const MILLION = 1000000`

## Important Reminders

- Always prefer editing existing files over creating new ones
- Never create documentation unless explicitly requested
- All user data operations must include permission checks
- Use Docker commands, not local pnpm for production
- Test security: users should not access other users' data

---

For detailed documentation, see:
- `DEPLOY-PROD.md` - Production deployment
- `docker-rebuild.sh` - Docker rebuild script
- `setup-admin-environment.sh` - Complete setup script