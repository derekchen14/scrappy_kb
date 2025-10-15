from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import logging

from common import models
import schemas
from common.crud_founders import (
    create_founder as crud_create_founder,
    get_founder,
    get_founders,
    update_founder as crud_update_founder,
    delete_founder as crud_delete_founder,
    create_founders_from_csv,
)
from common.auth import get_current_user, is_admin_user
from common.database import get_db

router = APIRouter(prefix="/founders", tags=["founders"])

@router.post("/", response_model=schemas.Founder)
def create_founder(founder: schemas.FounderCreate, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    try:
        print(f"Creating founder with data: {founder.dict()}")
        print(f"Current user: {current_user}")
        
        # Only set auth0_user_id from current user if not provided AND user is creating their own profile
        # For admin-created profiles, leave auth0_user_id as None until the actual user logs in
        if not founder.auth0_user_id and current_user and founder.email == current_user.get('email'):
            founder.auth0_user_id = current_user.get('sub')
            print(f"Set auth0_user_id to: {founder.auth0_user_id}")
        else:
            print(f"Not setting auth0_user_id (admin creating profile for someone else)")
        
        return crud_create_founder(db=db, founder=founder)
    except Exception as e:
        print(f"Error creating founder: {str(e)}")
        print(f"Error type: {type(e)}")
        
        # Handle specific database errors
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

@router.post("/upload-csv", response_model=schemas.FounderUploadResponse)
async def upload_founders_csv(
    file: UploadFile = File(...), 
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    (Admin Only) Allows bulk creation of founders from a CSV file.
    """
    # 1. Admin Authorization Check
    user_email = current_user.get('email', '')
    if not is_admin_user(user_email):
        raise HTTPException(status_code=403, detail="Admin privileges required for this action.")

    # 2. File Type Validation
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a CSV file.")
    
    try:
        # 3. Read file content and pass to CRUD function
        csv_file_content = await file.read()
        result = create_founders_from_csv(db, csv_file_content)
        return result
    except Exception as e:
        # 4. Handle unexpected errors
        raise HTTPException(
            status_code=500,
            detail=f"An unexpected error occurred while processing the file: {str(e)}"
        )

@router.get("/", response_model=List[schemas.Founder])
def read_founders(skip: int = 0, limit: int = 10000, db: Session = Depends(get_db)):
    return get_founders(db, skip=skip, limit=limit)

@router.get("/{founder_id}", response_model=schemas.Founder)
def read_founder(founder_id: int, db: Session = Depends(get_db)):
    founder = get_founder(db, founder_id=founder_id)
    if founder is None:
        raise HTTPException(status_code=404, detail="Founder not found")
    return founder

@router.put("/{founder_id}", response_model=schemas.Founder)
def update_founder_endpoint(founder_id: int, founder: schemas.FounderCreate, db: Session = Depends(get_db)):
    updated_founder = crud_update_founder(db, founder_id=founder_id, founder=founder)
    if updated_founder is None:
        raise HTTPException(status_code=404, detail="Founder not found")
    return updated_founder

@router.delete("/{founder_id}")
def delete_founder_endpoint(founder_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    logger = logging.getLogger(__name__)
    
    try:
        # Check if user is admin
        user_email = current_user.get('email', '')
        
        if not is_admin_user(user_email):
            raise HTTPException(status_code=403, detail="Admin privileges required")
        
        # Check if founder exists
        founder = get_founder(db, founder_id=founder_id)
        if founder is None:
            logger.warning(f"Attempt to delete non-existent founder {founder_id}")
            raise HTTPException(status_code=404, detail="Founder not found")
        
        # Cascade delete: Remove all associated help requests first
        help_requests = db.query(models.HelpRequest).filter(models.HelpRequest.founder_id == founder_id).all()
        help_requests_count = len(help_requests)
        for help_request in help_requests:
            db.delete(help_request)
        
        # Delete the founder (this will automatically handle the startup relationship and many-to-many relationships)
        deleted_founder = crud_delete_founder(db, founder_id=founder_id)
        
        # Note: No need to explicitly commit here as crud.delete_founder already commits
        
        logger.info(f"Successfully deleted founder {founder_id} and {help_requests_count} associated help requests by admin {user_email}")
        return {
            "message": "Founder deleted successfully", 
            "details": f"Also removed {help_requests_count} associated help requests"
        }
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        logger.error(f"Unexpected error deleting founder {founder_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/debug/check-email/{email}")
def debug_check_email(email: str, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Debug endpoint to check if an email exists in the database"""
    try:
        # Check for exact match
        exact_match = db.query(models.Founder).filter(models.Founder.email == email).first()
        # Check for case-insensitive match
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

