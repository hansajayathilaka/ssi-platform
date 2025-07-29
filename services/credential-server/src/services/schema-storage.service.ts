/**
 * Schema Storage Service
 *
 * This service handles the storage and retrieval of custom schemas using JSON files.
 * It provides basic CRUD operations for custom schemas with file-based persistence.
 */

import * as fs from "fs";
import * as path from "path";
import {
  CustomSchema,
  SchemaStorageOptions,
  SchemaValidationResult,
  SchemaValidationError,
} from "../types/schema.types";

export class SchemaStorageService {
  private schemasPath: string;
  private options: SchemaStorageOptions;

  constructor(options: SchemaStorageOptions) {
    this.options = options;
    this.schemasPath = options.schemasPath;
    this.ensureSchemaDirectory();
  }

  /**
   * Ensure the schemas directory exists
   */
  private ensureSchemaDirectory(): void {
    if (!fs.existsSync(this.schemasPath)) {
      fs.mkdirSync(this.schemasPath, { recursive: true });
    }
  }

  /**
   * Get the file path for a schema
   */
  private getSchemaFilePath(schemaId: string): string {
    return path.join(this.schemasPath, `${schemaId}.json`);
  }

  /**
   * Save a custom schema to JSON file
   */
  async saveSchema(schema: CustomSchema): Promise<void> {
    const filePath = this.getSchemaFilePath(schema.id);

    // Create backup if updating existing schema
    if (this.options.backupOnUpdate && fs.existsSync(filePath)) {
      const backupPath = `${filePath}.backup.${Date.now()}`;
      fs.copyFileSync(filePath, backupPath);
    }

    // Update timestamp
    schema.updatedAt = new Date();

    // Write schema to file
    const schemaJson = JSON.stringify(schema, null, 2);
    fs.writeFileSync(filePath, schemaJson, "utf8");
  }

  /**
   * Load a custom schema by ID
   */
  async loadSchema(schemaId: string): Promise<CustomSchema | null> {
    const filePath = this.getSchemaFilePath(schemaId);

    if (!fs.existsSync(filePath)) {
      return null;
    }

    try {
      const schemaJson = fs.readFileSync(filePath, "utf8");
      const schema = JSON.parse(schemaJson) as CustomSchema;

      // Convert date strings back to Date objects
      schema.createdAt = new Date(schema.createdAt);
      schema.updatedAt = new Date(schema.updatedAt);

      return schema;
    } catch (error) {
      console.error(`Error loading schema ${schemaId}:`, error);
      return null;
    }
  }

  /**
   * Load all custom schemas
   */
  async loadAllSchemas(): Promise<CustomSchema[]> {
    const schemas: CustomSchema[] = [];

    if (!fs.existsSync(this.schemasPath)) {
      return schemas;
    }

    const files = fs.readdirSync(this.schemasPath);

    for (const file of files) {
      if (file.endsWith(".json") && !file.includes(".backup.")) {
        const schemaId = path.basename(file, ".json");
        const schema = await this.loadSchema(schemaId);
        if (schema) {
          schemas.push(schema);
        }
      }
    }

    return schemas;
  }

  /**
   * Delete a custom schema
   */
  async deleteSchema(schemaId: string): Promise<boolean> {
    const filePath = this.getSchemaFilePath(schemaId);

    if (!fs.existsSync(filePath)) {
      return false;
    }

    try {
      fs.unlinkSync(filePath);
      return true;
    } catch (error) {
      console.error(`Error deleting schema ${schemaId}:`, error);
      return false;
    }
  }

  /**
   * Check if a schema exists
   */
  async schemaExists(schemaId: string): Promise<boolean> {
    const filePath = this.getSchemaFilePath(schemaId);
    return fs.existsSync(filePath);
  }

  /**
   * List all schema IDs
   */
  async listSchemaIds(): Promise<string[]> {
    if (!fs.existsSync(this.schemasPath)) {
      return [];
    }

    const files = fs.readdirSync(this.schemasPath);
    return files
      .filter((file) => file.endsWith(".json") && !file.includes(".backup."))
      .map((file) => path.basename(file, ".json"));
  }

  /**
   * Get schema metadata without loading full schema
   */
  async getSchemaMetadata(
    schemaId: string
  ): Promise<{ name: string; version: string; updatedAt: Date } | null> {
    const schema = await this.loadSchema(schemaId);
    if (!schema) {
      return null;
    }

    return {
      name: schema.name,
      version: schema.version,
      updatedAt: schema.updatedAt,
    };
  }
}
