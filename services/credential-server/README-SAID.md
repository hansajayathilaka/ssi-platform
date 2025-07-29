# SAID-Based Schema Management

This document explains how to use the SAID (Self-Addressing Identifier) based schema management system as described in the documentation.

## Overview

The system now supports proper KERI-compliant schema management with:
- JSON Schema Draft 2020-12 compliance
- SAID computation using the official `saidify` library
- Registry creation for each schema
- Proper KERI integration

## Installation

First, install the required dependencies:

```bash
npm install saidify
```

## Quick Start

### 1. Create a JSON Schema

Create a JSON Schema compliant with Draft 2020-12:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "",
  "title": "EmployeeRecord",
  "type": "object",
  "properties": {
    "credentialSubject": {
      "type": "object",
      "properties": {
        "employeeId": { "type": "string" },
        "department": { "type": "string" }
      },
      "required": ["employeeId", "department"]
    }
  },
  "required": ["credentialSubject"]
}
```

### 2. SAIDify the Schema

#### Option A: Using CLI Tool

```bash
# Using npm script
npm run saidify -- schema.json > schema.said.json

# Using built binary (after npm run build)
saidify schema.json > schema.said.json

# With options
saidify -i schema.json -o schema.said.json
```

#### Option B: Using API

```bash
curl -X POST http://localhost:3001/schemas/saidify \
  -H "Content-Type: application/json" \
  -d @schema.json
```

#### Option C: Programmatically

```typescript
import { saidify } from 'saidify';

const schema = {
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "",
  "title": "EmployeeRecord",
  // ... rest of schema
};

const [said, sad] = saidify(schema, '$id');
const saidifiedSchema = JSON.parse(sad);
console.log(`SAID: ${said}`);
```

### 3. Create a Registry

```bash
curl -X POST http://localhost:3001/registries \
  -H "Content-Type: application/json" \
  -d '{
    "name": "issuer",
    "registryName": "Employee Registry",
    "schemaId": "your_schema_said_here"
  }'
```

### 4. Issue Credentials

```bash
curl -X POST http://localhost:3001/issueAcdcCredential \
  -H "Content-Type: application/json" \
  -d '{
    "schemaSaid": "your_schema_said_here",
    "aid": "holder_aid_here",
    "attribute": {
      "employeeId": "EMP-001",
      "department": "Engineering"
    }
  }'
```

## API Endpoints

### Schema Management

- `POST /schemas/saidify` - SAIDify a JSON schema
- `POST /schemas/convert` - Convert custom schema to JSON Schema and SAIDify
- `POST /schemas/validate-said` - Validate a schema's SAID

### Registry Management

- `POST /registries` - Create a new registry
- `GET /registries` - List all registries
- `GET /registries/:id` - Get registry by ID
- `DELETE /registries/:id` - Delete a registry
- `POST /registries/for-schema` - Get or create registry for a schema

### Existing Endpoints

All existing custom schema endpoints remain available:
- `GET /schemas/custom` - List custom schemas
- `POST /schemas/custom` - Create custom schema
- `PUT /schemas/custom/:id` - Update custom schema
- `DELETE /schemas/custom/:id` - Delete custom schema

## Workflow Example

See `examples/schema-workflow.ts` for a complete example:

```bash
cd services/credential-server
npm run dev  # Start the server
ts-node examples/schema-workflow.ts  # Run the example
```

## CLI Tool Usage

The `saidify` CLI tool supports the following options:

```
Usage: saidify [options] [input-file]

Options:
  -i, --input <file>      Input JSON schema file (default: stdin)
  -o, --output <file>     Output file (default: stdout)
  -l, --label <label>     Field label for SAID (default: $id)
  -h, --help             Show help message
  -v, --version          Show version information

Examples:
  saidify schema.json                           # Output to stdout
  saidify -i schema.json -o schema.said.json    # Specify input/output files
  saidify --label d schema.json                 # Use 'd' field for SAID
```

## Schema Validation

The system validates:
- JSON Schema Draft 2020-12 compliance
- SAID correctness using the `saidify` library
- Schema structure and field definitions
- Credential data against schema requirements

## Integration with Existing System

The SAID-based system integrates seamlessly with the existing custom schema system:

1. **Backward Compatibility**: Existing custom schemas continue to work
2. **Hybrid Support**: Both SAID-based and simple ID-based schemas are supported
3. **Automatic Registry Management**: Registries are created automatically for SAID-based schemas
4. **Enhanced Validation**: SAID-based schemas get additional cryptographic validation

## Error Handling

Common errors and solutions:

### Invalid SAID
```json
{
  "success": false,
  "error": {
    "code": "INVALID_SCHEMA_SAID",
    "message": "Schema SAID is invalid or missing. Please saidify the schema first."
  }
}
```
**Solution**: Ensure the schema is properly SAIDified using the `saidify` tool or API.

### Registry Creation Failed
```json
{
  "success": false,
  "error": {
    "code": "REGISTRY_CREATION_ERROR",
    "message": "Failed to create registry"
  }
}
```
**Solution**: Check KERI client connection and issuer configuration.

## Best Practices

1. **Always SAIDify**: Use proper SAID computation for all schemas
2. **Validate SAIDs**: Verify SAID correctness before using schemas
3. **Registry Management**: Create dedicated registries for each schema type
4. **Schema Versioning**: Use new SAIDs for schema changes
5. **Backup Schemas**: Keep copies of both original and SAIDified schemas

## Development

To extend the SAID functionality:

1. **Add New Hash Algorithms**: Extend the `saidify` library integration
2. **Custom Validation**: Add schema-specific validation rules
3. **Registry Policies**: Implement custom registry management policies
4. **Schema Discovery**: Add schema registry and discovery features

## Testing

Run the test suite:

```bash
npm test
```

Test specific SAID functionality:

```bash
npm test -- --grep "SAID"
```

## Troubleshooting

### SAID Computation Issues
- Ensure JSON is properly formatted
- Check that the `$id` field is empty before saidification
- Verify the `saidify` library is properly installed

### Registry Issues
- Confirm KERI client is connected
- Check issuer identifier exists
- Verify registry permissions

### Credential Issuance Issues
- Validate schema SAID format
- Ensure registry exists for the schema
- Check credential data matches schema requirements

For more help, see the examples directory or check the API documentation.