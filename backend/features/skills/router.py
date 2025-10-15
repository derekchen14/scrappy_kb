from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List

from common import models
import schemas
from common.crud_skills import (
    create_skill,
    get_skill,
    get_skills,
    update_skill,
    delete_skill,
)
from common.database import get_db

router = APIRouter(prefix="/skills", tags=["skills"])

@router.post("/", response_model=schemas.Skill)
def create_skill_endpoint(skill: schemas.SkillCreate, db: Session = Depends(get_db)):
    return create_skill(db=db, skill=skill)

@router.get("/", response_model=List[schemas.Skill])
def read_skills(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return get_skills(db, skip=skip, limit=limit)

@router.get("/{skill_id}", response_model=schemas.Skill)
def read_skill(skill_id: int, db: Session = Depends(get_db)):
    skill = get_skill(db, skill_id=skill_id)
    if skill is None:
        raise HTTPException(status_code=404, detail="Skill not found")
    return skill

@router.put("/{skill_id}", response_model=schemas.Skill)
def update_skill_endpoint(skill_id: int, skill: schemas.SkillCreate, db: Session = Depends(get_db)):
    updated_skill = update_skill(db, skill_id=skill_id, skill=skill)
    if updated_skill is None:
        raise HTTPException(status_code=404, detail="Skill not found")
    return updated_skill

@router.delete("/{skill_id}")
def delete_skill_endpoint(skill_id: int, db: Session = Depends(get_db)):
    deleted_skill = delete_skill(db, skill_id=skill_id)
    if deleted_skill is None:
        raise HTTPException(status_code=404, detail="Skill not found")
    return {"message": "Skill deleted successfully"}

