// Get the server URL from Vite environment variables
const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:3001";

// Define the config object
const config = {
  endpoint: serverUrl,
  path: {
    ping: "/ping",
    getConnectionByDid: "/getConnectionByDid",
    invitation: "/invitation",
    credential: "/credential",
    invitationWithCredential: "/offerCredentialWithConnection",
    invitationWithCredentialConnectionless:
      "/offerCredentialWithConnectionLess",
    credentials: {
      summit: "/credentials/schemas/summit/v1",
    },
    keriOobi: "/keriOobi",
    issueAcdcCredential: "/issueAcdcCredential",
    schemaOobi: "/oobi/:id",
    contacts: "/contacts",
    deleteContact: "/deleteContact",
    contactCredentials: "/contactCredentials",
    resolveOobi: "/resolveOobi",
    requestDisclosure: "/requestDisclosure",
    revokeCredential: "/revokeCredential",
    schemas: "/schemas",
    branding: "/branding",
  },
};

export { config };
