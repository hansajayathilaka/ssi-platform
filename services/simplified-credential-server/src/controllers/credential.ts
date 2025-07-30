/**
 * Credential controller for the simplified credential server
 * Handles credential issuance, validation, and response formatting
 */

import { Request, Response } from "express";
import { SignifyClient } from "signify-ts";
import { issueCredential, initializeSignifyClient, ensureIdentifier } from "../utils/keri";
import { serverConfig } from "../config";

// Types for credential requests and responses
export interface CredentialRequest {
  recipientId: string;
  schemaId: string;
  attributes: Record<string, any>;
}

export interface CredentialResponse {
  success: boolean;
  data: string;
  credentialId?: string | undefined;
  error?: string;
}

export interface CredentialData {
  recipientId: string;
  schemaId: string;
  attributes: Record<string, any>;
  issuerName: string;
}

// Validation schemas for credential data
const REQUIRED_FIELDS = ['recipientId', 'schemaId', 'attributes'];

/**
 * Validate credential request data
 * @param data - The credential request data to validate
 * @returns ValidationResult - Object containing validation status and errors
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateCredentialData(data: any): ValidationResult {
  const errors: string[] = [];

  // Check if data exists
  if (!data || typeof data !== 'object') {
    errors.push('Request body must be a valid JSON object');
    return { isValid: false, errors };
  }

  // Check required fields
  for (const field of REQUIRED_FIELDS) {
    if (!data[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Validate recipientId format (should be a valid KERI identifier)
  if (data.recipientId && typeof data.recipientId !== 'string') {
    errors.push('recipientId must be a string');
  }

  if (data.recipientId && data.recipientId.length === 0) {
    errors.push('recipientId cannot be empty');
  }

  // Validate schemaId format
  if (data.schemaId && typeof data.schemaId !== 'string') {
    errors.push('schemaId must be a string');
  }

  if (data.schemaId && data.schemaId.length === 0) {
    errors.push('schemaId cannot be empty');
  }

  // Validate attributes
  if (data.attributes && typeof data.attributes !== 'object') {
    errors.push('attributes must be an object');
  }

  if (data.attributes && Object.keys(data.attributes).length === 0) {
    errors.push('attributes cannot be empty');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Issue a credential to a recipient
 * @param client - Signify client instance
 * @param credentialData - Credential data to issue
 * @param issuerName - Name of the issuer identifier
 * @returns Promise<CredentialResponse> - Credential issuance response
 */
export async function issueCredentialToRecipient(
  client: SignifyClient,
  credentialData: CredentialRequest,
  issuerName: string = serverConfig.issuerName
): Promise<CredentialResponse> {
  try {
    console.log(`Issuing credential to recipient: ${credentialData.recipientId}`);
    console.log(`Using schema: ${credentialData.schemaId}`);
    console.log(`Issuer: ${issuerName}`);

    // Ensure the issuer identifier exists
    await ensureIdentifier(client, issuerName);

    // Issue the credential using the utility function
    const result = await issueCredential(client, credentialData, issuerName);

    if (!result.success) {
      return {
        success: false,
        data: result.data,
        error: "Failed to issue credential",
      };
    }

    console.log(`Successfully issued credential with ID: ${result.credentialId}`);

    return {
      success: true,
      data: result.data,
      credentialId: result.credentialId,
    };
  } catch (error) {
    console.error("Error issuing credential:", error);
    return {
      success: false,
      data: "Credential issuance failed",
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Format credential data for processing
 * @param requestData - Raw request data
 * @param issuerName - Name of the issuer
 * @returns CredentialData - Formatted credential data
 */
export function formatCredentialData(
  requestData: CredentialRequest,
  issuerName: string = serverConfig.issuerName
): CredentialData {
  return {
    recipientId: requestData.recipientId,
    schemaId: requestData.schemaId,
    attributes: requestData.attributes,
    issuerName,
  };
}

/**
 * Express route handler for credential issuance
 * POST /api/credential
 * @param req - Express request object with credential data in body
 * @param res - Express response object
 */
export async function handleCredentialRequest(
  req: Request,
  res: Response
): Promise<void> {
  try {
    console.log("Received credential issuance request");
    console.log("Request body:", JSON.stringify(req.body, null, 2));

    // Validate the request data
    const validation = validateCredentialData(req.body);
    if (!validation.isValid) {
      console.log("Validation failed:", validation.errors);
      res.status(400).json({
        success: false,
        error: "Validation failed",
        details: validation.errors,
        data: null,
      });
      return;
    }

    // Initialize Signify client
    const client = await initializeSignifyClient();

    // Format the credential data
    const credentialData = formatCredentialData(req.body, serverConfig.issuerName);

    // Issue the credential
    const credentialResponse = await issueCredentialToRecipient(
      client,
      credentialData,
      serverConfig.issuerName
    );

    if (!credentialResponse.success) {
      res.status(500).json({
        success: false,
        error: credentialResponse.error || "Failed to issue credential",
        details: credentialResponse.data,
        data: null,
      });
      return;
    }

    // Send successful response
    res.json({
      success: true,
      data: {
        message: credentialResponse.data,
        credentialId: credentialResponse.credentialId,
        recipientId: credentialData.recipientId,
        schemaId: credentialData.schemaId,
        issuer: credentialData.issuerName,
        timestamp: new Date().toISOString(),
      },
    });

    console.log("Successfully sent credential issuance response");
  } catch (error) {
    console.error("Error handling credential request:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
      data: null,
    });
  }
}

/**
 * Issue credential with custom issuer name
 * @param req - Express request object with credential data and optional issuerName
 * @param res - Express response object
 */
export async function handleCustomCredentialRequest(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const issuerName = req.body.issuerName || serverConfig.issuerName;
    console.log(`Received custom credential request for issuer: ${issuerName}`);

    // Validate the request data
    const validation = validateCredentialData(req.body);
    if (!validation.isValid) {
      console.log("Validation failed:", validation.errors);
      res.status(400).json({
        success: false,
        error: "Validation failed",
        details: validation.errors,
        data: null,
      });
      return;
    }

    // Initialize Signify client
    const client = await initializeSignifyClient();

    // Format the credential data with custom issuer
    const credentialData = formatCredentialData(req.body, issuerName);

    // Issue the credential
    const credentialResponse = await issueCredentialToRecipient(
      client,
      credentialData,
      issuerName
    );

    if (!credentialResponse.success) {
      res.status(500).json({
        success: false,
        error: credentialResponse.error || "Failed to issue credential",
        details: credentialResponse.data,
        data: null,
      });
      return;
    }

    // Send successful response
    res.json({
      success: true,
      data: {
        message: credentialResponse.data,
        credentialId: credentialResponse.credentialId,
        recipientId: credentialData.recipientId,
        schemaId: credentialData.schemaId,
        issuer: credentialData.issuerName,
        timestamp: new Date().toISOString(),
      },
    });

    console.log(`Successfully sent custom credential issuance response for issuer: ${issuerName}`);
  } catch (error) {
    console.error("Error handling custom credential request:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
      data: null,
    });
  }
}

/**
 * Get credential status or information
 * GET /api/credential/:credentialId
 * @param req - Express request object with credentialId in params
 * @param res - Express response object
 */
export async function handleCredentialStatusRequest(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const credentialId = req.params['credentialId'];
    console.log(`Received credential status request for ID: ${credentialId}`);

    if (!credentialId) {
      res.status(400).json({
        success: false,
        error: "Credential ID is required",
        data: null,
      });
      return;
    }

    // For now, return a basic response indicating the credential exists
    // In a full implementation, this would query the credential registry
    // const client = await initializeSignifyClient();
    res.json({
      success: true,
      data: {
        credentialId,
        status: "issued",
        message: "Credential status check completed",
        timestamp: new Date().toISOString(),
      },
    });

    console.log(`Successfully sent credential status response for ID: ${credentialId}`);
  } catch (error) {
    console.error("Error handling credential status request:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
      data: null,
    });
  }
}