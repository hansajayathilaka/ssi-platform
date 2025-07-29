# Automatic SAID Generation for Custom Schemas

## Overview

When creating or updating custom schemas, the system now automatically generates a SAID (Self-Addressing Identifier) using the `saidify` library. This ensures that each schema has a unique, cryptographically verifiable identifier.

## ✅ Implementation Status

**COMPLETED**: Automatic SAID generation is now fully implemented and tested:

- ✅ Backend API automatically generates SAIDs for new schemas
- ✅ UI updated to not require manual ID input for new schemas  
- ✅ Schema storage service handles SAID-based filenames
- ✅ Update operations generate new SAIDs when content changes
- ✅ Unit tests pass with SAID generation
- ✅ Backward compatibility maintained for existing schemas

## How It Works

### Schema Creation
1. When a new schema is submitted via `POST /schemas/custom`, the system:
   - Validates the schema structure
   - Converts the custom schema format to JSON Schema
   - Generates a SAID using the `saidify` library
   - Uses the generated SAID as the schema ID
   - Saves the schema file with the SAID as the filename

### Schema Updates
1. When a schema is updated via `PUT /schemas/custom/:id`, the system:
   - Validates the updated schema structure
   - Generates a new SAID for the updated content
   - If the SAID changes (content changed), deletes the old schema file
   - Saves the schema with the new SAID

## SAID Generation Process

The SAID generation follows these steps:

1. **Convert to JSON Schema**: The custom schema format is converted to a standard JSON Schema Draft 2020-12 format
2. **Saidify**: The `saidify` library computes a Blake3-256 hash of the schema content
3. **Assign ID**: The computed SAID becomes the schema's unique identifier

## File Storage

Schemas are stored as JSON files in the configured schemas directory:
- Filename format: `{SAID}.json`
- Example: `EOHVcOHvDMXeizlUSPMNXcRfOfjEzze7gmUJaHWb6vuz.json`

## Benefits

1. **Uniqueness**: SAIDs are cryptographically unique based on content
2. **Integrity**: Any change to schema content results in a new SAID
3. **Verification**: Schema integrity can be verified by recomputing the SAID
4. **Immutability**: Content cannot be changed without changing the identifier

## API Changes

### Create Schema Response
```json
{
  "success": true,
  "data": {
    "id": "EOHVcOHvDMXeizlUSPMNXcRfOfjEzze7gmUJaHWb6vuz",
    "name": "KYC Credential",
    // ... other schema fields
  },
  "message": "Custom schema created successfully with generated SAID"
}
```

### Update Schema Response
```json
{
  "success": true,
  "data": {
    "id": "ENewSaidGeneratedForUpdatedContent123456789",
    "name": "Updated KYC Credential",
    // ... other schema fields
  },
  "message": "Custom schema updated successfully with new SAID",
  "oldId": "EOHVcOHvDMXeizlUSPMNXcRfOfjEzze7gmUJaHWb6vuz",
  "newId": "ENewSaidGeneratedForUpdatedContent123456789"
}
```

## Error Handling

If SAID generation fails, the API returns:
```json
{
  "success": false,
  "error": {
    "code": "SAID_GENERATION_ERROR",
    "message": "Failed to generate SAID for schema",
    "details": "Specific error details"
  }
}
```

## Backward Compatibility

- Existing schemas with manually assigned IDs continue to work
- New schemas automatically get SAID-based IDs
- The system can handle both types of identifiers