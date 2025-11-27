# Config Service - Complete Architecture Documentation

## Table of Contents
1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Data Model](#data-model)
4. [API Design](#api-design)
5. [Key Features](#key-features)
6. [Security & Best Practices](#security--best-practices)

---

## Overview

The Generic Configuration Service is a **schema-driven, zero-code configuration management platform** that enables centralized management of any configuration type without requiring code changes or database migrations.

### Core Principles

1. **Schema-First**: Define structure once using JSON Schema, use forever
2. **Zero-Code Extensibility**: Add new config types without touching code
3. **Reference Data Support**: Optimized APIs for FK lookups by external services
4. **Version Controlled**: Full audit trail of all configuration changes
5. **Namespace Isolation**: Multi-tenant support via namespaces

### Key Differentiators

- ✅ **No database migrations needed** - JSON storage with schema validation
- ✅ **Template library** - 14+ pre-built schemas for common patterns
- ✅ **Reference data APIs** - Optimized endpoints for FK validation
- ✅ **Secret management** - Azure Key Vault integration
- ✅ **Multi-namespace** - Logical isolation for teams/services

---

## System Architecture

### High-Level Architecture

```mermaid
graph TB
    subgraph "External Services"
        A[Service A]
        B[Service B]
        C[Service C]
    end
    
    subgraph "Config Service"
        UI[Web UI<br/>SPA]
        API[FastAPI<br/>Backend]
        Templates[Template<br/>Library]
        
        subgraph "Storage"
            DB[(SQLite<br/>Database)]
            KV[Azure Key Vault<br/>Secrets]
        end
    end
    
    A -->|Reference API| API
    B -->|Reference API| API
    C -->|Reference API| API
    
    UI -->|REST API| API
    API -->|Read/Write| DB
    API -->|Resolve Secrets| KV
    UI -->|Load Templates| Templates
    
    classDef external fill:#e1f5ff,stroke:#0288d1
    classDef service fill:#fff3e0,stroke:#f57c00
    classDef storage fill:#f3e5f5,stroke:#7b1fa2
    
    class A,B,C external
    class UI,API,Templates service
    class DB,KV storage
```

### Component Architecture

```mermaid
graph LR
    subgraph "Frontend Layer"
        SPA[Single Page App]
        Components[React-like Components]
        TemplatePicker[Template Picker]
    end
    
    subgraph "API Layer"
        CRUD[CRUD Routers]
        RefData[Reference Data Router]
        Validation[Schema Validation]
    end
    
    subgraph "Data Layer"
        ORM[SQLAlchemy ORM]
        Models[Data Models]
        History[Version History]
    end
    
    subgraph "Integration Layer"
        KeyVault[Key Vault Client]
        Cache[Future: Redis Cache]
    end
    
    SPA --> Components
    Components --> TemplatePicker
    Components -->|HTTP| CRUD
    Components -->|HTTP| RefData
    
    CRUD --> Validation
    RefData --> Validation
    Validation --> ORM
    ORM --> Models
    Models --> History
    
    Validation -->|Resolve Secrets| KeyVault
    RefData -->|Future| Cache
    
    classDef frontend fill:#e8f5e9,stroke:#388e3c
    classDef api fill:#fff3e0,stroke:#f57c00
    classDef data fill:#e1f5ff,stroke:#0288d1
    classDef integration fill:#f3e5f5,stroke:#7b1fa2
    
    class SPA,Components,TemplatePicker frontend
    class CRUD,RefData,Validation api
    class ORM,Models,History data
    class KeyVault,Cache integration
```

---

## Data Model

### Entity Relationship Diagram

```mermaid
erDiagram
    Namespace ||--o{ ConfigEntry : contains
    ConfigSchema ||--o{ ConfigEntry : defines
    ConfigEntry ||--o{ ConfigHistory : tracks
    
    Namespace {
        int id PK
        string name UK
        string description
        datetime created_at
    }
    
    ConfigSchema {
        int id PK
        string name UK
        int version
        json structure
        datetime created_at
    }
    
    ConfigEntry {
        int id PK
        int namespace_id FK
        int schema_id FK
        string key
        json value
        int version
        datetime created_at
        datetime updated_at
    }
    
    ConfigHistory {
        int id PK
        int config_id FK
        json value
        int version
        datetime created_at
    }
```

### Data Model Explanation

**Namespace**
- Logical isolation unit (e.g., "platform", "mbd", "tsa")
- Groups related configurations
- Supports multi-tenancy

**ConfigSchema**
- Stores JSON Schema definition
- Validates configuration structure
- Versioned for schema evolution
- Examples: UseCases, MenuItems, LLMModels

**ConfigEntry**
- Actual configuration value (stored as JSON)
- Links to namespace and schema
- Unique constraint: (namespace_id, key)
- Versioned for tracking changes

**ConfigHistory**
- Audit trail of all changes
- Immutable history records
- Enables rollback capability

### Data Flow

```mermaid
sequenceDiagram
    participant User
    participant UI
    participant API
    participant Validation
    participant DB
    
    User->>UI: Create Config
    UI->>User: Select Template
    User->>UI: Fill Form
    UI->>API: POST /configs/
    API->>DB: Fetch Schema
    DB-->>API: Schema Structure
    API->>Validation: Validate Against Schema
    alt Valid
        Validation-->>API: ✓ Valid
        API->>DB: Save ConfigEntry
        API->>DB: Save ConfigHistory
        DB-->>API: Success
        API-->>UI: 200 OK
        UI-->>User: Success Message
    else Invalid
        Validation-->>API: ✗ Invalid
        API-->>UI: 400 Bad Request
        UI-->>User: Error Message
    end
```

---

## API Design

### API Architecture

```mermaid
graph TD
    subgraph "API Endpoints"
        NS["/namespaces/<br/>CRUD Operations"]
        SCH["/schemas/<br/>CRUD Operations"]
        CFG["/configs/<br/>CRUD Operations"]
        REF["/reference/{ns}/{key}<br/>Optimized Reads"]
    end
    
    subgraph "Core Logic"
        Valid[Schema Validation]
        History[Version Tracking]
        Resolve[Secret Resolution]
    end
    
    subgraph "Storage"
        DB[(Database)]
        KV[Key Vault]
    end
    
    NS --> DB
    SCH --> DB
    CFG --> Valid
    Valid --> History
    History --> DB
    
    REF --> Resolve
    Resolve --> DB
    Resolve --> KV
    
    classDef endpoint fill:#e8f5e9,stroke:#388e3c
    classDef logic fill:#fff3e0,stroke:#f57c00
    classDef storage fill:#e1f5ff,stroke:#0288d1
    
    class NS,SCH,CFG,REF endpoint
    class Valid,History,Resolve logic
    class DB,KV storage
```

### API Endpoints Overview

#### Core CRUD APIs

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/namespaces/` | GET | List all namespaces |
| `/namespaces/` | POST | Create namespace |
| `/schemas/` | GET | List all schemas |
| `/schemas/` | POST | Create schema |
| `/configs/` | GET | List all configs |
| `/configs/` | POST | Create config |
| `/configs/{id}` | GET | Get specific config |
| `/configs/{id}` | PUT | Update config |
| `/configs/{id}` | DELETE | Delete config |

#### Reference Data APIs (NEW)

| Endpoint | Method | Purpose | Use Case |
|----------|--------|---------|----------|
| `/reference/{namespace}/{key}` | GET | Get full config | Fetch all usecases |
| `/reference/{namespace}/{key}/lookup/{id}` | GET | Lookup by ID | Validate FK reference |
| `/reference/{namespace}/{key}/search` | GET | Search in config | Find items by text |

### API Request/Response Examples

#### Create Schema from Template

```http
POST /schemas/
Content-Type: application/json

{
  "name": "UseCases",
  "structure": {
    "type": "array",
    "items": {
      "type": "object",
      "properties": {
        "usecase_id": {"type": "string"},
        "name": {"type": "string"},
        "status": {"type": "string", "enum": ["active", "inactive"]}
      },
      "required": ["usecase_id", "name", "status"]
    }
  }
}
```

**Response:**
```json
{
  "id": 1,
  "name": "UseCases",
  "version": 1,
  "structure": {...},
  "created_at": "2025-11-27T20:00:00Z"
}
```

#### Create Configuration

```http
POST /configs/
Content-Type: application/json

{
  "namespace_id": 1,
  "schema_id": 1,
  "key": "active_usecases",
  "value": [
    {
      "usecase_id": "UC001",
      "name": "Customer Onboarding",
      "status": "active"
    }
  ]
}
```

**Response:**
```json
{
  "id": 1,
  "namespace_id": 1,
  "schema_id": 1,
  "key": "active_usecases",
  "value": [...],
  "version": 1,
  "created_at": "2025-11-27T20:00:00Z"
}
```

#### Reference Data: Lookup Item

```http
GET /reference/platform/active_usecases/lookup/UC001?id_field=usecase_id
```

**Response:**
```json
{
  "usecase_id": "UC001",
  "name": "Customer Onboarding",
  "status": "active"
}
```

---

## Key Features

### 1. Template System

**Purpose**: Accelerate schema creation with pre-built templates

**Templates Available:**
- Reference Data: UseCases, OrgHierarchy, LLMModels, ArtifactTypes, NodeTypes
- UI Configuration: MenuItems, MicrofrontendMetadata, MaintenanceMessages
- External Integration: ThirdPartyURLs
- Sensitive Data: SecretKeys, PostgreSQLConnection
- Workflow Config: UseCaseOnboarding, FederatedCatalog

**Usage Flow:**
```mermaid
sequenceDiagram
    User->>UI: Click "Use Template"
    UI->>Templates: Load templates.json
    Templates-->>UI: 14 Templates
    UI->>User: Show Template Picker
    User->>UI: Select Template
    UI->>Form: Auto-fill Schema
    User->>UI: Customize (optional)
    UI->>API: Create Schema
```

### 2. Reference Data Pattern

**Problem**: Other services need to reference config data as foreign keys

**Solution**: Optimized `/reference/*` endpoints

**Example Use Case:**
```python
# Service A needs to validate usecase_id
def validate_usecase(usecase_id: str) -> bool:
    response = requests.get(
        f'{CONFIG_SERVICE}/reference/platform/active_usecases/lookup/{usecase_id}',
        params={'id_field': 'usecase_id'}
    )
    return response.status_code == 200
```

### 3. Secret Management

**Problem**: Storing sensitive data (passwords, API keys) securely

**Solution**: Azure Key Vault integration with `vault://` references

**Pattern:**
```json
{
  "database": "production",
  "password": "vault://db-prod-password"
}
```

**Resolution:**
```http
GET /reference/global/db_connection?resolve_vault=true
```

Returns actual password from Key Vault.

### 4. Version History

Every configuration change is tracked:
- Who changed it
- When it changed
- What the previous value was
- Enables rollback

---

## Security & Best Practices

### Security Features

1. **Secret Management**
   - Secrets stored in Azure Key Vault
   - Config stores references only
   - Optional resolution on-demand

2. **Validation**
   - JSON Schema validation enforced
   - Prevents invalid data
   - Type checking

3. **Audit Trail**
   - All changes logged
   - Immutable history
   - Compliance ready

### Best Practices

**For Schema Design:**
- Use templates as starting point
- Define required fields clearly
- Use enums for fixed values
- Add descriptions for documentation

**For Namespace Organization:**
- One namespace per team/service
- Platform namespace for shared configs
- Use meaningful names

**For Configuration Keys:**
- Use descriptive, unique keys
- Follow naming convention (e.g., snake_case)
- Group related configs

**For External Services:**
- Cache reference data locally
- Use lookup endpoints for FK validation
- Handle 404s gracefully

---

## Technology Stack

**Backend:**
- FastAPI (Python web framework)
- SQLAlchemy (ORM)
- SQLite (Database)
- Pydantic (Data validation)
- jsonschema (Schema validation)

**Frontend:**
- Vanilla JavaScript (ES6 modules)
- JSONEditor (Visual JSON editing)
- Modern CSS (Glassmorphism design)

**Integration:**
- Azure Key Vault (Secret management)
- Future: Redis (Caching)

---

## Deployment Architecture

```mermaid
graph TB
    subgraph "Production Environment"
        LB[Load Balancer]
        
        subgraph "App Tier"
            API1[FastAPI Instance 1]
            API2[FastAPI Instance 2]
        end
        
        subgraph "Data Tier"
            DB[(PostgreSQL<br/>Production)]
            DBReplica[(PostgreSQL<br/>Replica)]
        end
        
        subgraph "Cache Tier"
            Redis[(Redis Cache)]
        end
        
        subgraph "Secrets"
            KV[Azure Key Vault]
        end
    end
    
    LB --> API1
    LB --> API2
    
    API1 --> DB
    API2 --> DB
    DB --> DBReplica
    
    API1 --> Redis
    API2 --> Redis
    
    API1 --> KV
    API2 --> KV
    
    classDef lb fill:#ffebee,stroke:#c62828
    classDef app fill:#e8f5e9,stroke:#388e3c
    classDef data fill:#e1f5ff,stroke:#0288d1
    classDef cache fill:#fff3e0,stroke:#f57c00
    classDef secret fill:#f3e5f5,stroke:#7b1fa2
    
    class LB lb
    class API1,API2 app
    class DB,DBReplica data
    class Redis cache
    class KV secret
```

**Notes:**
- Current: SQLite (development)
- Production: Use PostgreSQL
- Add Redis for reference data caching
- Horizontal scaling via load balancer

---

## Next Steps

1. **Production Readiness**
   - Switch to PostgreSQL
   - Add Redis caching
   - Implement API authentication
   - Add rate limiting

2. **Enhanced Features**
   - Bulk import/export
   - Config comparison/diff
   - Approval workflows
   - Scheduled changes

3. **Monitoring**
   - API metrics
   - Usage analytics
   - Performance monitoring
   - Error tracking

---

For detailed API specifications, see [api-reference.md](./api-reference.md)  
For usage examples, see [usage-guide.md](./usage-guide.md)
