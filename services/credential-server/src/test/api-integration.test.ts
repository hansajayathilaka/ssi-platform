/**
 * API Integration Tests
 *
 * Tests to verify the schema management API endpoints work correctly.
 */

import request from "supertest";
import express from "express";
import { router } from "../routes";
import { CustomSchema } from "../types/schema.types";

// Create test app
const app = express();
app.use(express.json());
app.use(router);

const testSchema: CustomSchema = {
  id: "api-test-schema",
  name: "API Test Schema",
  version: "1.0.0",
  description: "Schema for API testing",
  fields: [
    {
      name: "testField",
      type: "string",
      required: true,
      displayName: "Test Field",
      description: "A test field",
    },
  ],
  metadata: {
    isActive: true,
    isPublic: false,
  },
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("Schema Management API Endpoints", () => {
  afterAll(async () => {
    // Clean up test schema
    await request(app).delete(`/schemas/custom/${testSchema.id}`).expect(200);
  });

  test("POST /schemas/custom - should create a new schema", async () => {
    const response = await request(app)
      .post("/schemas/custom")
      .send(testSchema)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe(testSchema.id);
    expect(response.body.data.name).toBe(testSchema.name);
  });

  test("GET /schemas/custom/:id - should retrieve a schema by ID", async () => {
    const response = await request(app)
      .get(`/schemas/custom/${testSchema.id}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe(testSchema.id);
    expect(response.body.data.name).toBe(testSchema.name);
  });

  test("GET /schemas/custom - should list all schemas", async () => {
    const response = await request(app).get("/schemas/custom").expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(
      response.body.data.some((schema: any) => schema.id === testSchema.id)
    ).toBe(true);
  });

  test("POST /schemas/custom/:id/validate - should validate credential data", async () => {
    const credentialData = {
      testField: "test value",
    };

    const response = await request(app)
      .post(`/schemas/custom/${testSchema.id}/validate`)
      .send(credentialData)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.isValid).toBe(true);
    expect(response.body.data.schemaId).toBe(testSchema.id);
  });

  test("PUT /schemas/custom/:id - should update a schema", async () => {
    const updatedSchema = {
      ...testSchema,
      name: "Updated API Test Schema",
      description: "Updated description",
    };

    const response = await request(app)
      .put(`/schemas/custom/${testSchema.id}`)
      .send(updatedSchema)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.name).toBe("Updated API Test Schema");
    expect(response.body.data.description).toBe("Updated description");
  });

  test("GET /schemas/custom/:id - should return 404 for non-existent schema", async () => {
    const response = await request(app)
      .get("/schemas/custom/non-existent-schema")
      .expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe("SCHEMA_NOT_FOUND");
  });

  test("POST /schemas/custom - should return 400 for invalid schema", async () => {
    const invalidSchema = {
      // Missing required fields
      name: "Invalid Schema",
    };

    const response = await request(app)
      .post("/schemas/custom")
      .send(invalidSchema)
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe("SCHEMA_VALIDATION_FAILED");
  });

  test("POST /schemas/custom/:id/validate - should return validation errors for invalid data", async () => {
    const invalidData = {
      // Missing required testField
    };

    const response = await request(app)
      .post(`/schemas/custom/${testSchema.id}/validate`)
      .send(invalidData)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.isValid).toBe(false);
    expect(response.body.data.errors.length).toBeGreaterThan(0);
  });
});
