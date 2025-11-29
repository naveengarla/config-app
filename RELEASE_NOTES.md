# Release Notes

## v1.0.0 - UI Standardization & Enhancement

### 🎨 UI/UX Overhaul
-   **Single Theme Enforcement**: Standardized the entire application to a clean, professional **Light Theme**. Removed all dark mode inconsistencies and toggle functionality to ensure a stable visual experience.
-   **Dashboard Refactor**:
    -   Redesigned for compactness and density.
    -   Moved "Quick Actions" to a non-scrolling area.
    -   Implemented side-by-side layout for Stats and Activity.
    -   Limited "Recent Activity" to the top 5 items to prevent clutter.
-   **Search Functionality**:
    -   Added real-time client-side search to **Schemas** and **Configs** pages.
    -   Supports filtering by Key, Namespace, and Schema Name.
    -   Polished search input UI with proper icon positioning and padding.

### ✨ New Features
-   **Schema Versioning**: Added support for editing schemas, which automatically creates a new version (v1 -> v2) to maintain data integrity for existing configurations.
-   **Visual Schema Editor**:
    -   Enhanced `SchemaBuilder` with a user-friendly visual interface.
    -   Added support for adding/removing fields, nested objects, and arrays.
    -   Added "Description" field for better schema documentation.
-   **Config Management**:
    -   Replaced unstyled submit buttons with proper primary action buttons.
    -   Improved form layout using `rjsf` with Tailwind styling.

### 🛠 Technical Improvements
-   **Frontend Stack**: Migrated to **Vite + React + Tailwind CSS**.
-   **State Management**: Implemented `@tanstack/react-query` for efficient data fetching and caching.
-   **Architecture**: Enforced "Schema-First" design with strict backend validation.

---
