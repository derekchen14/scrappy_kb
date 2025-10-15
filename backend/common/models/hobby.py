"""
Hobby model
"""
from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from common.database import Base


class Hobby(Base):
    __tablename__ = "hobbies"
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    category = Column(String(50))  # e.g., "Sports", "Games", "Arts", "Outdoor", "Indoor"
    description = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    founders = relationship("Founder", secondary="founder_hobbies", back_populates="hobbies")

