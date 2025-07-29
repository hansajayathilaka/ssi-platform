#!/bin/bash

# Test script for Docker customization deployment
# This script tests the custom configuration deployment

echo "🚀 Testing Docker Customization Deployment"
echo "=========================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

echo "✅ Docker is running"

# Check if docker-compose is available
if ! command -v docker-compose > /dev/null 2>&1; then
    echo "❌ docker-compose is not installed"
    exit 1
fi

echo "✅ docker-compose is available"

# Create test environment file
echo "📝 Creating test environment configuration..."
cat > .env.test << EOF
# Test Environment Configuration
CUSTOM_ORG_NAME=Test Organization
CUSTOM_LOGO_PATH=/app/assets/logo.png
CUSTOM_PRIMARY_COLOR=#4caf50
CUSTOM_SECONDARY_COLOR=#ff9800
CUSTOM_SCHEMAS_PATH=/app/data/schemas
ENABLE_SCHEMA_MANAGEMENT=true
SCHEMA_VALIDATION_STRICT=true
ENABLE_BRANDING_CUSTOMIZATION=true
ENABLE_BULK_CREDENTIAL_GENERATION=true
VITE_SERVER_URL=http://localhost:3001
EOF

echo "✅ Test environment file created"

# Validate docker-compose configuration
echo "🔍 Validating docker-compose configuration..."
if docker-compose --env-file .env.test config > /dev/null 2>&1; then
    echo "✅ docker-compose configuration is valid"
else
    echo "❌ docker-compose configuration has errors"
    docker-compose --env-file .env.test config
    exit 1
fi

# Check if custom config directory exists
if [ ! -d "custom-config" ]; then
    echo "❌ custom-config directory not found"
    exit 1
fi

echo "✅ custom-config directory exists"

# Check if sample schemas exist
if [ ! -f "custom-config/schemas/sample-employee-credential.json" ]; then
    echo "❌ Sample employee credential schema not found"
    exit 1
fi

if [ ! -f "custom-config/schemas/sample-student-credential.json" ]; then
    echo "❌ Sample student credential schema not found"
    exit 1
fi

echo "✅ Sample schemas are present"

# Check if branding configuration exists
if [ ! -f "custom-config/branding.json" ]; then
    echo "❌ Branding configuration not found"
    exit 1
fi

echo "✅ Branding configuration exists"

# Test volume mounts by checking if they're defined in docker-compose
echo "🔍 Checking volume mounts..."
if docker-compose --env-file .env.test config | grep -q "custom-schemas:"; then
    echo "✅ custom-schemas volume is configured"
else
    echo "❌ custom-schemas volume is missing"
    exit 1
fi

if docker-compose --env-file .env.test config | grep -q "branding-assets:"; then
    echo "✅ branding-assets volume is configured"
else
    echo "❌ branding-assets volume is missing"
    exit 1
fi

# Test environment variables
echo "🔍 Checking environment variables..."
if docker-compose --env-file .env.test config | grep -q "CUSTOM_ORG_NAME"; then
    echo "✅ Branding environment variables are configured"
else
    echo "❌ Branding environment variables are missing"
    exit 1
fi

if docker-compose --env-file .env.test config | grep -q "ENABLE_SCHEMA_MANAGEMENT"; then
    echo "✅ Schema management environment variables are configured"
else
    echo "❌ Schema management environment variables are missing"
    exit 1
fi

# Optional: Test actual deployment (commented out by default)
# echo "🚀 Testing actual deployment..."
# docker-compose --env-file .env.test up -d --build
# sleep 30
# 
# # Check if services are running
# if docker-compose --env-file .env.test ps | grep -q "Up"; then
#     echo "✅ Services are running"
# else
#     echo "❌ Services failed to start"
#     docker-compose --env-file .env.test logs
#     exit 1
# fi
# 
# # Cleanup
# docker-compose --env-file .env.test down

# Cleanup test files
rm -f .env.test

echo ""
echo "🎉 All Docker customization tests passed!"
echo "✅ Volume mounts are configured correctly"
echo "✅ Environment variables are set up properly"
echo "✅ Custom configuration files are in place"
echo ""
echo "To deploy with custom configuration:"
echo "1. Update your .env file with custom values"
echo "2. Place your assets in custom-config/assets/"
echo "3. Add your schemas to custom-config/schemas/"
echo "4. Run: docker-compose up -d --build"