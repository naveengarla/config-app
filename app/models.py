from sqlalchemy import JSON, Column, DateTime, ForeignKey, Integer, String, UniqueConstraint, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .database import Base


class Namespace(Base):
    __tablename__ = "namespaces"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    configs = relationship("ConfigEntry", back_populates="namespace")


class ConfigSchema(Base):
    __tablename__ = "config_schemas"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)  # Removed unique=True
    description = Column(String, nullable=True)
    version = Column(Integer, default=1)
    structure = Column(JSON, nullable=False)
    is_active = Column(Boolean, default=True)  # New field for lifecycle management
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    configs = relationship("ConfigEntry", back_populates="schema")

    __table_args__ = (UniqueConstraint("name", "version", name="_name_version_uc"),)


class ConfigEntry(Base):
    __tablename__ = "config_entries"

    id = Column(Integer, primary_key=True, index=True)
    namespace_id = Column(Integer, ForeignKey("namespaces.id"), nullable=False)
    schema_id = Column(Integer, ForeignKey("config_schemas.id"), nullable=False)
    key = Column(String, index=True, nullable=False)
    value = Column(JSON, nullable=False)
    version = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    namespace = relationship("Namespace", back_populates="configs")
    schema = relationship("ConfigSchema", back_populates="configs")
    history = relationship("ConfigHistory", back_populates="config")

    __table_args__ = (UniqueConstraint("namespace_id", "key", name="_namespace_key_uc"),)


class ConfigHistory(Base):
    __tablename__ = "config_history"

    id = Column(Integer, primary_key=True, index=True)
    config_id = Column(Integer, ForeignKey("config_entries.id"), nullable=False)
    value = Column(JSON, nullable=False)
    version = Column(Integer, nullable=False)
    changed_at = Column(DateTime(timezone=True), server_default=func.now())

    config = relationship("ConfigEntry", back_populates="history")
