import { httpInstance } from "./http";
import { config } from "../config";

export interface BrandingConfig {
  organizationName: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  favicon?: string;
  customCSS?: string;
}

export interface BrandingResponse {
  success: boolean;
  data?: BrandingConfig;
  error?: string;
}

class BrandingService {
  private static instance: BrandingService;
  private brandingConfig: BrandingConfig | null = null;
  private defaultConfig: BrandingConfig = {
    organizationName: "Veridian",
    logoUrl: undefined, // Will use default logo
  };

  private constructor() {}

  public static getInstance(): BrandingService {
    if (!BrandingService.instance) {
      BrandingService.instance = new BrandingService();
    }
    return BrandingService.instance;
  }

  /**
   * Load branding configuration from server or environment
   */
  public async loadBrandingConfig(): Promise<BrandingConfig> {
    if (this.brandingConfig) {
      return this.brandingConfig;
    }

    try {
      // Try to load from server first
      const response = await httpInstance.get<BrandingResponse>(
        config.path.branding
      );
      if (response.data.success && response.data.data) {
        this.brandingConfig = response.data.data;
        return this.brandingConfig;
      }
    } catch (error) {
      console.warn("Failed to load branding config from server:", error);
    }

    // Fallback to environment variables or runtime config
    this.brandingConfig = this.loadFromEnvironment();
    return this.brandingConfig;
  }

  /**
   * Load branding configuration from environment variables or runtime config
   */
  private loadFromEnvironment(): BrandingConfig {
    // Check for runtime configuration (similar to server URL pattern)
    const runtimeConfig = (window as any).__RUNTIME_CONFIG__;

    return {
      organizationName:
        runtimeConfig?.CUSTOM_ORG_NAME ||
        import.meta.env.VITE_CUSTOM_ORG_NAME ||
        this.defaultConfig.organizationName,
      logoUrl:
        runtimeConfig?.CUSTOM_LOGO_URL ||
        import.meta.env.VITE_CUSTOM_LOGO_URL ||
        this.defaultConfig.logoUrl,
      primaryColor:
        runtimeConfig?.CUSTOM_PRIMARY_COLOR ||
        import.meta.env.VITE_CUSTOM_PRIMARY_COLOR ||
        this.defaultConfig.primaryColor,
      secondaryColor:
        runtimeConfig?.CUSTOM_SECONDARY_COLOR ||
        import.meta.env.VITE_CUSTOM_SECONDARY_COLOR ||
        this.defaultConfig.secondaryColor,
      favicon:
        runtimeConfig?.CUSTOM_FAVICON_URL ||
        import.meta.env.VITE_CUSTOM_FAVICON_URL ||
        this.defaultConfig.favicon,
      customCSS:
        runtimeConfig?.CUSTOM_CSS_URL ||
        import.meta.env.VITE_CUSTOM_CSS_URL ||
        this.defaultConfig.customCSS,
    };
  }

  /**
   * Get current branding configuration
   */
  public getBrandingConfig(): BrandingConfig {
    return this.brandingConfig || this.defaultConfig;
  }

  /**
   * Get organization name with fallback
   */
  public getOrganizationName(): string {
    const config = this.getBrandingConfig();
    return config.organizationName || this.defaultConfig.organizationName;
  }

  /**
   * Get logo URL with fallback to default
   */
  public getLogoUrl(): string | undefined {
    const config = this.getBrandingConfig();
    return config.logoUrl;
  }

  /**
   * Check if custom logo is available
   */
  public hasCustomLogo(): boolean {
    const logoUrl = this.getLogoUrl();
    return logoUrl !== undefined && logoUrl !== "" && logoUrl.trim() !== "";
  }

  /**
   * Reset branding configuration (useful for testing)
   */
  public reset(): void {
    this.brandingConfig = null;
  }
}

export const brandingService = BrandingService.getInstance();
