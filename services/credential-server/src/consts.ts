export const QVI_NAME = "qvi";
export const ISSUER_NAME = "issuer";
export const QVI_SCHEMA_SAID = "EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao";
export const RARE_EVO_DEMO_SCHEMA_SAID =
  "EJxnJdxkHbRw2wVFNe4IUOPLt8fEtg9Sr3WyTjlgKoIb";
export const LE_SCHEMA_SAID = "ENPXp1vQzRF6JwIuS-mp2U8Uf1MoADoP_GqQ62VsDZWY";
export const F_EMPLOYEE_DEMO_SCHEMA_SAID =
  "EL9oOWU_7zQn_rD--Xsgi3giCWnFDaNvFMUGTOZx1ARO";
export const ACDC_SCHEMAS_ID = [
  QVI_SCHEMA_SAID,
  LE_SCHEMA_SAID,
  RARE_EVO_DEMO_SCHEMA_SAID,
  F_EMPLOYEE_DEMO_SCHEMA_SAID,
];

export const ACDC_SCHEMAS = [
  {
    id: F_EMPLOYEE_DEMO_SCHEMA_SAID,
    name: "Foundation Employee",
  },
  {
    id: QVI_SCHEMA_SAID,
    name: "Qualified vLEI Issuer Credential",
  },
  {
    id: RARE_EVO_DEMO_SCHEMA_SAID,
    name: "Rare EVO 2024 Attendee",
  },
  {
    id: LE_SCHEMA_SAID,
    name: "Legal Entity vLEI Credential",
  },
];

// Custom schema constants
export const CUSTOM_SCHEMA_PREFIX = "custom-schema-";
export const SAMPLE_PERSON_SCHEMA_ID = "sample-person-credential";

/**
 * Get all valid schema IDs including both default and custom schemas
 * This function should be used instead of ACDC_SCHEMAS_ID for validation
 */
export async function getAllValidSchemaIds(): Promise<string[]> {
  // Import here to avoid circular dependency
  const { SchemaStorageService } = await import(
    "./services/schema-storage.service"
  );
  const { config } = await import("./config");

  const schemaStorageService = new SchemaStorageService({
    schemasPath: config.schemas.customSchemasPath,
    enableValidation: config.schemas.validationStrict,
    backupOnUpdate: config.schemas.backupOnUpdate,
  });

  try {
    const customSchemas = await schemaStorageService.loadAllSchemas();
    const activeCustomSchemaIds = customSchemas
      .filter((schema) => schema.metadata.isActive)
      .map((schema) => schema.id);

    return [...ACDC_SCHEMAS_ID, ...activeCustomSchemaIds];
  } catch (error) {
    console.error("Error loading custom schema IDs:", error);
    // Fallback to default schemas only
    return ACDC_SCHEMAS_ID;
  }
}
