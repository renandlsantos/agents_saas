#!/bin/bash
# Build script for local Docker image creation

echo "🚀 Starting local build process..."

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf .next out

# Build the application locally
echo "📦 Building application..."
DOCKER=true npm run build:docker

# Check if build succeeded
if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build completed successfully!"

# Build Docker image using prebuilt artifacts
echo "🐳 Building Docker image with prebuilt artifacts..."
docker build -f Dockerfile.prebuilt -t agents-saas:local .

if [ $? -eq 0 ]; then
    echo "✅ Docker image built successfully!"
    echo "📌 Image tagged as: agents-saas:local"
    echo ""
    echo "To run the container:"
    echo "docker run -p 3210:3210 agents-saas:local"
else
    echo "❌ Docker image build failed!"
    exit 1
fi