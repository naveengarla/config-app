from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas
from ..database import get_db
import jsonschema
from jsonschema import validate

router = APIRouter(
    prefix="/configs",
    tags=["configs"],
)

def validate_config_value(value, schema_structure):
    try:
        validate(instance=value, schema=schema_structure)
    except jsonschema.exceptions.ValidationError as e:
        raise HTTPException(status_code=400, detail=f"Config validation failed: {e.message}")

@router.post("/", response_model=schemas.ConfigEntry)
def create_config(config: schemas.ConfigEntryCreate, db: Session = Depends(get_db)):
    # Check if namespace exists
    namespace = db.query(models.Namespace).filter(models.Namespace.id == config.namespace_id).first()
    if not namespace:
        raise HTTPException(status_code=404, detail="Namespace not found")

    # Check if schema exists
    schema = db.query(models.ConfigSchema).filter(models.ConfigSchema.id == config.schema_id).first()
    if not schema:
        raise HTTPException(status_code=404, detail="Schema not found")

    # Check for duplicate key in namespace
    existing_config = db.query(models.ConfigEntry).filter(
        models.ConfigEntry.namespace_id == config.namespace_id,
        models.ConfigEntry.key == config.key
    ).first()
    if existing_config:
        raise HTTPException(status_code=400, detail="Config key already exists in this namespace")

    # Validate value against schema
    validate_config_value(config.value, schema.structure)

    new_config = models.ConfigEntry(
        namespace_id=config.namespace_id,
        schema_id=config.schema_id,
        key=config.key,
        value=config.value
    )
    db.add(new_config)
    db.commit()
    db.refresh(new_config)
    
    # Create history entry
    history = models.ConfigHistory(
        config_id=new_config.id,
        value=new_config.value,
        version=new_config.version
    )
    db.add(history)
    db.commit()

    return new_config

@router.get("/", response_model=List[schemas.ConfigEntry])
def read_configs(skip: int = 0, limit: int = 100, namespace_id: int = None, db: Session = Depends(get_db)):
    query = db.query(models.ConfigEntry).filter(models.ConfigEntry.deleted_at.is_(None))
    if namespace_id:
        query = query.filter(models.ConfigEntry.namespace_id == namespace_id)
    configs = query.offset(skip).limit(limit).all()
    return configs

@router.get("/{config_id}", response_model=schemas.ConfigEntry)
def read_config(config_id: int, db: Session = Depends(get_db)):
    config = db.query(models.ConfigEntry).filter(
        models.ConfigEntry.id == config_id,
        models.ConfigEntry.deleted_at.is_(None)
    ).first()
    if config is None:
        raise HTTPException(status_code=404, detail="Config not found")
    return config

@router.put("/{config_id}", response_model=schemas.ConfigEntry)
def update_config(config_id: int, config_update: schemas.ConfigEntryUpdate, db: Session = Depends(get_db)):
    db_config = db.query(models.ConfigEntry).filter(
        models.ConfigEntry.id == config_id,
        models.ConfigEntry.deleted_at.is_(None)
    ).first()
    if not db_config:
        raise HTTPException(status_code=404, detail="Config not found")
    
    # Get schema to validate
    schema = db.query(models.ConfigSchema).filter(models.ConfigSchema.id == db_config.schema_id).first()
    
    # Validate new value
    validate_config_value(config_update.value, schema.structure)
    
    # Update config
    db_config.value = config_update.value
    db_config.version += 1
    
    # Create history entry
    history = models.ConfigHistory(
        config_id=db_config.id,
        value=db_config.value,
        version=db_config.version
    )
    db.add(history)
    
    db.commit()
    db.refresh(db_config)
    return db_config

@router.delete("/{config_id}")
def delete_config(config_id: int, db: Session = Depends(get_db)):
    """Soft delete a configuration"""
    config = db.query(models.ConfigEntry).filter(
        models.ConfigEntry.id == config_id,
        models.ConfigEntry.deleted_at.is_(None)
    ).first()
    if config is None:
        raise HTTPException(status_code=404, detail="Config not found")
    
    # Soft delete
    from datetime import datetime
    config.deleted_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Configuration deleted successfully", "id": config_id}
