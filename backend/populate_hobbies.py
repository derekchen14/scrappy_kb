#!/usr/bin/env python3
"""
Script to populate the database with initial hobby data
"""

from sqlalchemy.orm import Session
from database import SessionLocal
import models

def populate_hobbies():
    db = SessionLocal()
    
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
    
    try:
        for hobby_data in hobbies_data:
            # Check if hobby already exists
            existing_hobby = db.query(models.Hobby).filter(models.Hobby.name == hobby_data["name"]).first()
            if not existing_hobby:
                hobby = models.Hobby(**hobby_data)
                db.add(hobby)
        
        db.commit()
        print(f"Successfully populated {len(hobbies_data)} hobbies!")
        
        # Print all hobbies by category
        all_hobbies = db.query(models.Hobby).order_by(models.Hobby.category, models.Hobby.name).all()
        current_category = None
        for hobby in all_hobbies:
            if hobby.category != current_category:
                current_category = hobby.category
                print(f"\n{current_category}:")
            print(f"  - {hobby.name}")
            
    except Exception as e:
        db.rollback()
        print(f"Error populating hobbies: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    populate_hobbies()