"""
Startup model
"""
from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from common.database import Base


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
    founders = relationship("Founder", back_populates="startup")

