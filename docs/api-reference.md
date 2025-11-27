# Config Service - API Reference

## Base URL

```
http://localhost:8001  (Development)
https://config.company.com  (Production)
```

## Authentication

Currently: None (open access)  
Production: API Key or OAuth2 recommended

---

## Namespaces API

### List Namespaces

```http
GET /namespaces/
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "platform",
    "description": "Platform-wide configurations",
    "created_at": "2025-11-27T20:00:00Z"
  }
]
```

### Create Namespace

```http
POST /namespaces/
Content-Type: application/json

{
  "name": "my-service",
  "description": "Configurations for my-service"
}
```

**Response:** `201 Created`

---

## Schemas API

### List Schemas

```http
GET /schemas/
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "UseCases",
    "version": 1,
    "structure": {...},
    "created_at": "2025-11-27T20:00:00Z"
  }
]
```

### Create Schema

```http
POST /schemas/
Content-Type: application/json

{
  "name": "FeatureFlags",
  "structure": {
    "type": "object",
    "properties": {
      "feature_name": {"type": "string"},
      "enabled": {"type": "boolean"}
    },
    "required": ["feature_name", "enabled"]
  }
}
```

**Response:** `200 OK`

---

## Configurations API

### List Configurations

```http
GET /configs/
```

**Query Parameters:**
- `namespace_id` (optional): Filter by namespace
- `schema_id` (optional): Filter by schema

### Get Configuration

```http
GET /configs/{id}
```

### Create Configuration

```http
POST /configs/
Content-Type: application/json

{
  "namespace_id": 1,
  "schema_id": 1,
  "key": "active_usecases",
  "value": [...]
}
```

**Validation**: Value is validated against schema structure before saving.

### Update Configuration

```http
PUT /configs/{id}
Content-Type: application/json

{
  "value": [...]
}
```

**Note**: Creates new version in history.

### Delete Configuration

```http
DELETE /configs/{id}
```

---

## Reference Data API ⭐

Optimized endpoints for external service consumption.

### Get Full Configuration

```http
GET /reference/{namespace}/{key}
```

**Parameters:**
- `resolve_vault` (query, optional): Resolve vault:// references

**Example:**
```http
GET /reference/platform/active_usecases
GET /reference/platform/db_connection?resolve_vault=true
```

**Response:**
```json
{
  "namespace": "platform",
  "key": "active_usecases",
  "value": [...],
  "version": 1,
  "updated_at": "2025-11-27T20:00:00Z"
}
```

### Lookup Item by ID

```http
GET /reference/{namespace}/{key}/lookup/{id}
```

**Parameters:**
- `id_field` (query, default: "id"): Field name to match

**Example:**
```http
GET /reference/platform/active_usecases/lookup/UC001?id_field=usecase_id
```

**Response:**
```json
{
  "usecase_id": "UC001",
  "name": "Customer Onboarding",
  "status": "active",
  "category": "Sales",
  "owner": "john@company.com"
}
```

**Use Case:** Validate foreign key references

### Search in Configuration

```http
GET /reference/{namespace}/{key}/search
```

**Parameters:**
- `q` (query, required): Search query (case-insensitive)

**Example:**
```http
GET /reference/platform/active_usecases/search?q=onboarding
```

**Response:**
```json
{
  "results": [...],
  "count": 2,
  "query": "onboarding"
}
```

---

## Error Responses

### 400 Bad Request

```json
{
  "detail": "Config validation failed: 'status' is a required property"
}
```

### 404 Not Found

```json
{
  "detail": "Namespace 'invalid' not found"
}
```

### 500 Internal Server Error

```json
{
  "detail": "Internal server error"
}
```

---

## Rate Limiting (Future)

Recommended limits for production:
- CRUD APIs: 100 requests/minute
- Reference APIs: 1000 requests/minute (cacheable)

---

## WebSocket Support (Future)

Real-time configuration updates:

```javascript
const ws = new WebSocket('ws://localhost:8001/ws/configs/{key}');
ws.onmessage = (event) => {
  console.log('Config updated:', JSON.parse(event.data));
};
```

---

## SDK Examples

### Python

```python
import requests

class ConfigServiceClient:
    def __init__(self, base_url):
        self.base_url = base_url
    
    def get_config(self, namespace, key):
        response = requests.get(
            f'{self.base_url}/reference/{namespace}/{key}'
        )
        return response.json()['value']
    
    def validate_reference(self, namespace, key, id_value, id_field='id'):
        response = requests.get(
            f'{self.base_url}/reference/{namespace}/{key}/lookup/{id_value}',
            params={'id_field': id_field}
        )
        return response.status_code == 200

# Usage
client = ConfigServiceClient('http://localhost:8001')
usecases = client.get_config('platform', 'active_usecases')
is_valid = client.validate_reference('platform', 'active_usecases', 'UC001', 'usecase_id')
```

### JavaScript/Node.js

```javascript
class ConfigServiceClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }
  
  async getConfig(namespace, key) {
    const response = await fetch(
      `${this.baseUrl}/reference/${namespace}/${key}`
    );
    const data = await response.json();
    return data.value;
  }
  
  async validateReference(namespace, key, idValue, idField = 'id') {
    const response = await fetch(
      `${this.baseUrl}/reference/${namespace}/${key}/lookup/${idValue}?id_field=${idField}`
    );
    return response.ok;
  }
}

// Usage
const client = new ConfigServiceClient('http://localhost:8001');
const usecases = await client.getConfig('platform', 'active_usecases');
const isValid = await client.validateReference('platform', 'active_usecases', 'UC001', 'usecase_id');
```

---

## Interactive API Documentation

FastAPI provides auto-generated interactive docs:

- **Swagger UI**: http://localhost:8001/docs
- **ReDoc**: http://localhost:8001/redoc

Use these to explore and test all API endpoints interactively.
