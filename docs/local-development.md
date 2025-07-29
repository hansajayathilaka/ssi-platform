# Local Development Setup

## Environment Configuration

For local development, you need to configure the frontend to connect to the local backend instead of the production URL.

### Frontend Development Server

When running the frontend via `npm run dev`, create a `.env` file in the `services/credential-server-ui/` directory:

```bash
# services/credential-server-ui/.env

# Local development environment
VITE_SERVER_URL=http://localhost:3001

# Branding Configuration for UI
VITE_CUSTOM_ORG_NAME=My Organization
VITE_CUSTOM_LOGO_PATH=/assets/logo.png
VITE_CUSTOM_PRIMARY_COLOR=#1976d2
VITE_CUSTOM_SECONDARY_COLOR=#dc004e

# Feature Flags for UI
VITE_ENABLE_BRANDING_CUSTOMIZATION=true
VITE_ENABLE_BULK_CREDENTIAL_GENERATION=true
```

### Root Level Environment

For Docker Compose development, create a `.env` file in the root directory:

```bash
# .env (root level)

# Local development environment
VITE_SERVER_URL=http://localhost:3001
CRED_UI_SERVER_URL=http://localhost:3001

# Other local development settings
ENVIRONMENT=local
DEV_SKIP_ONBOARDING=true

# Credential Issuance Customization
## Branding Configuration
CUSTOM_ORG_NAME=My Organization
CUSTOM_LOGO_PATH=/app/assets/logo.png
CUSTOM_PRIMARY_COLOR=#1976d2
CUSTOM_SECONDARY_COLOR=#dc004e

## Schema Configuration
CUSTOM_SCHEMAS_PATH=/app/data/schemas
ENABLE_SCHEMA_MANAGEMENT=true
SCHEMA_VALIDATION_STRICT=true

## Feature Flags
ENABLE_BRANDING_CUSTOMIZATION=true
ENABLE_BULK_CREDENTIAL_GENERATION=true
```

## Running the Application

### Frontend Development Server
```bash
cd services/credential-server-ui
npm run dev
```

The development server will start on port 3002 and connect to the local backend at `http://localhost:3001`.

### Backend Server
Make sure your backend server is running on `http://localhost:3001`.

## Troubleshooting

If the frontend is still connecting to the production URL (`https://cred-issuance.hansajayathilaka.com`), check:

1. The `.env` file exists in the correct location
2. The `VITE_SERVER_URL` variable is set correctly
3. Restart the development server after creating/modifying the `.env` file

## Environment Variable Priority

The frontend reads the server URL from multiple sources in this order:
1. `window.__RUNTIME_CONFIG__.SERVER_URL` (runtime configuration)
2. `import.meta.env.VITE_SERVER_URL` (Vite environment variable)
3. Default fallback: `http://localhost:3001`