"""
Founder model
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from common.database import Base


class Founder(Base):
    __tablename__ = "founders"
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    bio = Column(Text)
    location = Column(String(100))
    linkedin_url = Column(String(200), nullable=False)
    twitter_url = Column(String(200))
    github_url = Column(String(200))
    profile_image_url = Column(String(500))
    profile_visible = Column(Boolean, default=True, nullable=False)
    auth0_user_id = Column(String(100), unique=True, nullable=True)  # Links founder to Auth0 user
    startup_id = Column(Integer, ForeignKey('startups.id'), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    skills = relationship("Skill", secondary="founder_skills", back_populates="founders")
    help_requests = relationship("HelpRequest", back_populates="founder")
    startup = relationship("Startup", back_populates="founders")
    hobbies = relationship("Hobby", secondary="founder_hobbies", back_populates="founders")

