#!/usr/bin/env python3
"""
Migration script to make linkedin_url NOT NULL
"""

import sqlite3
from pathlib import Path

def migrate_linkedin_not_null():
    db_path = Path("founders_crm.db")
    if not db_path.exists():
        print("Database file not found!")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Delete founders with NULL linkedin_url
        cursor.execute('DELETE FROM founders WHERE linkedin_url IS NULL OR linkedin_url = ""')
        deleted_rows = cursor.rowcount
        print(f"Deleted {deleted_rows} founders with NULL or empty linkedin_url")
        
        # For SQLite, we need to recreate the table to add NOT NULL constraint
        # First, create a backup table with the new structure
        cursor.execute('''
            CREATE TABLE founders_new (
                id INTEGER PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                bio TEXT,
                location VARCHAR(100),
                linkedin_url VARCHAR(200) NOT NULL,
                twitter_url VARCHAR(200),
                github_url VARCHAR(200),
                profile_image_url VARCHAR(500),
                profile_visible BOOLEAN DEFAULT 1 NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Copy data from old table to new table
        cursor.execute('''
            INSERT INTO founders_new 
            SELECT id, name, email, bio, location, linkedin_url, twitter_url, 
                   github_url, profile_image_url, profile_visible, created_at, updated_at
            FROM founders
        ''')
        
        # Drop the old table and rename the new one
        cursor.execute('DROP TABLE founders')
        cursor.execute('ALTER TABLE founders_new RENAME TO founders')
        
        # Recreate the many-to-many tables that reference founders
        # They should still work since we kept the same ID structure
        
        conn.commit()
        print("Successfully migrated linkedin_url to NOT NULL constraint")
        
        # Verify the change
        cursor.execute('PRAGMA table_info(founders)')
        columns = cursor.fetchall()
        linkedin_column = [col for col in columns if col[1] == 'linkedin_url'][0]
        print(f"LinkedIn column after migration: {linkedin_column}")
        
    except Exception as e:
        conn.rollback()
        print(f"Migration failed: {e}")
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_linkedin_not_null()