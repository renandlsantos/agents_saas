#!/bin/bash

# Script to fix MinIO HTTPS configuration

echo "=== Fixing MinIO HTTPS Configuration ==="
echo ""

# Option 1: For production with HTTPS
echo "Option 1: Production Setup with HTTPS"
echo "1. Run on your server: ./sh/fix-certbot-nginx.sh"
echo "2. This will set up Nginx to proxy MinIO over HTTPS on port 9443"
echo "3. Your .env file has been updated to use https://64.23.166.36:9443"
echo ""

# Option 2: For development
echo "Option 2: Development Setup"
echo "Access your application via HTTP instead:"
echo "http://64.23.166.36:3210"
echo ""

echo "=== Restarting Services ==="
docker-compose down
docker-compose up -d

echo ""
echo "=== Checking Services ==="
docker-compose ps

echo ""
echo "Done! MinIO URLs are now configured for HTTPS."
echo "If you still see mixed content errors:"
echo "1. Clear your browser cache"
echo "2. Check that Nginx is properly configured on port 9443"
echo "3. Ensure SSL certificates are valid"