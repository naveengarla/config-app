# Schema Design Guide

This guide provides best practices for designing schemas in the Config Service, covering both the Visual Editor and the advanced JSON Editor.

## Overview

The Config Service uses [JSON Schema Draft 07](https://json-schema.org/draft-07/json-schema-release-notes) to validate configurations. This allows for powerful validation rules, including nested objects, arrays, and complex constraints.

## Editor Modes

### Visual Editor
**Best for:** Simple, flat schemas (e.g., a list of key-value pairs).
- Supports: `string`, `integer`, `number`, `boolean`.
- Limitations: Does not currently support nested objects or arrays (coming soon).

### JSON Editor
**Best for:** Complex schemas, nested structures, and advanced validation.
- Supports: Full JSON Schema Draft 07 specification.
- Features: Syntax highlighting, error validation.

## Common Patterns

### 1. Simple Key-Value Pair
Use the **Visual Editor** for this.
```json
{
  "type": "object",
  "properties": {
    "api_key": { "type": "string" },
    "timeout": { "type": "integer" }
  },
  "required": ["api_key"]
}
```

### 2. Arrays (Lists)
Use the **JSON Editor**.
Example: A list of allowed IP addresses.
```json
{
  "type": "object",
  "properties": {
    "allowed_ips": {
      "type": "array",
      "items": {
        "type": "string",
        "format": "ipv4"
      }
    }
  }
}
```

### 3. Nested Objects (Tables/Hierarchy)
Use the **JSON Editor**.
Example: Database connection settings.
```json
{
  "type": "object",
  "properties": {
    "database": {
      "type": "object",
      "properties": {
        "host": { "type": "string" },
        "port": { "type": "integer" },
        "credentials": {
          "type": "object",
          "properties": {
            "username": { "type": "string" },
            "password": { "type": "string" }
          },
          "required": ["username", "password"]
        }
      },
      "required": ["host", "port"]
    }
  }
}
```

### 4. Enum (Dropdowns)
Use the **JSON Editor**.
Example: Environment selection.
```json
{
  "type": "object",
  "properties": {
    "environment": {
      "type": "string",
      "enum": ["dev", "staging", "prod"]
    }
  }
}
```

## Best Practices
1.  **Use Descriptions**: Always add a `description` to your fields. This helps other users understand what the config is for.
2.  **Required Fields**: Explicitly list required fields to prevent incomplete configurations.
3.  **Validation**: Use `minimum`, `maximum`, `minLength`, `pattern` (regex) to enforce strict validation.
    ```json
    "port": {
      "type": "integer",
      "minimum": 1,
      "maximum": 65535
    }
    ```
4.  **Immutable Versioning**: Remember that editing a schema creates a new version. Old configurations will continue to use the old version until they are manually updated.
