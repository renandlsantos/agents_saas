# Complete Fix for Docker Build Issues

## Problem Analysis

The build fails because:

1. Your `.env` has `DATABASE_URL` pointing to `agents-chat-postgres` (Docker container)
2. The regular `pnpm build` runs migrations in `postbuild`
3. During local build, the Docker container isn't running

## Solutions

### For Local Development (No Docker)

#### Option 1: Build without migrations

```bash
# Use the Docker build command which skips migrations
pnpm build:docker
```

#### Option 2: Use the script created

```bash
./build-without-migration.sh
```

#### Option 3: Create a local build script

Add to package.json:

```json
"build:local": "npm run prebuild && next build && npm run build-sitemap",
```

Then use:

```bash
pnpm build:local
```

### For Docker Deployment

The Docker setup is correct! When building with Docker:

```bash
# This will work because Dockerfile uses build:docker
docker-compose build app

# Or build and run everything
docker-compose up -d --build
```

### For Mixed Environment (Local build, Docker database)

If you want to build locally but use Docker database:

```bash
# 1. Start only the database
docker-compose up -d postgres

# 2. Update DATABASE_URL temporarily
export DATABASE_URL="postgresql://postgres:9facd6a17b53857a9cf0311d930cf0d92048903542faadf26751f32f185417a8@localhost:5432/agents_chat"

# 3. Build
pnpm build

# 4. Start all services
docker-compose up -d
```

## Permanent Fix

### Option A: Environment-aware DATABASE_URL

Create `.env.local` for local development:

```bash
DATABASE_URL=postgresql://postgres:password@localhost:5432/agents_chat
```

Create `.env.docker` for Docker:

```bash
DATABASE_URL=postgresql://postgres:password@agents-chat-postgres:5432/agents_chat
```

### Option B: Skip migrations in build

Edit package.json:

```json
"postbuild": "npm run build-sitemap",
"deploy": "npm run build && npm run db:migrate && npm run start",
```

### Option C: Conditional migration

Create a script `scripts/conditional-migrate.js`:

```javascript
const { execSync } = require('child_process');

// Skip migration if in build phase
if (process.env.SKIP_DB_MIGRATE || process.env.DOCKER_BUILD) {
  console.log('Skipping database migration during build');
  process.exit(0);
}

// Check if database is reachable
try {
  execSync('pg_isready -h localhost -p 5432', { stdio: 'ignore' });
  execSync('npm run db:migrate', { stdio: 'inherit' });
} catch (error) {
  console.log('Database not available, skipping migration');
}
```

Then update package.json:

```json
"postbuild": "npm run build-sitemap && node scripts/conditional-migrate.js",
```

## Recommended Workflow

### Development

```bash
# Use local database or start Docker postgres
docker-compose up -d postgres

# Build without migrations
pnpm build:docker

# Run migrations separately when needed
pnpm db:migrate
```

### Production with Docker

```bash
# Everything works automatically
docker-compose up -d --build
```

The key insight is that **builds should be environment-agnostic** - they shouldn't depend on external services being available. Migrations should run at deployment time, not build time.
