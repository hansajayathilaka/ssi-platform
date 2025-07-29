#!/usr/bin/env ts-node

/**
 * ACDC Schema Creation CLI Tool
 *
 * Command-line tool for creating properly formatted and SAIDified ACDC schemas
 * that are compatible with KERIA agents.
 *
 * Usage:
 *   npx ts-node src/scripts/create-acdc-schema.ts
 */

import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";
import {
  createAndSaidifyAcdcSchema,
  AcdcSchemaConfig,
  AttributeConfig,
} from "../utils/acdc-schema.utils";
import { config } from "../config";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function questionBoolean(prompt: string): Promise<boolean> {
  return new Promise((resolve) => {
    rl.question(`${prompt} (y/n): `, (answer) => {
      resolve(answer.toLowerCase() === "y" || answer.toLowerCase() === "yes");
    });
  });
}

async function collectAttributeInfo(): Promise<AttributeConfig> {
  const name = await question("  Attribute name: ");
  const description = await question("  Description: ");

  console.log("  Available types: string, number, integer, boolean");
  const type = (await question("  Type (default: string): ")) || "string";

  const format = await question("  Format (optional, e.g., email, date): ");
  const required = await questionBoolean("  Required?");

  const attribute: AttributeConfig = {
    description,
    type,
    required,
  };

  if (format) {
    attribute.format = format;
  }

  // Optional validation constraints
  if (type === "string") {
    const minLength = await question("  Minimum length (optional): ");
    const maxLength = await question("  Maximum length (optional): ");
    const pattern = await question("  Regex pattern (optional): ");

    if (minLength) attribute.minLength = parseInt(minLength);
    if (maxLength) attribute.maxLength = parseInt(maxLength);
    if (pattern) attribute.pattern = pattern;
  } else if (type === "number" || type === "integer") {
    const minimum = await question("  Minimum value (optional): ");
    const maximum = await question("  Maximum value (optional): ");

    if (minimum) attribute.minimum = parseFloat(minimum);
    if (maximum) attribute.maximum = parseFloat(maximum);
  }

  return attribute;
}

async function saveSchema(schema: any, schemaName: string): Promise<void> {
  // Save to built-in schemas directory (KERIA compatible)
  const builtInDir =
    config.schemas.builtInSchemasPath || path.join(__dirname, "..", "schemas");
  if (!fs.existsSync(builtInDir)) {
    fs.mkdirSync(builtInDir, { recursive: true });
  }

  const builtInPath = path.join(builtInDir, schema.$id);
  fs.writeFileSync(builtInPath, JSON.stringify(schema, null, 2));
  console.log(`✅ Built-in schema saved to: ${builtInPath}`);

  // Save to custom schemas directory
  const customDir = config.schemas.customSchemasPath;
  if (!fs.existsSync(customDir)) {
    fs.mkdirSync(customDir, { recursive: true });
  }

  const customPath = path.join(customDir, `${schema.$id}.json`);
  fs.writeFileSync(customPath, JSON.stringify(schema, null, 2));
  console.log(`✅ Custom schema saved to: ${customPath}`);

  // Also save a human-readable version
  const readablePath = path.join(
    customDir,
    `${schemaName.replace(/\s+/g, "-").toLowerCase()}-${schema.$id}.json`
  );
  fs.writeFileSync(readablePath, JSON.stringify(schema, null, 2));
  console.log(`✅ Readable copy saved to: ${readablePath}`);
}

async function main() {
  console.log("🔧 ACDC Schema Creation Tool");
  console.log("");
  console.log(
    "This tool will help you create a properly formatted ACDC schema"
  );
  console.log("that is compatible with KERIA agents.");
  console.log("");

  try {
    // Collect basic schema information
    const title = await question("Schema title: ");
    const description = await question("Description: ");
    const credentialType = await question(
      "Credential type (e.g., EmployeeCredential): "
    );
    const version = (await question("Version (default: 1.0.0): ")) || "1.0.0";

    console.log("");
    console.log("Now let's define the attributes for this credential...");
    console.log("");

    const attributes: Record<string, AttributeConfig> = {};

    // Collect attributes
    let addingAttributes = true;
    let attributeCount = 0;

    while (addingAttributes) {
      attributeCount++;
      console.log(`--- Attribute ${attributeCount} ---`);

      const attribute = await collectAttributeInfo();
      const attributeName = await question(
        "  Save this attribute as (field name): "
      );

      if (attributeName) {
        attributes[attributeName] = attribute;
        console.log(`✅ Added attribute: ${attributeName}`);
      }

      console.log("");
      addingAttributes = await questionBoolean("Add another attribute?");
      console.log("");
    }

    // Create the schema configuration
    const schemaConfig: AcdcSchemaConfig = {
      title,
      description,
      credentialType,
      version,
      attributes,
    };

    console.log("Creating and SAIDifying schema...");
    const saidifiedSchema = createAndSaidifyAcdcSchema(schemaConfig);

    console.log("");
    console.log("✨ Schema created successfully!");
    console.log(`📋 SAID: ${saidifiedSchema.$id}`);
    console.log(
      `📋 Attributes Block SAID: ${saidifiedSchema.properties?.a?.oneOf?.[1]?.$id}`
    );
    console.log("");

    // Save the schema
    const shouldSave = await questionBoolean("Save this schema?");
    if (shouldSave) {
      await saveSchema(saidifiedSchema, title);

      console.log("");
      console.log("🎉 Schema saved successfully!");
      console.log("");
      console.log("The schema is now accessible to KERIA agents via:");
      console.log(`   GET /schemas/${saidifiedSchema.$id}`);
      console.log("");
      console.log(
        "You can also use it in credential issuance by referencing its SAID."
      );
    } else {
      console.log("");
      console.log("Schema created but not saved. Here's the result:");
      console.log("");
      console.log(JSON.stringify(saidifiedSchema, null, 2));
    }
  } catch (error) {
    console.error("❌ Error creating schema:", error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { main };
