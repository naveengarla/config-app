from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime

# Namespace Schemas
class NamespaceBase(BaseModel):
    name: str
    description: Optional[str] = None

class NamespaceCreate(NamespaceBase):
    pass

class Namespace(NamespaceBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True

# Config Schema Schemas
class ConfigSchemaBase(BaseModel):
    name: str
    structure: Dict[str, Any] # JSON Schema

class ConfigSchemaCreate(ConfigSchemaBase):
    pass

class ConfigSchema(ConfigSchemaBase):
    id: int
    version: int
    created_at: datetime

    class Config:
        orm_mode = True

# Config Entry Schemas
class ConfigEntryBase(BaseModel):
    key: str
    value: Any # The actual config data

class ConfigEntryCreate(ConfigEntryBase):
    namespace_id: int
    schema_id: int

class ConfigEntryUpdate(BaseModel):
    value: Any

class ConfigEntry(ConfigEntryBase):
    id: int
    namespace_id: int
    schema_id: int
    version: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # We might want to include the schema name and namespace name in the response for convenience
    # namespace_name: str
    # schema_name: str

    class Config:
        orm_mode = True

class ConfigHistory(BaseModel):
    id: int
    config_id: int
    value: Any
    version: int
    changed_at: datetime

    class Config:
        orm_mode = True
