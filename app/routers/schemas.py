from typing import Any, Dict, List

import jsonschema
from fastapi import APIRouter, Depends, HTTPException
from jsonschema import validate
from pydantic import BaseModel
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db

router = APIRouter(
    prefix="/schemas",
    tags=["schemas"],
)


@router.post("/", response_model=schemas.ConfigSchema)
def create_schema(schema: schemas.ConfigSchemaCreate, db: Session = Depends(get_db)):
    # Check for existing versions of this schema name
    existing_versions = (
        db.query(models.ConfigSchema)
        .filter(models.ConfigSchema.name == schema.name)
        .order_by(models.ConfigSchema.version.desc())
        .all()
    )

    new_version = 1
    if existing_versions:
        new_version = existing_versions[0].version + 1
        # Mark previous versions as inactive (optional, but good for "latest" logic)
        for v in existing_versions:
            v.is_active = False
    
    new_schema = models.ConfigSchema(
        name=schema.name, 
        description=schema.description, 
        structure=schema.structure,
        version=new_version,
        is_active=True
    )
    db.add(new_schema)
    db.commit()
    db.refresh(new_schema)
    return new_schema


@router.get("/", response_model=List[schemas.ConfigSchema])
def read_schemas(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    schemas_list = (
        db.query(models.ConfigSchema)
        .filter(models.ConfigSchema.deleted_at.is_(None))
        .filter(models.ConfigSchema.is_active == True)
        .offset(skip)
        .limit(limit)
        .all()
    )
    return schemas_list


@router.get("/{schema_id}", response_model=schemas.ConfigSchema)
def read_schema(schema_id: int, db: Session = Depends(get_db)):
    schema = (
        db.query(models.ConfigSchema)
        .filter(models.ConfigSchema.id == schema_id, models.ConfigSchema.deleted_at.is_(None))
        .first()
    )
    if schema is None:
        raise HTTPException(status_code=404, detail="Schema not found")
    return schema


@router.delete("/{schema_id}")
def delete_schema(schema_id: int, db: Session = Depends(get_db)):
    """Soft delete a schema"""
    schema = (
        db.query(models.ConfigSchema)
        .filter(models.ConfigSchema.id == schema_id, models.ConfigSchema.deleted_at.is_(None))
        .first()
    )
    if schema is None:
        raise HTTPException(status_code=404, detail="Schema not found")

    # Soft delete
    from datetime import datetime

    schema.deleted_at = datetime.utcnow()
    db.commit()

    return {"message": "Schema deleted successfully", "id": schema_id}


class ValidationRequest(BaseModel):
    schema_structure: Dict[str, Any]
    data: Any


@router.post("/validate")
def validate_schema(request: ValidationRequest):
    try:
        validate(instance=request.data, schema=request.schema_structure)
        return {"valid": True, "message": "Data is valid against the schema."}
    except jsonschema.exceptions.ValidationError as e:
        return {"valid": False, "message": e.message}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
