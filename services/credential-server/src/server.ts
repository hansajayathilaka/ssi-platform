import dotenv from "dotenv";
import { join } from "path";

// Load environment variables from .env.production
dotenv.config({ path: join(__dirname, "../../../.env.production") });

import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import { SignifyClient, ready as signifyReady, Tier } from "signify-ts";
import { config } from "./config";
import { ACDC_SCHEMAS_ID, ISSUER_NAME, QVI_NAME } from "./consts";
import { log } from "./log";
import { router } from "./routes";
import { EndRole } from "./server.types";
import { PollingService } from "./services/pollingService";
import {
  createQVICredential,
  getEndRoles,
  getRegistry,
  loadBrans,
  REGISTRIES_NOT_FOUND,
  resolveOobi,
  waitAndGetDoneOp,
} from "./utils/utils";

async function getSignifyClient(bran: string): Promise<SignifyClient> {
  console.log("Connecting to Signify server:", config.keria.url);
  console.log("Connecting to Signify boot url:", config.keria.bootUrl);

  const client = new SignifyClient(
    config.keria.url,
    bran,
    Tier.low,
    config.keria.bootUrl
  );

  try {
    await client.connect();
  } catch (err) {
    console.error("Error connecting to Signify server:", err);
    await client.boot();
    await client.connect();
  }

  console.log("Loading schemas via OOBI...");
  const schemaResults = await Promise.allSettled(
    ACDC_SCHEMAS_ID.map(async (schemaId) => {
      try {
        const oobiUrl = `${config.oobiEndpoint}/oobi/${schemaId}`;
        console.log(`Loading schema: ${schemaId} from ${oobiUrl}`);

        // First check if the OOBI endpoint is accessible
        try {
          const response = await fetch(oobiUrl);
          if (!response.ok) {
            throw new Error(
              `OOBI endpoint returned ${response.status}: ${response.statusText}`
            );
          }
          console.log(`OOBI endpoint accessible for schema: ${schemaId}`);
        } catch (fetchError) {
          console.error(
            `OOBI endpoint not accessible for schema: ${schemaId}`,
            fetchError
          );
          return {
            schemaId,
            success: false,
            error: `OOBI endpoint not accessible: ${
              fetchError instanceof Error ? fetchError.message : "Unknown error"
            }`,
          };
        }

        // Try to resolve the OOBI with increased timeout
        await resolveOobi(client, oobiUrl, 30000); // 30 second timeout
        console.log(`✓ Successfully loaded schema: ${schemaId}`);
        return { schemaId, success: true };
      } catch (error) {
        console.error(`✗ Failed to load schema: ${schemaId}`, error);
        return { schemaId, success: false, error };
      }
    })
  );

  // Log results
  const successful = schemaResults.filter(
    (result) => result.status === "fulfilled" && result.value.success
  );
  const failed = schemaResults.filter(
    (result) =>
      result.status === "rejected" ||
      (result.status === "fulfilled" && !result.value.success)
  );

  console.log(
    `Schema loading complete: ${successful.length} successful, ${failed.length} failed`
  );

  if (failed.length > 0) {
    console.warn(
      "Failed to load schemas:",
      failed.map((result) =>
        result.status === "fulfilled" ? result.value.schemaId : "unknown"
      )
    );
    console.warn(
      "Server will continue startup. Failed schemas can be retried later via /schemas/reload endpoint."
    );
  }

  return client;
}

async function ensureIdentifierExists(
  client: SignifyClient,
  aidName: string
): Promise<void> {
  try {
    await client.identifiers().get(aidName);
  } catch (e: any) {
    const status = e.message.split(" - ")[1];
    if (/404/gi.test(status)) {
      const result = await client.identifiers().create(aidName);
      await waitAndGetDoneOp(client, await result.op());
      await client.identifiers().get(aidName);
    } else {
      throw e;
    }
  }
}

async function ensureEndRoles(
  client: SignifyClient,
  aidName: string
): Promise<void> {
  const roles = await getEndRoles(client, aidName);

  const hasDefaultRole = roles.some((role) => role.role === EndRole.AGENT);

  if (!hasDefaultRole) {
    await client
      .identifiers()
      .addEndRole(aidName, EndRole.AGENT, client.agent!.pre);
  }

  if (
    aidName === ISSUER_NAME &&
    !roles.some((role) => role.role === EndRole.INDEXER)
  ) {
    const prefix = (await client.identifiers().get(aidName)).prefix;

    const endResult = await client
      .identifiers()
      .addEndRole(aidName, "indexer", prefix);
    await waitAndGetDoneOp(client, await endResult.op());
    const locRes = await client.identifiers().addLocScheme(aidName, {
      url: config.oobiEndpoint,
      scheme: new URL(config.oobiEndpoint).protocol.replace(":", ""),
    });
    await waitAndGetDoneOp(client, await locRes.op());
  }
}

async function ensureRegistryExists(
  client: SignifyClient,
  aidName: string
): Promise<void> {
  try {
    await getRegistry(client, aidName);
  } catch (e: any) {
    if (e.message.includes(REGISTRIES_NOT_FOUND)) {
      const result = await client
        .registries()
        .create({ name: aidName, registryName: "vLEI" });
      await waitAndGetDoneOp(client, await result.op());
    } else {
      throw e;
    }
  }
}

async function initializeCredentials(
  client: SignifyClient,
  issuerClient: SignifyClient
): Promise<string> {
  const issuerRegistry = await getRegistry(issuerClient, QVI_NAME);

  const qviCredentialId = await createQVICredential(
    client,
    issuerClient,
    issuerRegistry
  ).catch((e) => {
    console.error(e);
    return "";
  });

  const pollingService = new PollingService(client);
  pollingService.start();

  return qviCredentialId;
}

async function startServer() {
  const app = express();
  app.use(cors());
  app.use("/static", express.static("static"));
  app.use(
    "/oobi",
    express.static(join(__dirname, "schemas"), {
      setHeaders: (res) => {
        res.setHeader("Content-Type", "application/schema+json");
      },
    })
  );

  // Serve branding assets
  if (config.branding.logoPath) {
    app.get("/static/branding/logo", (req, res) => {
      res.sendFile(config.branding.logoPath, (err) => {
        if (err) {
          console.error("Error serving logo:", err);
          res.status(404).json({ error: "Logo not found" });
        }
      });
    });
  }
  app.use(bodyParser.json());
  app.use(router);
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
      error: err.message,
    });
  });

  app.listen(config.port, async () => {
    await signifyReady();
    const brans = await loadBrans();

    const signifyClient = await getSignifyClient(brans.bran);
    const signifyClientIssuer = await getSignifyClient(brans.issuerBran);

    // Ensure identifiers exist first
    await ensureIdentifierExists(signifyClient, ISSUER_NAME);
    await ensureIdentifierExists(signifyClientIssuer, QVI_NAME);

    // Add end roles before creating registries (KERIA bug workaround)
    await ensureEndRoles(signifyClient, ISSUER_NAME);
    await ensureEndRoles(signifyClientIssuer, QVI_NAME);

    // Now create registries
    await ensureRegistryExists(signifyClient, ISSUER_NAME);
    await ensureRegistryExists(signifyClientIssuer, QVI_NAME);

    app.set("signifyClient", signifyClient);
    app.set("signifyClientIssuer", signifyClientIssuer);

    const qviCredentialId = await initializeCredentials(
      signifyClient,
      signifyClientIssuer
    );
    app.set("qviCredentialId", qviCredentialId);

    log(`Listening on port ${config.port}`);
  });
}

void startServer();
