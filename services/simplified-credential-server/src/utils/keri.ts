/**
 * KERI utilities module for the simplified credential server
 * Provides functions for Signify client initialization, identifier management,
 * OOBI generation, and credential issuance
 */

import {
  Operation,
  randomPasscode,
  Salter,
  SignifyClient,
  State,
  Tier,
} from "signify-ts";
import { config, serverConfig } from "../config";

// Constants
export const OP_TIMEOUT = 15000;
export const FAILED_TO_RESOLVE_OOBI = "Failed to resolve OOBI, operation not completing...";
export const REGISTRIES_NOT_FOUND = "No registries found for";

// Types
export interface CredentialRequest {
  recipientId: string;
  schemaId: string;
  attributes: Record<string, any>;
}

export interface CredentialResponse {
  success: boolean;
  data: string;
  credentialId?: string;
}

export interface InvitationResponse {
  success: boolean;
  data: {
    oobi: string;
    qrCode?: string;
  };
}

export interface KeriIdentifier {
  name: string;
  prefix: string;
}

/**
 * Generate a random salt for KERI operations
 */
export function randomSalt(): string {
  return new Salter({}).qb64;
}

/**
 * Initialize and connect a Signify client
 * @param bran - The bran (seed) for the client
 * @returns Promise<SignifyClient> - Connected Signify client
 */
export async function initializeSignifyClient(bran?: string): Promise<SignifyClient> {
  const clientBran = bran || randomPasscode();
  
  console.log(`Creating SignifyClient with bran: ${clientBran}`);
  console.log(`Keria URL: ${config.keria.url}`);
  console.log(`Boot URL: ${config.keria.bootUrl}`);
  console.log(`OOBI Endpoint: ${config.oobiEndpoint}`);

  const client = new SignifyClient(
    config.keria.url,
    clientBran,
    Tier.low,
    config.keria.bootUrl
  );

  await client.boot();
  await client.connect();

  return client;
}

/**
 * Wait for an operation to complete with timeout
 * @param client - Signify client
 * @param op - Operation to wait for
 * @param timeout - Timeout in milliseconds
 * @param interval - Polling interval in milliseconds
 * @returns Promise<Operation> - Completed operation
 */
export async function waitAndGetDoneOp(
  client: SignifyClient,
  op: Operation,
  timeout = OP_TIMEOUT,
  interval = 250
): Promise<Operation> {
  const startTime = new Date().getTime();
  while (!op.done && new Date().getTime() < startTime + timeout) {
    op = await client.operations().get(op.name);
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
  if (!op.done) {
    throw new Error(`Operation not completing: ${JSON.stringify(op, null, 2)}`);
  }
  return op;
}

/**
 * Ensure an identifier exists, create if it doesn't
 * @param client - Signify client
 * @param name - Identifier name
 * @returns Promise<KeriIdentifier> - The identifier
 */
export async function ensureIdentifier(
  client: SignifyClient,
  name: string
): Promise<KeriIdentifier> {
  try {
    const existing = await client.identifiers().get(name);
    return {
      name: existing.name,
      prefix: existing.prefix,
    };
  } catch (error) {
    // Identifier doesn't exist, create it
    console.log(`Creating identifier: ${name}`);
    const result = await client.identifiers().create(name, {
      toad: 3,
      wits: [],
    });
    
    await waitAndGetDoneOp(client, result.op);
    
    const identifier = await client.identifiers().get(name);
    return {
      name: identifier.name,
      prefix: identifier.prefix,
    };
  }
}

/**
 * Resolve an OOBI (Out-of-Band Introduction)
 * @param client - Signify client
 * @param url - OOBI URL to resolve
 * @returns Promise<Operation> - Resolved operation
 */
export async function resolveOobi(
  client: SignifyClient,
  url: string
): Promise<Operation> {
  const urlObj = new URL(url);
  const alias = urlObj.searchParams.get("name") ?? randomSalt();
  urlObj.searchParams.delete("name");
  const strippedUrl = urlObj.toString();

  const operation = (await waitAndGetDoneOp(
    client,
    await client.oobis().resolve(strippedUrl),
    OP_TIMEOUT
  )) as Operation & { response: State };
  
  if (!operation.done) {
    throw new Error(FAILED_TO_RESOLVE_OOBI);
  }
  
  if (operation.response && operation.response.i) {
    const connectionId = operation.response.i;
    const createdAt = new Date((operation.response as State).dt);
    await client.contacts().update(connectionId, {
      alias,
      createdAt,
      oobi: url,
    });
  }
  
  return operation;
}

/**
 * Get OOBI for an identifier
 * @param client - Signify client
 * @param identifierName - Name of the identifier
 * @returns Promise<string> - OOBI URL
 */
export async function getOobi(
  client: SignifyClient,
  identifierName: string
): Promise<string> {
  const result = await client.oobis().get(identifierName, "agent");
  return result.oobis[0];
}

/**
 * Generate a KERI invitation (OOBI)
 * @param client - Signify client
 * @param identifierName - Name of the identifier to generate invitation for
 * @returns Promise<InvitationResponse> - Invitation response
 */
export async function generateOOBI(
  client: SignifyClient,
  identifierName: string
): Promise<InvitationResponse> {
  try {
    // Ensure identifier exists
    await ensureIdentifier(client, identifierName);
    
    // Get OOBI for the identifier
    const oobi = await getOobi(client, identifierName);
    
    return {
      success: true,
      data: {
        oobi,
      },
    };
  } catch (error) {
    console.error("Error generating OOBI:", error);
    return {
      success: false,
      data: {
        oobi: "",
      },
    };
  }
}

/**
 * Get registry for an identifier
 * @param client - Signify client
 * @param identifierName - Name of the identifier
 * @returns Promise<string> - Registry key
 */
export async function getRegistry(
  client: SignifyClient,
  identifierName: string
): Promise<string> {
  const registries = await client.registries().list(identifierName);
  if (!registries || registries.length === 0) {
    throw new Error(`${REGISTRIES_NOT_FOUND} ${identifierName}`);
  }
  return registries[0].regk;
}

/**
 * Create a registry for an identifier if it doesn't exist
 * @param client - Signify client
 * @param identifierName - Name of the identifier
 * @returns Promise<string> - Registry key
 */
export async function ensureRegistry(
  client: SignifyClient,
  identifierName: string
): Promise<string> {
  try {
    return await getRegistry(client, identifierName);
  } catch (error) {
    // Registry doesn't exist, create it
    console.log(`Creating registry for identifier: ${identifierName}`);
    const result = await client.registries().create({
      name: identifierName,
      registryName: `${identifierName}-registry`,
    });
    
    await waitAndGetDoneOp(client, result.op);
    // Return the registry key from the result
    return (result as any).regk || result.op.name;
  }
}

/**
 * Issue an ACDC credential
 * @param client - Signify client
 * @param request - Credential request data
 * @param issuerName - Name of the issuer identifier
 * @returns Promise<CredentialResponse> - Credential issuance response
 */
export async function issueCredential(
  client: SignifyClient,
  request: CredentialRequest,
  issuerName: string = serverConfig.issuerName
): Promise<CredentialResponse> {
  try {
    // Ensure issuer identifier exists
    await ensureIdentifier(client, issuerName);
    
    // Ensure registry exists
    const registryKey = await ensureRegistry(client, issuerName);
    
    // Resolve schema OOBI if needed
    try {
      await resolveOobi(client, `${config.oobiEndpoint}/oobi/${request.schemaId}`);
    } catch (error) {
      console.warn(`Could not resolve schema OOBI for ${request.schemaId}:`, error);
    }
    
    // Issue the credential
    const result = await client.credentials().issue(issuerName, {
      ri: registryKey,
      s: request.schemaId,
      a: {
        i: request.recipientId,
        ...request.attributes,
      },
    });
    
    await waitAndGetDoneOp(client, result.op, OP_TIMEOUT);
    
    const credentialId = result.acdc.ked["d"];
    
    return {
      success: true,
      data: "Credential issued successfully",
      credentialId,
    };
  } catch (error) {
    console.error("Error issuing credential:", error);
    return {
      success: false,
      data: `Failed to issue credential: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Get end roles for an identifier
 * @param client - Signify client
 * @param alias - Identifier alias
 * @returns Promise<any> - End roles data
 */
export async function getEndRoles(
  client: SignifyClient,
  alias: string
): Promise<any> {
  const path = `/identifiers/${alias}/endroles`;
  const response: Response = await client.fetch(path, "GET", null);
  if (!response.ok) throw new Error(await response.text());
  const result = await response.json();
  return result;
}

/**
 * Initialize KERI infrastructure for the simplified credential server
 * @param issuerBran - Bran for the issuer client
 * @returns Promise<SignifyClient> - Initialized issuer client
 */
export async function initializeKeriInfrastructure(
  issuerBran?: string
): Promise<SignifyClient> {
  const client = await initializeSignifyClient(issuerBran);
  
  // Ensure issuer identifier exists
  await ensureIdentifier(client, serverConfig.issuerName);
  
  // Ensure registry exists
  await ensureRegistry(client, serverConfig.issuerName);
  
  return client;
}