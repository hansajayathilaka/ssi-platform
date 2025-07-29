/**
 * SAID Utilities Tests
 *
 * Tests for the SAID (Self-Addressing Identifier) utilities using the saidify library.
 */

import {
  computeSaid,
  saidifySchema,
  validateSchemaSaid,
  convertToJsonSchema,
  createJsonSchemaTemplate,
  saidifyJsonString,
  getSaidFromSchema,
  isSaidified,
  JsonSchema,
} from "../utils/said.utils";
import { saidify, verify } from "saidify";

describe("SAID Utilities", () => {
  const sampleSchema: JsonSchema = {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "",
    title: "TestSchema",
    type: "object",
    properties: {
      credentialSubject: {
        type: "object",
        properties: {
          name: { type: "string" },
          age: { type: "number" },
        },
        required: ["name"],
      },
    },
    required: ["credentialSubject"],
  };

  describe("computeSaid", () => {
    it("should compute a SAID for a schema", () => {
      const said = computeSaid(sampleSchema);

      expect(said).toBeDefined();
      expect(typeof said).toBe("string");
      expect(said.length).toBeGreaterThan(0);
    });

    it("should produce consistent SAIDs for the same schema", () => {
      const said1 = computeSaid(sampleSchema);
      const said2 = computeSaid(sampleSchema);

      expect(said1).toBe(said2);
    });

    it("should produce different SAIDs for different schemas", () => {
      const schema2 = { ...sampleSchema, title: "DifferentSchema" };

      const said1 = computeSaid(sampleSchema);
      const said2 = computeSaid(schema2);

      expect(said1).not.toBe(said2);
    });
  });

  describe("saidifySchema", () => {
    it("should saidify a schema by adding the SAID to $id", () => {
      const saidifiedSchema = saidifySchema(sampleSchema);

      expect(saidifiedSchema.$id).toBeDefined();
      expect(saidifiedSchema.$id.length).toBeGreaterThan(0);
      expect(saidifiedSchema.title).toBe(sampleSchema.title);
    });

    it("should produce a valid self-addressed schema", () => {
      const saidifiedSchema = saidifySchema(sampleSchema);

      // Verify using the saidify library
      const isValid = verify(saidifiedSchema, saidifiedSchema.$id);

      expect(isValid).toBe(true);
    });
  });

  describe("validateSchemaSaid", () => {
    it("should validate a correctly saidified schema", () => {
      const saidifiedSchema = saidifySchema(sampleSchema);
      const isValid = validateSchemaSaid(saidifiedSchema);

      expect(isValid).toBe(true);
    });

    it("should reject a schema with incorrect SAID", () => {
      const invalidSchema = { ...sampleSchema, $id: "invalid-said" };
      const isValid = validateSchemaSaid(invalidSchema);

      expect(isValid).toBe(false);
    });

    it("should reject a schema without SAID", () => {
      const isValid = validateSchemaSaid(sampleSchema);

      expect(isValid).toBe(false);
    });
  });

  describe("createJsonSchemaTemplate", () => {
    it("should create a valid JSON Schema template", () => {
      const properties = {
        name: { type: "string" },
        age: { type: "number" },
      };
      const required = ["name"];

      const template = createJsonSchemaTemplate(
        "TestTemplate",
        properties,
        required
      );

      expect(template.$schema).toBe(
        "https://json-schema.org/draft/2020-12/schema"
      );
      expect(template.$id).toBe("");
      expect(template.title).toBe("TestTemplate");
      expect(template.type).toBe("object");
      expect(template.properties?.credentialSubject?.properties).toEqual(
        properties
      );
      expect(template.properties?.credentialSubject?.required).toEqual(
        required
      );
    });
  });

  describe("convertToJsonSchema", () => {
    it("should convert custom schema format to JSON Schema", () => {
      const customSchema = {
        name: "Employee Schema",
        fields: [
          {
            name: "employeeId",
            type: "string",
            required: true,
            displayName: "Employee ID",
            description: "Unique employee identifier",
          },
          {
            name: "email",
            type: "email",
            required: true,
            displayName: "Email",
            description: "Employee email address",
          },
        ],
      };

      const jsonSchema = convertToJsonSchema(customSchema);

      expect(jsonSchema.$schema).toBe(
        "https://json-schema.org/draft/2020-12/schema"
      );
      expect(jsonSchema.title).toBe("Employee Schema");
      expect(
        jsonSchema.properties?.credentialSubject?.properties?.employeeId
      ).toBeDefined();
      expect(
        (jsonSchema.properties?.credentialSubject?.properties?.email as any)
          ?.format
      ).toBe("email");
      expect(jsonSchema.properties?.credentialSubject?.required).toContain(
        "employeeId"
      );
      expect(jsonSchema.properties?.credentialSubject?.required).toContain(
        "email"
      );
    });
  });

  describe("saidifyJsonString", () => {
    it("should saidify a JSON string", () => {
      const schemaJson = JSON.stringify(sampleSchema);
      const saidifiedJson = saidifyJsonString(schemaJson);

      const saidifiedSchema = JSON.parse(saidifiedJson);

      expect(saidifiedSchema.$id).toBeDefined();
      expect(saidifiedSchema.$id.length).toBeGreaterThan(0);
    });

    it("should throw error for invalid JSON", () => {
      const invalidJson = "{ invalid json }";

      expect(() => saidifyJsonString(invalidJson)).toThrow();
    });
  });

  describe("getSaidFromSchema", () => {
    it("should extract SAID from saidified schema", () => {
      const saidifiedSchema = saidifySchema(sampleSchema);
      const said = getSaidFromSchema(saidifiedSchema);

      expect(said).toBe(saidifiedSchema.$id);
    });

    it("should return null for schema without SAID", () => {
      const said = getSaidFromSchema(sampleSchema);

      expect(said).toBeNull();
    });
  });

  describe("isSaidified", () => {
    it("should return true for saidified schema", () => {
      const saidifiedSchema = saidifySchema(sampleSchema);

      expect(isSaidified(saidifiedSchema)).toBe(true);
    });

    it("should return false for non-saidified schema", () => {
      expect(isSaidified(sampleSchema)).toBe(false);
    });
  });

  describe("Integration with saidify library", () => {
    it("should work correctly with the saidify library directly", () => {
      const testData = {
        a: 1,
        b: 2,
        d: "",
      };

      const [said, sad] = saidify(testData, "d");

      expect(said).toBeDefined();
      expect(sad).toBeDefined();

      const parsedSad = sad;
      expect(parsedSad.d).toBe(said);

      // Verify the SAID
      const isValid = verify(sad, said);
      expect(isValid).toBe(true);
    });
  });
});
