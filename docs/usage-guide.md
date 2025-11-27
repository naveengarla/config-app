# Config Service - Usage Guide

## Quick Start

### 1. Access the Web UI

Open your browser and navigate to:
```
http://localhost:8001
```

### 2. Create Your First Namespace

1. Click **Namespaces** in the sidebar
2. Click **Create Namespace**
3. Fill in:
   - Name: `my-team`
   - Description: `My team's configurations`
4. Click **Save**

### 3. Create Schema from Template

1. Click **Schemas** in the sidebar
2. Click **📋 Use Template**
3. Browse templates by category:
   - Reference Data
   - UI Configuration
   - External Integration
   - Sensitive Data
   - Workflow Configuration
4. Click on a template (e.g., "Use Cases List")
5. Review and customize if needed
6. Click **Save Schema**

### 4. Create Configuration

1. Click **Configurations** in the sidebar
2. Click **Create Configuration**
3. Select:
   - Namespace: `my-team`
   - Schema: `UseCases`
   - Key: `active_usecases`
4. Fill in the value (form auto-generated from schema):
   ```json
   [
     {
       "usecase_id": "UC001",
       "name": "My First Use Case",
       "status": "active"
     }
   ]
   ```
5. Click **Save**

---

## Common Use Cases

### Use Case 1: Managing Menu Items

**Scenario**: Dynamically configure application menu

**Steps:**

1. **Create Schema** (use template: "Menu Items")
2. **Create Config:**
   ```json
   {
     "namespace": "platform",
     "key": "main_menu",
     "value": [
       {
         "id": "dashboard",
         "label": "Dashboard",
         "icon": "dashboard",
         "route": "/dashboard",
         "order": 1
       },
       {
         "id": "users",
         "label": "Users",
         "icon": "people",
         "route": "/users",
         "order": 2
       }
     ]
   }
   ```

3. **Consume in App:**
   ```javascript
   // Fetch menu config
   const response = await fetch('http://config-service:8001/reference/platform/main_menu');
   const menu = response.json().value;
   
   // Render menu
   menu.sort((a, b) => a.order - b.order).forEach(item => {
     renderMenuItem(item);
   });
   ```

---

### Use Case 2: Validating Foreign Keys

**Scenario**: Validate that usecase_id exists before creating record

**Steps:**

1. **Create Use Cases Config** (see Quick Start)

2. **Validate in Service:**
   ```python
   import requests
   
   def create_project(data):
       # Validate usecase_id
       response = requests.get(
           f'http://config-service:8001/reference/platform/active_usecases/lookup/{data["usecase_id"]}',
           params={'id_field': 'usecase_id'}
       )
       
       if response.status_code != 200:
           raise ValueError(f"Invalid usecase_id: {data['usecase_id']}")
       
       # Proceed with creation
       save_project(data)
   ```

---

### Use Case 3: Managing External API URLs

**Scenario**: Centralize third-party service URLs

**Steps:**

1. **Create Schema** (use template: "Third Party URLs")

2. **Create Config:**
   ```json
   {
     "namespace": "platform",
     "key": "external_apis",
     "value": {
       "stripe": "https://api.stripe.com/v1",
       "sendgrid": "https://api.sendgrid.com",
       "auth_service": "https://auth.company.com"
     }
   }
   ```

3. **Use in Services:**
   ```python
   import requests
   
   # Fetch URLs
   response = requests.get('http://config-service:8001/reference/platform/external_apis')
   urls = response.json()['value']
   
   # Use URLs
   stripe_client = StripeClient(base_url=urls['stripe'])
   ```

**Benefits:**
- Change URLs without redeploying
- Different URLs per environment
- Single source of truth

---

### Use Case 4: Storing Secrets Securely

**Scenario**: Database connection string with password

**Steps:**

1. **Store Secret in Azure Key Vault:**
   ```bash
   az keyvault secret set \
       --vault-name my-vault \
       --name db-prod-password \
       --value "MySecurePassword123!"
   ```

2. **Create Config with Reference:**
   ```json
   {
     "namespace": "platform",
     "key": "prod_database",
     "value": {
       "host": "db.company.com",
       "port": 5432,
       "database": "production",
       "username": "app_user",
       "password": "vault://db-prod-password"
     }
   }
   ```

3. **Fetch with Resolution:**
   ```python
   response = requests.get(
       'http://config-service:8001/reference/platform/prod_database',
       params={'resolve_vault': True}
   )
   db_config = response.json()['value']
   
   # Use config (password is resolved)
   conn = psycopg2.connect(**db_config)
   ```

**Security Benefits:**
- Password never stored in config database
- Access controlled by Key Vault
- Audit trail in Key Vault
- Easy rotation

---

### Use Case 5: Feature Flags

**Scenario**: Toggle features on/off without deployment

**Steps:**

1. **Create Schema:**
   ```json
   {
     "type": "object",
     "additionalProperties": {"type": "boolean"}
   }
   ```

2. **Create Config:**
   ```json
   {
     "namespace": "platform",
     "key": "feature_flags",
     "value": {
       "new_dashboard": true,
       "beta_features": false,
       "experimental_ai": false
     }
   }
   ```

3. **Check in App:**
   ```javascript
   const response = await fetch('http://config-service:8001/reference/platform/feature_flags');
   const flags = response.json().value;
   
   if (flags.new_dashboard) {
     renderNewDashboard();
   } else {
     renderLegacyDashboard();
   }
   ```

4. **Toggle Feature:**
   - Go to Configurations
   - Edit `feature_flags`
   - Change `new_dashboard` to `false`
   - Save
   - App picks up change on next fetch (or via WebSocket in future)

---

## Best Practices

### Schema Design

**DO:**
- ✅ Use templates as starting point
- ✅ Define all required fields
- ✅ Use enums for fixed values
- ✅ Add descriptions for documentation
- ✅ Use meaningful property names

**DON'T:**
- ❌ Make everything optional
- ❌ Use generic names like "value", "data"
- ❌ Store sensitive data without vault://
- ❌ Create overly complex nested structures

### Namespace Organization

**DO:**
- ✅ One namespace per team/service
- ✅ Use `platform` for shared configs
- ✅ Use descriptive names (e.g., `payment-service`)

**DON'T:**
- ❌ Put all configs in one namespace
- ❌ Create namespace per config type
- ❌ Use cryptic abbreviations

### Configuration Keys

**DO:**
- ✅ Use descriptive names
- ✅ Follow naming convention (snake_case)
- ✅ Group related configs

**Example:**
```
external_apis
auth_settings
payment_providers
```

**DON'T:**
- ❌ Use generic keys like "config1"
- ❌ Mix naming conventions
- ❌ Create duplicate keys

### External Service Integration

**DO:**
- ✅ Cache configs locally (with TTL)
- ✅ Use lookup endpoints for FK validation
- ✅ Handle 404s gracefully
- ✅ Implement retry logic

**Example:**
```python
import functools
import requests

@functools.lru_cache(maxsize=1)
def get_usecases():
    """Cached for 5 minutes"""
    response = requests.get('http://config-service/reference/platform/active_usecases')
    return response.json()['value']
```

**DON'T:**
- ❌ Fetch on every request (use caching)
- ❌ Fail silently on errors
- ❌ Store stale data indefinitely

---

## Migration Guide

### Migrating from Hardcoded Configs

**Before:**
```python
# hardcoded_config.py
USECASES = {
    "UC001": "Customer Onboarding",
    "UC002": "Payment Processing"
}
```

**After:**

1. **Create Schema & Config:**
   - Use "Use Cases List" template
   - Create config in platform namespace

2. **Update Code:**
   ```python
   import requests
   import functools
   
   @functools.lru_cache(maxsize=1)
   def get_usecases():
       response = requests.get('http://config-service/reference/platform/active_usecases')
       return {uc['usecase_id']: uc['name'] for uc in response.json()['value']}
   
   USECASES = get_usecases()  # Drop-in replacement
   ```

3. **Benefits:**
   - No deployments to update
   - Version history
   - Centralized management

---

## Troubleshooting

### Config Validation Fails

**Error:**
```
Config validation failed: 'status' is a required property
```

**Solution:**
- Check schema definition
- Ensure all required fields are provided
- Verify field types match schema

### Cannot Find Config

**Error:**
```
Config 'my_config' not found in namespace 'platform'
```

**Solution:**
- Verify namespace name is correct
- Check config key spelling
- List all configs in namespace to confirm

### Secret Not Resolving

**Error:**
```
Failed to retrieve secret 'db-password' from Key Vault
```

**Solution:**
- Verify secret name in Key Vault
- Check Key Vault URL is configured
- Ensure app has Key Vault access
- Check Azure credentials

---

## FAQ

**Q: Can I update a config without creating new version?**  
A: No, all updates create new versions for audit trail.

**Q: How do I rollback to previous version?**  
A: View config history, copy previous value, create new update.

**Q: Can multiple services use same namespace?**  
A: Yes, but recommended to use separate namespaces per service.

**Q: Are configs cached?**  
A: Not by default. Implement caching in your service.

**Q: Can I export/import configs?**  
A: Not currently, but planned for future release.

**Q: Is there a size limit for configs?**  
A: JSON column limit (varies by database). Keep under 1MB for performance.

---

## Support

- **Documentation**: `/docs` folder
- **API Docs**: http://localhost:8001/docs
- **Issues**: GitHub repository
