/**
 * ACDC Schema Creation Utilities
 *
 * Utilities for creating properly formatted ACDC (Attributed Credential Data Container)
 * schemas that are compatible with KERIA agents.
 */

import { saidifySchema, JsonSchema } from "./said.utils";

export interface AcdcSchemaConfig {
  title: string;
  description: string;
  credentialType: string;
  version?: string;
  attributes: Record<string, AttributeConfig>;
}

export interface AttributeConfig {
  description: string;
  type: string;
  format?: string;
  required: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  minimum?: number;
  maximum?: number;
}

/**
 * Create a properly formatted ACDC schema template
 */
export function createAcdcSchema(config: AcdcSchemaConfig): JsonSchema {
  const {
    title,
    description,
    credentialType,
    version = "1.0.0",
    attributes = {},
  } = config;

  // Create the attributes block properties
  const attributesProperties: Record<string, any> = {
    d: {
      description: "Attributes block SAID",
      type: "string",
    },
    i: {
      description: "Issuee AID",
      type: "string",
    },
    dt: {
      description: "Issuance date time",
      type: "string",
      format: "date-time",
    },
  };

  const requiredAttributes = ["i", "dt"];

  // Add custom attributes
  Object.entries(attributes).forEach(([name, config]) => {
    const property: any = {
      description: config.description,
      type: config.type,
    };

    // Add format if specified
    if (config.format) {
      property.format = config.format;
    }

    // Add validation constraints
    if (config.minLength !== undefined) {
      property.minLength = config.minLength;
    }
    if (config.maxLength !== undefined) {
      property.maxLength = config.maxLength;
    }
    if (config.pattern) {
      property.pattern = config.pattern;
    }
    if (config.minimum !== undefined) {
      property.minimum = config.minimum;
    }
    if (config.maximum !== undefined) {
      property.maximum = config.maximum;
    }

    attributesProperties[name] = property;

    if (config.required) {
      requiredAttributes.push(name);
    }
  });

  // Create the main schema structure following ACDC format
  const schema: JsonSchema = {
    $id: "", // Will be filled by SAIDification
    $schema: "http://json-schema.org/draft-07/schema#",
    title,
    description,
    type: "object",
    credentialType,
    version,
    properties: {
      v: {
        description: "Version",
        type: "string",
      },
      d: {
        description: "Credential SAID",
        type: "string",
      },
      u: {
        description: "One time use nonce",
        type: "string",
      },
      i: {
        description: "Issuee AID",
        type: "string",
      },
      ri: {
        description: "Credential status registry",
        type: "string",
      },
      s: {
        description: "Schema SAID",
        type: "string",
      },
      a: {
        oneOf: [
          {
            description: "Attributes block SAID",
            type: "string",
          },
          {
            $id: "", // Will be filled by SAIDification for attributes block
            description: "Attributes block",
            type: "object",
            properties: attributesProperties,
            additionalProperties: false,
            required: requiredAttributes,
          },
        ],
      },
    },
    additionalProperties: false,
    required: ["i", "ri", "s", "d", "a"],
  };

  return schema;
}

/**
 * Create and SAIDify an ACDC schema
 */
export function createAndSaidifyAcdcSchema(
  config: AcdcSchemaConfig
): JsonSchema {
  // Create the schema template
  const schema = createAcdcSchema(config);

  // SAIDify the schema (this will handle both the main schema and attributes block)
  const saidifiedSchema = saidifySchema(schema);

  return saidifiedSchema;
}

/**
 * Convert custom schema format to ACDC format
 */
export function convertCustomSchemaToAcdc(customSchema: any): JsonSchema {
  const attributes: Record<string, AttributeConfig> = {};

  // Convert custom fields to ACDC attributes
  if (customSchema.fields) {
    customSchema.fields.forEach((field: any) => {
      attributes[field.name] = {
        description:
          field.description || field.displayName || `${field.name} field`,
        type: field.type === "email" ? "string" : field.type,
        format: field.type === "email" ? "email" : field.format,
        required: field.required || false,
      };

      // Add validation rules if present
      if (field.validation) {
        field.validation.forEach((rule: any) => {
          switch (rule.type) {
            case "minLength":
              attributes[field.name].minLength = rule.value;
              break;
            case "maxLength":
              attributes[field.name].maxLength = rule.value;
              break;
            case "pattern":
              attributes[field.name].pattern = rule.value;
              break;
            case "min":
              attributes[field.name].minimum = rule.value;
              break;
            case "max":
              attributes[field.name].maximum = rule.value;
              break;
          }
        });
      }
    });
  }

  const config: AcdcSchemaConfig = {
    title: customSchema.name || customSchema.title,
    description: customSchema.description,
    credentialType:
      customSchema.credentialType || `${customSchema.name}Credential`,
    version: customSchema.version || "1.0.0",
    attributes,
  };

  return createAndSaidifyAcdcSchema(config);
}
