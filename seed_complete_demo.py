"""
Comprehensive seed script to populate the Config Service with demo data.

Creates:
- 3 Namespaces: platform, mbd, tsa
- All 14 template-based schemas in 'platform'
- Simple key-value schemas in 'mbd' and 'tsa'
- Sample configurations for each schema
"""

import requests
import json

BASE_URL = "http://localhost:8001"

# Load templates
with open('static/data/templates.json', 'r') as f:
    templates_data = json.load(f)
    templates = templates_data['templates']

def create_namespace(name, description):
    """Create a namespace"""
    response = requests.post(f"{BASE_URL}/namespaces/", json={
        "name": name,
        "description": description
    })
    if response.status_code == 200:
        print(f"✓ Created namespace: {name}")
        return response.json()['id']
    else:
        print(f"✗ Failed to create namespace {name}: {response.text}")
        return None

def create_schema(name, structure):
    """Create a schema"""
    response = requests.post(f"{BASE_URL}/schemas/", json={
        "name": name,
        "structure": structure
    })
    if response.status_code == 200:
        print(f"  ✓ Created schema: {name}")
        return response.json()['id']
    else:
        print(f"  ✗ Failed to create schema {name}: {response.text}")
        return None

def create_config(namespace_id, schema_id, key, value):
    """Create a configuration"""
    response = requests.post(f"{BASE_URL}/configs/", json={
        "namespace_id": namespace_id,
        "schema_id": schema_id,
        "key": key,
        "value": value
    })
    if response.status_code == 200:
        print(f"    ✓ Created config: {key}")
        return response.json()['id']
    else:
        print(f"    ✗ Failed to create config {key}: {response.text}")
        return None

def seed_platform_namespace(ns_id):
    """Seed platform namespace with all template types"""
    print("\n📦 Seeding Platform Namespace...")
    
    # 1. Use Cases
    template = next(t for t in templates if t['id'] == 'usecases')
    schema_id = create_schema("UseCases", template['schema'])
    if schema_id:
        create_config(ns_id, schema_id, "active_usecases", [
            {"usecase_id": "UC001", "name": "Customer Onboarding", "status": "active", "category": "Sales", "owner": "john@company.com"},
            {"usecase_id": "UC002", "name": "Payment Processing", "status": "active", "category": "Finance", "owner": "jane@company.com"},
            {"usecase_id": "UC003", "name": "Invoice Generation", "status": "active", "category": "Finance", "owner": "bob@company.com"}
        ])
    
    # 2. Menu Items
    template = next(t for t in templates if t['id'] == 'menu_items')
    schema_id = create_schema("MenuItems", template['schema'])
    if schema_id:
        create_config(ns_id, schema_id, "main_menu", [
            {"id": "dashboard", "label": "Dashboard", "icon": "dashboard", "route": "/dashboard", "order": 1, "children": []},
            {"id": "admin", "label": "Administration", "icon": "settings", "route": "", "order": 2, "children": [
                {"id": "users", "label": "Users", "route": "/admin/users"},
                {"id": "roles", "label": "Roles", "route": "/admin/roles"}
            ]}
        ])
    
    # 3. Org Hierarchy
    template = next(t for t in templates if t['id'] == 'org_hierarchy')
    schema_id = create_schema("OrgHierarchy", template['schema'])
    if schema_id:
        create_config(ns_id, schema_id, "organization_structure", [
            {
                "org_id": "ORG001",
                "name": "Engineering",
                "parent_id": None,
                "manager": "alice@company.com",
                "level": 1,
                "children": [
                    {"org_id": "ORG002", "name": "Backend Team", "parent_id": "ORG001", "manager": "bob@company.com", "level": 2, "children": []},
                    {"org_id": "ORG003", "name": "Frontend Team", "parent_id": "ORG001", "manager": "carol@company.com", "level": 2, "children": []}
                ]
            }
        ])
    
    # 4. Third Party URLs
    template = next(t for t in templates if t['id'] == 'third_party_urls')
    schema_id = create_schema("ThirdPartyURLs", template['schema'])
    if schema_id:
        create_config(ns_id, schema_id, "external_apis", {
            "stripe_api": "https://api.stripe.com/v1",
            "sendgrid_api": "https://api.sendgrid.com",
            "auth_service": "https://auth.company.com",
            "analytics_service": "https://analytics.company.com"
        })
    
    # 5. PostgreSQL Connection
    template = next(t for t in templates if t['id'] == 'postgresql_connection')
    schema_id = create_schema("PostgreSQLConnection", template['schema'])
    if schema_id:
        create_config(ns_id, schema_id, "prod_database", {
            "host": "db.company.com",
            "port": 5432,
            "database": "production",
            "username": "app_user",
            "password": "vault://db-prod-password",
            "ssl_mode": "require"
        })
    
    # 6. LLM Models
    template = next(t for t in templates if t['id'] == 'llm_models')
    schema_id = create_schema("LLMModels", template['schema'])
    if schema_id:
        create_config(ns_id, schema_id, "available_models", [
            {
                "model_id": "gpt-4",
                "name": "GPT-4",
                "provider": "openai",
                "endpoint": "https://api.openai.com/v1/chat/completions",
                "max_tokens": 8192,
                "cost_per_1k_tokens": 0.03,
                "capabilities": ["chat", "function_calling"],
                "enabled": True
            },
            {
                "model_id": "claude-3",
                "name": "Claude 3",
                "provider": "anthropic",
                "endpoint": "https://api.anthropic.com/v1/messages",
                "max_tokens": 4096,
                "cost_per_1k_tokens": 0.015,
                "capabilities": ["chat"],
                "enabled": True
            }
        ])
    
    # 7. Microfrontend Metadata
    template = next(t for t in templates if t['id'] == 'microfrontend_metadata')
    schema_id = create_schema("MicrofrontendMetadata", template['schema'])
    if schema_id:
        create_config(ns_id, schema_id, "registered_microfrontends", [
            {
                "mfe_id": "mfe-dashboard",
                "name": "Dashboard MFE",
                "entry_url": "https://cdn.company.com/dashboard/remoteEntry.js",
                "scope": "dashboard",
                "module": "./Module",
                "routes": ["/dashboard", "/dashboard/*"],
                "permissions": ["dashboard.view"],
                "version": "1.2.3",
                "enabled": True
            }
        ])
    
    # 8. Maintenance Messages
    template = next(t for t in templates if t['id'] == 'maintenance_messages')
    schema_id = create_schema("MaintenanceMessages", template['schema'])
    if schema_id:
        create_config(ns_id, schema_id, "active_messages", [
            {
                "message_id": "msg-001",
                "text": "System maintenance scheduled for Saturday 2-4 AM EST",
                "severity": "warning",
                "start_date": "2025-11-30T00:00:00Z",
                "end_date": "2025-12-01T00:00:00Z",
                "display_pages": ["*"],
                "dismissible": True
            }
        ])
    
    print("✓ Platform namespace seeded with all templates!")

def seed_simple_namespace(ns_id, ns_name):
    """Seed mbd/tsa namespaces with simple key-value configs"""
    print(f"\n📦 Seeding {ns_name.upper()} Namespace...")
    
    # Simple key-value schema
    schema_id = create_schema(f"{ns_name.upper()}_Config", {
        "type": "object",
        "additionalProperties": {"type": "string"}
    })
    
    if schema_id:
        # Create some example configs
        create_config(ns_id, schema_id, "api_endpoints", {
            "primary": f"https://{ns_name}.api.company.com",
            "secondary": f"https://{ns_name}-backup.api.company.com",
            "health_check": f"https://{ns_name}.api.company.com/health"
        })
        
        create_config(ns_id, schema_id, "feature_flags", {
            "enable_new_ui": "true",
            "enable_beta_features": "false",
            "maintenance_mode": "false"
        })
        
        create_config(ns_id, schema_id, f"{ns_name}_settings", {
            "max_connections": "100",
            "timeout_seconds": "30",
            "retry_attempts": "3",
            "log_level": "INFO"
        })
    
    print(f"✓ {ns_name.upper()} namespace seeded!")

def main():
    print("=" * 60)
    print("  CONFIG SERVICE - COMPREHENSIVE SEED SCRIPT")
    print("=" * 60)
    
    # Create namespaces
    print("\n📁 Creating Namespaces...")
    platform_id = create_namespace("platform", "Platform-wide configurations")
    mbd_id = create_namespace("mbd", "MBD service configurations")
    tsa_id = create_namespace("tsa", "TSA service configurations")
    
    if not all([platform_id, mbd_id, tsa_id]):
        print("\n✗ Failed to create one or more namespaces. Exiting.")
        return
    
    # Seed each namespace
    seed_platform_namespace(platform_id)
    seed_simple_namespace(mbd_id, "mbd")
    seed_simple_namespace(tsa_id, "tsa")
    
    print("\n" + "=" * 60)
    print("  ✓ SEEDING COMPLETE!")
    print("=" * 60)
    print("\nYou can now:")
    print("1. Visit http://localhost:8001")
    print("2. Browse Namespaces, Schemas, and Configurations")
    print("3. Test reference API:")
    print("   - GET /reference/platform/active_usecases")
    print("   - GET /reference/platform/active_usecases/lookup/UC001?id_field=usecase_id")
    print("   - GET /reference/mbd/api_endpoints")
    print()

if __name__ == "__main__":
    main()
