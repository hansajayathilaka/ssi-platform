/**
 * Schema Validation Service
 *
 * This service provides validation functionality for custom schemas,
 * ensuring they meet the required structure and field requirements.
 */

import {
  CustomSchema,
  SchemaField,
  SchemaValidationResult,
  SchemaValidationError,
  ValidationRule,
} from "../types/schema.types";

export class SchemaValidationService {
  /**
   * Validate a complete custom schema
   */
  validateSchema(schema: CustomSchema): SchemaValidationResult {
    const errors: SchemaValidationError[] = [];

    // Validate required schema properties
    this.validateRequiredSchemaFields(schema, errors);

    // Validate schema fields
    this.validateSchemaFields(schema.fields, errors);

    // Validate schema metadata
    this.validateSchemaMetadata(schema, errors);

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate a schema without requiring an ID (for new schemas before SAID generation)
   */
  validateSchemaWithoutId(
    schema: Omit<CustomSchema, "id">
  ): SchemaValidationResult {
    const errors: SchemaValidationError[] = [];

    // Validate required schema properties (excluding ID)
    this.validateRequiredSchemaFieldsWithoutId(schema, errors);

    // Validate schema fields
    this.validateSchemaFields(schema.fields, errors);

    // Validate schema metadata
    this.validateSchemaMetadata(
      { ...schema, id: "temp" } as CustomSchema,
      errors
    );

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate required schema fields
   */
  private validateRequiredSchemaFields(
    schema: CustomSchema,
    errors: SchemaValidationError[]
  ): void {
    // Validate ID
    if (
      !schema.id ||
      typeof schema.id !== "string" ||
      schema.id.trim().length === 0
    ) {
      errors.push({
        field: "id",
        message: "Schema ID is required and must be a non-empty string",
        code: "REQUIRED_FIELD_MISSING",
      });
    }

    // Common validation for both methods
    this.validateCommonSchemaFields(schema, errors);
  }

  /**
   * Validate required schema fields without ID (for new schemas)
   */
  private validateRequiredSchemaFieldsWithoutId(
    schema: Omit<CustomSchema, "id">,
    errors: SchemaValidationError[]
  ): void {
    // Common validation for both methods
    this.validateCommonSchemaFields(schema, errors);
  }

  /**
   * Validate common schema fields (used by both validation methods)
   */
  private validateCommonSchemaFields(
    schema: Omit<CustomSchema, "id"> | CustomSchema,
    errors: SchemaValidationError[]
  ): void {
    // Validate name
    if (
      !schema.name ||
      typeof schema.name !== "string" ||
      schema.name.trim().length === 0
    ) {
      errors.push({
        field: "name",
        message: "Schema name is required and must be a non-empty string",
        code: "REQUIRED_FIELD_MISSING",
      });
    }

    // Validate version
    if (
      !schema.version ||
      typeof schema.version !== "string" ||
      schema.version.trim().length === 0
    ) {
      errors.push({
        field: "version",
        message: "Schema version is required and must be a non-empty string",
        code: "REQUIRED_FIELD_MISSING",
      });
    }

    // Validate version format (basic semver check)
    if (schema.version && !/^\d+\.\d+\.\d+$/.test(schema.version)) {
      errors.push({
        field: "version",
        message:
          "Schema version must follow semantic versioning format (e.g., 1.0.0)",
        code: "INVALID_FORMAT",
      });
    }

    // Validate fields array
    if (!schema.fields || !Array.isArray(schema.fields)) {
      errors.push({
        field: "fields",
        message: "Schema fields must be an array",
        code: "INVALID_TYPE",
      });
    } else if (schema.fields.length === 0) {
      errors.push({
        field: "fields",
        message: "Schema must have at least one field",
        code: "REQUIRED_FIELD_MISSING",
      });
    }

    // Validate metadata
    if (!schema.metadata || typeof schema.metadata !== "object") {
      errors.push({
        field: "metadata",
        message: "Schema metadata is required and must be an object",
        code: "REQUIRED_FIELD_MISSING",
      });
    }

    // Validate timestamps
    if (!schema.createdAt || !(schema.createdAt instanceof Date)) {
      errors.push({
        field: "createdAt",
        message: "Schema createdAt is required and must be a valid Date",
        code: "INVALID_TYPE",
      });
    }

    if (!schema.updatedAt || !(schema.updatedAt instanceof Date)) {
      errors.push({
        field: "updatedAt",
        message: "Schema updatedAt is required and must be a valid Date",
        code: "INVALID_TYPE",
      });
    }
  }

  /**
   * Validate schema fields array
   */
  private validateSchemaFields(
    fields: SchemaField[],
    errors: SchemaValidationError[]
  ): void {
    if (!fields || !Array.isArray(fields)) {
      return; // Already handled in validateRequiredSchemaFields
    }

    const fieldNames = new Set<string>();

    fields.forEach((field, index) => {
      const fieldPrefix = `fields[${index}]`;

      // Validate required field properties
      if (
        !field.name ||
        typeof field.name !== "string" ||
        field.name.trim().length === 0
      ) {
        errors.push({
          field: `${fieldPrefix}.name`,
          message: "Field name is required and must be a non-empty string",
          code: "REQUIRED_FIELD_MISSING",
        });
      }

      // Check for duplicate field names
      if (field.name && fieldNames.has(field.name)) {
        errors.push({
          field: `${fieldPrefix}.name`,
          message: `Duplicate field name: ${field.name}`,
          code: "DUPLICATE_FIELD_NAME",
        });
      } else if (field.name) {
        fieldNames.add(field.name);
      }

      // Validate field type
      const validTypes = [
        "string",
        "number",
        "boolean",
        "date",
        "email",
        "url",
      ];
      if (!field.type || !validTypes.includes(field.type)) {
        errors.push({
          field: `${fieldPrefix}.type`,
          message: `Field type must be one of: ${validTypes.join(", ")}`,
          code: "INVALID_FIELD_TYPE",
        });
      }

      // Validate required flag
      if (typeof field.required !== "boolean") {
        errors.push({
          field: `${fieldPrefix}.required`,
          message: "Field required property must be a boolean",
          code: "INVALID_TYPE",
        });
      }

      // Validate displayName
      if (
        !field.displayName ||
        typeof field.displayName !== "string" ||
        field.displayName.trim().length === 0
      ) {
        errors.push({
          field: `${fieldPrefix}.displayName`,
          message:
            "Field displayName is required and must be a non-empty string",
          code: "REQUIRED_FIELD_MISSING",
        });
      }

      // Validate validation rules if present
      if (field.validation) {
        this.validateFieldValidationRules(
          field.validation,
          `${fieldPrefix}.validation`,
          errors
        );
      }
    });
  }

  /**
   * Validate field validation rules
   */
  private validateFieldValidationRules(
    rules: ValidationRule[],
    fieldPrefix: string,
    errors: SchemaValidationError[]
  ): void {
    if (!Array.isArray(rules)) {
      errors.push({
        field: fieldPrefix,
        message: "Validation rules must be an array",
        code: "INVALID_TYPE",
      });
      return;
    }

    rules.forEach((rule, index) => {
      const rulePrefix = `${fieldPrefix}[${index}]`;

      // Validate rule type
      const validRuleTypes = [
        "minLength",
        "maxLength",
        "pattern",
        "min",
        "max",
        "required",
      ];
      if (!rule.type || !validRuleTypes.includes(rule.type)) {
        errors.push({
          field: `${rulePrefix}.type`,
          message: `Validation rule type must be one of: ${validRuleTypes.join(
            ", "
          )}`,
          code: "INVALID_VALIDATION_RULE_TYPE",
        });
      }

      // Validate rule value
      if (rule.value === undefined || rule.value === null) {
        errors.push({
          field: `${rulePrefix}.value`,
          message: "Validation rule value is required",
          code: "REQUIRED_FIELD_MISSING",
        });
      }
    });
  }

  /**
   * Validate schema metadata
   */
  private validateSchemaMetadata(
    schema: CustomSchema,
    errors: SchemaValidationError[]
  ): void {
    if (!schema.metadata) {
      return; // Already handled in validateRequiredSchemaFields
    }

    const metadata = schema.metadata;

    // Validate isActive flag
    if (typeof metadata.isActive !== "boolean") {
      errors.push({
        field: "metadata.isActive",
        message: "Metadata isActive property must be a boolean",
        code: "INVALID_TYPE",
      });
    }

    // Validate isPublic flag
    if (typeof metadata.isPublic !== "boolean") {
      errors.push({
        field: "metadata.isPublic",
        message: "Metadata isPublic property must be a boolean",
        code: "INVALID_TYPE",
      });
    }

    // Validate tags if present
    if (metadata.tags && !Array.isArray(metadata.tags)) {
      errors.push({
        field: "metadata.tags",
        message: "Metadata tags must be an array of strings",
        code: "INVALID_TYPE",
      });
    } else if (metadata.tags) {
      metadata.tags.forEach((tag, index) => {
        if (typeof tag !== "string") {
          errors.push({
            field: `metadata.tags[${index}]`,
            message: "Each tag must be a string",
            code: "INVALID_TYPE",
          });
        }
      });
    }
  }

  /**
   * Validate credential data against a schema
   */
  validateCredentialData(
    data: Record<string, any>,
    schema: CustomSchema
  ): SchemaValidationResult {
    const errors: SchemaValidationError[] = [];

    // Check required fields
    schema.fields.forEach((field) => {
      if (
        field.required &&
        (data[field.name] === undefined || data[field.name] === null)
      ) {
        errors.push({
          field: field.name,
          message: `Required field '${field.displayName}' is missing`,
          code: "REQUIRED_FIELD_MISSING",
        });
      }

      // Validate field type if value is present
      if (data[field.name] !== undefined && data[field.name] !== null) {
        this.validateFieldValue(data[field.name], field, errors);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate a single field value
   */
  private validateFieldValue(
    value: any,
    field: SchemaField,
    errors: SchemaValidationError[]
  ): void {
    // Type validation
    switch (field.type) {
      case "string":
        if (typeof value !== "string") {
          errors.push({
            field: field.name,
            message: `Field '${field.displayName}' must be a string`,
            code: "INVALID_TYPE",
          });
        }
        break;
      case "number":
        if (typeof value !== "number" || isNaN(value)) {
          errors.push({
            field: field.name,
            message: `Field '${field.displayName}' must be a valid number`,
            code: "INVALID_TYPE",
          });
        }
        break;
      case "boolean":
        if (typeof value !== "boolean") {
          errors.push({
            field: field.name,
            message: `Field '${field.displayName}' must be a boolean`,
            code: "INVALID_TYPE",
          });
        }
        break;
      case "email":
        if (
          typeof value !== "string" ||
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
        ) {
          errors.push({
            field: field.name,
            message: `Field '${field.displayName}' must be a valid email address`,
            code: "INVALID_FORMAT",
          });
        }
        break;
      case "url":
        if (typeof value !== "string") {
          errors.push({
            field: field.name,
            message: `Field '${field.displayName}' must be a string`,
            code: "INVALID_TYPE",
          });
        } else {
          try {
            new URL(value);
          } catch {
            errors.push({
              field: field.name,
              message: `Field '${field.displayName}' must be a valid URL`,
              code: "INVALID_FORMAT",
            });
          }
        }
        break;
      case "date":
        if (typeof value !== "string" || isNaN(Date.parse(value))) {
          errors.push({
            field: field.name,
            message: `Field '${field.displayName}' must be a valid date string`,
            code: "INVALID_FORMAT",
          });
        }
        break;
    }

    // Custom validation rules
    if (field.validation) {
      field.validation.forEach((rule) => {
        this.validateFieldRule(value, field, rule, errors);
      });
    }
  }

  /**
   * Validate a field against a specific validation rule
   */
  private validateFieldRule(
    value: any,
    field: SchemaField,
    rule: ValidationRule,
    errors: SchemaValidationError[]
  ): void {
    switch (rule.type) {
      case "minLength":
        if (
          typeof value === "string" &&
          value.length < (rule.value as number)
        ) {
          errors.push({
            field: field.name,
            message:
              rule.message ||
              `Field '${field.displayName}' must be at least ${rule.value} characters long`,
            code: "VALIDATION_RULE_FAILED",
          });
        }
        break;
      case "maxLength":
        if (
          typeof value === "string" &&
          value.length > (rule.value as number)
        ) {
          errors.push({
            field: field.name,
            message:
              rule.message ||
              `Field '${field.displayName}' must be no more than ${rule.value} characters long`,
            code: "VALIDATION_RULE_FAILED",
          });
        }
        break;
      case "pattern":
        if (
          typeof value === "string" &&
          !new RegExp(rule.value as string).test(value)
        ) {
          errors.push({
            field: field.name,
            message:
              rule.message ||
              `Field '${field.displayName}' does not match the required pattern`,
            code: "VALIDATION_RULE_FAILED",
          });
        }
        break;
      case "min":
        if (typeof value === "number" && value < (rule.value as number)) {
          errors.push({
            field: field.name,
            message:
              rule.message ||
              `Field '${field.displayName}' must be at least ${rule.value}`,
            code: "VALIDATION_RULE_FAILED",
          });
        }
        break;
      case "max":
        if (typeof value === "number" && value > (rule.value as number)) {
          errors.push({
            field: field.name,
            message:
              rule.message ||
              `Field '${field.displayName}' must be no more than ${rule.value}`,
            code: "VALIDATION_RULE_FAILED",
          });
        }
        break;
    }
  }
}
