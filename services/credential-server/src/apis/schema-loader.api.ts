/**
 * Schema Loader API
 *
 * Endpoints for loading and reloading schemas into the KERI system
 */

import { Request, Response } from "express";
import { SignifyClient } from "signify-ts";
import { config } from "../config";
import { ACDC_SCHEMAS_ID } from "../consts";
import { resolveOobi } from "../utils/utils";

/**
 * POST /schemas/reload - Reload all schemas into KERI
 */
export async function reloadSchemas(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const client: SignifyClient = req.app.get("signifyClient");

    if (!client) {
      res.status(500).json({
        success: false,
        error: {
          code: "CLIENT_NOT_AVAILABLE",
          message: "Signify client not available",
        },
      });
      return;
    }

    console.log("Reloading schemas via OOBI...");
    const results: Array<{
      schemaId: string;
      success: boolean;
      error?: string;
    }> = [];

    for (const schemaId of ACDC_SCHEMAS_ID) {
      try {
        console.log(
          `Loading schema: ${schemaId} from ${config.oobiEndpoint}/oobi/${schemaId}`
        );
        await resolveOobi(client, `${config.oobiEndpoint}/oobi/${schemaId}`);
        console.log(`✓ Successfully loaded schema: ${schemaId}`);
        results.push({ schemaId, success: true });
      } catch (error) {
        console.error(`✗ Failed to load schema: ${schemaId}`, error);
        results.push({
          schemaId,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    console.log(
      `Schema reload complete: ${successful.length} successful, ${failed.length} failed`
    );

    res.status(200).json({
      success: true,
      data: {
        totalSchemas: ACDC_SCHEMAS_ID.length,
        successful: successful.length,
        failed: failed.length,
        results: results,
      },
      message: `Schema reload completed. ${successful.length}/${ACDC_SCHEMAS_ID.length} schemas loaded successfully.`,
    });
  } catch (error) {
    console.error("Error reloading schemas:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "SCHEMA_RELOAD_ERROR",
        message: "Failed to reload schemas",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
}

/**
 * GET /schemas/status - Check schema loading status
 */
export async function getSchemaStatus(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const client: SignifyClient = req.app.get("signifyClient");

    if (!client) {
      res.status(500).json({
        success: false,
        error: {
          code: "CLIENT_NOT_AVAILABLE",
          message: "Signify client not available",
        },
      });
      return;
    }

    const results: Array<{
      schemaId: string;
      loaded: boolean;
      error?: string;
    }> = [];

    for (const schemaId of ACDC_SCHEMAS_ID) {
      try {
        await client.schemas().get(schemaId);
        results.push({ schemaId, loaded: true });
      } catch (error) {
        results.push({
          schemaId,
          loaded: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const loaded = results.filter((r) => r.loaded);
    const notLoaded = results.filter((r) => !r.loaded);

    res.status(200).json({
      success: true,
      data: {
        totalSchemas: ACDC_SCHEMAS_ID.length,
        loaded: loaded.length,
        notLoaded: notLoaded.length,
        schemas: results,
      },
    });
  } catch (error) {
    console.error("Error checking schema status:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "SCHEMA_STATUS_ERROR",
        message: "Failed to check schema status",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
}
