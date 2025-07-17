#!/bin/bash

echo "🚀 Starting Agents Chat Production Deployment with Docker"
echo "======================================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Stop existing containers
echo -e "${YELLOW}Stopping existing containers...${NC}"
docker-compose down

# Step 2: Build and start all services
echo -e "${YELLOW}Building and starting all services...${NC}"
docker-compose up -d --build

# Step 3: Wait for services to be ready
echo -e "${YELLOW}Waiting for services to initialize...${NC}"
echo -n "Waiting for PostgreSQL"
for i in {1..30}; do
    if docker exec agents-chat-postgres pg_isready -U postgres >/dev/null 2>&1; then
        echo -e " ${GREEN}✓${NC}"
        break
    fi
    echo -n "."
    sleep 2
done

# Step 4: Run migrations
echo -e "${YELLOW}Running database migrations...${NC}"
docker exec agents-chat npm run db:migrate

# Step 5: Check application health
echo -e "${YELLOW}Checking application health...${NC}"
for i in {1..60}; do
    if curl -f http://localhost:3210/api/health >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Application is healthy${NC}"
        break
    fi
    sleep 2
done

# Step 6: Display status
echo ""
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo "========================================"
echo "Services running:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo "Access points:"
echo "- Application: http://localhost:3210"
echo "- Admin Panel: http://localhost:3210/admin"
echo "- MinIO Console: http://localhost:9001"
echo "- PostgreSQL: localhost:5432"
echo ""
echo "To create an admin user, run:"
echo "docker exec -it agents-chat-postgres psql -U postgres -d agents_chat -c \"UPDATE users SET is_admin = true WHERE email = 'your-email@example.com';\""
echo ""
echo "To view logs:"
echo "docker-compose logs -f"