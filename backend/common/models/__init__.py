"""
Models package for Scrappy Founders KB
"""
from common.database import Base

# Import association tables first (they need to exist before models that reference them)
from .founder_skills import founder_skills
from .founder_hobbies import founder_hobbies

# Import models
from .founder import Founder
from .skill import Skill
from .startup import Startup
from .help_request import HelpRequest
from .hobby import Hobby
from .event import Event

__all__ = [
    "Base",
    "Founder",
    "Skill",
    "Startup",
    "HelpRequest",
    "Hobby",
    "Event",
    "founder_skills",
    "founder_hobbies",
]

