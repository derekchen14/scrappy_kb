from __future__ import annotations

from pydantic import BaseModel, EmailStr, field_validator
from typing import List, Optional
from datetime import datetime
from enum import Enum


# -----------------------------
# Enumerations to match frontend
# -----------------------------

class StartupStageEnum(str, Enum):
    IDEATION = "Ideation"
    VALIDATION = "Validation"
    MVP = "MVP"
    DESIGN_PARTNERS = "Design Partners (pre-revenue)"
    CUSTOMERS = "Customers (post-revenue)"
    PRE_SEED = "Pre-seed"
    SEED = "Seed"
    SERIES_A = "Series A"
    SERIES_B_OR_LATER = "Series B or later"
    SCALING = "Scaling"


class IndustryEnum(str, Enum):
    AI_ML_DL = "AI/ML/Deep Learning"
    DEEPTECH = "Deeptech"
    DEVTOOLS = "DevTools"
    INFRA_CLOUD = "Infrastructure / Cloud"
    AGENTS = "Agents"
    FINTECH = "Fintech"
    HEALTHTECH = "Healthtech"
    BIOTECH = "Biotech"
    EDTECH = "Edtech"
    MARTECH = "Martech"
    SALESTECH = "Salestech"
    LEGALTECH = "Legaltech"
    INSURTECH = "Insurtech"
    PROPTECH = "Proptech"
    FOODTECH = "Foodtech"
    INDUSTRIALTECH = "Industrialtech"
    ECOM_MARKETPLACES = "Ecommerce / Marketplaces"
    CONSUMER = "Consumer"
    GAMING = "Gaming"
    ROBOTICS = "Robotics"
    HARDWARE_DEVICES = "Hardware / Devices"
    WEARABLES = "Wearables"
    CLIMATE_ENERGY = "Climate / Energy"
    MOBILITY_TRANSPORT = "Mobility / Transportation"
    AEROSPACE = "Aerospace"
    SOCIAL_COMMUNITY = "Social / Community"
    WEB3_CRYPTO = "Web3 / Crypto"
    SECURITY_PRIVACY = "Security / Privacy"


class TargetMarketEnum(str, Enum):
    CONSUMERS_D2C = "Consumers / D2C"
    SMBS = "SMBs"
    MID_MARKET = "Mid-Market"
    ENTERPRISES = "Enterprises"
    DEVELOPERS_ENGINEERS = "Developers / Engineers"
    STARTUPS = "Startups"
    PUBLIC_SECTOR = "Public Sector / Government"
    HEALTHCARE_PROVIDERS = "Healthcare Providers"
    EDUCATIONAL_INSTITUTIONS = "Educational Institutions"
    NONPROFITS = "Nonprofits"
    MARKETPLACES_PLATFORMS = "Marketplaces / Platforms"
    INTERNAL_TEAMS = "Internal / In-house Teams"


class RevenueEnum(str, Enum):
    PRE_REVENUE = "Pre-revenue"
    R_1_10K = "$1-10K"
    R_10_25K = "$10-25K"
    R_25_50K = "$25-50K"
    R_50_150K = "$50-150K"
    R_150_500K = "$150-500K"
    R_500K_1M = "$500-1M"
    R_1M_PLUS = "$1M+"


# -------------
# Skill schemas
# -------------
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


# -------------
# Hobby schemas
# -------------
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


# ---------------
# Startup schemas
# ---------------
class StartupBase(BaseModel):
    name: str
    description: Optional[str] = None
    industry: Optional[IndustryEnum] = None
    stage: Optional[StartupStageEnum] = None
    website_url: Optional[str] = None
    target_market: Optional[TargetMarketEnum] = None
    revenue_arr: Optional[RevenueEnum] = None


class StartupCreate(StartupBase):
    pass


class Startup(StartupBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# --------------------
# Help Request schemas
# --------------------
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


# ----------------
# Founder schemas
# ----------------
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
    auth0_user_id: Optional[str] = None

    @field_validator("linkedin_url")
    @classmethod
    def validate_linkedin_url(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("LinkedIn URL is required and cannot be empty")
        return v


class FounderCreate(FounderBase):
    skill_ids: Optional[List[int]] = []
    startup_id: Optional[int] = None
    hobby_ids: Optional[List[int]] = []


class Founder(FounderBase):
    id: int
    created_at: datetime
    updated_at: datetime
    skills: List[Skill] = []
    help_requests: List[HelpRequest] = []
    startup: Optional[Startup] = None
    hobbies: List[Hobby] = []

    class Config:
        from_attributes = True


# -------------
# Event schemas
# -------------
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


# ----------------------------------------
# Bulk Import (CSV/Excel) helper schemas
# ----------------------------------------

class FounderImportRow(BaseModel):
    """
    Represents a single parsed row from the uploaded file.
    This is *normalized* form that your import parser will produce.
    - skills/hobbies are free-text tag lists; resolver will map/create them.
    - startup_* feeds a new or existing startup (matched by name).
    """
    # Founder fields
    name: str
    email: EmailStr
    linkedin_url: str
    bio: Optional[str] = None
    location: Optional[str] = None
    twitter_url: Optional[str] = None
    github_url: Optional[str] = None
    profile_visible: Optional[bool] = True
    profile_image_url: Optional[str] = None  # e.g., a hosted URL from the CSV; optional

    # Tags as free text to be resolved
    skills: List[str] = []
    hobbies: List[str] = []

    # Startup fields (all optional; created/linked if present)
    startup_name: Optional[str] = None
    startup_description: Optional[str] = None
    startup_industry: Optional[IndustryEnum] = None
    startup_stage: Optional[StartupStageEnum] = None
    startup_website_url: Optional[str] = None
    startup_target_market: Optional[TargetMarketEnum] = None
    startup_revenue_arr: Optional[RevenueEnum] = None

    @field_validator("linkedin_url")
    @classmethod
    def li_required(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("LinkedIn URL is required")
        return v


class BulkFounderImportRequest(BaseModel):
    """
    Payload used by a JSON-based import endpoint (e.g., after parsing CSV on FE).
    """
    rows: List[FounderImportRow]
    create_missing_skills: bool = True
    create_missing_hobbies: bool = True
    create_missing_startups: bool = True


class BulkFounderImportResult(BaseModel):
    """
    Compact result summary from the bulk import.
    """
    created: int
    updated: int
    errors: List[str] = []


class BulkFounderImportPreviewItem(BaseModel):
    """
    Optional: use for a /preview endpoint to show how rows would be resolved.
    """
    row_index: int
    incoming: FounderImportRow
    resolved_skill_ids: List[int] = []
    missing_skills: List[str] = []
    resolved_hobby_ids: List[int] = []
    missing_hobbies: List[str] = []
    resolved_startup_id: Optional[int] = None
    will_create_startup: bool = False
