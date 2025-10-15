"""
Founder-Skills association table (many-to-many)
"""
from sqlalchemy import Column, Integer, ForeignKey, Table
from common.database import Base

founder_skills = Table(
    'founder_skills',
    Base.metadata,
    Column('founder_id', Integer, ForeignKey('founders.id'), primary_key=True),
    Column('skill_id', Integer, ForeignKey('skills.id'), primary_key=True),
    extend_existing=True
)

