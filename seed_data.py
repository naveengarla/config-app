import requests
import json

BASE_URL = "http://localhost:8001"

def create_ns(name, desc):
    requests.post(f"{BASE_URL}/namespaces/", json={"name": name, "description": desc})

def create_schema(name, structure):
    resp = requests.post(f"{BASE_URL}/schemas/", json={"name": name, "structure": structure})
    if resp.status_code == 200:
        return resp.json()["id"]
    print(f"Failed to create schema {name}: {resp.text}")
    return None

def create_config(ns_id, schema_id, key, value):
    requests.post(f"{BASE_URL}/configs/", json={
        "namespace_id": ns_id,
        "schema_id": schema_id,
        "key": key,
        "value": value
    })

def seed():
    print("Seeding data...")
    
    # Namespaces
    create_ns("Network", "Network related configs")
    create_ns("Features", "Feature flags and rollouts")
    
    # Get NS IDs (assuming 1 and 2 if fresh, but let's fetch)
    namespaces = requests.get(f"{BASE_URL}/namespaces/").json()
    net_ns = next(n["id"] for n in namespaces if n["name"] == "Network")
    feat_ns = next(n["id"] for n in namespaces if n["name"] == "Features")

    # 1. LIST Example: Whitelisted IPs
    list_schema_id = create_schema("IPWhitelist", {
        "type": "array",
        "items": { "type": "string" }
    })
    if list_schema_id:
        create_config(net_ns, list_schema_id, "admin_ips", ["127.0.0.1", "192.168.1.1", "10.0.0.5"])

    # 2. TABLE Example: Routing Rules
    table_schema_id = create_schema("RoutingRules", {
        "type": "array",
        "items": {
            "type": "object",
            "properties": {
                "source": { "type": "string" },
                "destination": { "type": "string" },
                "weight": { "type": "integer", "minimum": 0, "maximum": 100 }
            },
            "required": ["source", "destination", "weight"]
        }
    })
    if table_schema_id:
        create_config(net_ns, table_schema_id, "traffic_rules", [
            {"source": "/api/v1", "destination": "service-v1", "weight": 90},
            {"source": "/api/v2", "destination": "service-v2", "weight": 10}
        ])

    # 3. HIERARCHY Example: Feature Flag Complex
    hierarchy_schema_id = create_schema("FeatureRollout", {
        "type": "object",
        "properties": {
            "enabled": { "type": "boolean" },
            "strategy": {
                "type": "object",
                "properties": {
                    "type": { "type": "string" },
                    "percentage": { "type": "integer" },
                    "users": { 
                        "type": "array",
                        "items": { "type": "string" }
                    }
                }
            },
            "platforms": {
                "type": "object",
                "properties": {
                    "ios": { "type": "boolean" },
                    "android": { "type": "boolean" },
                    "web": { "type": "boolean" }
                }
            }
        }
    })
    if hierarchy_schema_id:
        create_config(feat_ns, hierarchy_schema_id, "new_dashboard_rollout", {
            "enabled": True,
            "strategy": {
                "type": "gradual",
                "percentage": 25,
                "users": ["user_123", "user_456"]
            },
            "platforms": {
                "ios": True,
                "android": False,
                "web": True
            }
        })

    print("Seeding complete!")

if __name__ == "__main__":
    seed()
