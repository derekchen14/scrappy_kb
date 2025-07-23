#!/usr/bin/env python3
"""
Script to populate the database with sample founder data
"""

import sys
import os

# Add backend to path for imports
backend_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'backend')
sys.path.insert(0, backend_path)

import models

def populate_founders(db, startup_ids=None):
    """Populate sample founder data"""
    if startup_ids is None:
        startup_ids = []
    
    founders_data = [
        {
            "name": "Sarah Chen",
            "email": "sarah.chen@ecotrack.ai",
            "bio": "Former Tesla engineer with 8 years in clean energy. Passionate about using technology to combat climate change. Built autonomous systems for renewable energy optimization.",
            "location": "San Francisco, CA",
            "linkedin_url": "https://www.linkedin.com/in/sarahchen-ecotrack",
            "twitter_url": "https://twitter.com/sarahchen_eco",
            "github_url": "https://github.com/sarahchen",
            "profile_image_url": "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=400",
            "startup_id": startup_ids[0] if len(startup_ids) > 0 else None  # EcoTrack
        },
        {
            "name": "Marcus Rodriguez",
            "email": "marcus@devflow.dev",
            "bio": "Ex-GitHub Staff Engineer and DevOps architect. Led developer experience teams at scale. Strong believer in making developers' lives easier through automation.",
            "location": "Austin, TX",
            "linkedin_url": "https://www.linkedin.com/in/marcusrodriguez-dev",
            "twitter_url": "https://twitter.com/marcus_devops",
            "github_url": "https://github.com/marcusdev",
            "profile_image_url": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400",
            "startup_id": startup_ids[1] if len(startup_ids) > 1 else None  # DevFlow
        },
        {
            "name": "Dr. Priya Patel",
            "email": "priya@healthlink.care",
            "bio": "Board-certified physician and healthcare technology innovator. 10+ years in telemedicine. MD from Johns Hopkins, focusing on accessible healthcare solutions.",
            "location": "Boston, MA",
            "linkedin_url": "https://www.linkedin.com/in/drpriyapatel-health",
            "twitter_url": "https://twitter.com/dr_priya_health",
            "github_url": "https://github.com/drpriya",
            "profile_image_url": "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400",
            "startup_id": startup_ids[2] if len(startup_ids) > 2 else None  # HealthLink
        },
        {
            "name": "James Kim",
            "email": "james@edumentor.learn",
            "bio": "Former Coursera product manager with deep expertise in educational technology. Stanford CS background. Passionate about democratizing personalized learning.",
            "location": "Seattle, WA",
            "linkedin_url": "https://www.linkedin.com/in/jameskim-edu",
            "twitter_url": "https://twitter.com/james_edtech",
            "github_url": "https://github.com/jamesedu",
            "profile_image_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
            "startup_id": startup_ids[3] if len(startup_ids) > 3 else None  # EduMentor
        },
        {
            "name": "Alex Thompson",
            "email": "alex@ecotrack.ai",
            "bio": "Business development and sustainability expert. Former McKinsey consultant specializing in ESG strategies. Co-founder focused on scaling EcoTrack's market reach.",
            "location": "San Francisco, CA",
            "linkedin_url": "https://www.linkedin.com/in/alexthompson-sustainability",
            "twitter_url": "https://twitter.com/alex_sustain",
            "profile_image_url": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400",
            "startup_id": startup_ids[0] if len(startup_ids) > 0 else None  # EcoTrack (second founder)
        }
    ]
    
    founders_added = 0
    founder_ids = []
    
    for founder_data in founders_data:
        existing_founder = db.query(models.Founder).filter(models.Founder.email == founder_data["email"]).first()
        if not existing_founder:
            founder = models.Founder(**founder_data)
            db.add(founder)
            db.flush()  # Get the ID without committing
            founder_ids.append(founder.id)
            founders_added += 1
        else:
            founder_ids.append(existing_founder.id)
    
    return founders_added, founder_ids

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
        founders_added, founder_ids = populate_founders(db)
        db.commit()
        print(f"✅ Successfully added {founders_added} new founders to the database!")
        print(f"Founder IDs: {founder_ids}")
    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
    finally:
        db.close()