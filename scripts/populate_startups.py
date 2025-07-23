#!/usr/bin/env python3
"""
Script to populate the database with sample startup data
"""

import sys
import os

# Add backend to path for imports
backend_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'backend')
sys.path.insert(0, backend_path)

import models

def populate_startups(db):
    """Populate sample startup data"""
    startups_data = [
        {
            "name": "EcoTrack",
            "description": "AI-powered platform helping companies track and reduce their carbon footprint through real-time monitoring and actionable insights.",
            "industry": "Climate / Energy",
            "stage": "Seed",
            "website_url": "https://www.ecotrack.ai",
            "target_market": "Mid-Market",
            "revenue_arr": "$150-500K"
        },
        {
            "name": "DevFlow",
            "description": "Developer productivity suite that automates code reviews, testing, and deployment workflows for engineering teams.",
            "industry": "DevTools",
            "stage": "Series A",
            "website_url": "https://www.devflow.dev",
            "target_market": "Enterprises",
            "revenue_arr": "$1M+"
        },
        {
            "name": "HealthLink",
            "description": "Telemedicine platform connecting patients with specialists through AI-powered symptom assessment and smart appointment scheduling.",
            "industry": "Healthtech",
            "stage": "MVP",
            "website_url": "https://www.healthlink.care",
            "target_market": "Healthcare Providers",
            "revenue_arr": "Pre-revenue"
        },
        {
            "name": "EduMentor",
            "description": "Personalized learning platform using adaptive AI to provide customized tutoring and skill development for students.",
            "industry": "Edtech",
            "stage": "Pre-seed",
            "website_url": "https://www.edumentor.learn",
            "target_market": "Educational Institutions",
            "revenue_arr": "$10-25K"
        }
    ]
    
    startups_added = 0
    startup_ids = []
    
    for startup_data in startups_data:
        existing_startup = db.query(models.Startup).filter(models.Startup.name == startup_data["name"]).first()
        if not existing_startup:
            startup = models.Startup(**startup_data)
            db.add(startup)
            db.flush()  # Get the ID without committing
            startup_ids.append(startup.id)
            startups_added += 1
        else:
            startup_ids.append(existing_startup.id)
    
    return startups_added, startup_ids

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
        startups_added, startup_ids = populate_startups(db)
        db.commit()
        print(f"✅ Successfully added {startups_added} new startups to the database!")
        print(f"Startup IDs: {startup_ids}")
    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
    finally:
        db.close()