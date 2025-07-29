import { Request, Response } from "express";
import { brandingService } from "../services/brandingService";

/**
 * GET /branding
 * Returns the current branding configuration
 */
export function getBrandingConfig(_: Request, res: Response) {
  try {
    const brandingConfig = brandingService.getBrandingConfig();

    res.status(200).json({
      success: true,
      data: brandingConfig,
    });
  } catch (error) {
    console.error("Error getting branding configuration:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "BRANDING_CONFIG_ERROR",
        message: "Failed to retrieve branding configuration",
      },
    });
  }
}
