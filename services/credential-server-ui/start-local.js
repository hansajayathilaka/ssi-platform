import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.production
const envPath = path.join(__dirname, "../../.env.production");
const envContent = fs.readFileSync(envPath, "utf8");

const envVars = {};
envContent.split("\n").forEach((line) => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith("#")) {
    const [key, ...valueParts] = trimmed.split("=");
    if (key && valueParts.length > 0) {
      envVars[key] = valueParts.join("=");
    }
  }
});

// Replace variables in values
Object.keys(envVars).forEach((key) => {
  let value = envVars[key];
  // Replace ${PUBLIC_DOMAIN} with actual value
  if (value.includes("${PUBLIC_DOMAIN}")) {
    const publicDomain = envVars.PUBLIC_DOMAIN || "hansajayathilaka.com";
    value = value.replace(/\$\{PUBLIC_DOMAIN\}/g, publicDomain);
    envVars[key] = value;
  }
  // Replace other variables
  if (value.includes("${CRED_HOST}")) {
    value = value.replace(/\$\{CRED_HOST\}/g, envVars.CRED_HOST || "");
    envVars[key] = value;
  }
});

// Set environment variables for the UI
const uiEnv = {
  ...process.env,
  PORT: "3000",
  VITE_SERVER_URL: envVars.CRED_UI_SERVER_URL || "http://localhost:3001",
  VITE_API_BASE_URL: "http://localhost:3001",
};

console.log("Starting credential server UI with environment:");
console.log("VITE_SERVER_URL:", uiEnv.VITE_SERVER_URL);
console.log("VITE_API_BASE_URL:", uiEnv.VITE_API_BASE_URL);
console.log("PORT:", uiEnv.PORT);

// Start the UI
const isWindows = process.platform === "win32";
const npmCmd = isWindows ? "npm.cmd" : "npm";

const ui = spawn(npmCmd, ["run", "dev"], {
  cwd: __dirname,
  env: uiEnv,
  stdio: "inherit",
  shell: true,
});

ui.on("close", (code) => {
  console.log(`UI process exited with code ${code}`);
});
