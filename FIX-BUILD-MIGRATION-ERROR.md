# Fix for Build Migration Error

## Problem

The build process fails at the post-build step because it tries to run database migrations against `agents-chat-postgres` (Docker container) which isn't available during build time.

## Solutions

### Solution 1: Skip Migrations During Build (Recommended)

Create a build script that skips the migration step:

```bash
# Build without migrations
pnpm prebuild && pnpm build:prod
```

Add to package.json:

```json
"build:prod": "next build",
"build:with-migration": "next build && npm run build-migrate-db",
```

### Solution 2: Use Environment-Specific DATABASE_URL

The migration script should check if it's in a Docker environment:

```bash
# For local development (no Docker)
DATABASE_URL=postgresql://postgres:password@localhost:5432/agents_chat

# For Docker environment
DATABASE_URL=postgresql://postgres:password@agents-chat-postgres:5432/agents_chat
```

### Solution 3: Conditional Post-Build

Modify the postbuild script to check environment:

```json
"postbuild": "npm run build-sitemap && ([ -z \"$SKIP_DB_MIGRATE\" ] && npm run build-migrate-db || true)"
```

Then build with:

```bash
SKIP_DB_MIGRATE=1 pnpm build
```

### Solution 4: Separate Build and Deploy Steps

1. **Build Phase** (no database required):

   ```bash
   pnpm prebuild
   NEXT_BUILD_SKIP_DB_MIGRATE=1 pnpm build
   pnpm build-sitemap
   ```

2. **Deploy Phase** (with database):

   ```bash
   # Start Docker containers
   docker-compose up -d postgres
   
   # Run migrations
   pnpm db:migrate
   
   # Start application
   docker-compose up -d app
   ```

## Immediate Fix

To fix your current build, run:

```bash
# Option 1: Build without postbuild
pnpm prebuild && pnpm next build

# Option 2: Set environment to skip migration
MIGRATION_DB=0 pnpm build

# Option 3: Point to local database if available
DATABASE_URL="postgresql://postgres:password@localhost:5432/agents_chat" pnpm build
```

## Recommended Approach

For development and CI/CD, separate concerns:

1. **Build artifacts** should not require database
2. **Migrations** should run during deployment, not build
3. **Use Docker** for consistent environments

### Update package.json:

```json
{
  "scripts": {
    "build": "next build",
    "build:full": "npm run prebuild && npm run build && npm run postbuild",
    "build:ci": "npm run prebuild && npm run build && npm run build-sitemap",
    "postbuild": "npm run build-sitemap",
    "migrate": "npm run db:migrate",
    "deploy": "npm run migrate && npm run start"
  }
}
```

This separates build-time operations from runtime operations, making the build process more reliable and portable.
