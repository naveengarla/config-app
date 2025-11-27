from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from .. import models, schemas
from ..database import get_db
import jsonschema
from jsonschema import validate
from pydantic import BaseModel

router = APIRouter(
    prefix="/schemas",
    tags=["schemas"],
)

@router.post("/", response_model=schemas.ConfigSchema)
def create_schema(schema: schemas.ConfigSchemaCreate, db: Session = Depends(get_db)):
    db_schema = db.query(models.ConfigSchema).filter(models.ConfigSchema.name == schema.name).first()
    if db_schema:
        raise HTTPException(status_code=400, detail="Schema already exists")
    
    # TODO: Validate that schema.structure is a valid JSON Schema
    
    new_schema = models.ConfigSchema(name=schema.name, structure=schema.structure)
    db.add(new_schema)
    db.commit()
    db.refresh(new_schema)
    return new_schema

@router.get("/", response_model=List[schemas.ConfigSchema])
def read_schemas(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    schemas_list = db.query(models.ConfigSchema).filter(models.ConfigSchema.deleted_at.is_(None)).offset(skip).limit(limit).all()
    return schemas_list

@router.get("/{schema_id}", response_model=schemas.ConfigSchema)
def read_schema(schema_id: int, db: Session = Depends(get_db)):
    schema = db.query(models.ConfigSchema).filter(
        models.ConfigSchema.id == schema_id,
        models.ConfigSchema.deleted_at.is_(None)
    ).first()
    if schema is None:
        raise HTTPException(status_code=404, detail="Schema not found")
    return schema

@router.delete("/{schema_id}")
def delete_schema(schema_id: int, db: Session = Depends(get_db)):
    """Soft delete a schema"""
    schema = db.query(models.ConfigSchema).filter(
        models.ConfigSchema.id == schema_id,
        models.ConfigSchema.deleted_at.is_(None)
    ).first()
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
        raise HTTPException(status_code=400, detail=str(e))
