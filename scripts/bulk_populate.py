#!/usr/bin/env python3
"""
Production-ready script to bulk populate skills, hobbies, startups, founders, and help requests
Can be used with different database environments
"""

import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add backend to path for imports
backend_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'backend')
sys.path.insert(0, backend_path)

import models
from models import Base

# Import populate functions
from populate_skills import populate_skills
from populate_hobbies import populate_hobbies
from populate_startups import populate_startups
from populate_founders import populate_founders
from populate_requests import populate_help_requests

def get_database_url():
    """Get database URL from environment or use default"""
    return os.getenv('DATABASE_URL', 'sqlite:///./founders_crm.db')

def create_db_session(database_url):
    """Create database session"""
    if database_url.startswith("sqlite"):
        engine = create_engine(database_url, connect_args={"check_same_thread": False})
    else:
        engine = create_engine(database_url)
    
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return SessionLocal()

def main():
    """Main function to populate data"""
    # Get command line arguments
    populate_skills_flag = '--skills' in sys.argv or '--all' in sys.argv
    populate_hobbies_flag = '--hobbies' in sys.argv or '--all' in sys.argv
    populate_startups_flag = '--startups' in sys.argv or '--sample-data' in sys.argv
    populate_founders_flag = '--founders' in sys.argv or '--sample-data' in sys.argv
    populate_requests_flag = '--requests' in sys.argv or '--sample-data' in sys.argv
    
    if not any([populate_skills_flag, populate_hobbies_flag, populate_startups_flag, 
                populate_founders_flag, populate_requests_flag]):
        print("Usage: python bulk_populate.py [OPTIONS]")
        print("")
        print("Data Options:")
        print("  --skills          Populate skills data")
        print("  --hobbies         Populate hobbies data")
        print("  --startups        Populate sample startup data")
        print("  --founders        Populate sample founder data")
        print("  --requests        Populate sample help request data")
        print("")
        print("Convenience Options:")
        print("  --all             Populate skills and hobbies")
        print("  --sample-data     Populate startups, founders, and requests")
        print("")
        print("Environment variable: DATABASE_URL (optional)")
        print("")
        print("Examples:")
        print("  python bulk_populate.py --sample-data")
        print("  python bulk_populate.py --skills --hobbies")
        print("  DATABASE_URL='postgresql://...' python bulk_populate.py --all")
        return
    
    database_url = get_database_url()
    print(f"Connecting to database: {database_url.split('@')[1] if '@' in database_url else database_url}")
    
    try:
        db = create_db_session(database_url)
        
        total_added = 0
        startup_ids = []
        founder_ids = []
        
        if populate_skills_flag:
            print("Populating skills...")
            skills_added = populate_skills(db)
            total_added += skills_added
            print(f"Added {skills_added} new skills")
        
        if populate_hobbies_flag:
            print("Populating hobbies...")
            hobbies_added = populate_hobbies(db)
            total_added += hobbies_added
            print(f"Added {hobbies_added} new hobbies")
        
        if populate_startups_flag:
            print("Populating startups...")
            startups_added, startup_ids = populate_startups(db)
            total_added += startups_added
            print(f"Added {startups_added} new startups")
        
        if populate_founders_flag:
            print("Populating founders...")
            founders_added, founder_ids = populate_founders(db, startup_ids)
            total_added += founders_added
            print(f"Added {founders_added} new founders")
        
        if populate_requests_flag:
            print("Populating help requests...")
            requests_added = populate_help_requests(db, founder_ids)
            total_added += requests_added
            print(f"Added {requests_added} new help requests")
        
        db.commit()
        print(f"\n✅ Successfully added {total_added} new items to the database!")
        
        # Show summary of what was created
        if populate_startups_flag or populate_founders_flag or populate_requests_flag:
            print("\n📊 Sample Data Summary:")
            if startup_ids:
                print(f"   • 4 Startups: EcoTrack, DevFlow, HealthLink, EduMentor")
                print(f"   • EcoTrack has 2 founders (Sarah Chen + Alex Thompson)")
            if founder_ids:
                print(f"   • 5 Founders across different industries")
            if populate_requests_flag:
                print(f"   • 3 Help Requests: Technical, Funding, Legal")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    main()