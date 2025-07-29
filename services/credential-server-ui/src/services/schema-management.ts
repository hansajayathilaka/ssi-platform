import { config } from "../config";
import { httpInstance } from "./http";

export interface CustomSchemaField {
  name: string;
  type: "string" | "number" | "boolean" | "date" | "email" | "url" | "select";
  required: boolean;
  displayName: string;
  description?: string;
  defaultValue?: any;
  options?: Array<{ value: string; label: string }>;
}

export interface CustomSchemaMetadata {
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
  fields: CustomSchemaField[];
  metadata: CustomSchemaMetadata;
  createdAt: Date;
  updatedAt: Date;
}

const SchemaManagementService = {
  // List all custom schemas
  getCustomSchemas: async () => {
    return httpInstance.get(`${config.endpoint}/schemas/custom`);
  },

  // Get a specific custom schema by ID
  getCustomSchemaById: async (id: string) => {
    return httpInstance.get(`${config.endpoint}/schemas/custom/${id}`);
  },

  // Get a JSON schema by ID (for form generation)
  getJsonSchemaById: async (id: string) => {
    return httpInstance.get(`${config.endpoint}/schemas/${id}`);
  },

  // Create a new custom schema
  createCustomSchema: async (
    schema: Omit<CustomSchema, "id" | "createdAt" | "updatedAt">
  ) => {
    return httpInstance.post(`${config.endpoint}/schemas/custom`, schema);
  },

  // Update an existing custom schema
  updateCustomSchema: async (id: string, schema: CustomSchema) => {
    return httpInstance.put(`${config.endpoint}/schemas/custom/${id}`, schema);
  },

  // Delete a custom schema
  deleteCustomSchema: async (id: string) => {
    return httpInstance.delete(`${config.endpoint}/schemas/custom/${id}`);
  },

  // Validate credential data against a schema
  validateCredentialData: async (schemaId: string, credentialData: any) => {
    return httpInstance.post(
      `${config.endpoint}/schemas/custom/${schemaId}/validate`,
      credentialData
    );
  },
};

export { SchemaManagementService };
