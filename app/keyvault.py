"""
Azure Key Vault integration for handling secrets.
Configs can reference secrets using format: vault://secret-name

Example:
    {
        "database": "mydb",
        "password": "vault://db-password"  <- Will be resolved from Key Vault
    }
"""

from typing import Any, Dict
import re
import os

class KeyVaultClient:
    """
    Azure Key Vault client for resolving secret references.
    
    To enable real Azure Key Vault integration:
    1. Install: pip install azure-keyvault-secrets azure-identity
    2. Set environment variable: AZURE_KEY_VAULT_URL=https://your-vault.vault.azure.net/
    3. Ensure your app has proper Azure credentials (Managed Identity, Service Principal, etc.)
    """
    
    def __init__(self, vault_url: str = None):
        self.vault_url = vault_url or os.getenv('AZURE_KEY_VAULT_URL')
        self.client = None
        
        # Try to initialize real Azure client if credentials available
        try:
            if self.vault_url:
                from azure.identity import DefaultAzureCredential
                from azure.keyvault.secrets import SecretClient
                
                credential = DefaultAzureCredential()
                self.client = SecretClient(vault_url=self.vault_url, credential=credential)
                print(f"[KeyVault] Connected to {self.vault_url}")
        except ImportError:
            print("[KeyVault] Azure SDK not installed. Install: pip install azure-keyvault-secrets azure-identity")
        except Exception as e:
            print(f"[KeyVault] Could not connect to Azure Key Vault: {e}")
            print("[KeyVault] vault:// references will NOT be resolved")
    
    def get_secret(self, name: str) -> str:
        """
        Retrieve secret from Azure Key Vault.
        
        Args:
            name: Secret name in Key Vault
            
        Returns:
            Secret value
            
        Raises:
            Exception: If secret not found or Key Vault not configured
        """
        if not self.client:
            raise Exception(
                f"Azure Key Vault not configured. Cannot resolve vault://{name}. "
                "Set AZURE_KEY_VAULT_URL environment variable and ensure Azure credentials are available."
            )
        
        try:
            secret = self.client.get_secret(name)
            return secret.value
        except Exception as e:
            raise Exception(f"Failed to retrieve secret '{name}' from Key Vault: {e}")


def resolve_secrets(config_value: Any, kv_client: KeyVaultClient = None) -> Any:
    """
    Recursively resolve vault:// references in config values.
    
    Args:
        config_value: Config value (can be dict, list, string, etc.)
        kv_client: Optional KeyVaultClient instance (creates new if not provided)
    
    Returns:
        Config value with vault:// references replaced by actual secrets
    
    Example:
        Input:  {"password": "vault://db-password", "port": 5432}
        Output: {"password": "actual_secret_value", "port": 5432}
    """
    if kv_client is None:
        kv_client = KeyVaultClient()
    
    if isinstance(config_value, dict):
        # Recursively resolve all dict values
        return {k: resolve_secrets(v, kv_client) for k, v in config_value.items()}
    
    elif isinstance(config_value, list):
        # Recursively resolve all list items
        return [resolve_secrets(item, kv_client) for item in config_value]
    
    elif isinstance(config_value, str):
        # Check if string is a vault reference
        match = re.match(r'^vault://(.+)$', config_value)
        if match:
            secret_name = match.group(1)
            try:
                return kv_client.get_secret(secret_name)
            except Exception as e:
                # Return error message instead of failing
                # In production, you might want to fail instead
                return f"[ERROR: {e}]"
    
    # Return as-is for all other types (int, bool, null, etc.)
    return config_value


def has_vault_references(config_value: Any) -> bool:
    """
    Check if config value contains any vault:// references.
    
    Args:
        config_value: Config value to check
        
    Returns:
        True if contains vault:// references, False otherwise
    """
    import json
    config_str = json.dumps(config_value)
    return 'vault://' in config_str
