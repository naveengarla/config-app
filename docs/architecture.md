# Generic Configuration Service - Architecture Documentation

## 1. System Overview

The **Generic Configuration Service** is a centralized platform for managing application configurations. It is built on a **"Schema-First"** philosophy, meaning that the structure of configuration data is defined dynamically at runtime using JSON Schemas, rather than being hardcoded in database tables or application code.

### Key Goals
- **Generic**: Support any type of configuration (Key-Value, Lists, Tables, Hierarchies).
- **Scalable**: Group configurations by Namespaces (e.g., per service or environment).
- **Validatable**: Ensure data integrity through strict JSON Schema validation.
- **Extensible**: Add new configuration types without deploying new code.

## 2. High-Level Architecture

The system follows a standard 3-tier architecture:

```mermaid
graph TD
    User[User / Admin] -->|HTTPS| Frontend[Frontend SPA (Vanilla JS)]
    Frontend -->|REST API| API[Backend API (FastAPI)]
    API -->|SQLAlchemy| DB[(SQLite Database)]
    
    subgraph "Backend Services"
        API
        Validator[JSON Schema Validator]
    end
```

## 3. Backend Design

### Technology Stack
- **Framework**: FastAPI (Python)
- **ORM**: SQLAlchemy
- **Database**: SQLite (for portability, easily swappable for PostgreSQL)
- **Validation**: `jsonschema` library

### Data Models (`app/models.py`)

1.  **Namespace**: Logical grouping of configurations.
    - `id`, `name`, `description`
2.  **ConfigSchema**: Defines the structure of a configuration type.
    - `id`, `name`, `structure` (JSON Blob storing the JSON Schema)
3.  **ConfigEntry**: The actual configuration instance.
    - `id`, `namespace_id`, `schema_id`, `key`, `value` (JSON Blob), `version`
4.  **ConfigHistory**: Audit trail for configuration changes.
    - `id`, `config_id`, `value`, `version`, `changed_at`

### API Layer (`app/routers/`)
- **`namespaces.py`**: CRUD operations for Namespaces.
- **`schemas.py`**: CRUD for Schemas + Validation Endpoint.
- **`configs.py`**: CRUD for Configs.
    - **Critical Logic**: On `create` or `update`, the backend fetches the associated `ConfigSchema` and validates the incoming `value` against the `structure` using `jsonschema.validate()`.

## 4. Frontend Design

### Technology Stack
- **Core**: Vanilla JavaScript (ES6 Modules)
- **Styling**: Custom CSS (Glassmorphism Design System)
- **External Libs**: `jsoneditor` (via CDN) for rich JSON editing.

### Component Architecture
The frontend is a Single Page Application (SPA) with a simple router.

- **`app.js`**: Main entry point, handles routing.
- **`api.js`**: Wrapper around `fetch` for API calls.
- **`components/`**:
    - **`Dashboard.js`**: High-level metrics.
    - **`Namespaces.js`**: List and create namespaces.
    - **`Schemas.js`**: Schema editor (using `JSONEditor` in Tree mode) and Playground.
    - **`Configs.js`**: The core configuration editor.
    - **`Modal.js`**: Reusable modal dialog.
    - **`Toast.js`**: Notification system.

### Dynamic Form Generation (`FormBuilder`)
The most complex part of the frontend is the **Recursive Form Builder** in `Configs.js`.
1.  It takes a JSON Schema as input.
2.  It recursively traverses the schema structure.
3.  It generates appropriate HTML inputs:
    - `string` -> `<input type="text">`
    - `integer` -> `<input type="number">`
    - `boolean` -> `<select>` (True/False)
    - `enum` -> `<select>` (Dropdown)
    - `object` -> `<fieldset>` (Nested recursively)
    - `array` -> Dynamic list with "Add/Remove" buttons.
4.  It also supports an **Advanced Mode** where the user can switch to a raw JSON Tree Editor for complex data entry.

## 5. Data Flow

### Creating a Configuration
1.  **User** selects a Namespace and a Schema (Type).
2.  **Frontend** fetches the Schema structure.
3.  **FormBuilder** renders the UI based on the Schema.
4.  **User** fills in the form (or uses Advanced JSON Editor).
5.  **Frontend** constructs the JSON payload and sends `POST /configs/`.
6.  **Backend** receives the request.
7.  **Backend** loads the referenced Schema from DB.
8.  **Backend** validates the payload `value` against the Schema.
    - *If Invalid*: Returns 400 Error with validation details.
    - *If Valid*: Saves to `ConfigEntry` table and creates a `ConfigHistory` record.
9.  **Frontend** receives success response and updates the list.

## 6. Extensibility & Future Proofing

The core value proposition is that **no code changes** are needed to support new configuration types.

**Scenario**: You need to store a "Rate Limiting Policy" which consists of a `path` (string), `limit` (int), and `window` (int).

**Old Way**:
1.  Create `RateLimit` table in DB.
2.  Create API endpoints.
3.  Create UI screens.
4.  Deploy.

**Our Way**:
1.  Open UI -> Schemas -> Define New Schema:
    ```json
    {
      "type": "object",
      "properties": {
        "path": { "type": "string" },
        "limit": { "type": "integer" },
        "window": { "type": "integer" }
      }
    }
    ```
2.  Done. You can now create "Rate Limiting Policy" configs immediately.
