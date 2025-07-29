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
import {
  saidifySchema,
  convertToJsonSchema,
  validateSchemaSaid,
  JsonSchema,
} from "../utils/said.utils";

// Initialize services
const storageService = new SchemaStorageService({
  schemasPath: config.schemas.customSchemasPath,
  enableValidation: config.schemas.validationStrict,
  backupOnUpdate: config.schemas.backupOnUpdate,
});

const validationService = new SchemaValidationService();

/**
 * Helper function to generate SAID for a custom schema
 */
async function generateSaidForSchema(schema: CustomSchema): Promise<string> {
  try {
    // Convert custom schema to JSON Schema format
    const jsonSchema = convertToJsonSchema(schema);

    // Generate SAID for the schema
    const saidifiedSchema = saidifySchema(jsonSchema);
    const generatedSaid = saidifiedSchema.$id;

    if (!generatedSaid) {
      throw new Error("Failed to generate SAID - empty result");
    }

    return generatedSaid;
  } catch (error) {
    console.error("Error in generateSaidForSchema:", error);
    throw new Error(
      `SAID generation failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

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
    const schemaData = req.body as Omit<
      CustomSchema,
      "id" | "createdAt" | "updatedAt"
    >;

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

    // Create a complete schema object with timestamps
    const now = new Date();
    const completeSchemaData: Omit<CustomSchema, "id"> = {
      ...schemaData,
      createdAt: now,
      updatedAt: now,
    };

    // Validate schema structure (before SAID generation) - without requiring ID
    const validationResult =
      validationService.validateSchemaWithoutId(completeSchemaData);

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

    // Generate SAID using saidily
    let finalSchema: CustomSchema;
    try {
      // Create a temporary schema with placeholder ID for SAID generation
      const tempSchemaForSaid: CustomSchema = {
        ...completeSchemaData,
        id: "temp-id-for-said",
      };

      const generatedSaid = await generateSaidForSchema(tempSchemaForSaid);
      finalSchema = {
        ...completeSchemaData,
        id: generatedSaid,
      };
      console.log(`Generated SAID for new schema: ${generatedSaid}`);
    } catch (saidError) {
      console.error("Error generating SAID for schema:", saidError);
      res.status(500).json({
        success: false,
        error: {
          code: "SAID_GENERATION_ERROR",
          message: "Failed to generate SAID for schema",
          details:
            saidError instanceof Error ? saidError.message : "Unknown error",
        },
      });
      return;
    }

    // Check if schema with same ID already exists (unlikely with SAID but good to check)
    const existingSchema = await storageService.loadSchema(finalSchema.id);
    if (existingSchema) {
      res.status(409).json({
        success: false,
        error: {
          code: "SCHEMA_ALREADY_EXISTS",
          message: `Schema with ID '${finalSchema.id}' already exists`,
        },
      });
      return;
    }

    // Save the schema with generated SAID
    await storageService.saveSchema(finalSchema);

    res.status(201).json({
      success: true,
      data: finalSchema,
      message: "Custom schema created successfully with generated SAID",
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

    // Validate schema structure (before SAID generation)
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

    // Generate new SAID for updated schema
    let newSaid: string;
    try {
      newSaid = await generateSaidForSchema(schemaData);
      schemaData.id = newSaid;
      console.log(
        `Generated new SAID for updated schema: ${newSaid} (was: ${id})`
      );
    } catch (saidError) {
      console.error("Error generating SAID for updated schema:", saidError);
      res.status(500).json({
        success: false,
        error: {
          code: "SAID_GENERATION_ERROR",
          message: "Failed to generate SAID for updated schema",
          details:
            saidError instanceof Error ? saidError.message : "Unknown error",
        },
      });
      return;
    }

    // If SAID changed, we need to handle the old schema file
    if (newSaid !== id) {
      // Delete the old schema file
      await storageService.deleteSchema(id);
      console.log(`Deleted old schema file with ID: ${id}`);
    }

    // Save the updated schema with new SAID
    await storageService.saveSchema(schemaData);

    res.status(200).json({
      success: true,
      data: schemaData,
      message:
        newSaid !== id
          ? "Custom schema updated successfully with new SAID"
          : "Custom schema updated successfully",
      oldId: newSaid !== id ? id : undefined,
      newId: newSaid,
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

/**
 * POST /schemas/saidify - Convert and SAIDify a JSON schema
 */
export async function saidifyJsonSchema(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const jsonSchema = req.body as JsonSchema;

    // Basic request validation
    if (!jsonSchema || typeof jsonSchema !== "object") {
      res.status(400).json({
        success: false,
        error: {
          code: "INVALID_REQUEST_BODY",
          message: "Request body must contain JSON schema data",
        },
      });
      return;
    }

    // Validate JSON Schema structure
    if (!jsonSchema.$schema || !jsonSchema.title || !jsonSchema.type) {
      res.status(400).json({
        success: false,
        error: {
          code: "INVALID_JSON_SCHEMA",
          message: "Schema must include $schema, title, and type fields",
        },
      });
      return;
    }

    // SAIDify the schema
    const saidifiedSchema = saidifySchema(jsonSchema);

    res.status(200).json({
      success: true,
      data: saidifiedSchema,
      message: "Schema SAIDified successfully",
    });
  } catch (error) {
    console.error("Error SAIDifying schema:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "SAIDIFY_ERROR",
        message: "Failed to SAIDify schema",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
}

/**
 * POST /schemas/convert - Convert custom schema to JSON Schema and SAIDify
 */
export async function convertAndSaidifySchema(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const customSchema = req.body as CustomSchema;

    // Basic request validation
    if (!customSchema || typeof customSchema !== "object") {
      res.status(400).json({
        success: false,
        error: {
          code: "INVALID_REQUEST_BODY",
          message: "Request body must contain custom schema data",
        },
      });
      return;
    }

    // Validate custom schema structure
    const validationResult = validationService.validateSchema(customSchema);
    if (!validationResult.isValid) {
      res.status(400).json({
        success: false,
        error: {
          code: "SCHEMA_VALIDATION_FAILED",
          message: "Custom schema validation failed",
          details: validationResult.errors,
        },
      });
      return;
    }

    // Convert to JSON Schema
    const jsonSchema = convertToJsonSchema(customSchema);

    // SAIDify the schema
    const saidifiedSchema = saidifySchema(jsonSchema);

    res.status(200).json({
      success: true,
      data: {
        originalSchema: customSchema,
        jsonSchema: jsonSchema,
        saidifiedSchema: saidifiedSchema,
        said: saidifiedSchema.$id,
      },
      message: "Schema converted and SAIDified successfully",
    });
  } catch (error) {
    console.error("Error converting and SAIDifying schema:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "CONVERT_SAIDIFY_ERROR",
        message: "Failed to convert and SAIDify schema",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
}

/**
 * POST /schemas/validate-said - Validate that a schema's SAID is correct
 */
export async function validateSchemaWithSaid(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const jsonSchema = req.body as JsonSchema;

    // Basic request validation
    if (!jsonSchema || typeof jsonSchema !== "object") {
      res.status(400).json({
        success: false,
        error: {
          code: "INVALID_REQUEST_BODY",
          message: "Request body must contain JSON schema data",
        },
      });
      return;
    }

    // Validate SAID
    const isValidSaid = validateSchemaSaid(jsonSchema);

    res.status(200).json({
      success: true,
      data: {
        isValid: isValidSaid,
        schemaId: jsonSchema.$id,
        schemaTitle: jsonSchema.title,
      },
      message: isValidSaid
        ? "Schema SAID is valid"
        : "Schema SAID is invalid or missing",
    });
  } catch (error) {
    console.error("Error validating schema SAID:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "SAID_VALIDATION_ERROR",
        message: "Failed to validate schema SAID",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
}
