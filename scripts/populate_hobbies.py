#!/usr/bin/env python3
"""
Script to populate the database with initial hobby data
"""

import sys
import os

# Add backend to path for imports
backend_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'backend')
sys.path.insert(0, backend_path)

from sqlalchemy.orm import Session
from database import SessionLocal
import models

def populate_hobbies(db=None):
    if db is None:
        db = SessionLocal()
        should_close = True
    else:
        should_close = False
    
    hobbies_data = [
        # Sports
        {"name": "Basketball", "category": "Sports"},
        {"name": "Soccer", "category": "Sports"},
        {"name": "Tennis", "category": "Sports"},
        {"name": "Golf", "category": "Sports"},
        {"name": "Swimming", "category": "Sports"},
        {"name": "Running", "category": "Sports"},
        {"name": "Cycling", "category": "Sports"},
        {"name": "Rock Climbing", "category": "Sports"},
        {"name": "Skiing", "category": "Sports"},
        {"name": "Snowboarding", "category": "Sports"},
        
        # Outdoor Activities
        {"name": "Hiking", "category": "Outdoor"},
        {"name": "Camping", "category": "Outdoor"},
        {"name": "Fishing", "category": "Outdoor"},
        {"name": "Surfing", "category": "Outdoor"},
        {"name": "Kayaking", "category": "Outdoor"},
        {"name": "Photography", "category": "Outdoor"},
        {"name": "Gardening", "category": "Outdoor"},
        
        # Games & Entertainment
        {"name": "Poker", "category": "Games"},
        {"name": "Board Games", "category": "Games"},
        {"name": "Chess", "category": "Games"},
        {"name": "Video Games", "category": "Games"},
        {"name": "Puzzles", "category": "Games"},
        
        # Arts & Crafts
        {"name": "Painting", "category": "Arts"},
        {"name": "Drawing", "category": "Arts"},
        {"name": "Music", "category": "Arts"},
        {"name": "Guitar", "category": "Arts"},
        {"name": "Piano", "category": "Arts"},
        {"name": "Singing", "category": "Arts"},
        {"name": "Dancing", "category": "Arts"},
        {"name": "Writing", "category": "Arts"},
        {"name": "Woodworking", "category": "Arts"},
        {"name": "Pottery", "category": "Arts"},
        
        # Learning & Mental
        {"name": "Reading", "category": "Learning"},
        {"name": "Coding", "category": "Learning"},
        {"name": "Language Learning", "category": "Learning"},
        {"name": "Meditation", "category": "Learning"},
        {"name": "Yoga", "category": "Learning"},
        
        # Food & Drink
        {"name": "Cooking", "category": "Food"},
        {"name": "Baking", "category": "Food"},
        {"name": "Wine Tasting", "category": "Food"},
        {"name": "Coffee", "category": "Food"},
        
        # Social
        {"name": "Traveling", "category": "Social"},
        {"name": "Volunteering", "category": "Social"},
        {"name": "Networking", "category": "Social"},
    ]
    
    hobbies_added = 0
    try:
        for hobby_data in hobbies_data:
            # Check if hobby already exists
            existing_hobby = db.query(models.Hobby).filter(models.Hobby.name == hobby_data["name"]).first()
            if not existing_hobby:
                hobby = models.Hobby(**hobby_data)
                db.add(hobby)
                hobbies_added += 1
        
        if should_close:
            db.commit()
            print(f"Successfully populated {hobbies_added} hobbies!")
            
            # Print all hobbies by category
            all_hobbies = db.query(models.Hobby).order_by(models.Hobby.category, models.Hobby.name).all()
            current_category = None
            for hobby in all_hobbies:
                if hobby.category != current_category:
                    current_category = hobby.category
                    print(f"\n{current_category}:")
                print(f"  - {hobby.name}")
                
    except Exception as e:
        if should_close:
            db.rollback()
            print(f"Error populating hobbies: {e}")
        else:
            raise e
    finally:
        if should_close:
            db.close()
    
    return hobbies_added

if __name__ == "__main__":
    populate_hobbies()