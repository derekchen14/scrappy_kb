#!/usr/bin/env python3
"""
Migration script to update Startup table:
- Remove team_size and location columns
- Add target_market and revenue_arr columns
"""

import sqlite3
from pathlib import Path

def migrate_startup_fields():
    db_path = Path("founders_crm.db")
    if not db_path.exists():
        print("Database file not found!")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check current table structure
        cursor.execute('PRAGMA table_info(startups)')
        columns = cursor.fetchall()
        print("Current startup table structure:")
        for col in columns:
            print(f"  {col}")
        
        # For SQLite, we need to recreate the table to modify columns
        # Create a new table with the updated structure
        cursor.execute('''
            CREATE TABLE startups_new (
                id INTEGER PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                industry VARCHAR(100),
                stage VARCHAR(50),
                website_url VARCHAR(200),
                target_market VARCHAR(200),
                revenue_arr VARCHAR(100),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Copy existing data to new table, mapping old columns to new structure
        cursor.execute('''
            INSERT INTO startups_new (id, name, description, industry, stage, website_url, created_at, updated_at)
            SELECT id, name, description, industry, stage, website_url, created_at, updated_at
            FROM startups
        ''')
        
        # Check how many rows were migrated
        cursor.execute('SELECT COUNT(*) FROM startups')
        old_count = cursor.fetchone()[0]
        cursor.execute('SELECT COUNT(*) FROM startups_new')
        new_count = cursor.fetchone()[0]
        print(f"Migrated {new_count} startups out of {old_count} from old table")
        
        # Drop the old table and rename the new one
        cursor.execute('DROP TABLE startups')
        cursor.execute('ALTER TABLE startups_new RENAME TO startups')
        
        # Recreate indexes if any existed (primary key is automatically recreated)
        
        conn.commit()
        print("Successfully migrated startup table structure")
        
        # Verify the change
        cursor.execute('PRAGMA table_info(startups)')
        new_columns = cursor.fetchall()
        print("New startup table structure:")
        for col in new_columns:
            print(f"  {col}")
        
        # Show sample data
        cursor.execute('SELECT id, name, target_market, revenue_arr FROM startups LIMIT 3')
        sample_data = cursor.fetchall()
        print(f"\nSample data (showing new fields):")
        for row in sample_data:
            print(f"  ID: {row[0]}, Name: {row[1]}, Target Market: {row[2]}, Revenue ARR: {row[3]}")
        
    except Exception as e:
        conn.rollback()
        print(f"Migration failed: {e}")
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_startup_fields()