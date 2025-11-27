from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from .. import models
from ..database import get_db

router = APIRouter(
    prefix="/reference",
    tags=["reference_data"],
)

@router.get("/{namespace}/{key}")
def get_reference_data(
    namespace: str, 
    key: str,
    resolve_vault: bool = Query(False, description="Resolve vault:// references"),
    db: Session = Depends(get_db)
):
    """
    Get configuration by namespace name and key.
    Optimized for external service consumption.
    
    Args:
        namespace: Namespace name (e.g., "global")
        key: Config key (e.g., "usecases")
        resolve_vault: If True, resolves vault:// references to actual secrets
    
    Returns:
        Full config with cache-friendly structure
    
    Example:
        GET /reference/global/usecases
    """
    # Find namespace by name
    ns = db.query(models.Namespace).filter(models.Namespace.name == namespace).first()
    if not ns:
        raise HTTPException(
            status_code=404, 
            detail=f"Namespace '{namespace}' not found"
        )
    
    # Find config by key
    config = db.query(models.ConfigEntry).filter(
        models.ConfigEntry.namespace_id == ns.id,
        models.ConfigEntry.key == key
    ).first()
    
    if not config:
        raise HTTPException(
            status_code=404, 
            detail=f"Config '{key}' not found in namespace '{namespace}'"
        )
    
    value = config.value
    
    # Optionally resolve vault references
    if resolve_vault:
        from ..keyvault import resolve_secrets
        value = resolve_secrets(value)
    
    return {
        "namespace": namespace,
        "key": key,
        "value": value,
        "version": config.version,
        "updated_at": config.updated_at.isoformat() if config.updated_at else None
    }


@router.get("/{namespace}/{key}/lookup/{id}")
def lookup_item_in_array(
    namespace: str,
    key: str,
    id: str,
    id_field: str = Query("id", description="Field name to use for lookup"),
    db: Session = Depends(get_db)
):
    """
    Lookup a specific item from an array-type config.
    
    Args:
        namespace: Namespace name
        key: Config key
        id: Value to search for
        id_field: Field name to match against (default: "id")
    
    Returns:
        Single matching object from the array
    
    Example:
        GET /reference/global/usecases/lookup/UC001?id_field=usecase_id
    """
    # Get the full config
    ns = db.query(models.Namespace).filter(models.Namespace.name == namespace).first()
    if not ns:
        raise HTTPException(
            status_code=404, 
            detail=f"Namespace '{namespace}' not found"
        )
    
    config = db.query(models.ConfigEntry).filter(
        models.ConfigEntry.namespace_id == ns.id,
        models.ConfigEntry.key == key
    ).first()
    
    if not config:
        raise HTTPException(
            status_code=404, 
            detail=f"Config '{key}' not found"
        )
    
    # Config value should be an array
    if not isinstance(config.value, list):
        raise HTTPException(
            status_code=400, 
            detail="Config is not an array type. Use GET /reference/{namespace}/{key} instead."
        )
    
    # Search for item with matching ID
    for item in config.value:
        if isinstance(item, dict) and str(item.get(id_field)) == str(id):
            return item
    
    raise HTTPException(
        status_code=404, 
        detail=f"Item with {id_field}='{id}' not found"
    )


@router.get("/{namespace}/{key}/search")
def search_in_config(
    namespace: str,
    key: str,
    q: str = Query(..., description="Search query"),
    db: Session = Depends(get_db)
):
    """
    Full-text search within config value.
    
    Args:
        namespace: Namespace name
        key: Config key  
        q: Search query (case-insensitive)
    
    Returns:
        Matching items (for arrays) or indication of match
    
    Example:
        GET /reference/global/usecases/search?q=onboarding
    """
    ns = db.query(models.Namespace).filter(models.Namespace.name == namespace).first()
    if not ns:
        raise HTTPException(
            status_code=404, 
            detail=f"Namespace '{namespace}' not found"
        )
    
    config = db.query(models.ConfigEntry).filter(
        models.ConfigEntry.namespace_id == ns.id,
        models.ConfigEntry.key == key
    ).first()
    
    if not config:
        raise HTTPException(
            status_code=404, 
            detail=f"Config '{key}' not found"
        )
    
    # Simple string search in JSON representation
    import json
    config_str = json.dumps(config.value).lower()
    q_lower = q.lower()
    
    if q_lower in config_str:
        # If array, return matching items
        if isinstance(config.value, list):
            results = []
            for item in config.value:
                item_str = json.dumps(item).lower()
                if q_lower in item_str:
                    results.append(item)
            return {
                "results": results, 
                "count": len(results),
                "query": q
            }
        else:
            return {
                "results": [config.value], 
                "count": 1,
                "query": q
            }
    
    return {
        "results": [], 
        "count": 0,
        "query": q
    }
