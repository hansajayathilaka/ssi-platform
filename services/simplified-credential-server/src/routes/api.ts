/**
 * API routes for the simplified credential server
 * Provides REST API endpoints for credential operations
 */

import { Router, Request, Response, NextFunction } from "express";
import {
  handleInvitationRequest,
  handleCustomInvitationRequest,
} from "../controllers/invitation";
import {
  handleCredentialRequest,
  handleCustomCredentialRequest,
  handleCredentialStatusRequest,
} from "../controllers/credential";

// Create Express router
const apiRouter: Router = Router();

// Error handling middleware for API routes
export interface ApiError extends Error {
  status?: number;
  code?: string;
  details?: any;
}

/**
 * API error handler middleware
 * Catches and formats errors for API responses
 */
export function apiErrorHandler(
  error: ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error("API Error:", error);

  // Default error response
  const status = error.status || 500;
  const response = {
    success: false,
    error: error.message || "Internal server error",
    code: error.code || "INTERNAL_ERROR",
    details: error.details || null,
    data: null,
  };

  // Log the error details
  console.error(`API Error [${status}]: ${error.message}`);
  if (error.stack) {
    console.error("Stack trace:", error.stack);
  }

  res.status(status).json(response);
}

/**
 * Async route wrapper to handle promise rejections
 * Ensures async errors are properly caught and passed to error middleware
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Request logging middleware for API routes
 */
export function apiRequestLogger(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] API ${req.method} ${req.path}`);
  
  if (req.method === "POST" && req.body) {
    console.log("Request body:", JSON.stringify(req.body, null, 2));
  }
  
  if (Object.keys(req.query).length > 0) {
    console.log("Query params:", req.query);
  }
  
  next();
}

/**
 * Validation middleware for JSON content type on POST requests
 */
export function validateJsonContent(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  if (req.method === "POST" && !req.is("application/json")) {
    const error: ApiError = new Error("Content-Type must be application/json");
    error.status = 400;
    error.code = "INVALID_CONTENT_TYPE";
    next(error);
    return;
  }
  next();
}

// Apply middleware to all API routes
apiRouter.use(apiRequestLogger);
apiRouter.use(validateJsonContent);

// INVITATION ROUTES

/**
 * GET /api/invitation
 * Generate a KERI OOBI invitation for the default issuer
 * 
 * Response format:
 * {
 *   success: boolean,
 *   data: {
 *     oobi: string,
 *     timestamp: string,
 *     issuerName: string,
 *     qrCode?: string
 *   }
 * }
 */
apiRouter.get("/invitation", asyncHandler(handleInvitationRequest));

/**
 * GET /api/invitation/custom
 * Generate a KERI OOBI invitation for a custom issuer
 * Query parameters:
 * - issuerName: string (optional) - Name of the issuer identifier
 * 
 * Response format: Same as /api/invitation
 */
apiRouter.get("/invitation/custom", asyncHandler(handleCustomInvitationRequest));

// CREDENTIAL ROUTES

/**
 * POST /api/credential
 * Issue a credential to a recipient using the default issuer
 * 
 * Request body:
 * {
 *   recipientId: string,
 *   schemaId: string,
 *   attributes: Record<string, any>
 * }
 * 
 * Response format:
 * {
 *   success: boolean,
 *   data: {
 *     message: string,
 *     credentialId?: string,
 *     recipientId: string,
 *     schemaId: string,
 *     issuer: string,
 *     timestamp: string
 *   }
 * }
 */
apiRouter.post("/credential", asyncHandler(handleCredentialRequest));

/**
 * POST /api/credential/custom
 * Issue a credential to a recipient using a custom issuer
 * 
 * Request body:
 * {
 *   recipientId: string,
 *   schemaId: string,
 *   attributes: Record<string, any>,
 *   issuerName?: string (optional)
 * }
 * 
 * Response format: Same as /api/credential
 */
apiRouter.post("/credential/custom", asyncHandler(handleCustomCredentialRequest));

/**
 * GET /api/credential/:credentialId
 * Get credential status or information
 * 
 * Path parameters:
 * - credentialId: string - ID of the credential to query
 * 
 * Response format:
 * {
 *   success: boolean,
 *   data: {
 *     credentialId: string,
 *     status: string,
 *     message: string,
 *     timestamp: string
 *   }
 * }
 */
apiRouter.get("/credential/:credentialId", asyncHandler(handleCredentialStatusRequest));

// HEALTH CHECK ROUTE

/**
 * GET /api/health
 * Health check endpoint for monitoring
 * 
 * Response format:
 * {
 *   success: boolean,
 *   data: {
 *     status: string,
 *     timestamp: string,
 *     uptime: number
 *   }
 * }
 */
apiRouter.get("/health", (_req: Request, res: Response): void => {
  res.json({
    success: true,
    data: {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  });
});

// Apply error handling middleware (must be last)
apiRouter.use(apiErrorHandler);

export default apiRouter;