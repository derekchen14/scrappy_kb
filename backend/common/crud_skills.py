"""CRUD operations for Skills"""
from sqlalchemy.orm import Session

from common import models
import schemas


def create_skill(db: Session, skill: schemas.SkillCreate):
    db_skill = models.Skill(**skill.model_dump())
    db.add(db_skill)
    db.commit()
    db.refresh(db_skill)
    return db_skill


def get_skill(db: Session, skill_id: int):
    return db.query(models.Skill).filter(models.Skill.id == skill_id).first()


def get_skills(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Skill).offset(skip).limit(limit).all()


def update_skill(db: Session, skill_id: int, skill: schemas.SkillCreate):
    db_skill = db.query(models.Skill).filter(models.Skill.id == skill_id).first()
    if db_skill:
        for key, value in skill.model_dump().items():
            setattr(db_skill, key, value)
        db.commit()
        db.refresh(db_skill)
    return db_skill


def delete_skill(db: Session, skill_id: int):
    db_skill = db.query(models.Skill).filter(models.Skill.id == skill_id).first()
    if db_skill:
        db.delete(db_skill)
        db.commit()
    return db_skill


def get_or_create_skill(db: Session, skill_name: str) -> models.Skill:
    """Helper function to get a skill by name or create it if it doesn't exist."""
    skill = db.query(models.Skill).filter(models.Skill.name.ilike(skill_name.strip())).first()
    if not skill:
        skill_schema = schemas.SkillCreate(name=skill_name.strip())
        skill = create_skill(db, skill_schema)
    return skill

