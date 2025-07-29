# Schema Management API Documentation

This document describes the REST API endpoints for managing custom credential schemas.

## Base URL

All endpoints are relative to the server base URL (typically `http://localhost:3001`).

## Endpoints

### 1. List Custom Schemas

**GET** `/schemas/custom`

Lists all custom schemas stored in the system.

**Query Parameters:**
- `active` (optional): Set to `true` to filter only active schemas

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "employee-credential",
      "name": "Employee Credential",
      "version": "1.0.0",
      "description": "Standard employee credential schema",
      "fields": [...],
      "metadata": {...},
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "count": 1
}
```

### 2. Get Schema by ID

**GET** `/schemas/custom/:id`

Retrieves a specific custom schema by its ID.

**Parameters:**
- `id` (required): The schema ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "employee-credential",
    "name": "Employee Credential",
    "version": "1.0.0",
    "description": "Standard employee credential schema",
    "fields": [
      {
        "name": "employeeId",
        "type": "string",
        "required": true,
        "displayName": "Employee ID",
        "description": "Unique employee identifier",
        "validation": [
          {
            "type": "minLength",
            "value": 3,
            "message": "Employee ID must be at least 3 characters"
          }
        ]
      }
    ],
    "metadata": {
      "author": "HR Department",
      "organization": "Example Corp",
      "category": "Employee",
      "tags": ["employee", "hr"],
      "isActive": true,
      "isPublic": false
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 3. Create New Schema

**POST** `/schemas/custom`

Creates a new custom schema.

**Request Body:**
```json
{
  "id": "employee-credential",
  "name": "Employee Credential",
  "version": "1.0.0",
  "description": "Standard employee credential schema",
  "fields": [
    {
      "name": "employeeId",
      "type": "string",
      "required": true,
      "displayName": "Employee ID",
      "description": "Unique employee identifier",
      "validation": [
        {
          "type": "minLength",
          "value": 3,
          "message": "Employee ID must be at least 3 characters"
        }
      ]
    },
    {
      "name": "fullName",
      "type": "string",
      "required": true,
      "displayName": "Full Name",
      "description": "Employee full name"
    },
    {
      "name": "email",
      "type": "email",
      "required": true,
      "displayName": "Email Address",
      "description": "Employee email address"
    }
  ],
  "metadata": {
    "author": "HR Department",
    "organization": "Example Corp",
    "category": "Employee",
    "tags": ["employee", "hr"],
    "isActive": true,
    "isPublic": false
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* created schema */ },
  "message": "Custom schema created successfully"
}
```

### 4. Update Schema

**PUT** `/schemas/custom/:id`

Updates an existing custom schema.

**Parameters:**
- `id` (required): The schema ID

**Request Body:** Same as create schema, but the ID must match the URL parameter.

**Response:**
```json
{
  "success": true,
  "data": { /* updated schema */ },
  "message": "Custom schema updated successfully"
}
```

### 5. Delete Schema

**DELETE** `/schemas/custom/:id`

Deletes a custom schema.

**Parameters:**
- `id` (required): The schema ID

**Response:**
```json
{
  "success": true,
  "message": "Schema 'employee-credential' deleted successfully"
}
```

### 6. Validate Credential Data

**POST** `/schemas/custom/:id/validate`

Validates credential data against a specific schema.

**Parameters:**
- `id` (required): The schema ID

**Request Body:**
```json
{
  "employeeId": "EMP001",
  "fullName": "John Doe",
  "email": "john.doe@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "errors": [],
    "schemaId": "employee-credential",
    "schemaName": "Employee Credential"
  }
}
```

## Field Types

The following field types are supported:

- `string`: Text field
- `number`: Numeric field
- `boolean`: True/false field
- `date`: Date field (ISO 8601 format)
- `email`: Email address field (with validation)
- `url`: URL field (with validation)

## Validation Rules

Fields can have the following validation rules:

- `minLength`: Minimum string length
- `maxLength`: Maximum string length
- `pattern`: Regular expression pattern
- `min`: Minimum numeric value
- `max`: Maximum numeric value
- `required`: Field is required (set via `required` property)

## Error Responses

All endpoints return error responses in the following format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": "Additional error details (optional)",
    "field": "field-name (for field-specific errors)"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Common Error Codes

- `SCHEMA_NOT_FOUND`: Schema with specified ID not found
- `SCHEMA_ALREADY_EXISTS`: Schema with specified ID already exists
- `SCHEMA_VALIDATION_FAILED`: Schema structure validation failed
- `INVALID_SCHEMA_ID`: Invalid or missing schema ID
- `INVALID_REQUEST_BODY`: Invalid request body format
- `SCHEMA_ID_MISMATCH`: Schema ID in URL doesn't match request body
- `VALIDATION_ERROR`: General validation error
- `SCHEMA_LIST_ERROR`: Error retrieving schema list
- `SCHEMA_CREATION_ERROR`: Error creating schema
- `SCHEMA_UPDATE_ERROR`: Error updating schema
- `SCHEMA_DELETION_ERROR`: Error deleting schema

## Configuration

The schema management system can be configured using environment variables:

- `CUSTOM_SCHEMAS_PATH`: Path to store custom schemas (default: `./data/schemas`)
- `ENABLE_SCHEMA_MANAGEMENT`: Enable schema management features (default: `false`)
- `SCHEMA_VALIDATION_STRICT`: Enable strict schema validation (default: `true`)