#!/usr/bin/env python3
"""
Script to populate the database with founder data from FoundersDB.xlsx
"""

import json
import sys
import os

# Add backend to path for imports
backend_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'backend')
sys.path.insert(0, backend_path)

import models

# Mapping from Excel column names to Founder model fields
EXCEL_TO_FOUNDER_MAPPING = {
    # Direct field mappings
    'name': 'name',
    'email': 'email',
    'linkedin': 'linkedin_url',
    'website': None,  # This will be used for startup website, not founder
    
    # Complex field mappings that need processing
    'startup': 'startup_name',  # Will be used to create/link startup
    'industry': 'startup_industry',  # Part of startup data
    'customer_user': 'startup_target_market',  # Maps to startup target_market
    'current_stage': 'startup_stage',  # Maps to startup stage
    
    # Bio construction from multiple fields
    'about_me': 'bio_component_1',  # Primary bio content
    'help_needed': 'bio_component_2',  # What they need help with
    'can_help_with': 'bio_component_3',  # What they can help with
    'love': 'bio_component_4',  # What they love
}

# Startup stage mapping from Excel values to standard stages
STAGE_MAPPING = {
    'idea validation': 'Idea',
    'pre-revenue': 'Idea',
    'post-revenue': 'MVP',
    'customer acquisition': 'MVP',
    'scaling': 'Seed',
    'investing': 'Series A',  # For VCs
    # Add more mappings as needed
}

def construct_bio(founder_data):
    """Construct a bio from multiple Excel fields"""
    bio_parts = []
    
    # Start with the main "about me" section
    if founder_data.get('about_me'):
        bio_parts.append(founder_data['about_me'])
    
    # Add what they can help with
    if founder_data.get('can_help_with'):
        bio_parts.append(f"Can help with: {founder_data['can_help_with']}")
    
    # Add what they need help with
    if founder_data.get('help_needed'):
        bio_parts.append(f"Looking for help with: {founder_data['help_needed']}")
    
    # Add what they love (personal touch)
    if founder_data.get('love'):
        bio_parts.append(f"Loves: {founder_data['love']}")
    
    return " | ".join(bio_parts) if bio_parts else None

def normalize_stage(stage_text):
    """Normalize startup stage from Excel text to standard values"""
    if not stage_text:
        return None
    
    stage_lower = stage_text.lower().strip()
    
    # Direct mapping
    if stage_lower in STAGE_MAPPING:
        return STAGE_MAPPING[stage_lower]
    
    # Keyword-based mapping
    if 'idea' in stage_lower or 'validation' in stage_lower:
        return 'Idea'
    elif 'revenue' in stage_lower and ('pre' in stage_lower or 'no' in stage_lower):
        return 'Idea'
    elif 'mvp' in stage_lower or 'product' in stage_lower:
        return 'MVP'
    elif 'seed' in stage_lower:
        return 'Seed'
    elif 'series' in stage_lower:
        return 'Series A'
    else:
        return 'MVP'  # Default fallback

def get_database_columns(db, table_name):
    """Get the actual columns available in the database table"""
    from sqlalchemy import inspect
    inspector = inspect(db.bind)
    try:
        columns = [col['name'] for col in inspector.get_columns(table_name)]
        return columns
    except:
        return []

def extract_founder_data(excel_data, available_columns=None):
    """Extract and transform founder data from Excel format to database format"""
    # Base data that should always be present
    founder_data = {
        'name': excel_data.get('name'),
        'email': excel_data.get('email'),
        'linkedin_url': excel_data.get('linkedin'),
        'bio': construct_bio(excel_data),
        'profile_visible': True,
    }
    
    # Optional fields that may not exist in all database schemas
    optional_fields = {
        'location': None,
        'twitter_url': None,
        'github_url': None,
        'profile_image_url': None,
        'auth0_user_id': None,
        'startup_id': None,
    }
    
    # Only add fields that exist in the database schema
    if available_columns:
        for field, value in optional_fields.items():
            if field in available_columns:
                founder_data[field] = value
    else:
        # Fallback: add all optional fields
        founder_data.update(optional_fields)
    
    return founder_data

def website_to_company_name(website_url):
    """Convert website URL to Title Case company name"""
    if not website_url:
        return None
    
    # Remove protocol
    url = website_url.replace('https://', '').replace('http://', '')
    
    # Remove www. prefix
    if url.startswith('www.'):
        url = url[4:]
    
    # Extract domain name (before first dot)
    domain_name = url.split('.')[0]
    
    # Simple approach: just use title case
    return domain_name.title()

def extract_startup_data(excel_data):
    """Extract startup data from Excel format"""
    website = excel_data.get('website')
    
    # No website means no startup
    if not website:
        return None
    
    company_name = website_to_company_name(website)
    
    # No valid company name extracted
    if not company_name:
        return None
    
    startup_data = {
        'name': company_name,
        'description': excel_data.get('startup'),  # Use the original startup field as description
        'industry': excel_data.get('industry'),
        'stage': normalize_stage(excel_data.get('current_stage')),
        'website_url': website,
        'target_market': excel_data.get('customer_user'),
        'revenue_arr': None,  # Not available in Excel data
    }
    
    return startup_data

def load_founders_data(json_file='founders_data.json'):
    """Load founders data from JSON file"""
    with open(json_file, 'r', encoding='utf-8') as f:
        return json.load(f)

def populate_founders_from_excel(db, json_file='founders_data.json', limit=None):
    """Populate database with founders and startups from Excel-derived JSON data"""
    excel_founders = load_founders_data(json_file)
    
    # Apply limit for testing purposes
    if limit:
        excel_founders = excel_founders[:limit]
        print(f"🧪 TEST MODE: Processing only first {limit} founders")
    
    # Get available columns for both tables
    founder_columns = get_database_columns(db, 'founders')
    startup_columns = get_database_columns(db, 'startups')
    
    print(f"📊 Processing {len(excel_founders)} founders from {json_file}")
    print(f"🔍 Available founder columns: {founder_columns}")
    print(f"🔍 Available startup columns: {startup_columns}")
    
    founders_added = 0
    startups_added = 0
    founders_updated = 0
    founder_ids = []
    startup_cache = {}  # Cache to avoid duplicate startups
    
    # Check if startups table exists and has startup linking capability
    supports_startups = 'startups' in get_database_columns(db, '') or len(startup_columns) > 0
    supports_startup_linking = 'startup_id' in founder_columns
    
    for i, excel_founder in enumerate(excel_founders, 1):
        try:
            print(f"Processing {i}/{len(excel_founders)}: {excel_founder.get('name', 'Unknown')}")
            
            # Handle startup creation/linking only if supported
            startup_id = None
            if supports_startups and supports_startup_linking:
                startup_data = extract_startup_data(excel_founder)
                
                if startup_data and startup_data['name']:
                    startup_name = startup_data['name'].strip()
                    
                    # Check cache first
                    if startup_name in startup_cache:
                        startup_id = startup_cache[startup_name]
                    else:
                        # Check if startup exists in database
                        try:
                            existing_startup = db.query(models.Startup).filter(
                                models.Startup.name == startup_name
                            ).first()
                            
                            if existing_startup:
                                startup_id = existing_startup.id
                                startup_cache[startup_name] = startup_id
                                print(f"  ↳ Linked to existing startup: {startup_name}")
                            else:
                                # Filter out None values before creating startup
                                filtered_startup_data = {k: v for k, v in startup_data.items() 
                                                       if v is not None and k in startup_columns}
                                if filtered_startup_data:  # Only create if we have data
                                    startup = models.Startup(**filtered_startup_data)
                                    db.add(startup)
                                    db.flush()  # Get ID without committing
                                    startup_id = startup.id
                                    startup_cache[startup_name] = startup_id
                                    startups_added += 1
                                    print(f"  ↳ Created new startup: {startup_name}")
                        except Exception as e:
                            print(f"  ⚠️ Startup creation failed: {e}")
            
            # Check if founder already exists
            existing_founder = db.query(models.Founder).filter(
                models.Founder.email == excel_founder.get('email')
            ).first()
            
            if existing_founder:
                # Update existing founder with new information
                founder_data = extract_founder_data(excel_founder, founder_columns)
                if supports_startup_linking and startup_id:
                    founder_data['startup_id'] = startup_id
                
                # Update non-null fields that exist in the database
                for key, value in founder_data.items():
                    if value is not None and hasattr(existing_founder, key) and key in founder_columns:
                        setattr(existing_founder, key, value)
                
                founder_ids.append(existing_founder.id)
                founders_updated += 1
                print(f"  ↳ Updated existing founder")
            else:
                # Create new founder
                founder_data = extract_founder_data(excel_founder, founder_columns)
                if supports_startup_linking and startup_id:
                    founder_data['startup_id'] = startup_id
                
                # Filter out fields that don't exist in the database schema
                filtered_founder_data = {k: v for k, v in founder_data.items() 
                                       if v is not None and k in founder_columns}
                
                if filtered_founder_data:  # Only create if we have data
                    founder = models.Founder(**filtered_founder_data)
                    db.add(founder)
                    db.flush()  # Get the ID without committing
                    founder_ids.append(founder.id)
                    founders_added += 1
                    print(f"  ↳ Created new founder")
                
        except Exception as e:
            print(f"  ❌ Error processing {excel_founder.get('name', 'Unknown')}: {e}")
            import traceback
            traceback.print_exc()
            continue
    
    return founders_added, startups_added, founders_updated, founder_ids

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
        founders_added, startups_added, founders_updated, founder_ids = populate_founders_from_excel(db)
        db.commit()
        
        print(f"\n🎉 Population completed successfully!")
        print(f"✅ Added {founders_added} new founders")
        print(f"✅ Added {startups_added} new startups") 
        print(f"🔄 Updated {founders_updated} existing founders")
        print(f"📊 Total processed founder IDs: {len(founder_ids)}")
        
        # Show some sample data
        if founder_ids:
            sample_founder = db.query(models.Founder).filter(models.Founder.id == founder_ids[0]).first()
            print(f"\n📝 Sample founder: {sample_founder.name}")
            print(f"   Email: {sample_founder.email}")
            print(f"   LinkedIn: {sample_founder.linkedin_url}")
            if sample_founder.bio:
                bio_preview = sample_founder.bio[:150] + "..." if len(sample_founder.bio) > 150 else sample_founder.bio
                print(f"   Bio: {bio_preview}")
            if sample_founder.startup:
                print(f"   Startup: {sample_founder.startup.name} ({sample_founder.startup.stage})")
        
        # Database statistics
        total_founders = db.query(models.Founder).count()
        total_startups = db.query(models.Startup).count()
        print(f"\n📈 Database totals:")
        print(f"   Total founders: {total_founders}")
        print(f"   Total startups: {total_startups}")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error during population: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()