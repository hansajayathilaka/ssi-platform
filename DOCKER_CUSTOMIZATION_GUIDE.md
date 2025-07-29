# Docker Customization Deployment Guide

This guide explains how to deploy the credential issuance system with custom branding and schema configurations using Docker.

## Overview

The Docker configuration has been enhanced to support:
- Custom organization branding (logo, colors, name)
- Custom credential schemas
- Persistent storage for customizations
- Environment-based configuration

## Volume Mounts

### Custom Schemas Volume
- **Container Path**: `/app/data/schemas` (backend)
- **Purpose**: Stores custom credential schemas
- **Persistence**: Data persists across container restarts

### Branding Assets Volume
- **Container Paths**: 
  - Backend: `/app/assets`
  - Frontend: `/usr/share/nginx/html/assets`
- **Purpose**: Stores custom logos, icons, and branding assets
- **Persistence**: Assets persist across container restarts

### Configuration Mount
- **Host Path**: `./custom-config`
- **Container Path**: `/app/config`
- **Purpose**: Read-only mount for configuration files
- **Mode**: Read-only

## Environment Variables

### Branding Configuration
```bash
CUSTOM_ORG_NAME=Your Organization Name
CUSTOM_LOGO_PATH=/app/assets/logo.png
CUSTOM_PRIMARY_COLOR=#1976d2
CUSTOM_SECONDARY_COLOR=#dc004e
```

### Schema Configuration
```bash
CUSTOM_SCHEMAS_PATH=/app/data/schemas
ENABLE_SCHEMA_MANAGEMENT=true
SCHEMA_VALIDATION_STRICT=true
```

### Feature Flags
```bash
ENABLE_BRANDING_CUSTOMIZATION=true
ENABLE_BULK_CREDENTIAL_GENERATION=true
```

## Deployment Instructions

### 1. Development Deployment

```bash
# 1. Update environment variables in .env file
cp .env.example .env
# Edit .env with your custom values

# 2. Place custom assets in custom-config/assets/
mkdir -p custom-config/assets
cp your-logo.png custom-config/assets/logo.png

# 3. Add custom schemas to custom-config/schemas/
mkdir -p custom-config/schemas
cp your-schema.json custom-config/schemas/

# 4. Deploy with docker-compose
docker-compose up -d --build
```

### 2. Production Deployment

```bash
# 1. Update production environment variables
# Edit .env.production with your custom values

# 2. Deploy with production profile
docker-compose -f docker-compose.production.local.yaml --profile cred-issuance up -d

# Or for full production with Traefik
docker-compose -f docker-compose.production.cred-issuance.yaml --profile production up -d
```

### 3. Testing Deployment

```bash
# Run the automated test script
bash test-docker-customization.sh
```

## Custom Configuration Structure

```
custom-config/
├── branding.json              # Branding configuration
├── assets/                    # Branding assets
│   ├── logo.png              # Organization logo
│   ├── favicon.ico           # Browser favicon
│   └── README.md             # Asset documentation
└── schemas/                   # Custom credential schemas
    ├── sample-employee-credential.json
    ├── sample-student-credential.json
    └── your-custom-schema.json
```

## Schema Format

Custom schemas should follow this structure:

```json
{
  "id": "unique-schema-id",
  "name": "Schema Display Name",
  "version": "1.0.0",
  "description": "Schema description",
  "fields": [
    {
      "name": "fieldName",
      "type": "string|number|boolean|date|email|url",
      "required": true,
      "displayName": "Field Display Name",
      "description": "Field description",
      "validation": [
        {
          "type": "pattern|min|max",
          "value": "validation value",
          "message": "Error message"
        }
      ]
    }
  ],
  "metadata": {
    "category": "schema category",
    "issuer": "issuing authority",
    "validityPeriod": "validity period"
  }
}
```

## Branding Configuration Format

```json
{
  "organizationName": "Your Organization",
  "logoUrl": "/assets/logo.png",
  "primaryColor": "#1976d2",
  "secondaryColor": "#dc004e",
  "favicon": "/assets/favicon.ico",
  "customCSS": "/* custom styles */"
}
```

## Troubleshooting

### Volume Mount Issues
```bash
# Check if volumes are created
docker volume ls | grep -E "(custom-schemas|branding-assets)"

# Inspect volume details
docker volume inspect veridian-prod_custom-schemas
docker volume inspect veridian-prod_branding-assets
```

### Environment Variable Issues
```bash
# Check resolved environment variables
docker-compose config | grep -A 20 environment

# For production
docker-compose -f docker-compose.production.cred-issuance.yaml --profile cred-issuance config
```

### Container Access
```bash
# Access backend container
docker exec -it cred-issuance bash

# Check mounted volumes
ls -la /app/data/schemas
ls -la /app/assets
ls -la /app/config
```

### Log Inspection
```bash
# View container logs
docker-compose logs cred-issuance
docker-compose logs cred-issuance-ui

# Follow logs in real-time
docker-compose logs -f cred-issuance
```

## Backup and Migration

### Backup Custom Data
```bash
# Backup schemas volume
docker run --rm -v veridian-prod_custom-schemas:/data -v $(pwd):/backup alpine tar czf /backup/schemas-backup.tar.gz -C /data .

# Backup branding assets volume
docker run --rm -v veridian-prod_branding-assets:/data -v $(pwd):/backup alpine tar czf /backup/assets-backup.tar.gz -C /data .
```

### Restore Custom Data
```bash
# Restore schemas volume
docker run --rm -v veridian-prod_custom-schemas:/data -v $(pwd):/backup alpine tar xzf /backup/schemas-backup.tar.gz -C /data

# Restore branding assets volume
docker run --rm -v veridian-prod_branding-assets:/data -v $(pwd):/backup alpine tar xzf /backup/assets-backup.tar.gz -C /data
```

## Security Considerations

1. **Read-only Mounts**: Configuration files are mounted read-only
2. **Volume Permissions**: Ensure proper file permissions in volumes
3. **Environment Variables**: Use secure methods to manage sensitive environment variables
4. **Asset Validation**: Validate uploaded assets for security
5. **Schema Validation**: Ensure custom schemas are properly validated

## Performance Optimization

1. **Volume Types**: Use named volumes for better performance
2. **Asset Optimization**: Optimize image assets for web delivery
3. **Schema Caching**: Schemas are cached for better performance
4. **Container Resources**: Set appropriate resource limits

## Monitoring

Monitor the following aspects:
- Volume usage and growth
- Container resource consumption
- Schema validation performance
- Asset loading times
- Environment variable resolution

## Support

For issues related to Docker customization:
1. Check the troubleshooting section above
2. Run the test script: `bash test-docker-customization.sh`
3. Inspect container logs and volume mounts
4. Verify environment variable configuration