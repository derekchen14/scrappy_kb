from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    ForeignKey,
    Table,
    Boolean,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

# --- Association tables (with proper cascading) ---

founder_skills = Table(
    "founder_skills",
    Base.metadata,
    Column("founder_id", Integer, ForeignKey("founders.id", ondelete="CASCADE"), primary_key=True),
    Column("skill_id", Integer, ForeignKey("skills.id", ondelete="CASCADE"), primary_key=True),
    extend_existing=True,
)

founder_hobbies = Table(
    "founder_hobbies",
    Base.metadata,
    Column("founder_id", Integer, ForeignKey("founders.id", ondelete="CASCADE"), primary_key=True),
    Column("hobby_id", Integer, ForeignKey("hobbies.id", ondelete="CASCADE"), primary_key=True),
    extend_existing=True,
)


class Founder(Base):
    __tablename__ = "founders"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False, index=True)
    bio = Column(Text)
    location = Column(String(100))
    linkedin_url = Column(String(200), nullable=False)
    twitter_url = Column(String(200))
    github_url = Column(String(200))
    profile_image_url = Column(String(500))
    profile_visible = Column(Boolean, default=True, nullable=False)
    auth0_user_id = Column(String(100), unique=True, nullable=True, index=True)
    startup_id = Column(
        Integer,
        ForeignKey("startups.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    skills = relationship(
        "Skill",
        secondary=founder_skills,
        back_populates="founders",
        lazy="selectin",
    )
    hobbies = relationship(
        "Hobby",
        secondary=founder_hobbies,
        back_populates="founders",
        lazy="selectin",
    )
    help_requests = relationship(
        "HelpRequest",
        back_populates="founder",
        cascade="all, delete-orphan",
        passive_deletes=True,
        lazy="selectin",
    )
    startup = relationship(
        "Startup",
        back_populates="founders",
        lazy="selectin",
    )


class Skill(Base):
    __tablename__ = "skills"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    category = Column(String(50))
    description = Column(Text)
    created_at = Column(DateTime, server_default=func.now())

    founders = relationship(
        "Founder",
        secondary=founder_skills,
        back_populates="skills",
        lazy="selectin",
    )


class HelpRequest(Base):
    __tablename__ = "help_requests"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    founder_id = Column(
        Integer,
        ForeignKey("founders.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(50))
    urgency = Column(String(20))
    status = Column(String(20), default="Open")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    founder = relationship("Founder", back_populates="help_requests", lazy="selectin")


class Startup(Base):
    __tablename__ = "startups"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    description = Column(Text)
    industry = Column(String(100))
    stage = Column(String(50))
    website_url = Column(String(200))
    target_market = Column(String(200))
    revenue_arr = Column(String(100))
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    founders = relationship(
        "Founder",
        back_populates="startup",
        passive_deletes=True,
        lazy="selectin",
    )


class Hobby(Base):
    __tablename__ = "hobbies"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    category = Column(String(50))
    description = Column(Text)
    created_at = Column(DateTime, server_default=func.now())

    founders = relationship(
        "Founder",
        secondary=founder_hobbies,
        back_populates="hobbies",
        lazy="selectin",
    )


class Event(Base):
    __tablename__ = "events"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    date_time = Column(DateTime, nullable=False, index=True)
    location = Column(String(200))
    attendees = Column(Text)
    theme = Column(String(50))
    link = Column(String(500))
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
