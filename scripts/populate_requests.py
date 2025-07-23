#!/usr/bin/env python3
"""
Script to populate the database with sample help request data
"""

import sys
import os

# Add backend to path for imports
backend_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'backend')
sys.path.insert(0, backend_path)

import models

def populate_help_requests(db, founder_ids=None):
    """Populate sample help request data"""
    if founder_ids is None:
        founder_ids = []
    
    help_requests_data = [
        {
            "founder_id": founder_ids[0] if len(founder_ids) > 0 else 1,  # Sarah Chen
            "title": "Need expertise in carbon accounting standards",
            "description": "Looking for someone with experience in GHG Protocol and Science-Based Targets. We're building our carbon tracking algorithms and need guidance on industry-standard methodologies for scope 1, 2, and 3 emissions calculations.",
            "category": "Technical",
            "urgency": "Medium",
            "status": "Open"
        },
        {
            "founder_id": founder_ids[1] if len(founder_ids) > 1 else 2,  # Marcus Rodriguez
            "title": "Seeking Series A fundraising mentor",
            "description": "DevFlow is ready for Series A and I need guidance from someone who's successfully raised institutional funding. Looking for help with pitch deck refinement, investor targeting, and term sheet negotiations.",
            "category": "Funding",
            "urgency": "High",
            "status": "In Progress"
        },
        {
            "founder_id": founder_ids[2] if len(founder_ids) > 2 else 3,  # Dr. Priya Patel
            "title": "HIPAA compliance for telemedicine platform",
            "description": "Need legal expertise to ensure our telemedicine platform meets all HIPAA requirements. Specifically looking for guidance on data encryption, access controls, and audit logging for patient health information.",
            "category": "Legal",
            "urgency": "High",
            "status": "Open"
        }
    ]
    
    requests_added = 0
    for request_data in help_requests_data:
        # Check if request with same title exists for this founder
        existing_request = db.query(models.HelpRequest).filter(
            models.HelpRequest.title == request_data["title"],
            models.HelpRequest.founder_id == request_data["founder_id"]
        ).first()
        
        if not existing_request:
            help_request = models.HelpRequest(**request_data)
            db.add(help_request)
            requests_added += 1
    
    return requests_added

if __name__ == "__main__":
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    
    # Get database URL
    database_url = os.getenv("DATABASE_URL", "sqlite:///./founders_crm.db")
    
    # Create engine and session
    if database_url.startswith("sqlite"):
        engine = create_engine(database_url, connect_args={"check_same_thread": False})
    else:
        engine = create_engine(database_url)
    
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        requests_added = populate_help_requests(db)
        db.commit()
        print(f"✅ Successfully added {requests_added} new help requests to the database!")
    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
    finally:
        db.close()