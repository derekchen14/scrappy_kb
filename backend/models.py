from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Table, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

# Many-to-many relationship tables
founder_skills = Table(
    'founder_skills',
    Base.metadata,
    Column('founder_id', Integer, ForeignKey('founders.id'), primary_key=True),
    Column('skill_id', Integer, ForeignKey('skills.id'), primary_key=True),
    extend_existing=True
)

startup_founders = Table(
    'startup_founders',
    Base.metadata,
    Column('startup_id', Integer, ForeignKey('startups.id'), primary_key=True),
    Column('founder_id', Integer, ForeignKey('founders.id'), primary_key=True),
    extend_existing=True
)

founder_hobbies = Table(
    'founder_hobbies',
    Base.metadata,
    Column('founder_id', Integer, ForeignKey('founders.id'), primary_key=True),
    Column('hobby_id', Integer, ForeignKey('hobbies.id'), primary_key=True),
    extend_existing=True
)

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
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    skills = relationship("Skill", secondary=founder_skills, back_populates="founders")
    help_requests = relationship("HelpRequest", back_populates="founder")
    startups = relationship("Startup", secondary=startup_founders, back_populates="founders")
    hobbies = relationship("Hobby", secondary=founder_hobbies, back_populates="founders")

class Skill(Base):
    __tablename__ = "skills"
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    category = Column(String(50))  # e.g., "Technical", "Marketing", "Business"
    description = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    founders = relationship("Founder", secondary=founder_skills, back_populates="skills")

class HelpRequest(Base):
    __tablename__ = "help_requests"
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True, index=True)
    founder_id = Column(Integer, ForeignKey('founders.id'), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(50))  # e.g., "Technical", "Marketing", "Funding"
    urgency = Column(String(20))  # e.g., "Low", "Medium", "High"
    status = Column(String(20), default="Open")  # e.g., "Open", "In Progress", "Resolved"
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    founder = relationship("Founder", back_populates="help_requests")

class Startup(Base):
    __tablename__ = "startups"
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    industry = Column(String(100))
    stage = Column(String(50))  # e.g., "Idea", "MVP", "Seed", "Series A"
    website_url = Column(String(200))
    target_market = Column(String(200))
    revenue_arr = Column(String(100))  # Annual Recurring Revenue as string to allow formats like "$1M", "Pre-revenue", etc.
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    founders = relationship("Founder", secondary=startup_founders, back_populates="startups")

class Hobby(Base):
    __tablename__ = "hobbies"
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    category = Column(String(50))  # e.g., "Sports", "Games", "Arts", "Outdoor", "Indoor"
    description = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    founders = relationship("Founder", secondary=founder_hobbies, back_populates="hobbies")