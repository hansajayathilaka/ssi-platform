import { Request, Response } from "express";
import { ACDC_SCHEMAS } from "../consts";
import { SchemaStorageService } from "../services/schema-storage.service";
import { config } from "../config";
import * as fs from "fs";
import * as path from "path";

// Initialize schema storage service
const schemaStorageService = new SchemaStorageService({
  schemasPath: config.schemas.customSchemasPath,
  enableValidation: config.schemas.validationStrict,
  backupOnUpdate: config.schemas.backupOnUpdate,
});

export async function schemaApi(req: Request, res: Response) {
  try {
    // Get default schemas
    const defaultSchemas = ACDC_SCHEMAS.map((schema) => ({
      ...schema,
      type: "default" as const,
      isActive: true,
    }));

    // Get custom schemas
    const customSchemas = await schemaStorageService.loadAllSchemas();
    const activeCustomSchemas = customSchemas
      .filter((schema) => schema.metadata.isActive)
      .map((schema) => ({
        id: schema.id,
        name: schema.name,
        type: "custom" as const,
        version: schema.version,
        description: schema.description,
        isActive: schema.metadata.isActive,
      }));

    // Combine both types of schemas
    const allSchemas = [...defaultSchemas, ...activeCustomSchemas];

    res.status(200).send({
      success: true,
      data: allSchemas,
      counts: {
        default: defaultSchemas.length,
        custom: activeCustomSchemas.length,
        total: allSchemas.length,
      },
    });
  } catch (error) {
    console.error("Error loading schemas:", error);
    res.status(500).send({
      success: false,
      error: {
        code: "SCHEMA_LOADING_ERROR",
        message: "Failed to load schemas",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
}

export async function getJsonSchemaById(req: Request, res: Response) {
  try {
    const { schemaId } = req.params;

    console.log(`[getJsonSchemaById] Looking for schema: ${schemaId}`);
    console.log(`[getJsonSchemaById] __dirname: ${__dirname}`);
    console.log(
      `[getJsonSchemaById] customSchemasPath: ${config.schemas.customSchemasPath}`
    );

    // List available files in schemas directory for debugging
    const builtInSchemasDir =
      config.schemas.builtInSchemasPath ||
      path.join(__dirname, "..", "schemas");
    console.log(
      `[getJsonSchemaById] Built-in schemas directory: ${builtInSchemasDir}`
    );
    try {
      if (fs.existsSync(builtInSchemasDir)) {
        const files = fs.readdirSync(builtInSchemasDir);
        console.log(`[getJsonSchemaById] Available built-in schemas:`, files);
      } else {
        console.log(
          `[getJsonSchemaById] Built-in schemas directory does not exist`
        );
      }
    } catch (error) {
      console.log(
        `[getJsonSchemaById] Error reading built-in schemas directory:`,
        error
      );
    }

    // First, try to load from built-in schemas directory (where default schemas are stored)
    const builtInSchemaPath = path.join(builtInSchemasDir, schemaId);
    console.log(
      `[getJsonSchemaById] Checking built-in path: ${builtInSchemaPath}`
    );

    if (fs.existsSync(builtInSchemaPath)) {
      console.log(`[getJsonSchemaById] Found schema at built-in path`);
      const schemaContent = fs.readFileSync(builtInSchemaPath, "utf8");
      const jsonSchema = JSON.parse(schemaContent);

      res.status(200).send({
        success: true,
        data: jsonSchema,
      });
      return;
    }

    // Then, try to load from custom schemas directory
    const customSchemaPath = path.join(
      config.schemas.customSchemasPath,
      schemaId
    );
    console.log(
      `[getJsonSchemaById] Checking custom path: ${customSchemaPath}`
    );

    if (fs.existsSync(customSchemaPath)) {
      console.log(`[getJsonSchemaById] Found schema at custom path`);
      const schemaContent = fs.readFileSync(customSchemaPath, "utf8");
      const jsonSchema = JSON.parse(schemaContent);

      res.status(200).send({
        success: true,
        data: jsonSchema,
      });
      return;
    }

    // Try to find it in custom schemas (if stored in database/service)
    const customSchema = await schemaStorageService.loadSchema(schemaId);
    if (customSchema) {
      // If it's already a JSON schema format, return it directly
      if ((customSchema as any).$id || (customSchema as any).$schema) {
        res.status(200).send({
          success: true,
          data: customSchema,
        });
        return;
      }

      // Otherwise, convert custom schema to JSON Schema format
      const { convertToJsonSchema } = await import("../utils/said.utils");
      const jsonSchema = convertToJsonSchema(customSchema);

      res.status(200).send({
        success: true,
        data: jsonSchema,
      });
      return;
    }

    // Schema not found
    res.status(404).send({
      success: false,
      error: {
        code: "SCHEMA_NOT_FOUND",
        message: `Schema with ID ${schemaId} not found`,
      },
    });
  } catch (error) {
    console.error("Error loading schema:", error);
    res.status(500).send({
      success: false,
      error: {
        code: "SCHEMA_LOADING_ERROR",
        message: "Failed to load schema",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
}
