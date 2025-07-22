from pydantic import BaseModel, EmailStr, field_validator
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

# Hobby schemas
class HobbyBase(BaseModel):
    name: str
    category: Optional[str] = None
    description: Optional[str] = None

class HobbyCreate(HobbyBase):
    pass

class Hobby(HobbyBase):
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
    target_market: Optional[str] = None
    revenue_arr: Optional[str] = None

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
    linkedin_url: str
    twitter_url: Optional[str] = None
    github_url: Optional[str] = None
    profile_image_url: Optional[str] = None
    profile_visible: Optional[bool] = True
    
    @field_validator('linkedin_url')
    @classmethod
    def validate_linkedin_url(cls, v):
        if not v or not v.strip():
            raise ValueError('LinkedIn URL is required and cannot be empty')
        return v

class FounderCreate(FounderBase):
    skill_ids: Optional[List[int]] = []
    startup_ids: Optional[List[int]] = []
    hobby_ids: Optional[List[int]] = []

class Founder(FounderBase):
    id: int
    created_at: datetime
    updated_at: datetime
    skills: List[Skill] = []
    help_requests: List[HelpRequest] = []
    startups: List[Startup] = []
    hobbies: List[Hobby] = []
    
    class Config:
        from_attributes = True

# Event schemas
class EventBase(BaseModel):
    title: str
    description: Optional[str] = None
    date_time: datetime
    location: Optional[str] = None
    attendees: Optional[str] = None
    theme: Optional[str] = None
    link: Optional[str] = None

class EventCreate(EventBase):
    pass

class Event(EventBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True