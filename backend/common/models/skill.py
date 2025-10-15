"""
Skill model
"""
from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from common.database import Base


class Skill(Base):
    __tablename__ = "skills"
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    category = Column(String(50))  # e.g., "Technical", "Marketing", "Business"
    description = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    founders = relationship("Founder", secondary="founder_skills", back_populates="skills")

