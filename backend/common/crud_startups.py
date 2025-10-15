"""CRUD operations for Startups"""
from sqlalchemy.orm import Session
from typing import Dict

from common import models
import schemas


def create_startup(db: Session, startup: schemas.StartupCreate):
    db_startup = models.Startup(**startup.model_dump())
    db.add(db_startup)
    db.commit()
    db.refresh(db_startup)
    return db_startup


def get_startup(db: Session, startup_id: int):
    return db.query(models.Startup).filter(models.Startup.id == startup_id).first()


def get_startups(db: Session, skip: int = 0, limit: int = 1000):
    return db.query(models.Startup).order_by(models.Startup.created_at.desc()).offset(skip).limit(limit).all()


def update_startup(db: Session, startup_id: int, startup: schemas.StartupCreate):
    db_startup = db.query(models.Startup).filter(models.Startup.id == startup_id).first()
    if db_startup:
        for key, value in startup.model_dump().items():
            setattr(db_startup, key, value)
        db.commit()
        db.refresh(db_startup)
    return db_startup


def delete_startup(db: Session, startup_id: int):
    db_startup = db.query(models.Startup).filter(models.Startup.id == startup_id).first()
    if db_startup:
        db.delete(db_startup)
        db.commit()
    return db_startup


def get_or_create_startup(db: Session, startup_name: str, startup_details: Dict) -> models.Startup:
    """Helper function to get a startup by name or create it if it doesn't exist."""
    startup = db.query(models.Startup).filter(models.Startup.name.ilike(startup_name.strip())).first()
    if not startup:
        startup_schema = schemas.StartupCreate(**startup_details)
        startup = create_startup(db, startup_schema)
    return startup

