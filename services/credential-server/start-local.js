const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Load environment variables from .env.production
const envPath = path.join(__dirname, '../../.env.production');
const envContent = fs.readFileSync(envPath, 'utf8');

const envVars = {};
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=');
    if (key && valueParts.length > 0) {
      envVars[key] = valueParts.join('=');
    }
  }
});

// Replace variables in values
Object.keys(envVars).forEach(key => {
  let value = envVars[key];
  // Replace ${PUBLIC_DOMAIN} with actual value
  if (value.includes('${PUBLIC_DOMAIN}')) {
    const publicDomain = envVars.PUBLIC_DOMAIN || 'hansajayathilaka.com';
    value = value.replace(/\$\{PUBLIC_DOMAIN\}/g, publicDomain);
    envVars[key] = value;
  }
  // Replace other variables
  if (value.includes('${KERIA_HOST}')) {
    value = value.replace(/\$\{KERIA_HOST\}/g, envVars.KERIA_HOST || '');
    envVars[key] = value;
  }
  if (value.includes('${KERIA_BOOT_HOST}')) {
    value = value.replace(/\$\{KERIA_BOOT_HOST\}/g, envVars.KERIA_BOOT_HOST || '');
    envVars[key] = value;
  }
  if (value.includes('${CRED_HOST}')) {
    value = value.replace(/\$\{CRED_HOST\}/g, envVars.CRED_HOST || '');
    envVars[key] = value;
  }
});

// Set environment variables for the credential server
const serverEnv = {
  ...process.env,
  PORT: '3001',
  ENDPOINT: 'http://localhost:3001',
  OOBI_ENDPOINT: envVars.CRED_OOBI_ENDPOINT || 'http://localhost:3001',
  KERIA_ENDPOINT: envVars.CRED_KERIA_ENDPOINT || 'https://keria.hansajayathilaka.com',
  KERIA_BOOT_ENDPOINT: envVars.CRED_KERIA_BOOT_ENDPOINT || 'https://keria-boot.hansajayathilaka.com',
  CUSTOM_ORG_NAME: 'Veridian Wallet Issuer',
  ENABLE_SCHEMA_MANAGEMENT: 'true'
};

console.log('Starting credential server with environment:');
console.log('KERIA_ENDPOINT:', serverEnv.KERIA_ENDPOINT);
console.log('KERIA_BOOT_ENDPOINT:', serverEnv.KERIA_BOOT_ENDPOINT);
console.log('OOBI_ENDPOINT:', serverEnv.OOBI_ENDPOINT);
console.log('PORT:', serverEnv.PORT);

// Start the server
const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

const server = spawn(npmCmd, ['run', 'dev'], {
  cwd: __dirname,
  env: serverEnv,
  stdio: 'inherit',
  shell: true
});

server.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
});