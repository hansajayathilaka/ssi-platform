import express, { Router } from "express";
import { getBrandingConfig } from "./apis/branding.api";
import { contactList, deleteContact } from "./apis/contact.api";
import {
  contactCredentials,
  issueAcdcCredential,
  requestDisclosure,
  revokeCredential,
} from "./apis/credential.api";
import { keriOobiApi } from "./apis/invitation.api";
import { resolveOobi } from "./apis/oobi.api";
import { ping } from "./apis/ping.api";
import { schemaApi, getJsonSchemaById } from "./apis/schema.api";
import { reloadSchemas } from "./apis/schema-loader.api";
import { createAcdcSchema, convertToAcdcSchema } from "./apis/acdc-schema.api";
import {
  listCustomSchemas,
  getCustomSchemaById,
  createCustomSchema,
  updateCustomSchema,
  deleteCustomSchema,
  validateCredentialData,
  saidifyJsonSchema,
  convertAndSaidifySchema,
  validateSchemaWithSaid,
} from "./apis/schema-management.api";
import {
  createRegistry,
  listRegistries,
  getRegistryById,
  deleteRegistry,
  getOrCreateRegistryForSchema,
} from "./apis/registry.api";
import { config } from "./config";

export const router: Router = express.Router();
router.get(config.path.ping, ping);
router.get(config.path.keriOobi, keriOobiApi);
router.post(config.path.issueAcdcCredential, issueAcdcCredential);
router.post(config.path.resolveOobi, resolveOobi);
router.get(config.path.contacts, contactList);
router.get(config.path.contactCredentials, contactCredentials);
router.get(config.path.schemas, schemaApi);

// Custom schema management routes (must come before generic :schemaId route)
router.get(config.path.customSchemas, listCustomSchemas);
router.get(config.path.customSchemaById, getCustomSchemaById);
router.post(config.path.customSchemas, createCustomSchema);
router.put(config.path.customSchemaById, updateCustomSchema);
router.delete(config.path.customSchemaById, deleteCustomSchema);
router.post(config.path.validateCredentialData, validateCredentialData);

// SAID-based schema routes
router.post("/schemas/saidify", saidifyJsonSchema);
router.post("/schemas/convert", convertAndSaidifySchema);
router.post("/schemas/validate-said", validateSchemaWithSaid);

// ACDC schema routes
router.post("/schemas/acdc", createAcdcSchema);
router.post("/schemas/acdc/convert", convertToAcdcSchema);

// Generic schema routes (must come after specific routes)
router.get("/schemas/:schemaId", getJsonSchemaById);
router.post("/schemas/reload", reloadSchemas);

router.get(config.path.branding, getBrandingConfig);
router.post(config.path.requestDisclosure, requestDisclosure);
router.post(config.path.revokeCredential, revokeCredential);
router.delete(config.path.deleteContact, deleteContact);

// Registry management routes
router.post("/registries", createRegistry);
router.get("/registries", listRegistries);
router.get("/registries/:id", getRegistryById);
router.delete("/registries/:id", deleteRegistry);
router.post("/registries/for-schema", getOrCreateRegistryForSchema);
