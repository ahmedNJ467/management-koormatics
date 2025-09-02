#!/bin/bash

# WSL-based build script to completely bypass Windows EPERM issues
# This script runs the build in WSL (Windows Subsystem for Linux)

echo "🐧 Starting WSL-based build process..."

# Set environment variables
export NODE_OPTIONS="--max-old-space-size=8192"
export NEXT_TELEMETRY_DISABLED=1
export NODE_ENV=production

# Clean build directories
echo "🧹 Cleaning build directories..."
rm -rf .next
rm -rf .next-build
rm -rf out
rm -rf dist
rm -rf build

# Create build directory
echo "📁 Creating build directory..."
mkdir -p .next-build

# Install dependencies if needed
echo "📦 Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm ci
fi

# Run the build
echo "🚀 Starting Next.js build in WSL..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully in WSL!"
    echo "Build output is in: .next-build"
    exit 0
else
    echo "❌ Build failed in WSL"
    exit 1
fi
