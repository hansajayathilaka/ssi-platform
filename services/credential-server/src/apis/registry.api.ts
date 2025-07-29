/**
 * Registry Management API
 *
 * REST endpoints for managing credential registries for custom schemas.
 * Provides operations for creating and managing registries as required by KERI.
 */

import { Request, Response } from "express";
import { SignifyClient } from "signify-ts";
import {
  RegistryService,
  RegistryCreationOptions,
} from "../services/registry.service";

/**
 * POST /registries - Create a new credential registry
 */
export async function createRegistry(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const client: SignifyClient = req.app.get("signifyClient");
    const registryService = new RegistryService(client);

    const { name, registryName, schemaId } =
      req.body as RegistryCreationOptions;

    // Basic request validation
    if (!name || typeof name !== "string") {
      res.status(400).json({
        success: false,
        error: {
          code: "INVALID_NAME",
          message: "Registry name is required and must be a string",
        },
      });
      return;
    }

    if (!registryName || typeof registryName !== "string") {
      res.status(400).json({
        success: false,
        error: {
          code: "INVALID_REGISTRY_NAME",
          message: "Registry display name is required and must be a string",
        },
      });
      return;
    }

    // Create the registry
    const registryInfo = await registryService.createRegistry({
      name,
      registryName,
      schemaId,
    });

    res.status(201).json({
      success: true,
      data: registryInfo,
      message: "Registry created successfully",
    });
  } catch (error) {
    console.error("Error creating registry:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "REGISTRY_CREATION_ERROR",
        message: "Failed to create registry",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
}

/**
 * GET /registries - List all registries
 */
export async function listRegistries(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const client: SignifyClient = req.app.get("signifyClient");
    const registryService = new RegistryService(client);

    const registries = await registryService.listRegistries();

    res.status(200).json({
      success: true,
      data: registries,
      count: registries.length,
    });
  } catch (error) {
    console.error("Error listing registries:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "REGISTRY_LIST_ERROR",
        message: "Failed to retrieve registries",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
}

/**
 * GET /registries/:id - Get a specific registry by ID
 */
export async function getRegistryById(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const client: SignifyClient = req.app.get("signifyClient");
    const registryService = new RegistryService(client);

    const { id } = req.params;

    if (!id || typeof id !== "string") {
      res.status(400).json({
        success: false,
        error: {
          code: "INVALID_REGISTRY_ID",
          message: "Registry ID is required and must be a string",
        },
      });
      return;
    }

    const registry = await registryService.getRegistry(id);

    if (!registry) {
      res.status(404).json({
        success: false,
        error: {
          code: "REGISTRY_NOT_FOUND",
          message: `Registry with ID '${id}' not found`,
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: registry,
    });
  } catch (error) {
    console.error("Error retrieving registry:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "REGISTRY_RETRIEVAL_ERROR",
        message: "Failed to retrieve registry",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
}

/**
 * DELETE /registries/:id - Delete a registry
 */
export async function deleteRegistry(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const client: SignifyClient = req.app.get("signifyClient");
    const registryService = new RegistryService(client);

    const { id } = req.params;

    if (!id || typeof id !== "string") {
      res.status(400).json({
        success: false,
        error: {
          code: "INVALID_REGISTRY_ID",
          message: "Registry ID is required and must be a string",
        },
      });
      return;
    }

    // Check if registry exists
    const existingRegistry = await registryService.getRegistry(id);
    if (!existingRegistry) {
      res.status(404).json({
        success: false,
        error: {
          code: "REGISTRY_NOT_FOUND",
          message: `Registry with ID '${id}' not found`,
        },
      });
      return;
    }

    // Delete the registry
    const deleted = await registryService.deleteRegistry(id);

    if (!deleted) {
      res.status(500).json({
        success: false,
        error: {
          code: "REGISTRY_DELETION_ERROR",
          message: "Failed to delete registry",
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: `Registry '${id}' deleted successfully`,
    });
  } catch (error) {
    console.error("Error deleting registry:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "REGISTRY_DELETION_ERROR",
        message: "Failed to delete registry",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
}

/**
 * POST /registries/for-schema - Get or create a registry for a specific schema
 */
export async function getOrCreateRegistryForSchema(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const client: SignifyClient = req.app.get("signifyClient");
    const registryService = new RegistryService(client);

    const { schemaId, issuerName } = req.body;

    if (!schemaId || typeof schemaId !== "string") {
      res.status(400).json({
        success: false,
        error: {
          code: "INVALID_SCHEMA_ID",
          message: "Schema ID is required and must be a string",
        },
      });
      return;
    }

    if (!issuerName || typeof issuerName !== "string") {
      res.status(400).json({
        success: false,
        error: {
          code: "INVALID_ISSUER_NAME",
          message: "Issuer name is required and must be a string",
        },
      });
      return;
    }

    // Get or create registry for the schema
    const registryId = await registryService.getOrCreateRegistryForSchema(
      schemaId,
      issuerName
    );

    const registryInfo = await registryService.getRegistry(registryId);

    res.status(200).json({
      success: true,
      data: {
        registryId,
        registryInfo,
      },
      message: "Registry retrieved or created successfully",
    });
  } catch (error) {
    console.error("Error getting/creating registry for schema:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "REGISTRY_SCHEMA_ERROR",
        message: "Failed to get or create registry for schema",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
}
