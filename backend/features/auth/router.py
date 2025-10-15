from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pathlib import Path
import uuid

from common import models
import schemas
from common.crud_founders import (
    get_founder_by_auth0_user_id,
    get_unclaimed_founder_by_email,
    claim_founder_profile,
    get_founder,
)
from common.auth import get_current_user
from common.database import get_db

router = APIRouter(tags=["auth"])

# Create uploads directory if it doesn't exist
UPLOAD_DIR = Path(__file__).parent.parent.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# Custom endpoint to serve uploaded images with CORS headers
@router.get("/uploads/{filename}")
async def serve_uploaded_file(filename: str):
    file_path = UPLOAD_DIR / filename
    print(f"Looking for file: {file_path}")
    print(f"File exists: {file_path.exists()}")
    print(f"Upload directory contents: {list(UPLOAD_DIR.glob('*')) if UPLOAD_DIR.exists() else 'Directory does not exist'}")
    
    if not file_path.exists():
        # For now, return a 404 but with CORS headers so the frontend can handle it gracefully
        raise HTTPException(
            status_code=404, 
            detail="File not found",
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET",
                "Access-Control-Allow-Headers": "*",
            }
        )
    
    # Return file with proper CORS headers
    return FileResponse(
        path=file_path,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET",
            "Access-Control-Allow-Headers": "*",
        }
    )

# Protected endpoint to verify authentication
@router.get("/protected")
def protected_route(current_user: dict = Depends(get_current_user)):
    return {"message": "This is a protected endpoint", "user": current_user}

# Image upload endpoint
@router.post("/upload-image/")
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

@router.post("/auth/check-profile")
def check_user_profile(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """
    Check if the authenticated user has an existing founder profile.
    If they do, link their Auth0 account to it. If not, return profile setup needed.
    """
    try:
        user_email = current_user.get('email')
        auth0_user_id = current_user.get('sub')
        
        if not user_email:
            raise HTTPException(status_code=400, detail="User email not found in token")
        
        print(f"Checking profile for user: {user_email}, auth0_id: {auth0_user_id}")
        
        # Check if user already has a linked profile
        existing_by_auth0 = db.query(models.Founder).filter(models.Founder.auth0_user_id == auth0_user_id).first()
        if existing_by_auth0:
            print(f"Found existing profile linked to Auth0 ID: {existing_by_auth0.name}")
            return {
                "has_profile": True,
                "profile_linked": True,
                "founder": existing_by_auth0
            }
        
        # Check if there's an unlinked profile with matching email
        existing_by_email = db.query(models.Founder).filter(models.Founder.email == user_email).first()
        if existing_by_email:
            print(f"Found unlinked profile with matching email: {existing_by_email.name}")
            # Link the Auth0 account to the existing profile
            existing_by_email.auth0_user_id = auth0_user_id
            db.commit()
            db.refresh(existing_by_email)
            print(f"Successfully linked Auth0 account to existing profile")
            
            return {
                "has_profile": True,
                "profile_linked": True,
                "founder": existing_by_email
            }
        
        # No existing profile found
        print(f"No existing profile found for {user_email}")
        return {
            "has_profile": False,
            "profile_linked": False,
            "founder": None
        }
        
    except Exception as e:
        print(f"Error checking user profile: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error checking profile: {str(e)}")

@router.get("/api/my-profile")
def get_my_profile(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get the current user's claimed founder profile, or find unclaimed profile by email."""
    user_email = current_user.get("email")
    user_id = current_user.get("sub")
    
    if not user_email or not user_id:
        raise HTTPException(status_code=400, detail="User email or ID not found in token")
    
    # First check if user has already claimed a profile
    claimed_founder = get_founder_by_auth0_user_id(db, user_id)
    if claimed_founder:
        return {"founder": claimed_founder, "status": "claimed"}
    
    # If not claimed, look for unclaimed profile with matching email
    unclaimed_founder = get_unclaimed_founder_by_email(db, user_email)
    if unclaimed_founder:
        return {"founder": unclaimed_founder, "status": "available"}
    
    # No matching founder profile found
    return {"founder": None, "status": "none"}

@router.post("/api/claim-profile/{founder_id}")
def claim_profile(founder_id: int, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    """Claim an unclaimed founder profile."""
    user_email = current_user.get("email")
    user_id = current_user.get("sub")
    
    if not user_email or not user_id:
        raise HTTPException(status_code=400, detail="User email or ID not found in token")
    
    # Check if user has already claimed a profile
    existing_claim = get_founder_by_auth0_user_id(db, user_id)
    if existing_claim:
        raise HTTPException(status_code=400, detail="User has already claimed a profile")
    
    # Get the founder profile
    founder = get_founder(db, founder_id)
    if not founder:
        raise HTTPException(status_code=404, detail="Founder profile not found")
    
    # Check if profile is already claimed
    if founder.auth0_user_id:
        raise HTTPException(status_code=400, detail="Profile has already been claimed")
    
    # Check if email matches
    if founder.email.lower() != user_email.lower():
        raise HTTPException(status_code=403, detail="Email does not match profile")
    
    # Claim the profile
    claimed_founder = claim_founder_profile(db, founder_id, user_id)
    return {"founder": claimed_founder, "message": "Profile claimed successfully"}

# Documentation endpoint - How image storage works
@router.get("/admin/image-storage-info")
def image_storage_info(db: Session = Depends(get_db)):
    """
    Documents how image storage works in this application
    """
    
    # Get all founders with their image URLs
    founders_with_images = db.query(models.Founder).filter(models.Founder.profile_image_url.isnot(None)).all()
    
    # Check what's actually on disk
    disk_files = []
    if UPLOAD_DIR.exists():
        for file_path in UPLOAD_DIR.glob('*'):
            if file_path.is_file():
                disk_files.append(file_path.name)
    
    # Analyze the founders' image URLs
    db_image_info = []
    for founder in founders_with_images:
        if founder.profile_image_url:
            # Check if it's a relative path or absolute URL
            url = founder.profile_image_url
            is_relative = url.startswith('/uploads/')
            is_absolute = url.startswith('http')
            
            # Extract filename if possible
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

