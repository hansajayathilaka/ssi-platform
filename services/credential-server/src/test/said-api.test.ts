/**
 * SAID API Integration Tests
 *
 * Tests for the SAID-based schema management API endpoints.
 */

import request from "supertest";
import express from "express";
import { router } from "../routes";

// Mock the SignifyClient and other dependencies
jest.mock("signify-ts");

const app = express();
app.use(express.json());
app.use(router);

describe("SAID API Endpoints", () => {
  const sampleJsonSchema = {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "",
    title: "EmployeeRecord",
    type: "object",
    properties: {
      credentialSubject: {
        type: "object",
        properties: {
          employeeId: { type: "string" },
          department: { type: "string" },
        },
        required: ["employeeId", "department"],
      },
    },
    required: ["credentialSubject"],
  };

  const sampleCustomSchema = {
    id: "test-employee-schema",
    name: "Employee Schema",
    version: "1.0.0",
    description: "Test employee schema",
    fields: [
      {
        name: "employeeId",
        type: "string",
        required: true,
        displayName: "Employee ID",
        description: "Unique employee identifier",
      },
      {
        name: "fullName",
        type: "string",
        required: true,
        displayName: "Full Name",
        description: "Employee full name",
      },
    ],
    metadata: {
      author: "Test Author",
      organization: "Test Org",
      category: "Employee",
      tags: ["employee", "test"],
      isActive: true,
      isPublic: false,
    },
  };

  describe("POST /schemas/saidify", () => {
    it("should saidify a valid JSON schema", async () => {
      const response = await request(app)
        .post("/schemas/saidify")
        .send(sampleJsonSchema)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.$id).toBeDefined();
      expect(response.body.data.$id.length).toBeGreaterThan(0);
      expect(response.body.data.title).toBe(sampleJsonSchema.title);
      expect(response.body.message).toBe("Schema SAIDified successfully");
    });

    it("should reject invalid JSON schema", async () => {
      const invalidSchema = {
        // Missing required fields
        type: "object",
      };

      const response = await request(app)
        .post("/schemas/saidify")
        .send(invalidSchema)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("INVALID_JSON_SCHEMA");
    });

    it("should reject empty request body", async () => {
      const response = await request(app)
        .post("/schemas/saidify")
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("INVALID_REQUEST_BODY");
    });
  });

  describe("POST /schemas/convert", () => {
    it("should convert and saidify a custom schema", async () => {
      const response = await request(app)
        .post("/schemas/convert")
        .send(sampleCustomSchema)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.originalSchema).toEqual(sampleCustomSchema);
      expect(response.body.data.jsonSchema).toBeDefined();
      expect(response.body.data.saidifiedSchema).toBeDefined();
      expect(response.body.data.said).toBeDefined();
      expect(response.body.data.saidifiedSchema.$id).toBe(
        response.body.data.said
      );
    });

    it("should reject invalid custom schema", async () => {
      const invalidCustomSchema = {
        // Missing required fields
        name: "Invalid Schema",
      };

      const response = await request(app)
        .post("/schemas/convert")
        .send(invalidCustomSchema)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("SCHEMA_VALIDATION_FAILED");
    });
  });

  describe("POST /schemas/validate-said", () => {
    it("should validate a correctly saidified schema", async () => {
      // First saidify a schema
      const saidifyResponse = await request(app)
        .post("/schemas/saidify")
        .send(sampleJsonSchema);

      const saidifiedSchema = saidifyResponse.body.data;

      // Then validate it
      const response = await request(app)
        .post("/schemas/validate-said")
        .send(saidifiedSchema)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isValid).toBe(true);
      expect(response.body.data.schemaId).toBe(saidifiedSchema.$id);
      expect(response.body.data.schemaTitle).toBe(saidifiedSchema.title);
    });

    it("should reject schema with invalid SAID", async () => {
      const invalidSchema = {
        ...sampleJsonSchema,
        $id: "invalid-said-value",
      };

      const response = await request(app)
        .post("/schemas/validate-said")
        .send(invalidSchema)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isValid).toBe(false);
    });

    it("should reject empty request body", async () => {
      const response = await request(app)
        .post("/schemas/validate-said")
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("INVALID_REQUEST_BODY");
    });
  });

  describe("Registry API Endpoints", () => {
    // Mock SignifyClient for registry tests
    beforeEach(() => {
      const mockClient = {
        registries: () => ({
          create: jest.fn().mockResolvedValue({
            regser: { pre: "mock-registry-id" },
          }),
          list: jest.fn().mockResolvedValue([]),
        }),
      };

      app.set("signifyClient", mockClient);
    });

    describe("POST /registries", () => {
      it("should create a new registry", async () => {
        const registryData = {
          name: "test-issuer",
          registryName: "Test Registry",
          schemaId: "test-schema-id",
        };

        const response = await request(app)
          .post("/registries")
          .send(registryData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.registryId).toBeDefined();
        expect(response.body.data.name).toBe(registryData.name);
        expect(response.body.data.registryName).toBe(registryData.registryName);
        expect(response.body.data.schemaId).toBe(registryData.schemaId);
      });

      it("should reject invalid registry data", async () => {
        const invalidData = {
          // Missing required fields
          registryName: "Test Registry",
        };

        const response = await request(app)
          .post("/registries")
          .send(invalidData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe("INVALID_NAME");
      });
    });

    describe("GET /registries", () => {
      it("should list all registries", async () => {
        const response = await request(app).get("/registries").expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
        expect(response.body.count).toBeDefined();
      });
    });

    describe("POST /registries/for-schema", () => {
      it("should get or create registry for schema", async () => {
        const requestData = {
          schemaId: "test-schema-said",
          issuerName: "test-issuer",
        };

        const response = await request(app)
          .post("/registries/for-schema")
          .send(requestData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.registryId).toBeDefined();
      });

      it("should reject invalid request data", async () => {
        const invalidData = {
          // Missing required fields
          schemaId: "test-schema-said",
        };

        const response = await request(app)
          .post("/registries/for-schema")
          .send(invalidData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe("INVALID_ISSUER_NAME");
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle malformed JSON gracefully", async () => {
      const response = await request(app)
        .post("/schemas/saidify")
        .send("invalid json")
        .expect(400);

      // Express should handle malformed JSON and return 400
      expect(response.status).toBe(400);
    });

    it("should handle server errors gracefully", async () => {
      // Mock a function to throw an error
      jest
        .spyOn(require("../utils/said.utils"), "saidifySchema")
        .mockImplementationOnce(() => {
          throw new Error("Test error");
        });

      const response = await request(app)
        .post("/schemas/saidify")
        .send(sampleJsonSchema)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("SAIDIFY_ERROR");
    });
  });
});
