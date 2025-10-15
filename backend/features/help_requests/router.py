from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List

from common import models
import schemas
from common.crud_help_requests import (
    create_help_request,
    get_help_request,
    get_help_requests,
    update_help_request,
    delete_help_request,
)
from common.database import get_db

router = APIRouter(prefix="/help-requests", tags=["help-requests"])

@router.post("/", response_model=schemas.HelpRequest)
def create_help_request_endpoint(help_request: schemas.HelpRequestCreate, db: Session = Depends(get_db)):
    return create_help_request(db=db, help_request=help_request)

@router.get("/", response_model=List[schemas.HelpRequest])
def read_help_requests(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return get_help_requests(db, skip=skip, limit=limit)

@router.get("/{help_request_id}", response_model=schemas.HelpRequest)
def read_help_request(help_request_id: int, db: Session = Depends(get_db)):
    help_request = get_help_request(db, help_request_id=help_request_id)
    if help_request is None:
        raise HTTPException(status_code=404, detail="Help request not found")
    return help_request

@router.put("/{help_request_id}", response_model=schemas.HelpRequest)
def update_help_request_endpoint(help_request_id: int, help_request: schemas.HelpRequestCreate, db: Session = Depends(get_db)):
    updated_help_request = update_help_request(db, help_request_id=help_request_id, help_request=help_request)
    if updated_help_request is None:
        raise HTTPException(status_code=404, detail="Help request not found")
    return updated_help_request

@router.delete("/{help_request_id}")
def delete_help_request_endpoint(help_request_id: int, db: Session = Depends(get_db)):
    deleted_help_request = delete_help_request(db, help_request_id=help_request_id)
    if deleted_help_request is None:
        raise HTTPException(status_code=404, detail="Help request not found")
    return {"message": "Help request deleted successfully"}

