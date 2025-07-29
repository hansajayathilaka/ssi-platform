import { Request, Response } from "express";
import { ACDC_SCHEMAS } from "../consts";
import { SchemaStorageService } from "../services/schema-storage.service";
import { config } from "../config";

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
