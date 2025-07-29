import { NextFunction, Request, Response } from "express";
import { Operation, Saider, Serder, SignifyClient } from "signify-ts";
import { ACDC_SCHEMAS_ID, ISSUER_NAME, LE_SCHEMA_SAID } from "../consts";
import { getRegistry, OP_TIMEOUT, waitAndGetDoneOp } from "../utils/utils";
import { QviCredential } from "../utils/utils.types";
import { SchemaStorageService } from "../services/schema-storage.service";
import { RegistryService } from "../services/registry.service";
import { validateSchemaSaid, isSaidified } from "../utils/said.utils";
import { config } from "../config";

export const UNKNOW_SCHEMA_ID = "Unknow Schema ID: ";
export const CREDENTIAL_NOT_FOUND = "Not found credential with ID: ";
export const CREDENTIAL_REVOKED_ALREADY =
  "The credential has been revoked already";

// Initialize schema storage service
const schemaStorageService = new SchemaStorageService({
  schemasPath: config.schemas.customSchemasPath,
  enableValidation: config.schemas.validationStrict,
  backupOnUpdate: config.schemas.backupOnUpdate,
});

/**
 * Check if a schema ID is valid (either default or custom)
 */
async function isValidSchemaId(schemaSaid: string): Promise<boolean> {
  // Check if it's a default schema
  if (ACDC_SCHEMAS_ID.some((schemaId) => schemaId === schemaSaid)) {
    return true;
  }

  // Check if it's a custom schema
  const customSchema = await schemaStorageService.loadSchema(schemaSaid);
  return customSchema !== null && customSchema.metadata.isActive;
}

/**
 * Validate credential data against schema (for custom schemas)
 */
async function validateCredentialData(
  schemaSaid: string,
  credentialData: any
): Promise<{ isValid: boolean; errors: string[] }> {
  // For default schemas, skip validation (handled by existing logic)
  if (ACDC_SCHEMAS_ID.some((schemaId) => schemaId === schemaSaid)) {
    return { isValid: true, errors: [] };
  }

  // For custom schemas, validate against schema definition
  const customSchema = await schemaStorageService.loadSchema(schemaSaid);
  if (!customSchema) {
    return { isValid: false, errors: ["Schema not found"] };
  }

  const errors: string[] = [];

  // Validate required fields
  for (const field of customSchema.fields) {
    if (
      field.required &&
      (credentialData[field.name] === undefined ||
        credentialData[field.name] === null ||
        credentialData[field.name] === "")
    ) {
      errors.push(
        `Required field '${field.displayName || field.name}' is missing`
      );
    }

    // Basic type validation
    if (
      credentialData[field.name] !== undefined &&
      credentialData[field.name] !== null
    ) {
      const value = credentialData[field.name];
      switch (field.type) {
        case "number":
          if (isNaN(Number(value))) {
            errors.push(
              `Field '${field.displayName || field.name}' must be a number`
            );
          }
          break;
        case "boolean":
          if (
            typeof value !== "boolean" &&
            value !== "true" &&
            value !== "false"
          ) {
            errors.push(
              `Field '${field.displayName || field.name}' must be a boolean`
            );
          }
          break;
        case "email":
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            errors.push(
              `Field '${
                field.displayName || field.name
              }' must be a valid email address`
            );
          }
          break;
        case "url":
          try {
            new URL(value);
          } catch {
            errors.push(
              `Field '${field.displayName || field.name}' must be a valid URL`
            );
          }
          break;
        case "date":
          if (isNaN(Date.parse(value))) {
            errors.push(
              `Field '${field.displayName || field.name}' must be a valid date`
            );
          }
          break;
      }

      // Additional validation rules
      if (field.validation) {
        for (const rule of field.validation) {
          switch (rule.type) {
            case "minLength":
              if (
                typeof value === "string" &&
                value.length < Number(rule.value)
              ) {
                errors.push(
                  rule.message ||
                    `Field '${
                      field.displayName || field.name
                    }' must be at least ${rule.value} characters long`
                );
              }
              break;
            case "maxLength":
              if (
                typeof value === "string" &&
                value.length > Number(rule.value)
              ) {
                errors.push(
                  rule.message ||
                    `Field '${
                      field.displayName || field.name
                    }' must be no more than ${rule.value} characters long`
                );
              }
              break;
            case "pattern":
              if (
                typeof value === "string" &&
                !new RegExp(rule.value as string).test(value)
              ) {
                errors.push(
                  rule.message ||
                    `Field '${
                      field.displayName || field.name
                    }' does not match required pattern`
                );
              }
              break;
            case "min":
              if (typeof value === "number" && value < Number(rule.value)) {
                errors.push(
                  rule.message ||
                    `Field '${
                      field.displayName || field.name
                    }' must be at least ${rule.value}`
                );
              }
              break;
            case "max":
              if (typeof value === "number" && value > Number(rule.value)) {
                errors.push(
                  rule.message ||
                    `Field '${
                      field.displayName || field.name
                    }' must be no more than ${rule.value}`
                );
              }
              break;
          }
        }
      }
    }
  }

  return { isValid: errors.length === 0, errors };
}

export async function issueAcdcCredential(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const client: SignifyClient = req.app.get("signifyClient");
  const qviCredentialId = req.app.get("qviCredentialId");

  const { schemaSaid, aid, attribute } = req.body;

  // Check if schema ID is valid (either default or custom)
  const isValid = await isValidSchemaId(schemaSaid);
  if (!isValid) {
    res.status(409).send({
      success: false,
      data: `${UNKNOW_SCHEMA_ID}${schemaSaid}`,
    });
    return;
  }

  // For default schemas, check if they are loaded in KERI
  if (ACDC_SCHEMAS_ID.some((schemaId) => schemaId === schemaSaid)) {
    try {
      // Try to get the schema from KERI to verify it's loaded
      await client.schemas().get(schemaSaid);
    } catch (error) {
      console.error(`Schema ${schemaSaid} not loaded in KERI:`, error);
      res.status(400).send({
        success: false,
        error: {
          code: "SCHEMA_NOT_LOADED",
          message: `Credential schema ${schemaSaid} not found. It must be loaded with data oobi before issuing credentials.`,
          details:
            "The schema exists but is not loaded in the KERI system. Please restart the server to reload schemas.",
        },
      });
      return;
    }
  }

  // For SAID-based schemas, validate the SAID format
  const isDefaultSchema = ACDC_SCHEMAS_ID.some(
    (schemaId) => schemaId === schemaSaid
  );
  if (!isDefaultSchema) {
    // This is a custom schema, check if it's properly SAIDified
    const customSchema = await schemaStorageService.loadSchema(schemaSaid);
    if (customSchema) {
      // Convert custom schema to JSON Schema and validate SAID
      const { convertToJsonSchema } = await import("../utils/said.utils");
      const jsonSchema = convertToJsonSchema(customSchema);

      if (!isSaidified(jsonSchema) || !validateSchemaSaid(jsonSchema)) {
        res.status(400).send({
          success: false,
          error: {
            code: "INVALID_SCHEMA_SAID",
            message:
              "Schema SAID is invalid or missing. Please saidify the schema first.",
          },
        });
        return;
      }
    }
  }

  // Validate credential data against schema (especially for custom schemas)
  const validation = await validateCredentialData(schemaSaid, attribute);
  if (!validation.isValid) {
    res.status(400).send({
      success: false,
      error: {
        code: "CREDENTIAL_VALIDATION_FAILED",
        message: "Credential data validation failed",
        details: validation.errors,
      },
    });
    return;
  }

  // Get or create registry for the schema
  const registryService = new RegistryService(client);
  let keriRegistryRegk: string;

  if (isDefaultSchema) {
    // Use existing registry for default schemas
    keriRegistryRegk = await getRegistry(client, ISSUER_NAME);
  } else {
    // Get or create registry for custom schema
    keriRegistryRegk = await registryService.getOrCreateRegistryForSchema(
      schemaSaid,
      ISSUER_NAME
    );
  }

  const holderAid = await client.identifiers().get(ISSUER_NAME);

  let issueParams: any;
  let grantParams: any;

  // Check if this is a custom schema
  const isCustomSchema = !ACDC_SCHEMAS_ID.some(
    (schemaId) => schemaId === schemaSaid
  );

  if (schemaSaid === LE_SCHEMA_SAID) {
    const qviCredential: QviCredential = await client
      .credentials()
      .get(qviCredentialId);

    issueParams = {
      ri: keriRegistryRegk,
      s: LE_SCHEMA_SAID,
      a: {
        i: aid,
        ...attribute,
      },
      r: Saider.saidify({
        d: "",
        usageDisclaimer: {
          l: "Usage of a valid, unexpired, and non-revoked vLEI Credential, as defined in the associated Ecosystem Governance Framework, does not assert that the Legal Entity is trustworthy, honest, reputable in its business dealings, safe to do business with, or compliant with any laws or that an implied or expressly intended purpose will be fulfilled.",
        },
        issuanceDisclaimer: {
          l: "All information in a valid, unexpired, and non-revoked vLEI Credential, as defined in the associated Ecosystem Governance Framework, is accurate as of the date the validation process was complete. The vLEI Credential has been issued to the legal entity or person named in the vLEI Credential as the subject; and the qualified vLEI Issuer exercised reasonable care to perform the validation process set forth in the vLEI Ecosystem Governance Framework.",
        },
      })[1],
      e: Saider.saidify({
        d: "",
        qvi: {
          n: qviCredential.sad.d,
          s: qviCredential.sad.s,
        },
      })[1],
    };

    grantParams = {
      senderName: holderAid.name,
      recipient: aid,
      ancAttachment: true,
    };
  } else {
    // For both default and custom schemas, use the same structure
    // Custom schemas use their ID as the schema SAID
    issueParams = {
      ri: keriRegistryRegk,
      s: schemaSaid,
      a: {
        i: aid,
        ...attribute,
      },
    };

    // Add metadata for custom schemas
    if (isCustomSchema) {
      const customSchema = await schemaStorageService.loadSchema(schemaSaid);
      if (customSchema) {
        issueParams.a = {
          i: aid,
          ...attribute,
          // Add schema metadata to the credential
          _schemaName: customSchema.name,
          _schemaVersion: customSchema.version,
          _issuedAt: new Date().toISOString(),
        };
      }
    }

    grantParams = {
      senderName: ISSUER_NAME,
      recipient: aid,
    };
  }

  const issuerName =
    schemaSaid === LE_SCHEMA_SAID ? holderAid.name : ISSUER_NAME;
  const result = await client.credentials().issue(issuerName, issueParams);
  await waitAndGetDoneOp(client, result.op, OP_TIMEOUT);

  const credential = await client.credentials().get(result.acdc.ked.d);
  const datetime = new Date().toISOString().replace("Z", "000+00:00");
  const [grant, gsigs, gend] = await client.ipex().grant({
    ...grantParams,
    acdc: new Serder(credential.sad),
    anc: new Serder(credential.anc),
    iss: new Serder(credential.iss),
    ancAttachment: credential.ancatc?.[0],
    datetime,
  });

  await client
    .ipex()
    .submitGrant(grantParams.senderName, grant, gsigs, gend, [aid]);

  res.status(200).send({
    success: true,
    data: "Credential offered",
  });
}

export async function requestDisclosure(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const client: SignifyClient = req.app.get("signifyClient");
  const { schemaSaid, aid, attributes } = req.body;

  const [apply, sigs] = await client.ipex().apply({
    senderName: ISSUER_NAME,
    recipient: aid,
    schemaSaid,
    attributes,
  });
  await client.ipex().submitApply(ISSUER_NAME, apply, sigs, [aid]);

  res.status(200).send({
    success: true,
    data: "Apply schema successfully",
  });
}

export async function contactCredentials(
  req: Request,
  res: Response
): Promise<void> {
  const client: SignifyClient = req.app.get("signifyClient");
  const { contactId } = req.query;

  const issuer = await client.identifiers().get(ISSUER_NAME);

  const data = await client.credentials().list({
    filter: {
      "-i": issuer.prefix,
      "-a-i": contactId as string,
    },
  });

  res.status(200).send({
    success: true,
    data,
  });
}

export async function revokeCredential(
  req: Request,
  res: Response
): Promise<void> {
  const client: SignifyClient = req.app.get("signifyClient");
  const { credentialId, holder } = req.body;

  // Get the credential first
  let credential = await client
    .credentials()
    .get(credentialId)
    .catch((error) => {
      const status = error.message.split(" - ")[1];
      if (/404/gi.test(status)) {
        res.status(404).send({
          success: false,
          data: `${CREDENTIAL_NOT_FOUND} ${credentialId}`,
        });
      } else {
        throw error;
      }
    });

  // Handle already revoked credential
  if (credential.status.s === "1") {
    res.status(409).send({
      success: false,
      data: CREDENTIAL_REVOKED_ALREADY,
    });
    return;
  }

  // Proceed with revocation
  await client.credentials().revoke(ISSUER_NAME, credentialId);

  while (credential.status.s !== "1") {
    credential = await client.credentials().get(credentialId);
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  const datetime = new Date().toISOString().replace("Z", "000+00:00");
  const [grant, gsigs, gend] = await client.ipex().grant({
    senderName: ISSUER_NAME,
    recipient: holder,
    acdc: new Serder(credential.sad),
    anc: new Serder(credential.anc),
    iss: new Serder(credential.iss),
    datetime,
    ancAttachment: credential.ancatc?.[0],
  });
  const submitGrantOp: Operation = await client
    .ipex()
    .submitGrant(ISSUER_NAME, grant, gsigs, gend, [holder]);
  await waitAndGetDoneOp(client, submitGrantOp, OP_TIMEOUT);

  res.status(200).send({
    success: true,
    data: "Revoke credential successfully",
  });
}
