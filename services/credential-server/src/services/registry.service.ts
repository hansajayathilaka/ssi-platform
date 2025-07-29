/**
 * Registry Management Service
 *
 * This service handles the creation and management of credential registries
 * for custom schemas according to KERI specifications.
 */

import { SignifyClient } from "signify-ts";

export interface RegistryCreationOptions {
  name: string;
  registryName: string;
  schemaId?: string;
}

export interface RegistryInfo {
  registryId: string;
  name: string;
  registryName: string;
  schemaId?: string;
  createdAt: Date;
}

export class RegistryService {
  private client: SignifyClient;
  private registries: Map<string, RegistryInfo> = new Map();

  constructor(client: SignifyClient) {
    this.client = client;
  }

  /**
   * Create a new credential registry for a schema
   *
   * @param options - Registry creation options
   * @returns Registry information
   */
  async createRegistry(
    options: RegistryCreationOptions
  ): Promise<RegistryInfo> {
    try {
      // Create registry using KERI client
      const registryResult = await this.client.registries().create({
        name: options.name,
        registryName: options.registryName,
      });

      const registryInfo: RegistryInfo = {
        registryId: registryResult.regser.pre,
        name: options.name,
        registryName: options.registryName,
        schemaId: options.schemaId,
        createdAt: new Date(),
      };

      // Store registry info for future reference
      this.registries.set(registryInfo.registryId, registryInfo);

      return registryInfo;
    } catch (error) {
      throw new Error(
        `Failed to create registry: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Get registry information by ID
   *
   * @param registryId - Registry identifier
   * @returns Registry information or null if not found
   */
  async getRegistry(registryId: string): Promise<RegistryInfo | null> {
    return this.registries.get(registryId) || null;
  }

  /**
   * List all registries
   *
   * @returns Array of registry information
   */
  async listRegistries(): Promise<RegistryInfo[]> {
    return Array.from(this.registries.values());
  }

  /**
   * Get or create a registry for a schema
   *
   * @param schemaId - Schema identifier (SAID)
   * @param issuerName - Issuer name/prefix
   * @returns Registry ID
   */
  async getOrCreateRegistryForSchema(
    schemaId: string,
    issuerName: string
  ): Promise<string> {
    // Check if registry already exists for this schema
    const existingRegistry = Array.from(this.registries.values()).find(
      (reg) => reg.schemaId === schemaId
    );

    if (existingRegistry) {
      return existingRegistry.registryId;
    }

    // Create new registry for the schema
    const registryInfo = await this.createRegistry({
      name: issuerName,
      registryName: `Registry for ${schemaId}`,
      schemaId: schemaId,
    });

    return registryInfo.registryId;
  }

  /**
   * Delete a registry
   *
   * @param registryId - Registry identifier
   * @returns True if deleted successfully
   */
  async deleteRegistry(registryId: string): Promise<boolean> {
    try {
      // Note: KERI doesn't typically support registry deletion
      // This removes it from our local tracking only
      return this.registries.delete(registryId);
    } catch (error) {
      console.error(`Failed to delete registry ${registryId}:`, error);
      return false;
    }
  }

  /**
   * Validate that a registry exists and is accessible
   *
   * @param registryId - Registry identifier
   * @returns True if registry is valid and accessible
   */
  async validateRegistry(registryId: string): Promise<boolean> {
    try {
      // Try to access the registry through KERI client
      const registries = await this.client.registries().list("issuer");
      return registries.some((reg) => reg.regk === registryId);
    } catch (error) {
      console.error(`Failed to validate registry ${registryId}:`, error);
      return false;
    }
  }
}
