#!/usr/bin/env python3
"""
Database migration script to convert founder-startup relationship from many-to-many to one-to-one.

This script:
1. Reads existing data from startup_founders table
2. Updates founders table with startup_id foreign key
3. Drops the startup_founders table

Run this script BEFORE running the application with the new schema.
"""

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from database import DATABASE_URL

def migrate_startup_relationship():
    """Migrate from many-to-many to one-to-one relationship."""
    engine = create_engine(DATABASE_URL)
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        print("Starting migration of startup-founder relationship...")
        
        # Check if startup_founders table exists
        result = session.execute(text(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='startup_founders'"
        ))
        table_exists = result.fetchone() is not None
        
        if not table_exists:
            print("startup_founders table does not exist. Migration may have already been completed.")
            return
        
        # Get all founder-startup relationships
        relationships = session.execute(text(
            "SELECT founder_id, startup_id FROM startup_founders"
        )).fetchall()
        
        print(f"Found {len(relationships)} founder-startup relationships to migrate.")
        
        # For each founder, take the first startup relationship (since we're moving to one-to-one)
        founder_startup_map = {}
        for founder_id, startup_id in relationships:
            if founder_id not in founder_startup_map:
                founder_startup_map[founder_id] = startup_id
                print(f"  Founder {founder_id} -> Startup {startup_id}")
            else:
                print(f"  Warning: Founder {founder_id} has multiple startups, keeping first one ({founder_startup_map[founder_id]}), ignoring startup {startup_id}")
        
        # Check if startup_id column already exists in founders table
        result = session.execute(text("PRAGMA table_info(founders)"))
        columns = [row[1] for row in result.fetchall()]
        
        if 'startup_id' not in columns:
            # Add startup_id column to founders table
            print("Adding startup_id column to founders table...")
            session.execute(text("ALTER TABLE founders ADD COLUMN startup_id INTEGER"))
            session.commit()
        else:
            print("startup_id column already exists in founders table.")
        
        # Update founders with their startup_id
        print("Updating founders with startup_id values...")
        for founder_id, startup_id in founder_startup_map.items():
            session.execute(text(
                "UPDATE founders SET startup_id = :startup_id WHERE id = :founder_id"
            ), {"startup_id": startup_id, "founder_id": founder_id})
        
        session.commit()
        print(f"Updated {len(founder_startup_map)} founders with startup_id.")
        
        # Drop the startup_founders table
        print("Dropping startup_founders table...")
        session.execute(text("DROP TABLE startup_founders"))
        session.commit()
        
        print("Migration completed successfully!")
        print("Summary:")
        print(f"  - Migrated {len(founder_startup_map)} founder-startup relationships")
        print(f"  - Dropped startup_founders table")
        print(f"  - Added/updated startup_id column in founders table")
        
    except Exception as e:
        print(f"Error during migration: {e}")
        session.rollback()
        raise
    finally:
        session.close()

if __name__ == "__main__":
    migrate_startup_relationship()