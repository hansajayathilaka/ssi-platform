/**
 * ACDC Schema Creation Tests
 */

import {
  createAndSaidifyAcdcSchema,
  convertCustomSchemaToAcdc,
} from "../utils/acdc-schema.utils";
import { validateSchemaSaid } from "../utils/said.utils";

describe("ACDC Schema Creation", () => {
  test("should create a valid ACDC schema", () => {
    const config = {
      title: "Test Employee Credential",
      description: "A test credential for employees",
      credentialType: "TestEmployeeCredential",
      version: "1.0.0",
      attributes: {
        firstName: {
          description: "Employee first name",
          type: "string",
          required: true,
        },
        lastName: {
          description: "Employee last name",
          type: "string",
          required: true,
        },
        email: {
          description: "Employee email",
          type: "string",
          format: "email",
          required: true,
        },
      },
    };

    const schema = createAndSaidifyAcdcSchema(config);

    // Verify basic structure
    expect(schema.$id).toBeDefined();
    expect(schema.$id).not.toBe("");
    expect(schema.$schema).toBe("http://json-schema.org/draft-07/schema#");
    expect(schema.title).toBe(config.title);
    expect(schema.credentialType).toBe(config.credentialType);

    // Verify ACDC structure
    expect(schema.properties).toBeDefined();
    expect(schema.properties!.v).toBeDefined();
    expect(schema.properties!.d).toBeDefined();
    expect(schema.properties!.i).toBeDefined();
    expect(schema.properties!.ri).toBeDefined();
    expect(schema.properties!.s).toBeDefined();
    expect(schema.properties!.a).toBeDefined();

    // Verify attributes block
    const attributesBlock = schema.properties!.a.oneOf[1];
    expect(attributesBlock.$id).toBeDefined();
    expect(attributesBlock.$id).not.toBe("");
    expect(attributesBlock.properties.firstName).toBeDefined();
    expect(attributesBlock.properties.lastName).toBeDefined();
    expect(attributesBlock.properties.email).toBeDefined();
    expect(attributesBlock.properties.email.format).toBe("email");

    // Verify required fields
    expect(attributesBlock.required).toContain("firstName");
    expect(attributesBlock.required).toContain("lastName");
    expect(attributesBlock.required).toContain("email");
    expect(attributesBlock.required).toContain("i");
    expect(attributesBlock.required).toContain("dt");
  });

  test("should have valid SAIDs", () => {
    const config = {
      title: "SAID Test Credential",
      description: "Testing SAID validation",
      credentialType: "SAIDTestCredential",
      attributes: {
        testField: {
          description: "A test field",
          type: "string",
          required: true,
        },
      },
    };

    const schema = createAndSaidifyAcdcSchema(config);

    // Validate main schema SAID
    expect(validateSchemaSaid(schema)).toBe(true);

    // Validate attributes block SAID
    const attributesBlock = schema.properties!.a.oneOf[1];
    expect(validateSchemaSaid(attributesBlock)).toBe(true);
  });

  test("should convert custom schema to ACDC", () => {
    const customSchema = {
      name: "Custom Test Schema",
      description: "A custom schema for testing",
      version: "1.0.0",
      fields: [
        {
          name: "testField",
          type: "string",
          required: true,
          displayName: "Test Field",
          description: "A test field",
        },
        {
          name: "emailField",
          type: "email",
          required: false,
          displayName: "Email Field",
          description: "An email field",
        },
      ],
    };

    const acdcSchema = convertCustomSchemaToAcdc(customSchema);

    // Verify conversion
    expect(acdcSchema.$id).toBeDefined();
    expect(acdcSchema.title).toBe(customSchema.name);
    expect(acdcSchema.description).toBe(customSchema.description);
    expect(acdcSchema.credentialType).toBe("Custom Test SchemaCredential");

    // Verify attributes conversion
    const attributesBlock = acdcSchema.properties!.a.oneOf[1];
    expect(attributesBlock.properties.testField).toBeDefined();
    expect(attributesBlock.properties.testField.type).toBe("string");
    expect(attributesBlock.properties.emailField).toBeDefined();
    expect(attributesBlock.properties.emailField.type).toBe("string");
    expect(attributesBlock.properties.emailField.format).toBe("email");

    // Verify required fields
    expect(attributesBlock.required).toContain("testField");
    expect(attributesBlock.required).not.toContain("emailField");
  });

  test("should handle validation constraints", () => {
    const config = {
      title: "Validation Test Credential",
      description: "Testing validation constraints",
      credentialType: "ValidationTestCredential",
      attributes: {
        constrainedString: {
          description: "String with constraints",
          type: "string",
          required: true,
          minLength: 5,
          maxLength: 50,
          pattern: "^[A-Z][a-z]+$",
        },
        constrainedNumber: {
          description: "Number with constraints",
          type: "number",
          required: false,
          minimum: 0,
          maximum: 100,
        },
      },
    };

    const schema = createAndSaidifyAcdcSchema(config);
    const attributesBlock = schema.properties!.a.oneOf[1];

    // Verify string constraints
    const stringField = attributesBlock.properties.constrainedString;
    expect(stringField.minLength).toBe(5);
    expect(stringField.maxLength).toBe(50);
    expect(stringField.pattern).toBe("^[A-Z][a-z]+$");

    // Verify number constraints
    const numberField = attributesBlock.properties.constrainedNumber;
    expect(numberField.minimum).toBe(0);
    expect(numberField.maximum).toBe(100);
  });
});
