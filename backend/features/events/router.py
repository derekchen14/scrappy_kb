from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List

from common import models
import schemas
from common.crud_events import (
    create_event,
    get_event,
    get_events,
    update_event,
    delete_event,
)
from common.auth import get_current_user
from common.database import get_db

router = APIRouter(prefix="/events", tags=["events"])

@router.post("/", response_model=schemas.Event)
def create_event_endpoint(event: schemas.EventCreate, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    return create_event(db=db, event=event)

@router.get("/", response_model=List[schemas.Event])
def read_events(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return get_events(db, skip=skip, limit=limit)

@router.get("/{event_id}", response_model=schemas.Event)
def read_event(event_id: int, db: Session = Depends(get_db)):
    event = get_event(db, event_id=event_id)
    if event is None:
        raise HTTPException(status_code=404, detail="Event not found")
    return event

@router.put("/{event_id}", response_model=schemas.Event)
def update_event_endpoint(event_id: int, event: schemas.EventCreate, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    updated_event = update_event(db, event_id=event_id, event=event)
    if updated_event is None:
        raise HTTPException(status_code=404, detail="Event not found")
    return updated_event

@router.delete("/{event_id}")
def delete_event_endpoint(event_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    deleted_event = delete_event(db, event_id=event_id)
    if deleted_event is None:
        raise HTTPException(status_code=404, detail="Event not found")
    return {"message": "Event deleted successfully"}

