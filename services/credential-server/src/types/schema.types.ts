/**
 * Custom Schema Types
 *
 * This module defines the TypeScript interfaces for custom credential schemas
 * as specified in the credential issuance customization feature.
 */

export interface ValidationRule {
  type: "minLength" | "maxLength" | "pattern" | "min" | "max" | "required";
  value: string | number | boolean;
  message?: string;
}

export interface SchemaField {
  name: string;
  type: "string" | "number" | "boolean" | "date" | "email" | "url";
  required: boolean;
  validation?: ValidationRule[];
  displayName: string;
  description?: string;
  defaultValue?: any;
}

export interface SchemaMetadata {
  author?: string;
  organization?: string;
  category?: string;
  tags?: string[];
  isActive: boolean;
  isPublic: boolean;
}

export interface CustomSchema {
  id: string;
  name: string;
  version: string;
  description?: string;
  fields: SchemaField[];
  metadata: SchemaMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface SchemaValidationError {
  field: string;
  message: string;
  code: string;
}

export interface SchemaValidationResult {
  isValid: boolean;
  errors: SchemaValidationError[];
}

export interface SchemaStorageOptions {
  schemasPath: string;
  enableValidation: boolean;
  backupOnUpdate: boolean;
}

/**
 * Enhanced Schema Registry that extends existing ACDC_SCHEMAS structure
 */
export interface EnhancedSchemaRegistry {
  defaultSchemas: DefaultSchemaDefinition[];
  customSchemas: CustomSchema[];
  schemaVersions: Map<string, SchemaVersion[]>;
}

export interface DefaultSchemaDefinition {
  id: string;
  name: string;
  type: "default";
  schema: any; // JSON Schema
  isActive: boolean;
}

export interface SchemaVersion {
  version: string;
  schema: CustomSchema;
  createdAt: Date;
  isDeprecated: boolean;
}
