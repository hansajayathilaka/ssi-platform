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
import { schemaApi } from "./apis/schema.api";
import {
  listCustomSchemas,
  getCustomSchemaById,
  createCustomSchema,
  updateCustomSchema,
  deleteCustomSchema,
  validateCredentialData,
} from "./apis/schema-management.api";
import { config } from "./config";

export const router: Router = express.Router();
router.get(config.path.ping, ping);
router.get(config.path.keriOobi, keriOobiApi);
router.post(config.path.issueAcdcCredential, issueAcdcCredential);
router.post(config.path.resolveOobi, resolveOobi);
router.get(config.path.contacts, contactList);
router.get(config.path.contactCredentials, contactCredentials);
router.get(config.path.schemas, schemaApi);
router.get(config.path.branding, getBrandingConfig);
router.post(config.path.requestDisclosure, requestDisclosure);
router.post(config.path.revokeCredential, revokeCredential);
router.delete(config.path.deleteContact, deleteContact);

// Custom schema management routes
router.get(config.path.customSchemas, listCustomSchemas);
router.get(config.path.customSchemaById, getCustomSchemaById);
router.post(config.path.customSchemas, createCustomSchema);
router.put(config.path.customSchemaById, updateCustomSchema);
router.delete(config.path.customSchemaById, deleteCustomSchema);
router.post(config.path.validateCredentialData, validateCredentialData);
