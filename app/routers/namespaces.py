from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas
from ..database import get_db

router = APIRouter(
    prefix="/namespaces",
    tags=["namespaces"],
)

@router.post("/", response_model=schemas.Namespace)
def create_namespace(namespace: schemas.NamespaceCreate, db: Session = Depends(get_db)):
    db_namespace = db.query(models.Namespace).filter(models.Namespace.name == namespace.name).first()
    if db_namespace:
        raise HTTPException(status_code=400, detail="Namespace already exists")
    new_namespace = models.Namespace(name=namespace.name, description=namespace.description)
    db.add(new_namespace)
    db.commit()
    db.refresh(new_namespace)
    return new_namespace

@router.get("/", response_model=List[schemas.Namespace])
def read_namespaces(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    namespaces = db.query(models.Namespace).filter(models.Namespace.deleted_at.is_(None)).offset(skip).limit(limit).all()
    return namespaces

@router.get("/{namespace_id}", response_model=schemas.Namespace)
def read_namespace(namespace_id: int, db: Session = Depends(get_db)):
    namespace = db.query(models.Namespace).filter(
        models.Namespace.id == namespace_id,
        models.Namespace.deleted_at.is_(None)
    ).first()
    if namespace is None:
        raise HTTPException(status_code=404, detail="Namespace not found")
    return namespace

@router.delete("/{namespace_id}")
def delete_namespace(namespace_id: int, db: Session = Depends(get_db)):
    """Soft delete a namespace"""
    namespace = db.query(models.Namespace).filter(
        models.Namespace.id == namespace_id,
        models.Namespace.deleted_at.is_(None)
    ).first()
    if namespace is None:
        raise HTTPException(status_code=404, detail="Namespace not found")
    
    # Soft delete
    from datetime import datetime
    namespace.deleted_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Namespace deleted successfully", "id": namespace_id}
