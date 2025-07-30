/**
 * Configuration module for the simplified credential server
 * Handles environment variable loading and provides default values
 */

// Configuration interfaces
export interface Config {
  port: number;
  keria: {
    url: string;
    bootUrl: string;
  };
  oobiEndpoint: string;
  paths: {
    api: string;
    invitation: string;
    credential: string;
  };
}

export interface ServerConfig {
  port: number;
  keriaUrl: string;
  keriaBootUrl: string;
  oobiEndpoint: string;
  issuerName: string;
  qviName: string;
}

// Environment variable handling with defaults
const port = process.env["PORT"] ? Number(process.env["PORT"]) : 3002;
const endpoint = process.env["ENDPOINT"] ?? `http://127.0.0.1:${port}`;
const oobiEndpoint = process.env["OOBI_ENDPOINT"] ?? endpoint;
const keriaUrl = process.env["KERIA_ENDPOINT"] ?? "http://127.0.0.1:3901";
const keriaBootUrl = process.env["KERIA_BOOT_ENDPOINT"] ?? "http://127.0.0.1:3903";
const issuerName = process.env["ISSUER_NAME"] ?? "issuer";
const qviName = process.env["QVI_NAME"] ?? "qvi";

// Main configuration object
export const config: Config = {
  port,
  keria: {
    url: keriaUrl,
    bootUrl: keriaBootUrl,
  },
  oobiEndpoint,
  paths: {
    api: "/api",
    invitation: "/api/invitation",
    credential: "/api/credential",
  },
};

// Server configuration object (alternative interface for compatibility)
export const serverConfig: ServerConfig = {
  port,
  keriaUrl,
  keriaBootUrl,
  oobiEndpoint,
  issuerName,
  qviName,
};

// Static asset paths configuration
export const staticPaths = {
  public: "public",
  css: "public/css",
  js: "public/js",
  images: "public/images",
};

// Template configuration
export const templateConfig = {
  engine: "ejs",
  viewsDir: "src/views",
  partialsDir: "src/views/partials",
};

// Export default configuration
export default config;