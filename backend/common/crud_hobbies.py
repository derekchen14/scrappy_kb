"""CRUD operations for Hobbies"""
from sqlalchemy.orm import Session

from common import models
import schemas


def create_hobby(db: Session, hobby: schemas.HobbyCreate):
    db_hobby = models.Hobby(**hobby.model_dump())
    db.add(db_hobby)
    db.commit()
    db.refresh(db_hobby)
    return db_hobby


def get_hobby(db: Session, hobby_id: int):
    return db.query(models.Hobby).filter(models.Hobby.id == hobby_id).first()


def get_hobbies(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Hobby).offset(skip).limit(limit).all()


def update_hobby(db: Session, hobby_id: int, hobby: schemas.HobbyCreate):
    db_hobby = db.query(models.Hobby).filter(models.Hobby.id == hobby_id).first()
    if db_hobby:
        for key, value in hobby.model_dump().items():
            setattr(db_hobby, key, value)
        db.commit()
        db.refresh(db_hobby)
    return db_hobby


def delete_hobby(db: Session, hobby_id: int):
    db_hobby = db.query(models.Hobby).filter(models.Hobby.id == hobby_id).first()
    if db_hobby:
        db.delete(db_hobby)
        db.commit()
    return db_hobby


def get_or_create_hobby(db: Session, hobby_name: str) -> models.Hobby:
    """Helper function to get a hobby by name or create it if it doesn't exist."""
    hobby = db.query(models.Hobby).filter(models.Hobby.name.ilike(hobby_name.strip())).first()
    if not hobby:
        hobby_schema = schemas.HobbyCreate(name=hobby_name.strip())
        hobby = create_hobby(db, hobby_schema)
    return hobby

