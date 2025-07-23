from fastapi import FastAPI, HTTPException, Depends, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from typing import List, Optional
import models, schemas, database, crud
from auth import get_current_user, get_current_user_optional
import os
import uuid
import requests
import json
from pathlib import Path
from pydantic import BaseModel

app = FastAPI(title="Scrappy Founders Knowledge Base")

# Create uploads directory if it doesn't exist
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# Mount static files for serving uploaded images
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create tables
models.Base.metadata.create_all(bind=database.engine)

# Dependency
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Health check endpoint (no auth required)
@app.get("/health")
def health_check():
    return {"status": "healthy", "message": "API is running"}

# Root endpoint
@app.get("/")
def read_root():
    return {"message": "Scrappy Founders Knowledge Base API"}

# Protected endpoint to verify authentication
@app.get("/protected")
def protected_route(current_user: dict = Depends(get_current_user)):
    return {"message": "This is a protected endpoint", "user": current_user}

# Image upload endpoint
@app.post("/upload-image/")
async def upload_image(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Generate unique filename
    file_extension = file.filename.split(".")[-1] if file.filename else "jpg"
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = UPLOAD_DIR / unique_filename
    
    # Save file
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
    
    # Return the URL that can be used to access the image
    return {"image_url": f"/uploads/{unique_filename}"}

# Founder endpoints
@app.post("/founders/", response_model=schemas.Founder)
def create_founder(founder: schemas.FounderCreate, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    return crud.create_founder(db=db, founder=founder)

@app.get("/founders/", response_model=List[schemas.Founder])
def read_founders(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_founders(db, skip=skip, limit=limit)

@app.get("/founders/{founder_id}", response_model=schemas.Founder)
def read_founder(founder_id: int, db: Session = Depends(get_db)):
    founder = crud.get_founder(db, founder_id=founder_id)
    if founder is None:
        raise HTTPException(status_code=404, detail="Founder not found")
    return founder

@app.put("/founders/{founder_id}", response_model=schemas.Founder)
def update_founder(founder_id: int, founder: schemas.FounderCreate, db: Session = Depends(get_db)):
    updated_founder = crud.update_founder(db, founder_id=founder_id, founder=founder)
    if updated_founder is None:
        raise HTTPException(status_code=404, detail="Founder not found")
    return updated_founder

@app.delete("/founders/{founder_id}")
def delete_founder(founder_id: int, db: Session = Depends(get_db)):
    deleted_founder = crud.delete_founder(db, founder_id=founder_id)
    if deleted_founder is None:
        raise HTTPException(status_code=404, detail="Founder not found")
    return {"message": "Founder deleted successfully"}

# Skill endpoints
@app.post("/skills/", response_model=schemas.Skill)
def create_skill(skill: schemas.SkillCreate, db: Session = Depends(get_db)):
    return crud.create_skill(db=db, skill=skill)

@app.get("/skills/", response_model=List[schemas.Skill])
def read_skills(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_skills(db, skip=skip, limit=limit)

@app.get("/skills/{skill_id}", response_model=schemas.Skill)
def read_skill(skill_id: int, db: Session = Depends(get_db)):
    skill = crud.get_skill(db, skill_id=skill_id)
    if skill is None:
        raise HTTPException(status_code=404, detail="Skill not found")
    return skill

@app.put("/skills/{skill_id}", response_model=schemas.Skill)
def update_skill(skill_id: int, skill: schemas.SkillCreate, db: Session = Depends(get_db)):
    updated_skill = crud.update_skill(db, skill_id=skill_id, skill=skill)
    if updated_skill is None:
        raise HTTPException(status_code=404, detail="Skill not found")
    return updated_skill

@app.delete("/skills/{skill_id}")
def delete_skill(skill_id: int, db: Session = Depends(get_db)):
    deleted_skill = crud.delete_skill(db, skill_id=skill_id)
    if deleted_skill is None:
        raise HTTPException(status_code=404, detail="Skill not found")
    return {"message": "Skill deleted successfully"}

# Startup endpoints
@app.post("/startups/", response_model=schemas.Startup)
def create_startup(startup: schemas.StartupCreate, db: Session = Depends(get_db)):
    return crud.create_startup(db=db, startup=startup)

@app.get("/startups/", response_model=List[schemas.Startup])
def read_startups(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_startups(db, skip=skip, limit=limit)

@app.get("/startups/{startup_id}", response_model=schemas.Startup)
def read_startup(startup_id: int, db: Session = Depends(get_db)):
    startup = crud.get_startup(db, startup_id=startup_id)
    if startup is None:
        raise HTTPException(status_code=404, detail="Startup not found")
    return startup

@app.put("/startups/{startup_id}", response_model=schemas.Startup)
def update_startup(startup_id: int, startup: schemas.StartupCreate, db: Session = Depends(get_db)):
    updated_startup = crud.update_startup(db, startup_id=startup_id, startup=startup)
    if updated_startup is None:
        raise HTTPException(status_code=404, detail="Startup not found")
    return updated_startup

@app.delete("/startups/{startup_id}")
def delete_startup(startup_id: int, db: Session = Depends(get_db)):
    deleted_startup = crud.delete_startup(db, startup_id=startup_id)
    if deleted_startup is None:
        raise HTTPException(status_code=404, detail="Startup not found")
    return {"message": "Startup deleted successfully"}

# Help Request endpoints
@app.post("/help-requests/", response_model=schemas.HelpRequest)
def create_help_request(help_request: schemas.HelpRequestCreate, db: Session = Depends(get_db)):
    return crud.create_help_request(db=db, help_request=help_request)

@app.get("/help-requests/", response_model=List[schemas.HelpRequest])
def read_help_requests(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_help_requests(db, skip=skip, limit=limit)

@app.get("/help-requests/{help_request_id}", response_model=schemas.HelpRequest)
def read_help_request(help_request_id: int, db: Session = Depends(get_db)):
    help_request = crud.get_help_request(db, help_request_id=help_request_id)
    if help_request is None:
        raise HTTPException(status_code=404, detail="Help request not found")
    return help_request

@app.put("/help-requests/{help_request_id}", response_model=schemas.HelpRequest)
def update_help_request(help_request_id: int, help_request: schemas.HelpRequestCreate, db: Session = Depends(get_db)):
    updated_help_request = crud.update_help_request(db, help_request_id=help_request_id, help_request=help_request)
    if updated_help_request is None:
        raise HTTPException(status_code=404, detail="Help request not found")
    return updated_help_request

@app.delete("/help-requests/{help_request_id}")
def delete_help_request(help_request_id: int, db: Session = Depends(get_db)):
    deleted_help_request = crud.delete_help_request(db, help_request_id=help_request_id)
    if deleted_help_request is None:
        raise HTTPException(status_code=404, detail="Help request not found")
    return {"message": "Help request deleted successfully"}

# Hobby endpoints
@app.post("/hobbies/", response_model=schemas.Hobby)
def create_hobby(hobby: schemas.HobbyCreate, db: Session = Depends(get_db)):
    return crud.create_hobby(db=db, hobby=hobby)

@app.get("/hobbies/", response_model=List[schemas.Hobby])
def read_hobbies(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_hobbies(db, skip=skip, limit=limit)

@app.get("/hobbies/{hobby_id}", response_model=schemas.Hobby)
def read_hobby(hobby_id: int, db: Session = Depends(get_db)):
    hobby = crud.get_hobby(db, hobby_id=hobby_id)
    if hobby is None:
        raise HTTPException(status_code=404, detail="Hobby not found")
    return hobby

@app.put("/hobbies/{hobby_id}", response_model=schemas.Hobby)
def update_hobby(hobby_id: int, hobby: schemas.HobbyCreate, db: Session = Depends(get_db)):
    updated_hobby = crud.update_hobby(db, hobby_id=hobby_id, hobby=hobby)
    if updated_hobby is None:
        raise HTTPException(status_code=404, detail="Hobby not found")
    return updated_hobby

@app.delete("/hobbies/{hobby_id}")
def delete_hobby(hobby_id: int, db: Session = Depends(get_db)):
    deleted_hobby = crud.delete_hobby(db, hobby_id=hobby_id)
    if deleted_hobby is None:
        raise HTTPException(status_code=404, detail="Hobby not found")
    return {"message": "Hobby deleted successfully"}

# Event endpoints
@app.post("/events/", response_model=schemas.Event)
def create_event(event: schemas.EventCreate, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    return crud.create_event(db=db, event=event)

@app.get("/events/", response_model=List[schemas.Event])
def read_events(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_events(db, skip=skip, limit=limit)

@app.get("/events/{event_id}", response_model=schemas.Event)
def read_event(event_id: int, db: Session = Depends(get_db)):
    event = crud.get_event(db, event_id=event_id)
    if event is None:
        raise HTTPException(status_code=404, detail="Event not found")
    return event

@app.put("/events/{event_id}", response_model=schemas.Event)
def update_event(event_id: int, event: schemas.EventCreate, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    updated_event = crud.update_event(db, event_id=event_id, event=event)
    if updated_event is None:
        raise HTTPException(status_code=404, detail="Event not found")
    return updated_event

@app.delete("/events/{event_id}")
def delete_event(event_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    deleted_event = crud.delete_event(db, event_id=event_id)
    if deleted_event is None:
        raise HTTPException(status_code=404, detail="Event not found")
    return {"message": "Event deleted successfully"}

# User profile matching and claiming endpoints
@app.get("/api/my-profile")
def get_my_profile(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get the current user's claimed founder profile, or find unclaimed profile by email."""
    user_email = current_user.get("email")
    user_id = current_user.get("sub")
    
    if not user_email or not user_id:
        raise HTTPException(status_code=400, detail="User email or ID not found in token")
    
    # First check if user has already claimed a profile
    claimed_founder = crud.get_founder_by_auth0_user_id(db, user_id)
    if claimed_founder:
        return {"founder": claimed_founder, "status": "claimed"}
    
    # If not claimed, look for unclaimed profile with matching email
    unclaimed_founder = crud.get_unclaimed_founder_by_email(db, user_email)
    if unclaimed_founder:
        return {"founder": unclaimed_founder, "status": "available"}
    
    # No matching founder profile found
    return {"founder": None, "status": "none"}

@app.post("/api/claim-profile/{founder_id}")
def claim_profile(founder_id: int, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    """Claim an unclaimed founder profile."""
    user_email = current_user.get("email")
    user_id = current_user.get("sub")
    
    if not user_email or not user_id:
        raise HTTPException(status_code=400, detail="User email or ID not found in token")
    
    # Check if user has already claimed a profile
    existing_claim = crud.get_founder_by_auth0_user_id(db, user_id)
    if existing_claim:
        raise HTTPException(status_code=400, detail="User has already claimed a profile")
    
    # Get the founder profile
    founder = crud.get_founder(db, founder_id)
    if not founder:
        raise HTTPException(status_code=404, detail="Founder profile not found")
    
    # Check if profile is already claimed
    if founder.auth0_user_id:
        raise HTTPException(status_code=400, detail="Profile has already been claimed")
    
    # Check if email matches
    if founder.email.lower() != user_email.lower():
        raise HTTPException(status_code=403, detail="Email does not match profile")
    
    # Claim the profile
    claimed_founder = crud.claim_founder_profile(db, founder_id, user_id)
    return {"founder": claimed_founder, "message": "Profile claimed successfully"}

