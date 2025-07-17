#!/bin/bash

# Build script that skips database migration
# Use this when database is not available during build time

echo "🔨 Building Agents Chat without database migration..."

# Run prebuild
echo "📦 Running prebuild..."
pnpm prebuild

# Build Next.js app
echo "🏗️ Building Next.js application..."
pnpm next build

# Build sitemap (doesn't require database)
echo "🗺️ Building sitemap..."
pnpm build-sitemap

echo "✅ Build completed successfully!"
echo ""
echo "📝 Note: Database migrations were skipped."
echo "   Run 'pnpm db:migrate' when database is available."