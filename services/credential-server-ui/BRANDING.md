# Branding Customization

This document explains how to customize the branding of the Credential Server UI.

## Overview

The credential server UI supports organization-specific branding including:

- Custom organization name
- Custom logo
- Custom colors
- Custom favicon
- Custom CSS

## Configuration Methods

### 1. Environment Variables (Development)

For development, you can set environment variables in a `.env` file:

```bash
# Branding Configuration
VITE_CUSTOM_ORG_NAME=My Organization
VITE_CUSTOM_LOGO_URL=https://example.com/logo.png
VITE_CUSTOM_PRIMARY_COLOR=#1976d2
VITE_CUSTOM_SECONDARY_COLOR=#dc004e
VITE_CUSTOM_FAVICON_URL=https://example.com/favicon.ico
VITE_CUSTOM_CSS_URL=https://example.com/custom.css
```

### 2. Runtime Configuration (Production)

For production deployments, use environment variables that get injected at runtime:

```bash
# Docker environment variables
CUSTOM_ORG_NAME=My Organization
CUSTOM_LOGO_URL=https://example.com/logo.png
CUSTOM_PRIMARY_COLOR=#1976d2
CUSTOM_SECONDARY_COLOR=#dc004e
CUSTOM_FAVICON_URL=https://example.com/favicon.ico
CUSTOM_CSS_URL=https://example.com/custom.css
```

These variables are processed by the `update-envfile.js` script and made available at runtime.

### 3. Server API (Future Enhancement)

The system is designed to support loading branding configuration from a server endpoint at `/branding`.

## Usage

### NavBar Component

The NavBar component automatically uses the branding service to:

- Display the custom organization name
- Show the custom logo with fallback to default
- Apply custom styling

### Branding Service

The branding service provides:

```typescript
import { brandingService } from "../services/branding";

// Load branding configuration
const config = await brandingService.loadBrandingConfig();

// Get organization name
const orgName = brandingService.getOrganizationName();

// Get logo URL
const logoUrl = brandingService.getLogoUrl();

// Check if custom logo is available
const hasCustomLogo = brandingService.hasCustomLogo();
```

### React Hook

Use the `useBranding` hook in React components:

```typescript
import { useBranding } from '../hooks/useBranding';

const MyComponent = () => {
  const { organizationName, logoUrl, hasCustomLogo, isLoading } = useBranding();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h1>{organizationName}</h1>
      {hasCustomLogo && <img src={logoUrl} alt={`${organizationName} logo`} />}
    </div>
  );
};
```

## Logo Requirements

- Supported formats: PNG, JPG, SVG
- Recommended size: 200x50px (or similar aspect ratio)
- Should work on both light and dark backgrounds
- Must be accessible via HTTPS in production

## Fallback Behavior

- If custom logo fails to load, falls back to default Veridian logo
- If organization name is not provided, uses "Veridian" as default
- If server API is unavailable, uses environment/runtime configuration
- All customizations are optional and gracefully degrade

## Testing

Run the branding service tests:

```bash
npm test -- branding.test.ts
```

## Docker Integration

The branding configuration integrates with the existing Docker setup:

1. Set environment variables in your Docker Compose or deployment configuration
2. The `update-envfile.js` script processes these variables during container startup
3. The frontend loads the configuration at runtime

Example Docker Compose configuration:

```yaml
services:
  credential-server-ui:
    environment:
      - CUSTOM_ORG_NAME=My Organization
      - CUSTOM_LOGO_URL=https://example.com/logo.png
      - CUSTOM_PRIMARY_COLOR=#1976d2
```
