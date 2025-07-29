/**
 * Schema Management API
 *
 * REST endpoints for managing custom credential schemas.
 * Provides CRUD operations for custom schemas with validation.
 */

import { Request, Response } from "express";
import { config } from "../config";
import { CustomSchema } from "../types/schema.types";
import { SchemaStorageService } from "../services/schema-storage.service";
import { SchemaValidationService } from "../services/schema-validation.service";

// Initialize services
const storageService = new SchemaStorageService({
  schemasPath: config.schemas.customSchemasPath,
  enableValidation: config.schemas.validationStrict,
  backupOnUpdate: config.schemas.backupOnUpdate,
});

const validationService = new SchemaValidationService();

/**
 * GET /schemas/custom - List all custom schemas
 */
export async function listCustomSchemas(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schemas = await storageService.loadAllSchemas();

    // Filter active schemas if requested
    const activeOnly = req.query.active === "true";
    const filteredSchemas = activeOnly
      ? schemas.filter((schema) => schema.metadata.isActive)
      : schemas;

    res.status(200).json({
      success: true,
      data: filteredSchemas,
      count: filteredSchemas.length,
    });
  } catch (error) {
    console.error("Error listing custom schemas:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "SCHEMA_LIST_ERROR",
        message: "Failed to retrieve custom schemas",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
}

/**
 * GET /schemas/custom/:id - Get a specific custom schema by ID
 */
export async function getCustomSchemaById(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;

    if (!id || typeof id !== "string") {
      res.status(400).json({
        success: false,
        error: {
          code: "INVALID_SCHEMA_ID",
          message: "Schema ID is required and must be a string",
        },
      });
      return;
    }

    const schema = await storageService.loadSchema(id);

    if (!schema) {
      res.status(404).json({
        success: false,
        error: {
          code: "SCHEMA_NOT_FOUND",
          message: `Schema with ID '${id}' not found`,
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: schema,
    });
  } catch (error) {
    console.error("Error retrieving custom schema:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "SCHEMA_RETRIEVAL_ERROR",
        message: "Failed to retrieve custom schema",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
}

/**
 * POST /schemas/custom - Create a new custom schema
 */
export async function createCustomSchema(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schemaData = req.body as CustomSchema;

    // Basic request validation
    if (!schemaData || typeof schemaData !== "object") {
      res.status(400).json({
        success: false,
        error: {
          code: "INVALID_REQUEST_BODY",
          message: "Request body must contain schema data",
        },
      });
      return;
    }

    // Set timestamps for new schema
    const now = new Date();
    schemaData.createdAt = now;
    schemaData.updatedAt = now;

    // Validate schema structure
    const validationResult = validationService.validateSchema(schemaData);

    if (!validationResult.isValid) {
      res.status(400).json({
        success: false,
        error: {
          code: "SCHEMA_VALIDATION_FAILED",
          message: "Schema validation failed",
          details: validationResult.errors,
        },
      });
      return;
    }

    // Check if schema with same ID already exists
    const existingSchema = await storageService.loadSchema(schemaData.id);
    if (existingSchema) {
      res.status(409).json({
        success: false,
        error: {
          code: "SCHEMA_ALREADY_EXISTS",
          message: `Schema with ID '${schemaData.id}' already exists`,
        },
      });
      return;
    }

    // Save the schema
    await storageService.saveSchema(schemaData);

    res.status(201).json({
      success: true,
      data: schemaData,
      message: "Custom schema created successfully",
    });
  } catch (error) {
    console.error("Error creating custom schema:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "SCHEMA_CREATION_ERROR",
        message: "Failed to create custom schema",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
}

/**
 * PUT /schemas/custom/:id - Update an existing custom schema
 */
export async function updateCustomSchema(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const schemaData = req.body as CustomSchema;

    if (!id || typeof id !== "string") {
      res.status(400).json({
        success: false,
        error: {
          code: "INVALID_SCHEMA_ID",
          message: "Schema ID is required and must be a string",
        },
      });
      return;
    }

    if (!schemaData || typeof schemaData !== "object") {
      res.status(400).json({
        success: false,
        error: {
          code: "INVALID_REQUEST_BODY",
          message: "Request body must contain schema data",
        },
      });
      return;
    }

    // Ensure the ID in the URL matches the ID in the body
    if (schemaData.id !== id) {
      res.status(400).json({
        success: false,
        error: {
          code: "SCHEMA_ID_MISMATCH",
          message: "Schema ID in URL must match ID in request body",
        },
      });
      return;
    }

    // Check if schema exists
    const existingSchema = await storageService.loadSchema(id);
    if (!existingSchema) {
      res.status(404).json({
        success: false,
        error: {
          code: "SCHEMA_NOT_FOUND",
          message: `Schema with ID '${id}' not found`,
        },
      });
      return;
    }

    // Preserve creation date and update timestamp
    schemaData.createdAt = existingSchema.createdAt;
    schemaData.updatedAt = new Date();

    // Validate schema structure
    const validationResult = validationService.validateSchema(schemaData);

    if (!validationResult.isValid) {
      res.status(400).json({
        success: false,
        error: {
          code: "SCHEMA_VALIDATION_FAILED",
          message: "Schema validation failed",
          details: validationResult.errors,
        },
      });
      return;
    }

    // Save the updated schema
    await storageService.saveSchema(schemaData);

    res.status(200).json({
      success: true,
      data: schemaData,
      message: "Custom schema updated successfully",
    });
  } catch (error) {
    console.error("Error updating custom schema:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "SCHEMA_UPDATE_ERROR",
        message: "Failed to update custom schema",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
}

/**
 * DELETE /schemas/custom/:id - Delete a custom schema
 */
export async function deleteCustomSchema(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;

    if (!id || typeof id !== "string") {
      res.status(400).json({
        success: false,
        error: {
          code: "INVALID_SCHEMA_ID",
          message: "Schema ID is required and must be a string",
        },
      });
      return;
    }

    // Check if schema exists
    const existingSchema = await storageService.loadSchema(id);
    if (!existingSchema) {
      res.status(404).json({
        success: false,
        error: {
          code: "SCHEMA_NOT_FOUND",
          message: `Schema with ID '${id}' not found`,
        },
      });
      return;
    }

    // Delete the schema
    const deleted = await storageService.deleteSchema(id);

    if (!deleted) {
      res.status(500).json({
        success: false,
        error: {
          code: "SCHEMA_DELETION_ERROR",
          message: "Failed to delete schema file",
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: `Schema '${id}' deleted successfully`,
    });
  } catch (error) {
    console.error("Error deleting custom schema:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "SCHEMA_DELETION_ERROR",
        message: "Failed to delete custom schema",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
}

/**
 * POST /schemas/custom/:id/validate - Validate credential data against a schema
 */
export async function validateCredentialData(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const credentialData = req.body;

    if (!id || typeof id !== "string") {
      res.status(400).json({
        success: false,
        error: {
          code: "INVALID_SCHEMA_ID",
          message: "Schema ID is required and must be a string",
        },
      });
      return;
    }

    if (!credentialData || typeof credentialData !== "object") {
      res.status(400).json({
        success: false,
        error: {
          code: "INVALID_REQUEST_BODY",
          message: "Request body must contain credential data to validate",
        },
      });
      return;
    }

    // Load the schema
    const schema = await storageService.loadSchema(id);
    if (!schema) {
      res.status(404).json({
        success: false,
        error: {
          code: "SCHEMA_NOT_FOUND",
          message: `Schema with ID '${id}' not found`,
        },
      });
      return;
    }

    // Validate the credential data
    const validationResult = validationService.validateCredentialData(
      credentialData,
      schema
    );

    res.status(200).json({
      success: true,
      data: {
        isValid: validationResult.isValid,
        errors: validationResult.errors,
        schemaId: id,
        schemaName: schema.name,
      },
    });
  } catch (error) {
    console.error("Error validating credential data:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Failed to validate credential data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
}
