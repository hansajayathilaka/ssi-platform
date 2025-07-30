/**
 * Invitation controller for the simplified credential server
 * Handles OOBI generation and invitation response formatting
 */

import { Request, Response } from "express";
import { SignifyClient } from "signify-ts";
import { generateOOBI, initializeSignifyClient, ensureIdentifier } from "../utils/keri";
import { serverConfig } from "../config";

// Types for invitation responses
export interface InvitationResponse {
  success: boolean;
  data: {
    oobi: string;
    qrCode?: string;
  };
  error?: string;
}

export interface InvitationData {
  oobi: string;
  timestamp: string;
  issuerName: string;
}

/**
 * Generate a KERI invitation (OOBI) for the issuer
 * @param client - Signify client instance
 * @param issuerName - Name of the issuer identifier
 * @returns Promise<InvitationResponse> - Invitation response with OOBI data
 */
export async function generateInvitation(
  client: SignifyClient,
  issuerName: string = serverConfig.issuerName
): Promise<InvitationResponse> {
  try {
    console.log(`Generating invitation for issuer: ${issuerName}`);

    // Ensure the issuer identifier exists
    await ensureIdentifier(client, issuerName);

    // Generate OOBI using the utility function
    const result = await generateOOBI(client, issuerName);

    if (!result.success) {
      return {
        success: false,
        data: {
          oobi: "",
        },
        error: "Failed to generate OOBI invitation",
      };
    }

    console.log(`Successfully generated OOBI: ${result.data.oobi}`);

    return {
      success: true,
      data: {
        oobi: result.data.oobi,
        // QR code data can be added here if needed
        qrCode: result.data.oobi, // The OOBI itself can be used for QR code generation
      },
    };
  } catch (error) {
    console.error("Error generating invitation:", error);
    return {
      success: false,
      data: {
        oobi: "",
      },
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Format invitation data for response
 * @param oobi - OOBI string
 * @param issuerName - Name of the issuer
 * @returns InvitationData - Formatted invitation data
 */
export function formatInvitationData(
  oobi: string,
  issuerName: string = serverConfig.issuerName
): InvitationData {
  return {
    oobi,
    timestamp: new Date().toISOString(),
    issuerName,
  };
}

/**
 * Express route handler for generating invitations
 * GET /api/invitation
 * @param _req - Express request object (unused)
 * @param res - Express response object
 */
export async function handleInvitationRequest(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    console.log("Received invitation request");

    // Initialize Signify client
    const client = await initializeSignifyClient();

    // Generate invitation
    const invitationResponse = await generateInvitation(client, serverConfig.issuerName);

    if (!invitationResponse.success) {
      res.status(500).json({
        success: false,
        error: invitationResponse.error || "Failed to generate invitation",
        data: null,
      });
      return;
    }

    // Format the response data
    const formattedData = formatInvitationData(
      invitationResponse.data.oobi,
      serverConfig.issuerName
    );

    // Send successful response
    res.json({
      success: true,
      data: {
        ...formattedData,
        qrCode: invitationResponse.data.qrCode,
      },
    });

    console.log("Successfully sent invitation response");
  } catch (error) {
    console.error("Error handling invitation request:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
      data: null,
    });
  }
}

/**
 * Generate invitation with custom issuer name
 * @param req - Express request object with issuerName in query params
 * @param res - Express response object
 */
export async function handleCustomInvitationRequest(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const issuerName = (req.query['issuerName'] as string) || serverConfig.issuerName;
    console.log(`Received custom invitation request for issuer: ${issuerName}`);

    // Initialize Signify client
    const client = await initializeSignifyClient();

    // Generate invitation for custom issuer
    const invitationResponse = await generateInvitation(client, issuerName);

    if (!invitationResponse.success) {
      res.status(500).json({
        success: false,
        error: invitationResponse.error || "Failed to generate invitation",
        data: null,
      });
      return;
    }

    // Format the response data
    const formattedData = formatInvitationData(invitationResponse.data.oobi, issuerName);

    // Send successful response
    res.json({
      success: true,
      data: {
        ...formattedData,
        qrCode: invitationResponse.data.qrCode,
      },
    });

    console.log(`Successfully sent custom invitation response for issuer: ${issuerName}`);
  } catch (error) {
    console.error("Error handling custom invitation request:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
      data: null,
    });
  }
}