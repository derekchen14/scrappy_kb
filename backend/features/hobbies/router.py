from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List

from common import models
import schemas
from common.crud_hobbies import (
    create_hobby,
    get_hobby,
    get_hobbies,
    update_hobby,
    delete_hobby,
)
from common.database import get_db

router = APIRouter(prefix="/hobbies", tags=["hobbies"])

@router.post("/", response_model=schemas.Hobby)
def create_hobby_endpoint(hobby: schemas.HobbyCreate, db: Session = Depends(get_db)):
    return create_hobby(db=db, hobby=hobby)

@router.get("/", response_model=List[schemas.Hobby])
def read_hobbies(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return get_hobbies(db, skip=skip, limit=limit)

@router.get("/{hobby_id}", response_model=schemas.Hobby)
def read_hobby(hobby_id: int, db: Session = Depends(get_db)):
    hobby = get_hobby(db, hobby_id=hobby_id)
    if hobby is None:
        raise HTTPException(status_code=404, detail="Hobby not found")
    return hobby

@router.put("/{hobby_id}", response_model=schemas.Hobby)
def update_hobby_endpoint(hobby_id: int, hobby: schemas.HobbyCreate, db: Session = Depends(get_db)):
    updated_hobby = update_hobby(db, hobby_id=hobby_id, hobby=hobby)
    if updated_hobby is None:
        raise HTTPException(status_code=404, detail="Hobby not found")
    return updated_hobby

@router.delete("/{hobby_id}")
def delete_hobby_endpoint(hobby_id: int, db: Session = Depends(get_db)):
    deleted_hobby = delete_hobby(db, hobby_id=hobby_id)
    if deleted_hobby is None:
        raise HTTPException(status_code=404, detail="Hobby not found")
    return {"message": "Hobby deleted successfully"}

