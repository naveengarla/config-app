import requests
import json
import time

BASE_URL = "http://localhost:8000"

def test_api():
    print("Waiting for server to start...")
    time.sleep(3)

    # 1. Create Namespace
    print("Creating Namespace...")
    ns_data = {"name": "TestNamespace", "description": "For testing"}
    resp = requests.post(f"{BASE_URL}/namespaces/", json=ns_data)
    if resp.status_code != 200:
        print(f"Failed to create namespace: {resp.text}")
        return
    ns_id = resp.json()["id"]
    print(f"Namespace created with ID: {ns_id}")

    # 2. Create Schema
    print("Creating Schema...")
    schema_data = {
        "name": "TestSchema",
        "structure": {
            "type": "object",
            "properties": {
                "host": {"type": "string"},
                "port": {"type": "integer"},
                "active": {"type": "boolean"}
            },
            "required": ["host", "port"]
        }
    }
    resp = requests.post(f"{BASE_URL}/schemas/", json=schema_data)
    if resp.status_code != 200:
        print(f"Failed to create schema: {resp.text}")
        return
    schema_id = resp.json()["id"]
    print(f"Schema created with ID: {schema_id}")

    # 3. Create Valid Config
    print("Creating Valid Config...")
    config_data = {
        "namespace_id": ns_id,
        "schema_id": schema_id,
        "key": "db_config",
        "value": {
            "host": "localhost",
            "port": 5432,
            "active": True
        }
    }
    resp = requests.post(f"{BASE_URL}/configs/", json=config_data)
    if resp.status_code != 200:
        print(f"Failed to create config: {resp.text}")
        return
    print("Config created successfully!")

    # 4. Create Invalid Config (Validation Error)
    print("Testing Validation (Should fail)...")
    invalid_data = {
        "namespace_id": ns_id,
        "schema_id": schema_id,
        "key": "db_config_invalid",
        "value": {
            "host": "localhost",
            "port": "not_an_integer" # Error here
        }
    }
    resp = requests.post(f"{BASE_URL}/configs/", json=invalid_data)
    if resp.status_code == 400:
        print("Validation failed as expected!")
    else:
        print(f"Unexpected status code: {resp.status_code}")

if __name__ == "__main__":
    try:
        test_api()
    except Exception as e:
        print(f"Test failed with exception: {e}")
