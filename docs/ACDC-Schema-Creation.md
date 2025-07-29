# ACDC Schema Creation Guide

This guide explains how to create properly formatted ACDC (Attributed Credential Data Container) schemas that are compatible with KERIA agents and follow the SAIDification process.

## Overview

ACDC schemas are the proper format for credential schemas in the KERI ecosystem. They must be:
1. **Properly structured** following the ACDC specification
2. **SAIDified** with cryptographic self-addressing identifiers
3. **Accessible to KERIA agents** via the schema API

## Schema Structure

ACDC schemas follow this structure (based on `EL9oOWU_7zQn_rD--Xsgi3giCWnFDaNvFMUGTOZx1ARO`):

```json
{
  "$id": "SCHEMA_SAID_HERE",
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Your Credential Title",
  "description": "Description of the credential",
  "type": "object",
  "credentialType": "YourCredentialType",
  "version": "1.0.0",
  "properties": {
    "v": { "description": "Version", "type": "string" },
    "d": { "description": "Credential SAID", "type": "string" },
    "u": { "description": "One time use nonce", "type": "string" },
    "i": { "description": "Issuee AID", "type": "string" },
    "ri": { "description": "Credential status registry", "type": "string" },
    "s": { "description": "Schema SAID", "type": "string" },
    "a": {
      "oneOf": [
        {
          "description": "Attributes block SAID",
          "type": "string"
        },
        {
          "$id": "ATTRIBUTES_BLOCK_SAID",
          "description": "Attributes block",
          "type": "object",
          "properties": {
            "d": { "description": "Attributes block SAID", "type": "string" },
            "i": { "description": "Issuee AID", "type": "string" },
            "dt": { "description": "Issuance date time", "type": "string", "format": "date-time" },
            // Your custom attributes here
          },
          "additionalProperties": false,
          "required": ["i", "dt", /* your required fields */]
        }
      ]
    }
  },
  "additionalProperties": false,
  "required": ["i", "ri", "s", "d", "a"]
}
```

## Methods to Create ACDC Schemas

### Method 1: Backend API

#### Create New ACDC Schema
```bash
POST /api/schemas/acdc
Content-Type: application/json

{
  "title": "Employee Credential",
  "description": "Credential for company employees",
  "credentialType": "EmployeeCredential",
  "version": "1.0.0",
  "attributes": {
    "firstName": {
      "description": "Employee's first name",
      "type": "string",
      "required": true
    },
    "lastName": {
      "description": "Employee's last name", 
      "type": "string",
      "required": true
    },
    "email": {
      "description": "Employee's email address",
      "type": "string",
      "format": "email",
      "required": true
    },
    "department": {
      "description": "Employee's department",
      "type": "string",
      "required": false
    }
  }
}
```

#### Convert Custom Schema to ACDC
```bash
POST /api/schemas/acdc/convert?save=true
Content-Type: application/json

{
  "name": "Employee Schema",
  "description": "Employee information",
  "fields": [
    {
      "name": "firstName",
      "type": "string",
      "required": true,
      "displayName": "First Name",
      "description": "Employee's first name"
    }
  ]
}
```

### Method 2: CLI Tool

Run the interactive CLI tool:

```bash
cd services/credential-server
npm run create-acdc-schema
```

This will guide you through:
1. Basic schema information (title, description, etc.)
2. Attribute definitions with validation rules
3. Automatic SAIDification
4. Saving to both schema directories

### Method 3: Frontend UI

Use the React components:

1. **CreateAcdcSchemaModal** - Create new ACDC schemas
2. **ConvertToAcdcModal** - Convert existing custom schemas

```tsx
import CreateAcdcSchemaModal from './components/CreateAcdcSchemaModal';
import ConvertToAcdcModal from './components/ConvertToAcdcModal';

// Usage
<CreateAcdcSchemaModal
  visible={showCreateModal}
  onCancel={() => setShowCreateModal(false)}
  onSuccess={(schema) => {
    console.log('Created schema:', schema);
    // Refresh schema list
  }}
/>
```

## SAIDification Process

The SAIDification process follows the steps in `docs/How do I properly SAIDify my schema before issuing.md`:

1. **Create schema template** with empty `$id` fields
2. **SAIDify attributes block** first (nested SAID)
3. **SAIDify main schema** with the attributes block SAID included
4. **Save with SAID as filename**

This is handled automatically by the `saidifySchema` function in `src/utils/said.utils.ts`.

## File Storage

Schemas are saved to both locations for maximum compatibility:

1. **Built-in schemas**: `services/credential-server/src/schemas/{SAID}` (no extension)
   - Accessible to KERIA agents
   - Included in builds
   
2. **Custom schemas**: `services/credential-server/data/schemas/{SAID}.json`
   - Managed via API
   - Persistent data

Both are served via the same endpoint: `GET /schemas/{SAID}`

## KERIA Agent Compatibility

Properly created ACDC schemas are automatically compatible with KERIA agents because they:

1. **Follow ACDC specification** with all required fields
2. **Have valid SAIDs** computed using the saidify library
3. **Are accessible via API** at `/schemas/{SAID}`
4. **Include proper metadata** like credentialType and version

## Verification

After creating a schema, verify it works:

```bash
# Check schema is accessible
curl http://localhost:3001/schemas/YOUR_SAID

# List all schemas (should include your new one)
curl http://localhost:3001/schemas

# Validate SAID is correct
curl -X POST http://localhost:3001/schemas/validate-said \
  -H "Content-Type: application/json" \
  -d @your-schema.json
```

## Example: Complete Employee Schema

Here's a complete example of creating an employee credential schema:

```typescript
import { createAndSaidifyAcdcSchema } from './utils/acdc-schema.utils';

const employeeSchema = createAndSaidifyAcdcSchema({
  title: "Employee Credential",
  description: "Credential issued to company employees",
  credentialType: "EmployeeCredential",
  version: "1.0.0",
  attributes: {
    firstName: {
      description: "Employee's first name",
      type: "string",
      required: true,
      minLength: 1,
      maxLength: 50
    },
    lastName: {
      description: "Employee's last name",
      type: "string", 
      required: true,
      minLength: 1,
      maxLength: 50
    },
    email: {
      description: "Employee's email address",
      type: "string",
      format: "email",
      required: true
    },
    employeeId: {
      description: "Unique employee identifier",
      type: "string",
      required: true,
      pattern: "^EMP[0-9]{6}$"
    },
    department: {
      description: "Employee's department",
      type: "string",
      required: false
    },
    startDate: {
      description: "Employment start date",
      type: "string",
      format: "date",
      required: true
    }
  }
});

console.log('Generated SAID:', employeeSchema.$id);
```

## Troubleshooting

### Common Issues

1. **Schema not found by KERIA**
   - Verify SAID matches filename exactly
   - Check schema is in `src/schemas/` directory
   - Ensure no file extension for built-in schemas

2. **Invalid SAID errors**
   - Use the saidify library for SAID generation
   - Don't manually create SAIDs
   - Verify schema structure before SAIDification

3. **Validation failures**
   - Ensure all required ACDC fields are present
   - Check attributes block has proper structure
   - Verify JSON Schema compliance

### Debug Commands

```bash
# Test SAID generation
npm run saidify -- your-schema.json

# Validate schema structure
curl -X POST http://localhost:3001/schemas/validate-said \
  -H "Content-Type: application/json" \
  -d @your-schema.json

# Check if schema is accessible
curl http://localhost:3001/schemas/YOUR_SAID
```

## Best Practices

1. **Use descriptive names** for credentialType (e.g., "EmployeeCredential", not "Employee")
2. **Include proper validation** rules for attributes (minLength, pattern, etc.)
3. **Test with KERIA** after creating schemas
4. **Version your schemas** when making changes
5. **Document your attributes** with clear descriptions
6. **Use standard formats** (email, date, uri) when appropriate

This ensures your schemas work seamlessly with KERIA agents and follow ACDC best practices.