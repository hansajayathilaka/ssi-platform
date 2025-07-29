/**
 * Schema Management API Tests
 *
 * Basic tests to verify the schema management API endpoints are working correctly.
 */

import { CustomSchema } from "../types/schema.types";
import { SchemaStorageService } from "../services/schema-storage.service";
import { SchemaValidationService } from "../services/schema-validation.service";

// Test data
const testSchema: CustomSchema = {
  id: "test-employee-schema",
  name: "Test Employee Credential",
  version: "1.0.0",
  description: "A test schema for employee credentials",
  fields: [
    {
      name: "employeeId",
      type: "string",
      required: true,
      displayName: "Employee ID",
      description: "Unique employee identifier",
      validation: [
        {
          type: "minLength",
          value: 3,
          message: "Employee ID must be at least 3 characters",
        },
      ],
    },
    {
      name: "fullName",
      type: "string",
      required: true,
      displayName: "Full Name",
      description: "Employee full name",
    },
    {
      name: "email",
      type: "email",
      required: true,
      displayName: "Email Address",
      description: "Employee email address",
    },
    {
      name: "department",
      type: "string",
      required: false,
      displayName: "Department",
      description: "Employee department",
    },
  ],
  metadata: {
    author: "Test Author",
    organization: "Test Organization",
    category: "Employee",
    tags: ["employee", "test"],
    isActive: true,
    isPublic: false,
  },
  createdAt: new Date(),
  updatedAt: new Date(),
};

const testCredentialData = {
  employeeId: "EMP001",
  fullName: "John Doe",
  email: "john.doe@example.com",
  department: "Engineering",
};

describe("Schema Management API", () => {
  let storageService: SchemaStorageService;
  let validationService: SchemaValidationService;

  beforeAll(() => {
    // Initialize services with test configuration
    storageService = new SchemaStorageService({
      schemasPath: "./test-data/schemas",
      enableValidation: true,
      backupOnUpdate: true,
    });

    validationService = new SchemaValidationService();
  });

  afterAll(async () => {
    // Clean up test schema
    await storageService.deleteSchema(testSchema.id);
  });

  test("should validate a valid schema", () => {
    const result = validationService.validateSchema(testSchema);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test("should save and load a schema", async () => {
    // Save schema
    await storageService.saveSchema(testSchema);

    // Load schema
    const loadedSchema = await storageService.loadSchema(testSchema.id);

    expect(loadedSchema).not.toBeNull();
    expect(loadedSchema?.id).toBe(testSchema.id);
    expect(loadedSchema?.name).toBe(testSchema.name);
    expect(loadedSchema?.fields).toHaveLength(testSchema.fields.length);
  });

  test("should validate credential data against schema", async () => {
    const result = validationService.validateCredentialData(
      testCredentialData,
      testSchema
    );
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test("should detect missing required fields", () => {
    const invalidData = {
      employeeId: "EMP001",
      // Missing required fullName and email
      department: "Engineering",
    };

    const result = validationService.validateCredentialData(
      invalidData,
      testSchema
    );
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(2); // Missing fullName and email
  });

  test("should validate email format", () => {
    const invalidData = {
      ...testCredentialData,
      email: "invalid-email",
    };

    const result = validationService.validateCredentialData(
      invalidData,
      testSchema
    );
    expect(result.isValid).toBe(false);
    expect(result.errors.some((error) => error.field === "email")).toBe(true);
  });

  test("should list all schemas", async () => {
    const schemas = await storageService.loadAllSchemas();
    expect(Array.isArray(schemas)).toBe(true);
    expect(schemas.some((schema) => schema.id === testSchema.id)).toBe(true);
  });
});
