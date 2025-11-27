"""
Demo script showing the new features:
1. Templates system
2. Reference data API
3. Azure Key Vault integration

Run this after creating a few configs via the UI.
"""

import requests
import json

BASE_URL = "http://localhost:8001"

def demo_templates():
    """Show available templates"""
    print("\n" + "="*60)
    print("📋 AVAILABLE TEMPLATES")
    print("="*60)
    
    response = requests.get(f"{BASE_URL}/static/data/templates.json")
    templates = response.json()['templates']
    
    print(f"\nFound {len(templates)} templates:\n")
    
    categories = {}
    for t in templates:
        cat = t.get('category', 'Other')
        if cat not in categories:
            categories[cat] = []
        categories[cat].append(t)
    
    for cat, temps in categories.items():
        print(f"\n{cat}:")
        for t in temps:
            icon = "🔐" if t.get('sensitive') else "📊  " if t.get('purpose') == 'reference_data' else "📄"
            print(f"  {icon} {t['name']}")
            print(f"     {t['description']}")


def demo_reference_api():
    """Demonstrate reference data API"""
    print("\n" + "="*60)
    print("🔗 REFERENCE DATA API DEMO")
    print("="*60)
    
    print("\nNOTE: These examples assume you've created configs via the UI.")
    print("If you get 404 errors, please create the configs first.\n")
    
    # Example 1: Get full config
    print("\n1. Get full config:")
    print(f"   GET /reference/global/usecases")
    try:
        response = requests.get(f"{BASE_URL}/reference/global/usecases")
        if response.status_code == 200:
            data = response.json()
            print(f"   ✓ Found {len(data.get('value', []))} usecases")
            print(f"   Version: {data.get('version')}")
        else:
            print(f"   ✗ {response.status_code}: {response.json()['detail']}")
    except Exception as e:
        print(f"   ✗ Error: {e}")
    
    # Example 2: Lookup specific item
    print("\n2. Lookup specific item:")
    print(f"   GET /reference/global/usecases/lookup/UC001?id_field=usecase_id")
    try:
        response = requests.get(
            f"{BASE_URL}/reference/global/usecases/lookup/UC001",
            params={'id_field': 'usecase_id'}
        )
        if response.status_code == 200:
            item = response.json()
            print(f"   ✓ Found: {item.get('name', 'N/A')}")
            print(f"   Data: {json.dumps(item, indent=6)}")
        else:
            print(f"   ✗ {response.status_code}: {response.json()['detail']}")
    except Exception as e:
        print(f"   ✗ Error: {e}")
    
    # Example 3: Search
    print("\n3. Search within config:")
    print(f"   GET /reference/global/usecases/search?q=test")
    try:
        response = requests.get(
            f"{BASE_URL}/reference/global/usecases/search",
            params={'q': 'test'}
        )
        if response.status_code == 200:
            data = response.json()
            print(f"   ✓ Found {data['count']} matching items")
        else:
            print(f"   ✗ {response.status_code}: {response.json()['detail']}")
    except Exception as e:
        print(f"   ✗ Error: {e}")


def demo_keyvault_integration():
    """Show how vault:// references work"""
    print("\n" + "="*60)
    print("🔐 AZURE KEY VAULT INTEGRATION")
    print("="*60)
    
    print("\nExample config with vault:// references:\n")
    
    example_config = {
        "host": "db.company.com",
        "port": 5432,
        "database": "production",
        "username": "app_user",
        "password": "vault://db-prod-password"  # Reference to Key Vault
    }
    
    print(json.dumps(example_config, indent=2))
    
    print("\n✓ The actual password is stored securely in Azure Key Vault")
    print("✓ Only the reference 'vault://db-prod-password' is in the config")
    print("✓ Applications can request resolved values: ?resolve_vault=true")
    
    print("\nWithout resolution:")
    print('  GET /reference/global/db_connection')
    print('  Returns: {"password": "vault://db-prod-password"}')
    
    print("\nWith resolution:")
    print('  GET /reference/global/db_connection?resolve_vault=true')
    print('  Returns: {"password": "actual_secret_value"}')


def demo_external_service_usage():
    """Show how external services consume configs"""
    print("\n" + "="*60)
    print("🚀 EXTERNAL SERVICE USAGE EXAMPLES")
    print("="*60)
    
    print("\nPython example:\n")
    print("""```python
import requests
import functools

@functools.lru_cache(maxsize=1)
def get_usecases():
    '''Fetch usecases from config service with caching'''
    response = requests.get('http://config-service:8001/reference/global/usecases')
    return response.json()['value']

# Get all usecases
usecases = get_usecases()

# Lookup specific usecase (validate FK)
def get_usecase(usecase_id):
    response = requests.get(
        f'http://config-service:8001/reference/global/usecases/lookup/{usecase_id}',
        params={'id_field': 'usecase_id'}
    )
    if response.status_code == 200:
        return response.json()
    return None
```""")


def show_migration_steps():
    """Show migration steps"""
    print("\n" + "="*60)
    print("📦 MIGRATION QUICK START")
    print("="*60)
    
    print("""
1. Create Namespace (if not exists):
   - Go to http://localhost:8001
   - Click "Namespaces" → "Create Namespace"
   - Name: "global"
   - Description: "Global configurations"

2. Create Schema from Template:
   - Go to "Schemas" → "Define New Schema"
   - Click "Use Template" (when UI is ready)
   - Select "Use Cases List"
   - Save

3. Create Config:
   - Go to "Configurations" → "Create Configuration"
   - Namespace: global
   - Schema: Use Cases List
   - Key: usecases
   - Value: [
       {
         "usecase_id": "UC001",
         "name": "Customer Onboarding",
         "status": "active",
         "category": "Sales",
         "owner": "john@company.com"
       }
     ]
   - Save

4. Test Reference API:
   - GET http://localhost:8001/reference/global/usecases
   - GET http://localhost:8001/reference/global/usecases/lookup/UC001?id_field=usecase_id
""")


def main():
    print("\n" + "="*70)
    print("  CONFIG SERVICE - NEW FEATURES DEMO")
    print("="*70)
    
    demo_templates()
    demo_reference_api()
    demo_keyvault_integration()
    demo_external_service_usage()
    show_migration_steps()
    
    print("\n" + "="*70)
    print("  ✓ Demo Complete!")
    print("="*70)
    print("\nNext steps:")
    print("1. Open http://localhost:8001 and create some configs")
    print("2. Try the reference API endpoints")
    print("3. Start migrating your hardcoded configs")
    print()


if __name__ == "__main__":
    main()
