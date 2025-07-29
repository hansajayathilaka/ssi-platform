import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// Replicate __dirname using import.meta.url
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to the envfile.js file in the public directory
const envFilePath = join(__dirname, "../public/envfile.js");

// Get configuration from environment variables or use default values
const serverUrl = process.env.SERVER_URL || "http://localhost:3001";
const customOrgName = process.env.CUSTOM_ORG_NAME || "";
const customLogoUrl = process.env.CUSTOM_LOGO_URL || "";
const customPrimaryColor = process.env.CUSTOM_PRIMARY_COLOR || "";
const customSecondaryColor = process.env.CUSTOM_SECONDARY_COLOR || "";
const customFaviconUrl = process.env.CUSTOM_FAVICON_URL || "";
const customCssUrl = process.env.CUSTOM_CSS_URL || "";

// Content to write to envfile.js
const content = `window.__RUNTIME_CONFIG__ = {
  SERVER_URL: "${serverUrl}",
  CUSTOM_ORG_NAME: "${customOrgName}",
  CUSTOM_LOGO_URL: "${customLogoUrl}",
  CUSTOM_PRIMARY_COLOR: "${customPrimaryColor}",
  CUSTOM_SECONDARY_COLOR: "${customSecondaryColor}",
  CUSTOM_FAVICON_URL: "${customFaviconUrl}",
  CUSTOM_CSS_URL: "${customCssUrl}"
};`;

// Write the content to envfile.js
writeFileSync(envFilePath, content, "utf8");
console.log(`Updated envfile.js with SERVER_URL: ${serverUrl}`);
if (customOrgName)
  console.log(`Updated envfile.js with CUSTOM_ORG_NAME: ${customOrgName}`);
if (customLogoUrl)
  console.log(`Updated envfile.js with CUSTOM_LOGO_URL: ${customLogoUrl}`);
