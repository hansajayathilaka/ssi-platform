/**
 * Schema Workflow Example
 * 
 * This example demonstrates the complete workflow described in the documentation:
 * 1. Create a JSON Schema
 * 2. SAIDify the schema
 * 3. Create a registry
 * 4. Issue credentials using the schema
 */

import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { saidify } from 'saidify';

// Configuration
const SERVER_URL = 'http://localhost:3001';
const ISSUER_NAME = 'issuer';

interface JsonSchema {
  $schema: string;
  $id: string;
  title: string;
  type: string;
  properties: Record<string, any>;
  required: string[];
}

/**
 * Step 1: Create and SAIDify a JSON Schema
 */
async function createAndSaidifySchema(): Promise<JsonSchema> {
  console.log('Step 1: Creating and SAIDifying JSON Schema...');
  
  // Load the example schema
  const schemaPath = path.join(__dirname, 'employee-schema.json');
  const schemaContent = fs.readFileSync(schemaPath, 'utf8');
  const schema = JSON.parse(schemaContent) as JsonSchema;
  
  console.log('Original schema:', JSON.stringify(schema, null, 2));
  
  // SAIDify the schema using the saidify library
  const schemaForSaid = { ...schema, $id: '' };
  const [said, sad] = saidify(schemaForSaid, '$id');
  
  const saidifiedSchema = JSON.parse(sad) as JsonSchema;
  
  console.log(`Computed SAID: ${said}`);
  console.log('SAIDified schema:', JSON.stringify(saidifiedSchema, null, 2));
  
  // Save the saidified schema
  const saidifiedPath = path.join(__dirname, 'employee-schema.said.json');
  fs.writeFileSync(saidifiedPath, JSON.stringify(saidifiedSchema, null, 2));
  
  console.log(`SAIDified schema saved to: ${saidifiedPath}`);
  
  return saidifiedSchema;
}

/**
 * Step 2: Create a registry for the schema
 */
async function createRegistry(schemaSaid: string): Promise<string> {
  console.log('Step 2: Creating registry for schema...');
  
  try {
    const response = await axios.post(`${SERVER_URL}/registries`, {
      name: ISSUER_NAME,
      registryName: `Employee Registry for ${schemaSaid}`,
      schemaId: schemaSaid
    });
    
    const registryInfo = response.data.data;
    console.log('Registry created:', registryInfo);
    
    return registryInfo.registryId;
  } catch (error) {
    console.error('Error creating registry:', error);
    throw error;
  }
}

/**
 * Step 3: Issue a credential using the schema
 */
async function issueCredential(schemaSaid: string, holderAid: string): Promise<void> {
  console.log('Step 3: Issuing credential...');
  
  // Prepare credential data according to the schema
  const credentialSubject = {
    employeeId: "EMP-001",
    fullName: "John Doe",
    department: "Engineering",
    email: "john.doe@company.com",
    startDate: "2024-01-15"
  };
  
  try {
    const response = await axios.post(`${SERVER_URL}/issueAcdcCredential`, {
      schemaSaid: schemaSaid,
      aid: holderAid,
      attribute: credentialSubject
    });
    
    console.log('Credential issued successfully:', response.data);
  } catch (error) {
    console.error('Error issuing credential:', error);
    throw error;
  }
}

/**
 * Step 4: Validate the schema SAID
 */
async function validateSchemaSaid(schema: JsonSchema): Promise<boolean> {
  console.log('Step 4: Validating schema SAID...');
  
  try {
    const response = await axios.post(`${SERVER_URL}/schemas/validate-said`, schema);
    
    const isValid = response.data.data.isValid;
    console.log(`Schema SAID validation result: ${isValid}`);
    
    return isValid;
  } catch (error) {
    console.error('Error validating schema SAID:', error);
    throw error;
  }
}

/**
 * Alternative: Use the API to SAIDify a schema
 */
async function saidifySchemaViaApi(schema: JsonSchema): Promise<JsonSchema> {
  console.log('Alternative: SAIDifying schema via API...');
  
  try {
    const response = await axios.post(`${SERVER_URL}/schemas/saidify`, schema);
    
    const saidifiedSchema = response.data.data;
    console.log('Schema saidified via API:', saidifiedSchema);
    
    return saidifiedSchema;
  } catch (error) {
    console.error('Error saidifying schema via API:', error);
    throw error;
  }
}

/**
 * Main workflow execution
 */
async function runWorkflow(): Promise<void> {
  try {
    console.log('=== Schema Management Workflow Example ===\n');
    
    // Step 1: Create and SAIDify schema
    const saidifiedSchema = await createAndSaidifySchema();
    const schemaSaid = saidifiedSchema.$id;
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Step 2: Validate the SAID
    await validateSchemaSaid(saidifiedSchema);
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Step 3: Create registry
    const registryId = await createRegistry(schemaSaid);
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Step 4: Issue credential (requires a valid holder AID)
    // Note: This would need a real holder AID in a real scenario
    const holderAid = 'EExample_holder_aid_here';
    console.log(`Would issue credential to holder: ${holderAid}`);
    console.log('(Skipping actual credential issuance - requires valid KERI setup)');
    
    // await issueCredential(schemaSaid, holderAid);
    
    console.log('\n=== Workflow completed successfully! ===');
    
  } catch (error) {
    console.error('Workflow failed:', error);
    process.exit(1);
  }
}

/**
 * CLI usage example
 */
async function demonstrateCliUsage(): Promise<void> {
  console.log('\n=== CLI Usage Example ===\n');
  
  const schemaPath = path.join(__dirname, 'employee-schema.json');
  const outputPath = path.join(__dirname, 'employee-schema.cli.said.json');
  
  console.log('CLI command to saidify schema:');
  console.log(`npm run saidify -- -i ${schemaPath} -o ${outputPath}`);
  console.log('\nOr using the built binary:');
  console.log(`saidify ${schemaPath} > ${outputPath}`);
}

// Run the workflow if called directly
if (require.main === module) {
  runWorkflow()
    .then(() => demonstrateCliUsage())
    .catch(console.error);
}

export {
  createAndSaidifySchema,
  createRegistry,
  issueCredential,
  validateSchemaSaid,
  saidifySchemaViaApi,
  runWorkflow
};