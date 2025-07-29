import { config } from "../config";

export interface BrandingConfig {
  organizationName: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export class BrandingService {
  /**
   * Get the current branding configuration
   */
  getBrandingConfig(): BrandingConfig {
    const brandingConfig: BrandingConfig = {
      organizationName: config.branding.organizationName,
      primaryColor: config.branding.primaryColor,
      secondaryColor: config.branding.secondaryColor,
    };

    // Only include logoUrl if a custom logo path is configured
    if (config.branding.logoPath) {
      brandingConfig.logoUrl = `/static/branding/logo`;
    }

    return brandingConfig;
  }

  /**
   * Check if custom branding is configured
   */
  hasCustomBranding(): boolean {
    return (
      config.branding.organizationName !== "Credential Issuer" ||
      !!config.branding.logoPath ||
      config.branding.primaryColor !== "#1976d2" ||
      config.branding.secondaryColor !== "#dc004e"
    );
  }
}

export const brandingService = new BrandingService();
