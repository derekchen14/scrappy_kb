from sqlalchemy.orm import Session
from typing import List, Optional
import models, schemas

# Founder CRUD operations
def create_founder(db: Session, founder: schemas.FounderCreate):
    db_founder = models.Founder(
        name=founder.name,
        email=founder.email,
        bio=founder.bio,
        location=founder.location,
        linkedin_url=founder.linkedin_url,
        twitter_url=founder.twitter_url,
        github_url=founder.github_url
    )
    
    db.add(db_founder)
    db.commit()
    db.refresh(db_founder)
    
    # Add skills
    if founder.skill_ids and len(founder.skill_ids) > 0:
        skills = db.query(models.Skill).filter(models.Skill.id.in_(founder.skill_ids)).all()
        db_founder.skills = skills
        db.commit()
        db.refresh(db_founder)
    
    # Add startups
    if founder.startup_ids and len(founder.startup_ids) > 0:
        startups = db.query(models.Startup).filter(models.Startup.id.in_(founder.startup_ids)).all()
        db_founder.startups = startups
        db.commit()
        db.refresh(db_founder)
    
    return db_founder

def get_founder(db: Session, founder_id: int):
    return db.query(models.Founder).filter(models.Founder.id == founder_id).first()

def get_founders(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Founder).offset(skip).limit(limit).all()

def update_founder(db: Session, founder_id: int, founder: schemas.FounderCreate):
    db_founder = db.query(models.Founder).filter(models.Founder.id == founder_id).first()
    if db_founder:
        for key, value in founder.dict(exclude={'skill_ids', 'startup_ids'}).items():
            if value is not None:
                setattr(db_founder, key, value)
        
        # Update skills
        if founder.skill_ids is not None:
            if len(founder.skill_ids) > 0:
                skills = db.query(models.Skill).filter(models.Skill.id.in_(founder.skill_ids)).all()
                db_founder.skills = skills
            else:
                db_founder.skills = []
        
        # Update startups
        if founder.startup_ids is not None:
            if len(founder.startup_ids) > 0:
                startups = db.query(models.Startup).filter(models.Startup.id.in_(founder.startup_ids)).all()
                db_founder.startups = startups
            else:
                db_founder.startups = []
        
        db.commit()
        db.refresh(db_founder)
    return db_founder

def delete_founder(db: Session, founder_id: int):
    db_founder = db.query(models.Founder).filter(models.Founder.id == founder_id).first()
    if db_founder:
        db.delete(db_founder)
        db.commit()
    return db_founder

# Skill CRUD operations
def create_skill(db: Session, skill: schemas.SkillCreate):
    db_skill = models.Skill(**skill.dict())
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
        for key, value in skill.dict().items():
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

# Startup CRUD operations
def create_startup(db: Session, startup: schemas.StartupCreate):
    db_startup = models.Startup(**startup.dict())
    db.add(db_startup)
    db.commit()
    db.refresh(db_startup)
    return db_startup

def get_startup(db: Session, startup_id: int):
    return db.query(models.Startup).filter(models.Startup.id == startup_id).first()

def get_startups(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Startup).offset(skip).limit(limit).all()

def update_startup(db: Session, startup_id: int, startup: schemas.StartupCreate):
    db_startup = db.query(models.Startup).filter(models.Startup.id == startup_id).first()
    if db_startup:
        for key, value in startup.dict().items():
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

# Help Request CRUD operations
def create_help_request(db: Session, help_request: schemas.HelpRequestCreate):
    db_help_request = models.HelpRequest(**help_request.dict())
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
        for key, value in help_request.dict().items():
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