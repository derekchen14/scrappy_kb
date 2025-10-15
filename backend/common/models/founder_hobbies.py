"""
Founder-Hobbies association table (many-to-many)
"""
from sqlalchemy import Column, Integer, ForeignKey, Table
from common.database import Base

founder_hobbies = Table(
    'founder_hobbies',
    Base.metadata,
    Column('founder_id', Integer, ForeignKey('founders.id'), primary_key=True),
    Column('hobby_id', Integer, ForeignKey('hobbies.id'), primary_key=True),
    extend_existing=True
)

