from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import models, schemas, database, crud
from auth import get_current_user, get_current_user_optional
import os
import uuid
import requests
import json
from pathlib import Path
from pydantic import BaseModel

# NEW: helpers for import
import csv
import io
import re

app = FastAPI(title="Scrappy Founders Knowledge Base")

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

@app.get("/uploads/{filename}")
async def serve_uploaded_file(filename: str):
    file_path = UPLOAD_DIR / filename
    print(f"Looking for file: {file_path}")
    print(f"File exists: {file_path.exists()}")
    print(f"Upload directory contents: {list(UPLOAD_DIR.glob('*')) if UPLOAD_DIR.exists() else 'Directory does not exist'}")
    if not file_path.exists():
        raise HTTPException(
            status_code=404,
            detail="File not found",
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET",
                "Access-Control-Allow-Headers": "*",
            }
        )
    return FileResponse(
        path=file_path,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET",
            "Access-Control-Allow-Headers": "*",
        }
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

models.Base.metadata.create_all(bind=database.engine)

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/health")
def health_check():
    return {"status": "healthy", "message": "API is running"}

@app.get("/")
def read_root():
    return {"message": "Scrappy Founders Knowledge Base API"}

@app.get("/admin/image-storage-info")
def image_storage_info(db: Session = Depends(get_db)):
    founders_with_images = db.query(models.Founder).filter(models.Founder.profile_image_url.isnot(None)).all()
    disk_files = []
    if UPLOAD_DIR.exists():
        for file_path in UPLOAD_DIR.glob('*'):
            if file_path.is_file():
                disk_files.append(file_path.name)
    db_image_info = []
    for founder in founders_with_images:
        if founder.profile_image_url:
            url = founder.profile_image_url
            is_relative = url.startswith('/uploads/')
            is_absolute = url.startswith('http')
            filename = None
            if '/' in url:
                filename = url.split('/')[-1]
            db_image_info.append({
                "founder_id": founder.id,
                "founder_name": founder.name,
                "profile_image_url": url,
                "is_relative_path": is_relative,
                "is_absolute_url": is_absolute,
                "extracted_filename": filename,
                "file_exists_on_disk": filename in disk_files if filename else False
            })
    return {
        "documentation": {
            "image_upload_process": {
                "1": "Images are uploaded via POST /upload-image/ endpoint",
                "2": "Files are saved to UPLOAD_DIR (./uploads/)",
                "3": "Unique filename is generated using uuid.uuid4()",
                "4": "Endpoint returns {'image_url': '/uploads/filename.ext'}",
                "5": "Frontend stores this URL in founder.profile_image_url"
            },
            "image_serving_process": {
                "1": "Images served via GET /uploads/{filename} endpoint",
                "2": "Frontend calls getImageUrl() helper function",
                "3": "If URL starts with 'http', returns as-is (absolute URL)",
                "4": "If URL is relative, prepends API_URL to make it absolute"
            },
            "storage_locations": {
                "backend_directory": str(UPLOAD_DIR.absolute()) if UPLOAD_DIR.exists() else "Directory does not exist",
                "served_via": "Custom FastAPI endpoint at /uploads/{filename}",
                "cors_headers": "Added via custom endpoint (not StaticFiles)"
            }
        },
        "current_state": {
            "upload_directory_exists": UPLOAD_DIR.exists(),
            "files_on_disk": {
                "count": len(disk_files),
                "filenames": sorted(disk_files)
            },
            "database_records": {
                "founders_with_images": len(founders_with_images),
                "image_details": db_image_info
            }
        }
    }

@app.get("/protected")
def protected_route(current_user: dict = Depends(get_current_user)):
    return {"message": "This is a protected endpoint", "user": current_user}

@app.post("/upload-image/")
async def upload_image(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    file_extension = file.filename.split(".")[-1] if file.filename else "jpg"
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = UPLOAD_DIR / unique_filename
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
    return {"image_url": f"/uploads/{unique_filename}"}

@app.post("/founders/", response_model=schemas.Founder)
def create_founder(founder: schemas.FounderCreate, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    try:
        print(f"Creating founder with data: {founder.dict()}")
        print(f"Current user: {current_user}")
        if not founder.auth0_user_id and current_user and founder.email == current_user.get('email'):
            founder.auth0_user_id = current_user.get('sub')
            print(f"Set auth0_user_id to: {founder.auth0_user_id}")
        else:
            print(f"Not setting auth0_user_id (admin creating profile for someone else)")
        return crud.create_founder(db=db, founder=founder)
    except Exception as e:
        print(f"Error creating founder: {str(e)}")
        print(f"Error type: {type(e)}")
        error_str = str(e)
        if "UNIQUE constraint failed" in error_str or "duplicate key" in error_str.lower():
            if "email" in error_str.lower():
                raise HTTPException(status_code=400, detail="A founder with this email already exists")
            elif "auth0_user_id" in error_str.lower():
                raise HTTPException(status_code=400, detail="Your account is already linked to another founder profile. You may have an existing profile with a different email address.")
            else:
                raise HTTPException(status_code=400, detail=f"Duplicate constraint violation: {error_str}")
        elif "NOT NULL constraint failed" in error_str:
            raise HTTPException(status_code=400, detail="Required field is missing")
        elif "FOREIGN KEY constraint failed" in error_str:
            raise HTTPException(status_code=400, detail="Invalid reference to startup or other entity")
        else:
            raise HTTPException(status_code=500, detail=f"Database error: {error_str}")

@app.post("/auth/check-profile")
def check_user_profile(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    try:
        user_email = current_user.get('email')
        auth0_user_id = current_user.get('sub')
        if not user_email:
            raise HTTPException(status_code=400, detail="User email not found in token")
        print(f"Checking profile for user: {user_email}, auth0_id: {auth0_user_id}")
        existing_by_auth0 = db.query(models.Founder).filter(models.Founder.auth0_user_id == auth0_user_id).first()
        if existing_by_auth0:
            print(f"Found existing profile linked to Auth0 ID: {existing_by_auth0.name}")
            return {
                "has_profile": True,
                "profile_linked": True,
                "founder": existing_by_auth0
            }
        existing_by_email = db.query(models.Founder).filter(models.Founder.email == user_email).first()
        if existing_by_email:
            print(f"Found unlinked profile with matching email: {existing_by_email.name}")
            existing_by_email.auth0_user_id = auth0_user_id
            db.commit()
            db.refresh(existing_by_email)
            print(f"Successfully linked Auth0 account to existing profile")
            return {
                "has_profile": True,
                "profile_linked": True,
                "founder": existing_by_email
            }
        print(f"No existing profile found for {user_email}")
        return {
            "has_profile": False,
            "profile_linked": False,
            "founder": None
        }
    except Exception as e:
        print(f"Error checking user profile: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error checking profile: {str(e)}")

@app.get("/founders/", response_model=List[schemas.Founder])
def read_founders(skip: int = 0, limit: int = 10000, db: Session = Depends(get_db)):
    return crud.get_founders(db, skip=skip, limit=limit)

@app.get("/debug/check-email/{email}")
def debug_check_email(email: str, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    try:
        exact_match = db.query(models.Founder).filter(models.Founder.email == email).first()
        case_insensitive = db.query(models.Founder).filter(models.Founder.email.ilike(email)).all()
        return {
            "email_searched": email,
            "exact_match": {
                "found": exact_match is not None,
                "founder": exact_match.name if exact_match else None,
                "visible": exact_match.profile_visible if exact_match else None,
                "id": exact_match.id if exact_match else None
            },
            "case_insensitive_matches": [
                {
                    "email": f.email,
                    "name": f.name,
                    "visible": f.profile_visible,
                    "id": f.id
                } for f in case_insensitive
            ]
        }
    except Exception as e:
        return {"error": str(e)}

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
def delete_founder(founder_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    from auth import is_admin_user, ADMIN_EMAILS
    import logging
    logger = logging.getLogger(__name__)
    try:
        user_email = current_user.get('email', '')
        if not is_admin_user(user_email):
            raise HTTPException(status_code=403, detail="Admin privileges required")
        founder = crud.get_founder(db, founder_id=founder_id)
        if founder is None:
            logger.warning(f"Attempt to delete non-existent founder {founder_id}")
            raise HTTPException(status_code=404, detail="Founder not found")
        help_requests = db.query(models.HelpRequest).filter(models.HelpRequest.founder_id == founder_id).all()
        help_requests_count = len(help_requests)
        for help_request in help_requests:
            db.delete(help_request)
        deleted_founder = crud.delete_founder(db, founder_id=founder_id)
        logger.info(f"Successfully deleted founder {founder_id} and {help_requests_count} associated help requests by admin {user_email}")
        return {
            "message": "Founder deleted successfully",
            "details": f"Also removed {help_requests_count} associated help requests"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error deleting founder {founder_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# ---------- NEW: CSV Import Endpoint for Founders ----------

@app.post("/founders/import")
async def import_founders_from_csv(
    file: UploadFile = File(...),
    dry_run: bool = False,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Import founders from a CSV generated from your Google Sheet / form.
    - Dedupe by email (case-insensitive).
    - Creates/updates Startup, Skill(s), Hobby(ies) by name.
    - On dry_run, parses and validates but does not write to DB.
    Returns a summary and per-row results.
    """
    from auth import is_admin_user

    user_email = current_user.get("email") or ""
    if not is_admin_user(user_email):
        raise HTTPException(status_code=403, detail="Admin privileges required")

    # Read bytes and decode safely (support BOM)
    try:
        content = await file.read()
        text = content.decode("utf-8-sig")
    except Exception:
        try:
            text = content.decode("utf-8")
        except Exception:
            raise HTTPException(status_code=400, detail="Could not decode file as UTF-8")

    # Parse CSV
    try:
        reader = csv.DictReader(io.StringIO(text))
        rows = list(reader)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid CSV: {e}")

    # Column map (case-insensitive; supports several variants)
    def pick(row: Dict[str, Any], *cands: str) -> str:
        if not row:
            return ""
        lower_map = { (k or "").strip().lower(): (v or "").strip() for k, v in row.items() }
        for c in cands:
            if c.lower() in lower_map:
                return lower_map[c.lower()]
        # Try partial/loose matches
        for k, v in lower_map.items():
            for c in cands:
                if c.lower() in k:
                    return v
        return ""

    def split_list(val: str) -> List[str]:
        if not val:
            return []
        # split by comma or semicolon; keep slashes inside tokens
        parts = re.split(r"[;,]", val)
        return [p.strip() for p in parts if p and p.strip()]

    # Simple get-or-create helpers
    def get_or_create_skill(name: str) -> models.Skill:
        obj = db.query(models.Skill).filter(models.Skill.name.ilike(name)).first()
        if obj:
            return obj
        obj = models.Skill(name=name, category=None, description=None)
        db.add(obj); db.commit(); db.refresh(obj)
        return obj

    def get_or_create_hobby(name: str) -> models.Hobby:
        obj = db.query(models.Hobby).filter(models.Hobby.name.ilike(name)).first()
        if obj:
            return obj
        obj = models.Hobby(name=name, category=None, description=None)
        db.add(obj); db.commit(); db.refresh(obj)
        return obj

    def get_or_create_startup(name: str) -> models.Startup:
        obj = db.query(models.Startup).filter(models.Startup.name.ilike(name)).first()
        if obj:
            return obj
        obj = models.Startup(name=name)
        db.add(obj); db.commit(); db.refresh(obj)
        return obj

    summary = {
        "processed": 0,
        "created": 0,
        "updated": 0,
        "skipped": 0,
        "errors": 0,
        "dry_run": dry_run,
        "details": []  # per-row info
    }

    for idx, row in enumerate(rows, start=2):  # header = line 1
        try:
            name = pick(row, "Name")
            email = pick(row, "Email")
            if not email:
                summary["skipped"] += 1
                summary["details"].append({"row": idx, "status": "skipped", "reason": "missing email"})
                continue

            linkedin = pick(row, "LinkedIn", "LinkedIn URL", "LinkedIn Profile")
            bio = pick(row, "Bio")
            location = pick(row, "Location")

            startup_name = pick(row, "Startup", "Startup Name", "Company", "Venture")
            startup_desc = pick(row, "Describe what your startup does", "Startup Description", "Description")
            stage = pick(row, "Where are you now", "Stage")
            industry = pick(row, "What is your startup industry", "Industry")
            target_market = pick(row, "Who are you building for", "Target Market")
            revenue_arr = pick(row, "Current revenue (ARR $)", "Revenue ARR")

            skills_offered = split_list(pick(row, "One thing YOU CAN HELP", "Help Offered"))
            skills_needed = split_list(pick(row, "Something you want other founders to HELP YOU", "Help Needed"))
            hobbies = split_list(pick(row, "One thing you love doing outside your startup", "Hobbies"))

            # Build relations (ids)
            skill_ids: List[int] = []
            for s in skills_offered + skills_needed:
                if not s:
                    continue
                obj = get_or_create_skill(s)
                skill_ids.append(obj.id)

            hobby_ids: List[int] = []
            for h in hobbies:
                if not h:
                    continue
                obj = get_or_create_hobby(h)
                hobby_ids.append(obj.id)

            startup_id: Optional[int] = None
            if startup_name:
                st = get_or_create_startup(startup_name)
                # Fill extra startup fields if empty or new info is present
                updated = False
                if startup_desc and (not st.description):
                    st.description = startup_desc; updated = True
                if stage and (not st.stage):
                    st.stage = stage; updated = True
                if industry and (not st.industry):
                    st.industry = industry; updated = True
                if target_market and (not st.target_market):
                    st.target_market = target_market; updated = True
                if revenue_arr and (not st.revenue_arr):
                    st.revenue_arr = revenue_arr; updated = True
                if updated and not dry_run:
                    db.commit(); db.refresh(st)
                startup_id = st.id

            payload = schemas.FounderCreate(
                name=name or email.split("@")[0],
                email=email,
                bio=bio or "",
                location=location or "",
                linkedin_url=linkedin or "",
                twitter_url="",
                github_url="",
                profile_image_url="",
                profile_visible=True,
                auth0_user_id=None,
                skill_ids=skill_ids,
                startup_id=startup_id,
                hobby_ids=hobby_ids,
            )

            if dry_run:
                summary["processed"] += 1
                summary["details"].append({"row": idx, "status": "ok", "action": "would upsert", "email": email})
                continue

            existing = crud.get_founder_by_email(db, email)
            if existing:
                crud.update_founder(db, existing.id, payload)
                summary["updated"] += 1
                action = "updated"
                founder_id = existing.id
            else:
                created = crud.create_founder(db, payload)
                summary["created"] += 1
                action = "created"
                founder_id = created.id

            summary["processed"] += 1
            summary["details"].append({"row": idx, "status": "ok", "action": action, "email": email, "id": founder_id})

        except Exception as e:
            summary["errors"] += 1
            summary["details"].append({"row": idx, "status": "error", "error": str(e)})
            # Don’t fail the whole import; continue

    return summary

# ---------- Skills ----------

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

# ---------- Startups ----------

@app.post("/startups/", response_model=schemas.Startup)
def create_startup(startup: schemas.StartupCreate, db: Session = Depends(get_db)):
    return crud.create_startup(db=db, startup=startup)

@app.get("/startups/", response_model=List[schemas.Startup])
def read_startups(skip: int = 0, limit: int = 1000, db: Session = Depends(get_db)):
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

@app.get("/startups/{startup_id}/founders", response_model=List[schemas.Founder])
def get_startup_founders(startup_id: int, db: Session = Depends(get_db)):
    startup = crud.get_startup(db, startup_id=startup_id)
    if startup is None:
        raise HTTPException(status_code=404, detail="Startup not found")
    founders = crud.get_founders_by_startup_id(db, startup_id=startup_id)
    return founders

# ---------- Help Requests ----------

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

# ---------- Hobbies ----------

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

# ---------- Events ----------

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

# ---------- Claiming / Profile lookup ----------

@app.get("/api/my-profile")
def get_my_profile(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    user_email = current_user.get("email")
    user_id = current_user.get("sub")
    if not user_email or not user_id:
        raise HTTPException(status_code=400, detail="User email or ID not found in token")
    claimed_founder = crud.get_founder_by_auth0_user_id(db, user_id)
    if claimed_founder:
        return {"founder": claimed_founder, "status": "claimed"}
    unclaimed_founder = crud.get_unclaimed_founder_by_email(db, user_email)
    if unclaimed_founder:
        return {"founder": unclaimed_founder, "status": "available"}
    return {"founder": None, "status": "none"}

@app.post("/api/claim-profile/{founder_id}")
def claim_profile(founder_id: int, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    user_email = current_user.get("email")
    user_id = current_user.get("sub")
    if not user_email or not user_id:
        raise HTTPException(status_code=400, detail="User email or ID not found in token")
    existing_claim = crud.get_founder_by_auth0_user_id(db, user_id)
    if existing_claim:
        raise HTTPException(status_code=400, detail="User has already claimed a profile")
    founder = crud.get_founder(db, founder_id)
    if not founder:
        raise HTTPException(status_code=404, detail="Founder profile not found")
    if founder.auth0_user_id:
        raise HTTPException(status_code=400, detail="Profile has already been claimed")
    if founder.email.lower() != user_email.lower():
        raise HTTPException(status_code=403, detail="Email does not match profile")
    claimed_founder = crud.claim_founder_profile(db, founder_id, user_id)
    return {"founder": claimed_founder, "message": "Profile claimed successfully"}
