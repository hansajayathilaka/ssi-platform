/**
 * Schema Management API Usage Examples
 *
 * This file demonstrates how to use the schema management API endpoints.
 */

import axios from "axios";
import { CustomSchema } from "../types/schema.types";

const API_BASE_URL = "http://localhost:3001";

// Example schema definition
const exampleSchema: CustomSchema = {
  id: "student-credential",
  name: "Student Credential",
  version: "1.0.0",
  description: "Credential schema for student records",
  fields: [
    {
      name: "studentId",
      type: "string",
      required: true,
      displayName: "Student ID",
      description: "Unique student identifier",
      validation: [
        {
          type: "pattern",
          value: "^STU[0-9]{6}$",
          message: "Student ID must follow format STU123456",
        },
      ],
    },
    {
      name: "fullName",
      type: "string",
      required: true,
      displayName: "Full Name",
      description: "Student full name",
      validation: [
        {
          type: "minLength",
          value: 2,
          message: "Name must be at least 2 characters",
        },
      ],
    },
    {
      name: "email",
      type: "email",
      required: true,
      displayName: "Email Address",
      description: "Student email address",
    },
    {
      name: "graduationYear",
      type: "number",
      required: true,
      displayName: "Graduation Year",
      description: "Expected graduation year",
      validation: [
        {
          type: "min",
          value: 2020,
          message: "Graduation year must be 2020 or later",
        },
        {
          type: "max",
          value: 2030,
          message: "Graduation year must be 2030 or earlier",
        },
      ],
    },
    {
      name: "gpa",
      type: "number",
      required: false,
      displayName: "GPA",
      description: "Grade Point Average",
      validation: [
        {
          type: "min",
          value: 0.0,
          message: "GPA must be 0.0 or higher",
        },
        {
          type: "max",
          value: 4.0,
          message: "GPA must be 4.0 or lower",
        },
      ],
    },
  ],
  metadata: {
    author: "Academic Records Office",
    organization: "University Example",
    category: "Academic",
    tags: ["student", "academic", "university"],
    isActive: true,
    isPublic: false,
  },
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Example credential data
const exampleCredentialData = {
  studentId: "STU123456",
  fullName: "Jane Smith",
  email: "jane.smith@university.edu",
  graduationYear: 2025,
  gpa: 3.75,
};

/**
 * Example: Create a new schema
 */
async function createSchema() {
  try {
    console.log("Creating new schema...");
    const response = await axios.post(
      `${API_BASE_URL}/schemas/custom`,
      exampleSchema
    );
    console.log("Schema created successfully:", response.data);
    return response.data.data;
  } catch (error: any) {
    console.error(
      "Error creating schema:",
      error.response?.data || error.message
    );
    throw error;
  }
}

/**
 * Example: List all schemas
 */
async function listSchemas() {
  try {
    console.log("Listing all schemas...");
    const response = await axios.get(`${API_BASE_URL}/schemas/custom`);
    console.log("Schemas retrieved:", response.data);
    return response.data.data;
  } catch (error: any) {
    console.error(
      "Error listing schemas:",
      error.response?.data || error.message
    );
    throw error;
  }
}

/**
 * Example: Get a specific schema by ID
 */
async function getSchema(schemaId: string) {
  try {
    console.log(`Getting schema with ID: ${schemaId}`);
    const response = await axios.get(
      `${API_BASE_URL}/schemas/custom/${schemaId}`
    );
    console.log("Schema retrieved:", response.data);
    return response.data.data;
  } catch (error: any) {
    console.error(
      "Error getting schema:",
      error.response?.data || error.message
    );
    throw error;
  }
}

/**
 * Example: Update a schema
 */
async function updateSchema(schemaId: string) {
  try {
    console.log(`Updating schema with ID: ${schemaId}`);
    const updatedSchema = {
      ...exampleSchema,
      name: "Updated Student Credential",
      description: "Updated credential schema for student records",
      version: "1.1.0",
    };

    const response = await axios.put(
      `${API_BASE_URL}/schemas/custom/${schemaId}`,
      updatedSchema
    );
    console.log("Schema updated successfully:", response.data);
    return response.data.data;
  } catch (error: any) {
    console.error(
      "Error updating schema:",
      error.response?.data || error.message
    );
    throw error;
  }
}

/**
 * Example: Validate credential data against a schema
 */
async function validateCredentialData(schemaId: string) {
  try {
    console.log(`Validating credential data against schema: ${schemaId}`);
    const response = await axios.post(
      `${API_BASE_URL}/schemas/custom/${schemaId}/validate`,
      exampleCredentialData
    );
    console.log("Validation result:", response.data);
    return response.data.data;
  } catch (error: any) {
    console.error(
      "Error validating credential data:",
      error.response?.data || error.message
    );
    throw error;
  }
}

/**
 * Example: Validate invalid credential data
 */
async function validateInvalidData(schemaId: string) {
  try {
    console.log(
      `Validating invalid credential data against schema: ${schemaId}`
    );
    const invalidData = {
      studentId: "INVALID", // Doesn't match pattern
      fullName: "J", // Too short
      email: "invalid-email", // Invalid email format
      graduationYear: 2019, // Below minimum
      gpa: 5.0, // Above maximum
    };

    const response = await axios.post(
      `${API_BASE_URL}/schemas/custom/${schemaId}/validate`,
      invalidData
    );
    console.log("Validation result for invalid data:", response.data);
    return response.data.data;
  } catch (error: any) {
    console.error(
      "Error validating invalid data:",
      error.response?.data || error.message
    );
    throw error;
  }
}

/**
 * Example: Delete a schema
 */
async function deleteSchema(schemaId: string) {
  try {
    console.log(`Deleting schema with ID: ${schemaId}`);
    const response = await axios.delete(
      `${API_BASE_URL}/schemas/custom/${schemaId}`
    );
    console.log("Schema deleted successfully:", response.data);
    return response.data;
  } catch (error: any) {
    console.error(
      "Error deleting schema:",
      error.response?.data || error.message
    );
    throw error;
  }
}

/**
 * Run all examples
 */
async function runExamples() {
  try {
    console.log("=== Schema Management API Examples ===\n");

    // Create schema
    await createSchema();
    console.log("\n---\n");

    // List schemas
    await listSchemas();
    console.log("\n---\n");

    // Get specific schema
    await getSchema(exampleSchema.id);
    console.log("\n---\n");

    // Update schema
    await updateSchema(exampleSchema.id);
    console.log("\n---\n");

    // Validate valid data
    await validateCredentialData(exampleSchema.id);
    console.log("\n---\n");

    // Validate invalid data
    await validateInvalidData(exampleSchema.id);
    console.log("\n---\n");

    // Delete schema
    await deleteSchema(exampleSchema.id);
    console.log("\n---\n");

    console.log("All examples completed successfully!");
  } catch (error) {
    console.error("Example execution failed:", error);
  }
}

// Export functions for use in other modules
export {
  createSchema,
  listSchemas,
  getSchema,
  updateSchema,
  validateCredentialData,
  validateInvalidData,
  deleteSchema,
  runExamples,
};

// Run examples if this file is executed directly
if (require.main === module) {
  runExamples();
}
