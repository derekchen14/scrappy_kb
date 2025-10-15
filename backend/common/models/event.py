"""
Event model
"""
from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from common.database import Base


class Event(Base):
    __tablename__ = "events"
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    date_time = Column(DateTime, nullable=False)
    location = Column(String(200))
    attendees = Column(Text)  # Store as text for now
    theme = Column(String(50))  # hiking, poker, basketball, pickleball, roundtable, group dinner
    link = Column(String(500))  # Link to Luma, Partiful, etc.
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

