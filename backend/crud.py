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
        github_url=founder.github_url,
        profile_image_url=founder.profile_image_url,
        profile_visible=founder.profile_visible,
        startup_id=founder.startup_id
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
    
    # Add hobbies
    if founder.hobby_ids and len(founder.hobby_ids) > 0:
        hobbies = db.query(models.Hobby).filter(models.Hobby.id.in_(founder.hobby_ids)).all()
        db_founder.hobbies = hobbies
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
        for key, value in founder.model_dump(exclude={'skill_ids', 'startup_id', 'hobby_ids'}).items():
            if value is not None:
                setattr(db_founder, key, value)
        
        # Update startup_id directly
        if founder.startup_id is not None:
            db_founder.startup_id = founder.startup_id
        
        # Update skills
        if founder.skill_ids is not None:
            if len(founder.skill_ids) > 0:
                skills = db.query(models.Skill).filter(models.Skill.id.in_(founder.skill_ids)).all()
                db_founder.skills = skills
            else:
                db_founder.skills = []
        
        # Update hobbies
        if founder.hobby_ids is not None:
            if len(founder.hobby_ids) > 0:
                hobbies = db.query(models.Hobby).filter(models.Hobby.id.in_(founder.hobby_ids)).all()
                db_founder.hobbies = hobbies
            else:
                db_founder.hobbies = []
        
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

# Startup CRUD operations
def create_startup(db: Session, startup: schemas.StartupCreate):
    db_startup = models.Startup(**startup.model_dump())
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

# Help Request CRUD operations
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

# Hobby CRUD operations
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

# Event CRUD operations
def create_event(db: Session, event: schemas.EventCreate):
    db_event = models.Event(**event.model_dump())
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event

def get_event(db: Session, event_id: int):
    return db.query(models.Event).filter(models.Event.id == event_id).first()

def get_events(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Event).offset(skip).limit(limit).all()

def update_event(db: Session, event_id: int, event: schemas.EventCreate):
    db_event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if db_event:
        for key, value in event.model_dump().items():
            setattr(db_event, key, value)
        db.commit()
        db.refresh(db_event)
    return db_event

def delete_event(db: Session, event_id: int):
    db_event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if db_event:
        db.delete(db_event)
        db.commit()
    return db_event