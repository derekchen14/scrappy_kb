from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List

from common import models
import schemas
from common.crud_startups import (
    create_startup,
    get_startup,
    get_startups,
    update_startup,
    delete_startup,
)
from common.crud_founders import get_founders_by_startup_id
from common.database import get_db

router = APIRouter(prefix="/startups", tags=["startups"])

@router.post("/", response_model=schemas.Startup)
def create_startup_endpoint(startup: schemas.StartupCreate, db: Session = Depends(get_db)):
    return create_startup(db=db, startup=startup)

@router.get("/", response_model=List[schemas.Startup])
def read_startups(skip: int = 0, limit: int = 1000, db: Session = Depends(get_db)):
    return get_startups(db, skip=skip, limit=limit)

@router.get("/{startup_id}", response_model=schemas.Startup)
def read_startup(startup_id: int, db: Session = Depends(get_db)):
    startup = get_startup(db, startup_id=startup_id)
    if startup is None:
        raise HTTPException(status_code=404, detail="Startup not found")
    return startup

@router.put("/{startup_id}", response_model=schemas.Startup)
def update_startup_endpoint(startup_id: int, startup: schemas.StartupCreate, db: Session = Depends(get_db)):
    updated_startup = update_startup(db, startup_id=startup_id, startup=startup)
    if updated_startup is None:
        raise HTTPException(status_code=404, detail="Startup not found")
    return updated_startup

@router.delete("/{startup_id}")
def delete_startup_endpoint(startup_id: int, db: Session = Depends(get_db)):
    deleted_startup = delete_startup(db, startup_id=startup_id)
    if deleted_startup is None:
        raise HTTPException(status_code=404, detail="Startup not found")
    return {"message": "Startup deleted successfully"}

@router.get("/{startup_id}/founders", response_model=List[schemas.Founder])
def get_startup_founders_endpoint(startup_id: int, db: Session = Depends(get_db)):
    """Get all founders associated with a specific startup."""
    startup = get_startup(db, startup_id=startup_id)
    if startup is None:
        raise HTTPException(status_code=404, detail="Startup not found")
    
    founders = get_founders_by_startup_id(db, startup_id=startup_id)
    return founders

