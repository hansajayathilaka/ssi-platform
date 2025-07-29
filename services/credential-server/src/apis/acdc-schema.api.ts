/**
 * ACDC Schema API
 *
 * REST endpoints for creating properly formatted ACDC schemas
 * that are compatible with KERIA agents.
 */

import { Request, Response } from "express";
import { config } from "../config";
import * as fs from "fs";
import * as path from "path";
import {
  AcdcSchemaConfig,
  createAndSaidifyAcdcSchema,
  convertCustomSchemaToAcdc,
} from "../utils/acdc-schema.utils";
import { JsonSchema } from "../utils/said.utils";

/**
 * POST /schemas/acdc - Create a new ACDC schema
 */
export async function createAcdcSchema(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schemaConfig = req.body as AcdcSchemaConfig;

    // Basic request validation
    if (!schemaConfig || typeof schemaConfig !== "object") {
      res.status(400).json({
        success: false,
        error: {
          code: "INVALID_REQUEST_BODY",
          message: "Request body must contain ACDC schema configuration",
        },
      });
      return;
    }

    // Validate required fields
    if (
      !schemaConfig.title ||
      !schemaConfig.description ||
      !schemaConfig.credentialType
    ) {
      res.status(400).json({
        success: false,
        error: {
          code: "MISSING_REQUIRED_FIELDS",
          message: "title, description, and credentialType are required",
        },
      });
      return;
    }

    // Create and SAIDify the ACDC schema
    let saidifiedSchema: JsonSchema;
    try {
      saidifiedSchema = createAndSaidifyAcdcSchema(schemaConfig);
      console.log(`Generated ACDC schema with SAID: ${saidifiedSchema.$id}`);
    } catch (saidError) {
      console.error("Error creating ACDC schema:", saidError);
      res.status(500).json({
        success: false,
        error: {
          code: "SCHEMA_CREATION_ERROR",
          message: "Failed to create ACDC schema",
          details:
            saidError instanceof Error ? saidError.message : "Unknown error",
        },
      });
      return;
    }

    // Save to both locations for maximum compatibility
    try {
      await saveSchemaToBuiltIn(saidifiedSchema);
      await saveSchemaToCustom(saidifiedSchema);
    } catch (saveError) {
      console.error("Error saving schema:", saveError);
      res.status(500).json({
        success: false,
        error: {
          code: "SCHEMA_SAVE_ERROR",
          message: "Failed to save schema",
          details:
            saveError instanceof Error ? saveError.message : "Unknown error",
        },
      });
      return;
    }

    res.status(201).json({
      success: true,
      data: saidifiedSchema,
      message: "ACDC schema created and saved successfully",
      endpoints: {
        schema: `/schemas/${saidifiedSchema.$id}`,
        keriaCompatible: true,
      },
    });
  } catch (error) {
    console.error("Error in createAcdcSchema:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
}

/**
 * POST /schemas/acdc/convert - Convert custom schema to ACDC format
 */
export async function convertToAcdcSchema(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const customSchema = req.body;

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

    // Convert to ACDC format
    let acdcSchema: JsonSchema;
    try {
      acdcSchema = convertCustomSchemaToAcdc(customSchema);
      console.log(
        `Converted custom schema to ACDC with SAID: ${acdcSchema.$id}`
      );
    } catch (conversionError) {
      console.error("Error converting to ACDC:", conversionError);
      res.status(500).json({
        success: false,
        error: {
          code: "CONVERSION_ERROR",
          message: "Failed to convert schema to ACDC format",
          details:
            conversionError instanceof Error
              ? conversionError.message
              : "Unknown error",
        },
      });
      return;
    }

    // Save the converted schema
    const shouldSave = req.query.save === "true";
    if (shouldSave) {
      try {
        await saveSchemaToBuiltIn(acdcSchema);
        await saveSchemaToCustom(acdcSchema);
      } catch (saveError) {
        console.error("Error saving converted schema:", saveError);
        res.status(500).json({
          success: false,
          error: {
            code: "SCHEMA_SAVE_ERROR",
            message: "Failed to save converted schema",
            details:
              saveError instanceof Error ? saveError.message : "Unknown error",
          },
        });
        return;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        originalSchema: customSchema,
        acdcSchema: acdcSchema,
        said: acdcSchema.$id,
        saved: shouldSave,
      },
      message: shouldSave
        ? "Schema converted to ACDC format and saved successfully"
        : "Schema converted to ACDC format successfully",
      endpoints: shouldSave
        ? {
            schema: `/schemas/${acdcSchema.$id}`,
            keriaCompatible: true,
          }
        : undefined,
    });
  } catch (error) {
    console.error("Error in convertToAcdcSchema:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
}

/**
 * Save schema to built-in schemas directory (KERIA compatible)
 */
async function saveSchemaToBuiltIn(schema: JsonSchema): Promise<void> {
  const builtInDir =
    config.schemas.builtInSchemasPath || path.join(__dirname, "..", "schemas");

  // Ensure directory exists
  if (!fs.existsSync(builtInDir)) {
    fs.mkdirSync(builtInDir, { recursive: true });
  }

  // Save without .json extension (like other built-in schemas)
  const filepath = path.join(builtInDir, schema.$id);
  fs.writeFileSync(filepath, JSON.stringify(schema, null, 2));

  console.log(`✅ Built-in schema saved to: ${filepath}`);
}

/**
 * Save schema to custom schemas directory
 */
async function saveSchemaToCustom(schema: JsonSchema): Promise<void> {
  const customDir = config.schemas.customSchemasPath;

  // Ensure directory exists
  if (!fs.existsSync(customDir)) {
    fs.mkdirSync(customDir, { recursive: true });
  }

  // Save with .json extension (like other custom schemas)
  const filepath = path.join(customDir, `${schema.$id}.json`);
  fs.writeFileSync(filepath, JSON.stringify(schema, null, 2));

  console.log(`✅ Custom schema saved to: ${filepath}`);
}
