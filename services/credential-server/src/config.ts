const port = process.env.PORT ? Number(process.env.PORT) : 3001;
const endpoint = process.env.ENDPOINT ?? `http://127.0.0.1:${port}`;
const oobiEndpoint =
  process.env.CRED_OOBI_ENDPOINT ?? process.env.OOBI_ENDPOINT ?? endpoint;
const keriaUrl =
  process.env.CRED_KERIA_ENDPOINT ??
  process.env.KERIA_ENDPOINT ??
  "http://127.0.0.1:3901";
const keriaBootUrl =
  process.env.CRED_KERIA_BOOT_ENDPOINT ??
  process.env.KERIA_BOOT_ENDPOINT ??
  "http://127.0.0.1:3903";

// Branding configuration
const customOrgName = process.env.CUSTOM_ORG_NAME ?? "Credential Issuer";
const customLogoPath = process.env.CUSTOM_LOGO_PATH ?? "";
const customPrimaryColor = process.env.CUSTOM_PRIMARY_COLOR ?? "#1976d2";
const customSecondaryColor = process.env.CUSTOM_SECONDARY_COLOR ?? "#dc004e";

// Schema configuration
const customSchemasPath = process.env.CUSTOM_SCHEMAS_PATH ?? "./data/schemas";
const enableSchemaManagement = process.env.ENABLE_SCHEMA_MANAGEMENT === "true";
const schemaValidationStrict = process.env.SCHEMA_VALIDATION_STRICT !== "false";

export const config = {
  endpoint: endpoint,
  oobiEndpoint: oobiEndpoint,
  port,
  keria: {
    url: keriaUrl,
    bootUrl: keriaBootUrl,
  },
  branding: {
    organizationName: customOrgName,
    logoPath: customLogoPath,
    primaryColor: customPrimaryColor,
    secondaryColor: customSecondaryColor,
  },
  schemas: {
    customSchemasPath: customSchemasPath,
    enableManagement: enableSchemaManagement,
    validationStrict: schemaValidationStrict,
    backupOnUpdate: true,
  },
  path: {
    ping: "/ping",
    keriOobi: "/keriOobi",
    issueAcdcCredential: "/issueAcdcCredential",
    contacts: "/contacts",
    contactCredentials: "/contactCredentials",
    resolveOobi: "/resolveOobi",
    requestDisclosure: "/requestDisclosure",
    revokeCredential: "/revokeCredential",
    deleteContact: "/deleteContact",
    schemas: "/schemas",
    branding: "/branding",
    // Custom schema management endpoints
    customSchemas: "/schemas/custom",
    customSchemaById: "/schemas/custom/:id",
    validateCredentialData: "/schemas/custom/:id/validate",
  },
};
