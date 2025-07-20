#!/usr/bin/env python3
"""
Simple test script to verify Auth0 configuration and basic functionality
"""

import sys
import os
sys.path.append('backend')

def test_backend_startup():
    """Test that the backend can start without errors"""
    try:
        from backend.main import app
        from backend.auth import auth0_bearer, ADMIN_EMAILS
        print("✅ Backend imports successfully")
        print(f"✅ Admin emails configured: {ADMIN_EMAILS}")
        return True
    except Exception as e:
        print(f"❌ Backend import failed: {e}")
        return False

def test_auth0_config():
    """Test Auth0 configuration"""
    try:
        from backend.auth import AUTH0_DOMAIN, AUTH0_AUDIENCE, AUTH0_ALGORITHMS
        print(f"✅ Auth0 Domain: {AUTH0_DOMAIN}")
        print(f"✅ Auth0 Audience: {AUTH0_AUDIENCE}")
        print(f"✅ Auth0 Algorithms: {AUTH0_ALGORITHMS}")
        
        if AUTH0_DOMAIN == "dev-example.auth0.com":
            print("⚠️  WARNING: Using default Auth0 domain - update .env file")
        if AUTH0_AUDIENCE == "http://localhost:8000":
            print("ℹ️  Using localhost audience - good for local testing")
            
        return True
    except Exception as e:
        print(f"❌ Auth0 config error: {e}")
        return False

def test_database():
    """Test database connection"""
    try:
        from backend.database import engine
        from backend.models import Base
        from sqlalchemy import text
        
        # Test connection
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            result.fetchone()
        
        print("✅ Database connection successful")
        return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

def main():
    print("🧪 Testing Scrappy KB Auth0 Setup...")
    print("=" * 50)
    
    tests = [
        ("Backend Startup", test_backend_startup),
        ("Auth0 Configuration", test_auth0_config),
        ("Database Connection", test_database),
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n📋 Testing {test_name}:")
        if test_func():
            passed += 1
        else:
            print(f"   ⚠️  {test_name} failed")
    
    print("\n" + "=" * 50)
    print(f"🎯 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Your setup looks good.")
        print("\n📝 Next Steps:")
        print("1. Set up Auth0 account and update .env files")
        print("2. Start backend: cd backend && uvicorn main:app --reload")
        print("3. Start frontend: cd frontend && npm start")
        print("4. Test login flow at http://localhost:3000")
    else:
        print("❌ Some tests failed. Please check the errors above.")
        
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)