import { CustomSchemaField } from "./schema-management";

export interface JsonSchemaProperty {
  type: string;
  description?: string;
  format?: string;
  enum?: string[];
  required?: boolean;
}

export interface ParsedJsonSchema {
  id: string;
  title: string;
  description?: string;
  credentialType: string;
  version: string;
  fields: CustomSchemaField[];
}

/**
 * Parse a JSON Schema to extract form fields from the attributes block
 */
export function parseJsonSchemaForForm(schema: any): ParsedJsonSchema | null {
  if (!schema || !schema.properties || !schema.properties.a) {
    return null;
  }

  // Find the attributes block in the oneOf array
  const attributesBlock = schema.properties.a.oneOf?.find(
    (item: any) => item.type === "object" && item.properties
  );

  if (!attributesBlock || !attributesBlock.properties) {
    return null;
  }

  const fields: CustomSchemaField[] = [];
  const requiredFields = attributesBlock.required || [];

  // Skip system fields (d, i, dt) and extract user-fillable fields
  const systemFields = ["d", "i", "dt"];

  Object.entries(attributesBlock.properties).forEach(
    ([fieldName, fieldDef]: [string, any]) => {
      if (systemFields.includes(fieldName)) {
        return; // Skip system fields
      }

      const field: CustomSchemaField = {
        name: fieldName,
        type: mapJsonSchemaTypeToFormType(fieldDef),
        required: requiredFields.includes(fieldName),
        displayName: fieldDef.description || formatDisplayName(fieldName),
        description: fieldDef.description,
      };

      // Handle enum values for select fields
      if (fieldDef.enum && fieldDef.enum.length > 0) {
        field.type = "select";
        field.options = fieldDef.enum.map((value: string) => ({
          value,
          label: formatDisplayName(value),
        }));
      }

      fields.push(field);
    }
  );

  return {
    id: schema.$id,
    title: schema.title,
    description: schema.description,
    credentialType: schema.credentialType,
    version: schema.version,
    fields,
  };
}

/**
 * Map JSON Schema types to form field types
 */
function mapJsonSchemaTypeToFormType(fieldDef: any): CustomSchemaField["type"] {
  if (fieldDef.enum) {
    return "select" as any; // Will be handled separately
  }

  switch (fieldDef.type) {
    case "boolean":
      return "boolean";
    case "number":
    case "integer":
      return "number";
    case "string":
      if (fieldDef.format === "email") {
        return "email";
      }
      if (fieldDef.format === "uri" || fieldDef.format === "url") {
        return "url";
      }
      if (fieldDef.format === "date" || fieldDef.format === "date-time") {
        return "date";
      }
      return "string";
    default:
      return "string";
  }
}

/**
 * Format field names into human-readable display names
 */
function formatDisplayName(fieldName: string): string {
  return fieldName
    .replace(/([A-Z])/g, " $1") // Add space before capital letters
    .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
    .replace(/\b\w/g, (str) => str.toUpperCase()); // Capitalize each word
}

/**
 * Validate that a parsed schema has the minimum required fields
 */
export function validateParsedSchema(schema: ParsedJsonSchema): boolean {
  return !!(
    schema.id &&
    schema.title &&
    schema.fields &&
    Array.isArray(schema.fields) &&
    schema.fields.length > 0
  );
}

/**
 * Get schema from the credential server
 */
export async function fetchJsonSchema(schemaId: string): Promise<any> {
  const response = await fetch(`/api/schemas/${schemaId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch schema: ${response.statusText}`);
  }
  return response.json();
}
