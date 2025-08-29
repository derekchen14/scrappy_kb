import csv
import io
from sqlalchemy.orm import Session
from typing import List, Optional, Dict
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
        auth0_user_id=founder.auth0_user_id,
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

# User profile matching functions
def get_founder_by_auth0_user_id(db: Session, auth0_user_id: str):
    """Get founder profile by Auth0 user ID (for claimed profiles)."""
    return db.query(models.Founder).filter(models.Founder.auth0_user_id == auth0_user_id).first()

def get_unclaimed_founder_by_email(db: Session, email: str):
    """Get unclaimed founder profile by email."""
    return db.query(models.Founder).filter(
        models.Founder.email.ilike(email),
        models.Founder.auth0_user_id.is_(None)
    ).first()

def claim_founder_profile(db: Session, founder_id: int, auth0_user_id: str):
    """Claim a founder profile by linking it to an Auth0 user."""
    db_founder = db.query(models.Founder).filter(models.Founder.id == founder_id).first()
    if db_founder:
        db_founder.auth0_user_id = auth0_user_id
        db.commit()
        db.refresh(db_founder)
    return db_founder

def get_founders_by_startup_id(db: Session, startup_id: int):
    """Get all founders associated with a specific startup."""
    return db.query(models.Founder).filter(models.Founder.startup_id == startup_id).all()


# <<< --- START: NEW CODE FOR CSV UPLOAD --- >>>

def get_or_create_skill(db: Session, skill_name: str) -> models.Skill:
    """Helper function to get a skill by name or create it if it doesn't exist."""
    skill = db.query(models.Skill).filter(models.Skill.name.ilike(skill_name.strip())).first()
    if not skill:
        skill_schema = schemas.SkillCreate(name=skill_name.strip())
        skill = create_skill(db, skill_schema)
    return skill

def get_or_create_hobby(db: Session, hobby_name: str) -> models.Hobby:
    """Helper function to get a hobby by name or create it if it doesn't exist."""
    hobby = db.query(models.Hobby).filter(models.Hobby.name.ilike(hobby_name.strip())).first()
    if not hobby:
        hobby_schema = schemas.HobbyCreate(name=hobby_name.strip())
        hobby = create_hobby(db, hobby_schema)
    return hobby

def get_or_create_startup(db: Session, startup_name: str, startup_details: Dict) -> models.Startup:
    """Helper function to get a startup by name or create it if it doesn't exist."""
    startup = db.query(models.Startup).filter(models.Startup.name.ilike(startup_name.strip())).first()
    if not startup:
        startup_schema = schemas.StartupCreate(**startup_details)
        startup = create_startup(db, startup_schema)
    return startup

def create_founders_from_csv(db: Session, csv_file: bytes):
    """Parses a CSV file and creates founders, startups, skills, and hobbies."""
    
    created_founders = []
    errors = []

    try:
        file_content_str = csv_file.decode('utf-8')
        reader = csv.DictReader(io.StringIO(file_content_str))
        
        # Normalize headers: strip whitespace and make lowercase
        reader.fieldnames = [header.strip().lower() for header in reader.fieldnames]
    except Exception as e:
        return {"created_count": 0, "errors": [f"Failed to read or decode CSV: {e}"]}

    # --- Define expected column headers based on your documentation (lowercase for matching) ---
    # These keys will be used to access data from each row.
    COL_NAME = "name"
    COL_EMAIL = "email"
    COL_LINKEDIN = "linkedin url"
    COL_TWITTER = "twitter url"
    COL_LOCATION = "location"
    COL_HOBBY = "one thing you love doing outside your startup?"
    COL_HELP_OFFERED = "one thing you can help with (your specialization/passion)"
    COL_HELP_WANTED = "something you want other founders to help you with? (customer acquisition, gtm, fundraising, engineering, product, etc.)"
    
    COL_STARTUP_NAME = "startup name"
    COL_STARTUP_DESC = "describe what your startup does (in 1 sentence)"
    COL_STARTUP_STAGE = "where are you now (stage)?"
    COL_STARTUP_INDUSTRY = "what is your startup industry?"
    COL_STARTUP_MARKET = "who are you building for?"
    COL_STARTUP_REVENUE = "current revenue (arr $)"
    COL_STARTUP_WEBSITE = "startup website"

    for row_num, row in enumerate(reader, 2): # Start from row 2 (for error logging)
        try:
            # Normalize row keys to handle potential whitespace issues
            row = {k.strip().lower(): v.strip() for k, v in row.items()}

            # 1. Handle Startup
            startup_name = row.get(COL_STARTUP_NAME, "")
            if not startup_name:
                errors.append(f"Row {row_num}: '{COL_STARTUP_NAME}' is a required field.")
                continue

            startup_data = {
                "name": startup_name,
                "description": row.get(COL_STARTUP_DESC, ""),
                "stage": row.get(COL_STARTUP_STAGE, ""),
                "industry": row.get(COL_STARTUP_INDUSTRY, ""),
                "target_market": row.get(COL_STARTUP_MARKET, ""),
                "revenue_arr": row.get(COL_STARTUP_REVENUE, ""),
                "website": row.get(COL_STARTUP_WEBSITE, "")
            }
            startup = get_or_create_startup(db, startup_name, startup_data)

            # 2. Handle Founder Email (Check for existence)
            founder_email = row.get(COL_EMAIL, "")
            if not founder_email:
                errors.append(f"Row {row_num}: '{COL_EMAIL}' is a required field.")
                continue
            
            existing_founder = db.query(models.Founder).filter(models.Founder.email.ilike(founder_email)).first()
            if existing_founder:
                errors.append(f"Row {row_num}: Founder with email '{founder_email}' already exists.")
                continue
                
            # 3. Handle Skills (from "Help Offered" and "Help Wanted")
            skill_ids = set() # Use a set to avoid duplicate skill IDs
            help_offered = row.get(COL_HELP_OFFERED, "")
            help_wanted = row.get(COL_HELP_WANTED, "")
            
            skill_names = [s.strip() for s in (help_offered + "," + help_wanted).split(',') if s.strip()]
            for skill_name in skill_names:
                skill = get_or_create_skill(db, skill_name)
                skill_ids.add(skill.id)

            # 4. Handle Hobbies
            hobby_ids = set() # Use a set to avoid duplicate hobby IDs
            hobby_names_str = row.get(COL_HOBBY, "")
            hobby_names = [h.strip() for h in hobby_names_str.split(',') if h.strip()]
            for hobby_name in hobby_names:
                hobby = get_or_create_hobby(db, hobby_name)
                hobby_ids.add(hobby.id)

            # 5. Prepare and Create Founder
            founder_data = schemas.FounderCreate(
                name=row.get(COL_NAME, ""),
                email=founder_email,
                location=row.get(COL_LOCATION, ""),
                linkedin_url=row.get(COL_LINKEDIN, ""),
                twitter_url=row.get(COL_TWITTER, ""),
                startup_id=startup.id,
                skill_ids=list(skill_ids),
                hobby_ids=list(hobby_ids),
                profile_visible=True # Default visibility
            )

            created_founder = create_founder(db, founder_data)
            created_founders.append(created_founder)

        except Exception as e:
            errors.append(f"Row {row_num}: An unexpected error occurred - {str(e)}")
            
    return {"created_count": len(created_founders), "errors": errors}

# <<< --- END: NEW CODE FOR CSV UPLOAD --- >>>


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

def get_startups(db: Session, skip: int = 0, limit: int = 1000):
    return db.query(models.Startup).order_by(models.Startup.created_at.desc()).offset(skip).limit(limit).all()

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