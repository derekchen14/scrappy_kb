from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

# Skill schemas
class SkillBase(BaseModel):
    name: str
    category: Optional[str] = None
    description: Optional[str] = None

class SkillCreate(SkillBase):
    pass

class Skill(SkillBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Startup schemas
class StartupBase(BaseModel):
    name: str
    description: Optional[str] = None
    industry: Optional[str] = None
    stage: Optional[str] = None
    website_url: Optional[str] = None
    team_size: Optional[int] = None
    location: Optional[str] = None

class StartupCreate(StartupBase):
    pass

class Startup(StartupBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Help Request schemas
class HelpRequestBase(BaseModel):
    title: str
    description: str
    category: Optional[str] = None
    urgency: Optional[str] = "Medium"
    status: Optional[str] = "Open"

class HelpRequestCreate(HelpRequestBase):
    founder_id: int

class HelpRequest(HelpRequestBase):
    id: int
    founder_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Founder schemas
class FounderBase(BaseModel):
    name: str
    email: EmailStr
    bio: Optional[str] = None
    location: Optional[str] = None
    linkedin_url: Optional[str] = None
    twitter_url: Optional[str] = None
    github_url: Optional[str] = None

class FounderCreate(FounderBase):
    skill_ids: Optional[List[int]] = []
    startup_ids: Optional[List[int]] = []

class Founder(FounderBase):
    id: int
    created_at: datetime
    updated_at: datetime
    skills: List[Skill] = []
    help_requests: List[HelpRequest] = []
    startups: List[Startup] = []
    
    class Config:
        from_attributes = True