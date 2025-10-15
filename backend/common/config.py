"""
Centralized configuration management
"""
import os
from dotenv import load_dotenv

load_dotenv()


class DatabaseConfig:
    """Database configuration"""
    
    # Postgres connection variables
    POSTGRES_USER = os.getenv("POSTGRES_USER")
    POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD")
    POSTGRES_DB = os.getenv("POSTGRES_DB")
    POSTGRES_HOST = os.getenv("POSTGRES_HOST", "localhost")
    POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5432")
    
    @classmethod
    def get_database_url(cls) -> str:
        """Build the database URL from Postgres variables"""
        if not all([cls.POSTGRES_USER, cls.POSTGRES_PASSWORD, cls.POSTGRES_DB]):
            raise ValueError(
                "Database configuration missing! Set all of: "
                "POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB"
            )
        
        return f"postgresql://{cls.POSTGRES_USER}:{cls.POSTGRES_PASSWORD}@{cls.POSTGRES_HOST}:{cls.POSTGRES_PORT}/{cls.POSTGRES_DB}"


class Auth0Config:
    """Auth0 authentication configuration"""
    
    DOMAIN = os.getenv("AUTH0_DOMAIN", "dev-example.auth0.com")
    AUDIENCE = os.getenv("AUTH0_AUDIENCE", "http://localhost:8000")
    ALGORITHMS = os.getenv("AUTH0_ALGORITHMS", "RS256").split(",")
    
    # Admin users
    ADMIN_EMAILS = [
        'admin@scrappyfounders.com',
        'derekchen14@gmail.com', 
        'denis.beliauski@gmail.com',
        'gleb.sviripa@gmail.com',
    ]


class Settings:
    """Application settings"""
    
    # Database
    db = DatabaseConfig
    
    # Auth0
    auth = Auth0Config
    
    # App
    APP_NAME = "Scrappy Founders Knowledge Base"
    DEBUG = os.getenv("DEBUG", "False").lower() in ("true", "1", "yes")


# Create singleton instance
settings = Settings()

