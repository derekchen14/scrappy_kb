"""CRUD operations for Help Requests"""
from sqlalchemy.orm import Session

from common import models
import schemas


def create_help_request(db: Session, help_request: schemas.HelpRequestCreate):
    db_help_request = models.HelpRequest(**help_request.model_dump())
    db.add(db_help_request)
    db.commit()
    db.refresh(db_help_request)
    return db_help_request


def get_help_request(db: Session, help_request_id: int):
    return db.query(models.HelpRequest).filter(models.HelpRequest.id == help_request_id).first()


def get_help_requests(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.HelpRequest).offset(skip).limit(limit).all()


def update_help_request(db: Session, help_request_id: int, help_request: schemas.HelpRequestCreate):
    db_help_request = db.query(models.HelpRequest).filter(models.HelpRequest.id == help_request_id).first()
    if db_help_request:
        for key, value in help_request.model_dump().items():
            setattr(db_help_request, key, value)
        db.commit()
        db.refresh(db_help_request)
    return db_help_request


def delete_help_request(db: Session, help_request_id: int):
    db_help_request = db.query(models.HelpRequest).filter(models.HelpRequest.id == help_request_id).first()
    if db_help_request:
        db.delete(db_help_request)
        db.commit()
    return db_help_request

