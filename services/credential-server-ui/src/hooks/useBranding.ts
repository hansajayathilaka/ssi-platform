import { useState, useEffect } from "react";
import { brandingService, BrandingConfig } from "../services/branding";

export interface UseBrandingReturn {
  brandingConfig: BrandingConfig;
  isLoading: boolean;
  error: string | null;
  organizationName: string;
  logoUrl: string | undefined;
  hasCustomLogo: boolean;
  reload: () => Promise<void>;
}

export const useBranding = (): UseBrandingReturn => {
  const [brandingConfig, setBrandingConfig] = useState<BrandingConfig>(
    brandingService.getBrandingConfig()
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBranding = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const config = await brandingService.loadBrandingConfig();
      setBrandingConfig(config);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to load branding configuration";
      setError(errorMessage);
      console.error("Error loading branding configuration:", err);
      // Use default configuration on error
      setBrandingConfig(brandingService.getBrandingConfig());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBranding();
  }, []);

  return {
    brandingConfig,
    isLoading,
    error,
    organizationName: brandingConfig.organizationName,
    logoUrl: brandingConfig.logoUrl,
    hasCustomLogo: brandingService.hasCustomLogo(),
    reload: loadBranding,
  };
};
