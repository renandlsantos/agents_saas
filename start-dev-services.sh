#!/bin/bash

echo "🚀 Starting development services for Lobe Chat"
echo ""

# Check Docker
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Create directories
echo "📁 Creating directories..."
mkdir -p data/{postgres,redis,minio,casdoor}

# Check for .env file
if [ ! -f ".env.local" ] && [ ! -f ".env" ]; then
    echo "📝 Creating .env.local from template..."
    cp .env.dev.example .env.local
    echo "⚠️  Please edit .env.local and add your API keys and Casdoor credentials"
fi

# Stop existing services
echo "🛑 Stopping existing services..."
docker-compose -f docker-compose-dev-services.yml down

# Start services
echo "🐳 Starting Docker services..."
docker-compose -f docker-compose-dev-services.yml up -d

# Wait for services
echo "⏳ Waiting for services to start..."
sleep 10

# Check services
echo ""
echo "📊 Service status:"
docker-compose -f docker-compose-dev-services.yml ps

echo ""
echo "✅ Services started successfully!"
echo ""
echo "🔗 Service URLs:"
echo "  PostgreSQL: localhost:5432"
echo "  Redis: localhost:6379"
echo "  MinIO: http://localhost:9000 (Console: http://localhost:9001)"
echo "  Casdoor: http://localhost:8000"
echo ""
echo "📝 Next steps:"
echo "1. Configure Casdoor (see setup-casdoor-dev.md)"
echo "2. Run: pnpm install"
echo "3. Run: pnpm db:migrate"
echo "4. Run: pnpm dev"
echo ""
echo "🛑 To stop services: docker-compose -f docker-compose-dev-services.yml down"