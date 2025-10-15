"""
Help Request model
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from common.database import Base


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

