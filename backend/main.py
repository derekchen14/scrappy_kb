from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import models, schemas, database, crud

app = FastAPI(title="Scrappy Founders Knowledge Base")

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

@app.get("/")
def read_root():
    return {"message": "Founders Community CRM API"}

# Health check

@app.get("/health")
def health_check():
    return {"status": "healthy"}

# Founder endpoints
@app.post("/founders/", response_model=schemas.Founder)
def create_founder(founder: schemas.FounderCreate, db: Session = Depends(get_db)):
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