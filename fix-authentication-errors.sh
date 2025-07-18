#!/bin/bash

# ============================================================================
# 🔧 FIX AUTHENTICATION ERRORS - AGENTS CHAT
# ============================================================================
# Script to fix authentication and login issues
# ============================================================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}🔧 FIXING AUTHENTICATION ERRORS${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""

# Check if Docker services are running
echo -e "${YELLOW}📊 Checking Docker services...${NC}"
if ! docker ps | grep -q agents-chat-postgres; then
    echo -e "${RED}❌ PostgreSQL is not running!${NC}"
    echo -e "${YELLOW}Starting Docker services...${NC}"
    docker-compose up -d
    sleep 10
fi

if ! docker ps | grep -q agents-chat; then
    echo -e "${RED}❌ Main application is not running!${NC}"
    echo -e "${YELLOW}Please start the application with: docker-compose up -d${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker services are running${NC}"
echo ""

# Step 1: Create admin user with proper password
echo -e "${YELLOW}🔐 Step 1: Creating admin user with password...${NC}"
pnpm tsx scripts/create-admin-user.ts
echo ""

# Step 2: Restart the application to apply fixes
echo -e "${YELLOW}🔄 Step 2: Restarting application...${NC}"
docker-compose restart app
echo -e "${GREEN}✅ Application restarted${NC}"
echo ""

# Step 3: Wait for application to be ready
echo -e "${YELLOW}⏳ Step 3: Waiting for application to be ready...${NC}"
sleep 15

# Step 4: Test the authentication endpoints
echo -e "${YELLOW}🧪 Step 4: Testing authentication endpoints...${NC}"

# Test NextAuth session endpoint
echo -e "${BLUE}Testing /api/auth/session...${NC}"
if curl -s -f http://64.23.237.16:3210/api/auth/session > /dev/null; then
    echo -e "${GREEN}✅ /api/auth/session is responding${NC}"
else
    echo -e "${RED}❌ /api/auth/session is still failing${NC}"
fi

# Test tRPC endpoint
echo -e "${BLUE}Testing tRPC config endpoint...${NC}"
if curl -s -f "http://64.23.237.16:3210/trpc/edge/config.getGlobalConfig?batch=1&input=%7B%220%22%3A%7B%22json%22%3Anull%2C%22meta%22%3A%7B%22values%22%3A%5B%22undefined%22%5D%7D%7D%7D" > /dev/null; then
    echo -e "${GREEN}✅ tRPC endpoints are responding${NC}"
else
    echo -e "${RED}❌ tRPC endpoints are still failing${NC}"
fi

echo ""
echo -e "${GREEN}🎉 AUTHENTICATION FIX PROCESS COMPLETED!${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""
echo -e "${YELLOW}📋 NEXT STEPS:${NC}"
echo -e "1. 🌐 Access: ${GREEN}http://64.23.237.16:3210${NC}"
echo -e "2. 🔑 Login with: ${GREEN}admin@64.23.237.16${NC}"
echo -e "3. 🔐 Password: ${GREEN}ROJ0DotNWbFvkhVz${NC}"
echo -e "4. ⚙️  Access admin panel: ${GREEN}http://64.23.237.16:3210/admin${NC}"
echo ""
echo -e "${YELLOW}🔍 If you still see errors:${NC}"
echo -e "- Check Docker logs: ${BLUE}docker-compose logs -f app${NC}"
echo -e "- Check PostgreSQL logs: ${BLUE}docker-compose logs -f postgres${NC}"
echo -e "- Restart all services: ${BLUE}docker-compose restart${NC}"
echo ""
echo -e "${RED}⚠️  IMPORTANT:${NC}"
echo -e "- Change the default password after first login"
echo -e "- Check that all environment variables are properly set"
echo -e "${BLUE}============================================================================${NC}"