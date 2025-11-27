# Release v1.1.0: Enterprise Features & Soft Delete

This release introduces major enterprise-grade enhancements including soft delete functionality, a new reference data pattern, Azure Key Vault integration, and comprehensive documentation.

## 🚀 New Features

### 1. Soft Delete Functionality
- **Backend**: Implemented `deleted_at` timestamp for Namespaces, Schemas, and Configs.
- **API**: Added `DELETE` endpoints for all entities.
- **Filtering**: Updated all `GET` endpoints to automatically exclude soft-deleted items.
- **UI**: Added "Delete" buttons with confirmation dialogs to all management pages.
- **Migration**: Included `migrate_add_soft_delete.py` to update existing databases.

### 2. Reference Data Architecture
- **New API**: Added `/reference` endpoints for optimized data fetching.
- **Lookup**: Fast ID-based lookup for array items (e.g., `/reference/platform/usecases/lookup/UC001`).
- **Search**: Full-text search within configuration values.
- **Pattern Documentation**: Added comprehensive guide on using Config Service as an enterprise reference data source.

### 3. Schema Templates & UI
- **Template Library**: Added 14 pre-built schema templates (Use Cases, Artifact Types, Org Hierarchy, etc.).
- **Template Picker**: New UI component to easily create schemas from templates.
- **Visual Improvements**: Enhanced UI with glassmorphism design and better layout.

### 4. Security & Integration
- **Azure Key Vault**: Added `vault://` reference support for secure secret management.
- **Secret Resolution**: Automatic resolution of secrets at runtime (optional).

## 📚 Documentation
- **Architecture**: Complete system architecture with Mermaid diagrams.
- **API Reference**: Detailed OpenAPI specifications and examples.
- **Usage Guide**: Practical guide for developers and architects.
- **Reference Data Pattern**: Critical architectural guidance and anti-pattern warnings.

## 🛠️ Technical Details
- **Database**: SQLite (default) with SQLAlchemy ORM.
- **Validation**: Strict JSON Schema validation for all configurations.
- **Frontend**: Vanilla JS with no build step required.

## 📦 Migration
To upgrade from previous versions:
1. Pull the latest code.
2. Run the migration script: `python migrate_add_soft_delete.py`
3. Restart the server: `python -m uvicorn app.main:app --reload --port 8001`
