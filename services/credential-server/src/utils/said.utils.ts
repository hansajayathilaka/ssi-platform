/**
 * SAID (Self-Addressing Identifier) Utilities
 *
 * This module provides utilities for computing SAIDs (Self-Addressing Identifiers)
 * for JSON schemas according to KERI specifications using the official saidify library.
 */

import { saidify } from "saidify";

/**
 * JSON Schema structure for SAID computation
 */
export interface JsonSchema {
  $schema: string;
  $id: string;
  title?: string;
  type: string;
  properties?: Record<string, any>;
  required?: string[];
  [key: string]: any;
}

/**
 * SAID computation options (using saidify library defaults)
 */
export interface SaidOptions {
  // The saidify library uses Blake3-256 by default
  // Additional options can be added here if the library supports them
}

/**
 * Compute SAID for a JSON schema using the official saidify library
 *
 * @param schema - The JSON schema object (with $id placeholder)
 * @param options - SAID computation options (currently unused, for future compatibility)
 * @returns The computed SAID string
 */
export function computeSaid(
  schema: JsonSchema,
  options: SaidOptions = {}
): string {
  // Create a copy of the schema with empty $id for SAID computation
  const schemaForSaid = { ...schema, $id: "" };

  // Use the saidify library to compute the SAID
  // The library defaults to Blake3-256 and JSON serialization
  const [said, sad] = saidify(schemaForSaid, "$id");

  return said;
}

/**
 * SAIDify a JSON schema by computing and inserting the SAID into $id field
 * Handles ACDC schemas with nested attributes blocks
 *
 * @param schema - The JSON schema object with placeholder $id
 * @param options - SAID computation options
 * @returns The schema with computed SAID in $id field
 */
export function saidifySchema(
  schema: JsonSchema,
  options: SaidOptions = {}
): JsonSchema {
  // Create a deep copy of the schema
  const schemaForSaid = JSON.parse(JSON.stringify(schema));

  // First, SAIDify the attributes block if it exists (ACDC format)
  if (schemaForSaid.properties?.a?.oneOf?.[1]) {
    const attributesBlock = schemaForSaid.properties.a.oneOf[1];
    if (attributesBlock.$id !== undefined) {
      // Set empty $id for attributes block SAIDification
      attributesBlock.$id = "";
      const [attrSaid, attrSad] = saidify(attributesBlock, "$id");
      schemaForSaid.properties.a.oneOf[1] = attrSad;
    }
  }

  // Then SAIDify the main schema
  schemaForSaid.$id = "";
  const [mainSaid, mainSad] = saidify(schemaForSaid, "$id");

  return mainSad as JsonSchema;
}

/**
 * Validate that a schema's $id matches its computed SAID
 *
 * @param schema - The JSON schema to validate
 * @param options - SAID computation options
 * @returns True if the $id matches the computed SAID
 */
export function validateSchemaSaid(
  schema: JsonSchema,
  options: SaidOptions = {}
): boolean {
  if (!schema.$id) {
    return false;
  }

  try {
    // Compute the SAID for the schema and compare with existing $id
    const computedSaid = computeSaid(schema, options);
    return computedSaid === schema.$id;
  } catch (error) {
    console.error("Error validating SAID:", error);
    return false;
  }
}

/**
 * Create a JSON Schema Draft 2020-12 compliant schema template
 *
 * @param title - Schema title
 * @param properties - Schema properties definition
 * @param required - Array of required property names
 * @returns JSON Schema template with placeholder $id
 */
export function createJsonSchemaTemplate(
  title: string,
  properties: Record<string, any>,
  required: string[] = []
): JsonSchema {
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "", // Placeholder for SAID
    title,
    type: "object",
    properties: {
      credentialSubject: {
        type: "object",
        properties,
        required,
      },
    },
    required: ["credentialSubject"],
  };
}

/**
 * Convert custom schema format to JSON Schema Draft 2020-12
 *
 * @param customSchema - Custom schema in application format
 * @returns JSON Schema compliant schema
 */
export function convertToJsonSchema(customSchema: any): JsonSchema {
  const properties: Record<string, any> = {};
  const required: string[] = [];

  // Convert custom fields to JSON Schema properties
  for (const field of customSchema.fields || []) {
    const property: any = {
      type: field.type === "email" ? "string" : field.type,
      title: field.displayName,
      description: field.description,
    };

    // Add format for special types
    if (field.type === "email") {
      property.format = "email";
    } else if (field.type === "url") {
      property.format = "uri";
    } else if (field.type === "date") {
      property.format = "date";
    }

    // Add validation constraints
    if (field.validation) {
      for (const rule of field.validation) {
        switch (rule.type) {
          case "minLength":
            property.minLength = rule.value;
            break;
          case "maxLength":
            property.maxLength = rule.value;
            break;
          case "pattern":
            property.pattern = rule.value;
            break;
          case "min":
            property.minimum = rule.value;
            break;
          case "max":
            property.maximum = rule.value;
            break;
        }
      }
    }

    properties[field.name] = property;

    if (field.required) {
      required.push(field.name);
    }
  }

  return createJsonSchemaTemplate(
    customSchema.name || customSchema.title,
    properties,
    required
  );
}

/**
 * CLI-style saidify function for external tools
 *
 * @param schemaJson - JSON string of the schema
 * @param options - SAID computation options
 * @returns JSON string of the saidified schema
 */
export function saidifyJsonString(
  schemaJson: string,
  options: SaidOptions = {}
): string {
  try {
    const schema = JSON.parse(schemaJson) as JsonSchema;

    // Ensure the schema has an empty $id field for saidification
    const schemaForSaid = { ...schema, $id: "" };

    // Use the saidify library
    const [said, sad] = saidify(schemaForSaid, "$id");

    // Return the formatted SAD (Self-Addressed Data)
    return JSON.stringify(sad, null, 2);
  } catch (error) {
    throw new Error(
      `Failed to saidify schema: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Get the SAID from a saidified schema
 *
 * @param schema - The saidified JSON schema
 * @returns The SAID string
 */
export function getSaidFromSchema(schema: JsonSchema): string | null {
  return schema.$id || null;
}

/**
 * Check if a schema is properly saidified
 *
 * @param schema - The JSON schema to check
 * @returns True if the schema has a valid SAID in $id field
 */
export function isSaidified(schema: JsonSchema): boolean {
  return !!(schema.$id && schema.$id.length > 0);
}
