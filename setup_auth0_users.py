#!/usr/bin/env python3
"""
Script to create Auth0 users for existing founders with default passwords.

This script reads existing founders from the database and creates corresponding
Auth0 users with the default password '12scrappyfounders'.

Prerequisites:
1. Install required packages: pip install requests python-dotenv
2. Set up Auth0 Management API credentials in .env file:
   AUTH0_DOMAIN=your-domain.auth0.com
   AUTH0_CLIENT_ID=your-management-api-client-id
   AUTH0_CLIENT_SECRET=your-management-api-client-secret
   AUTH0_AUDIENCE=https://your-domain.auth0.com/api/v2/

Instructions:
1. Go to Auth0 Dashboard > Applications > Machine to Machine Applications
2. Create a new M2M application or use existing one
3. Authorize it for the Auth0 Management API with scopes: create:users, read:users
4. Add credentials to .env file
5. Run this script: python setup_auth0_users.py
"""

import os
import requests
import json
from dotenv import load_dotenv
import sys
sys.path.append('/Users/derekchen/Documents/repos/scrappy_kb/backend')

# Load environment variables
load_dotenv()

# Auth0 Configuration
AUTH0_DOMAIN = os.getenv('AUTH0_DOMAIN')
AUTH0_CLIENT_ID = os.getenv('AUTH0_CLIENT_ID') 
AUTH0_CLIENT_SECRET = os.getenv('AUTH0_CLIENT_SECRET')
AUTH0_AUDIENCE = os.getenv('AUTH0_AUDIENCE', f'https://{AUTH0_DOMAIN}/api/v2/')

DEFAULT_PASSWORD = '12scrappyfounders'

def get_management_api_token():
    """Get an access token for the Auth0 Management API."""
    url = f'https://{AUTH0_DOMAIN}/oauth/token'
    
    payload = {
        'client_id': AUTH0_CLIENT_ID,
        'client_secret': AUTH0_CLIENT_SECRET,
        'audience': AUTH0_AUDIENCE,
        'grant_type': 'client_credentials'
    }
    
    response = requests.post(url, json=payload)
    response.raise_for_status()
    
    return response.json()['access_token']

def get_existing_founders():
    """Get list of existing founders from the database."""
    try:
        from sqlalchemy import create_engine
        from sqlalchemy.orm import sessionmaker
        import sys
        sys.path.append('/Users/derekchen/Documents/repos/scrappy_kb/backend')
        from database import DATABASE_URL
        from models import Founder
        
        engine = create_engine(DATABASE_URL)
        Session = sessionmaker(bind=engine)
        session = Session()
        
        founders = session.query(Founder).all()
        session.close()
        
        return [(f.email, f.name) for f in founders]
    except Exception as e:
        print(f"Error fetching founders: {e}")
        return []

def create_auth0_user(token, email, name):
    """Create a user in Auth0."""
    url = f'https://{AUTH0_DOMAIN}/api/v2/users'
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    payload = {
        'email': email,
        'password': DEFAULT_PASSWORD,
        'name': name,
        'connection': 'Username-Password-Authentication',  # Default Auth0 database connection
        'email_verified': True
    }
    
    response = requests.post(url, headers=headers, json=payload)
    
    if response.status_code == 201:
        print(f"✅ Created user: {email}")
        return True
    elif response.status_code == 409:
        print(f"ℹ️  User already exists: {email}")
        return True
    else:
        print(f"❌ Error creating user {email}: {response.status_code} - {response.text}")
        return False

def main():
    """Main function to set up Auth0 users."""
    if not all([AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET]):
        print("❌ Missing Auth0 configuration. Please set up .env file with:")
        print("   AUTH0_DOMAIN=your-domain.auth0.com")
        print("   AUTH0_CLIENT_ID=your-management-api-client-id") 
        print("   AUTH0_CLIENT_SECRET=your-management-api-client-secret")
        return
    
    print("🚀 Setting up Auth0 users for existing founders...")
    print(f"📧 Default password: {DEFAULT_PASSWORD}")
    print()
    
    try:
        # Get Management API token
        token = get_management_api_token()
        print("✅ Got Auth0 Management API token")
        
        # Get existing founders
        founders = get_existing_founders()
        print(f"📊 Found {len(founders)} founders in database")
        print()
        
        if not founders:
            print("⚠️  No founders found in database. Make sure the database is accessible.")
            return
        
        # Create Auth0 users
        success_count = 0
        for email, name in founders:
            if create_auth0_user(token, email, name):
                success_count += 1
        
        print()
        print(f"✅ Successfully processed {success_count}/{len(founders)} users")
        print(f"🔑 All users can log in with password: {DEFAULT_PASSWORD}")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    main()