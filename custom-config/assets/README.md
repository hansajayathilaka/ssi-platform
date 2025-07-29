# Branding Assets

This directory contains custom branding assets for the credential issuance system.

## Supported Assets

- **logo.png**: Organization logo (recommended size: 200x60px)
- **favicon.ico**: Browser favicon (16x16px or 32x32px)
- **background.jpg**: Optional background image
- **custom.css**: Custom CSS overrides

## Usage

Place your custom assets in this directory and they will be mounted into the Docker containers at runtime.

The assets will be available at:
- Backend: `/app/assets/`
- Frontend: `/usr/share/nginx/html/assets/`

## Environment Variables

Configure the asset paths using these environment variables:
- `CUSTOM_LOGO_PATH`: Path to the organization logo
- `CUSTOM_PRIMARY_COLOR`: Primary brand color (hex format)
- `CUSTOM_SECONDARY_COLOR`: Secondary brand color (hex format)