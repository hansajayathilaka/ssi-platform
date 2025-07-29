/**
 * Schema Utilities
 *
 * This module provides utility functions for working with custom schemas,
 * including schema creation helpers and ID generation.
 */

import {
  CustomSchema,
  SchemaField,
  SchemaMetadata,
} from "../types/schema.types";
import { randomBytes } from "crypto";

/**
 * Generate a unique schema ID
 */
export function generateSchemaId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = randomBytes(8).toString("hex");
  return `custom-schema-${timestamp}-${randomPart}`;
}

/**
 * Create a new custom schema with default values
 */
export function createCustomSchema(
  name: string,
  version: string,
  fields: SchemaField[],
  options: {
    description?: string;
    metadata?: Partial<SchemaMetadata>;
    id?: string;
  } = {}
): CustomSchema {
  const now = new Date();

  return {
    id: options.id || generateSchemaId(),
    name,
    version,
    description: options.description,
    fields,
    metadata: {
      author: options.metadata?.author,
      organization: options.metadata?.organization,
      category: options.metadata?.category || "custom",
      tags: options.metadata?.tags || [],
      isActive: options.metadata?.isActive ?? true,
      isPublic: options.metadata?.isPublic ?? false,
      ...options.metadata,
    },
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Create a basic schema field
 */
export function createSchemaField(
  name: string,
  type: SchemaField["type"],
  displayName: string,
  options: {
    required?: boolean;
    description?: string;
    defaultValue?: any;
    validation?: SchemaField["validation"];
  } = {}
): SchemaField {
  return {
    name,
    type,
    required: options.required ?? false,
    displayName,
    description: options.description,
    defaultValue: options.defaultValue,
    validation: options.validation,
  };
}

/**
 * Validate schema field name format
 */
export function isValidFieldName(name: string): boolean {
  // Field names should be valid JavaScript identifiers
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name);
}

/**
 * Sanitize field name to make it valid
 */
export function sanitizeFieldName(name: string): string {
  // Remove invalid characters and ensure it starts with a letter or underscore
  let sanitized = name.replace(/[^a-zA-Z0-9_$]/g, "_");

  // Ensure it starts with a letter or underscore
  if (!/^[a-zA-Z_$]/.test(sanitized)) {
    sanitized = "_" + sanitized;
  }

  return sanitized;
}

/**
 * Convert schema to JSON Schema format for validation
 */
export function convertToJsonSchema(schema: CustomSchema): any {
  const properties: any = {};
  const required: string[] = [];

  schema.fields.forEach((field) => {
    properties[field.name] = {
      type: getJsonSchemaType(field.type),
      title: field.displayName,
      description: field.description,
    };

    // Add format for specific types
    if (field.type === "email") {
      properties[field.name].format = "email";
    } else if (field.type === "url") {
      properties[field.name].format = "uri";
    } else if (field.type === "date") {
      properties[field.name].format = "date-time";
    }

    // Add validation rules
    if (field.validation) {
      field.validation.forEach((rule) => {
        switch (rule.type) {
          case "minLength":
            properties[field.name].minLength = rule.value;
            break;
          case "maxLength":
            properties[field.name].maxLength = rule.value;
            break;
          case "pattern":
            properties[field.name].pattern = rule.value;
            break;
          case "min":
            properties[field.name].minimum = rule.value;
            break;
          case "max":
            properties[field.name].maximum = rule.value;
            break;
        }
      });
    }

    // Add default value
    if (field.defaultValue !== undefined) {
      properties[field.name].default = field.defaultValue;
    }

    // Add to required array if field is required
    if (field.required) {
      required.push(field.name);
    }
  });

  return {
    $id: schema.id,
    $schema: "http://json-schema.org/draft-07/schema#",
    title: schema.name,
    description: schema.description,
    type: "object",
    version: schema.version,
    properties,
    required,
    additionalProperties: false,
  };
}

/**
 * Convert custom field type to JSON Schema type
 */
function getJsonSchemaType(fieldType: SchemaField["type"]): string {
  switch (fieldType) {
    case "string":
    case "email":
    case "url":
    case "date":
      return "string";
    case "number":
      return "number";
    case "boolean":
      return "boolean";
    default:
      return "string";
  }
}

/**
 * Create a sample schema for testing
 */
export function createSampleSchema(): CustomSchema {
  const fields: SchemaField[] = [
    createSchemaField("firstName", "string", "First Name", {
      required: true,
      description: "The person's first name",
      validation: [
        { type: "minLength", value: 1, message: "First name is required" },
        {
          type: "maxLength",
          value: 50,
          message: "First name must be less than 50 characters",
        },
      ],
    }),
    createSchemaField("lastName", "string", "Last Name", {
      required: true,
      description: "The person's last name",
      validation: [
        { type: "minLength", value: 1, message: "Last name is required" },
        {
          type: "maxLength",
          value: 50,
          message: "Last name must be less than 50 characters",
        },
      ],
    }),
    createSchemaField("email", "email", "Email Address", {
      required: true,
      description: "The person's email address",
    }),
    createSchemaField("birthDate", "date", "Birth Date", {
      required: false,
      description: "The person's date of birth",
    }),
    createSchemaField("isActive", "boolean", "Active Status", {
      required: false,
      description: "Whether the person is currently active",
      defaultValue: true,
    }),
  ];

  return createCustomSchema("Sample Person Credential", "1.0.0", fields, {
    description: "A sample credential schema for person information",
    metadata: {
      author: "System",
      category: "sample",
      tags: ["person", "identity", "sample"],
      isActive: true,
      isPublic: true,
    },
  });
}
