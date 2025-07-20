import os
from functools import wraps
from typing import Optional
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
import requests
from dotenv import load_dotenv

load_dotenv()

AUTH0_DOMAIN = os.getenv("AUTH0_DOMAIN", "dev-example.auth0.com")
AUTH0_AUDIENCE = os.getenv("AUTH0_AUDIENCE", "http://localhost:8000")
AUTH0_ALGORITHMS = os.getenv("AUTH0_ALGORITHMS", "RS256").split(",")

# Hardcoded list of admin emails
ADMIN_EMAILS = [
    'admin@scrappykb.com',
    'derek@scrappykb.com', 
    'founder@scrappykb.com'
]

security = HTTPBearer()

class Auth0JWTBearer:
    def __init__(self):
        self.jwks_url = f"https://{AUTH0_DOMAIN}/.well-known/jwks.json"
        self.algorithms = AUTH0_ALGORITHMS
        self.audience = AUTH0_AUDIENCE
        self.issuer = f"https://{AUTH0_DOMAIN}/"

    def get_signing_key(self, token: str) -> dict:
        try:
            jwks = requests.get(self.jwks_url).json()
            unverified_header = jwt.get_unverified_header(token)
            
            for key in jwks["keys"]:
                if key["kid"] == unverified_header["kid"]:
                    rsa_key = {
                        "kty": key["kty"],
                        "kid": key["kid"],
                        "use": key["use"],
                        "n": key["n"],
                        "e": key["e"]
                    }
                    return rsa_key
            
            raise HTTPException(status_code=401, detail="Unable to find appropriate key")
                
        except Exception as e:
            raise HTTPException(status_code=401, detail=f"Unable to parse authentication token: {str(e)}")

    def verify_jwt(self, token: str) -> dict:
        try:
            signing_key = self.get_signing_key(token)
            payload = jwt.decode(
                token,
                signing_key,
                algorithms=self.algorithms,
                audience=self.audience,
                issuer=self.issuer
            )
            return payload
        except JWTError as e:
            raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
        except Exception as e:
            raise HTTPException(status_code=401, detail=f"Token verification failed: {str(e)}")

auth0_bearer = Auth0JWTBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """
    Dependency to get the current authenticated user from JWT token
    """
    token = credentials.credentials
    payload = auth0_bearer.verify_jwt(token)
    return payload

def require_auth(f):
    """
    Decorator to require authentication for a route
    """
    @wraps(f)
    async def wrapper(*args, **kwargs):
        return await f(*args, **kwargs)
    return wrapper

# Optional: Get user if authenticated, but don't require it
def get_current_user_optional(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Optional[dict]:
    """
    Dependency to optionally get the current authenticated user from JWT token
    """
    if not credentials:
        return None
    
    try:
        token = credentials.credentials
        payload = auth0_bearer.verify_jwt(token)
        return payload
    except:
        return None

def is_admin_user(user_email: str) -> bool:
    """
    Check if a user email is in the admin list
    """
    return user_email.lower() in [email.lower() for email in ADMIN_EMAILS]

def get_admin_user(current_user: dict = Depends(get_current_user)) -> dict:
    """
    Dependency to get the current user and verify they are an admin
    """
    user_email = current_user.get('email', '')
    if not is_admin_user(user_email):
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return current_user

def can_edit_profile(current_user_email: str, profile_owner_email: str) -> bool:
    """
    Check if current user can edit a specific profile
    """
    # Admins can edit any profile
    if is_admin_user(current_user_email):
        return True
    
    # Regular users can only edit their own profile
    return current_user_email.lower() == profile_owner_email.lower()