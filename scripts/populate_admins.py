"""
Seed 3 admin users into SQLite DB at sqlite:///./founders_crm.db

Usage:
  python populate_admins.py
"""

import hashlib
from dataclasses import dataclass
from typing import List
from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    create_engine,
    UniqueConstraint,
    text,
)
from sqlalchemy.orm import declarative_base, sessionmaker

# --- DB setup ---
DATABASE_URL = "sqlite:///./founders_crm.db"
engine = create_engine(DATABASE_URL, echo=False, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
Base = declarative_base()


# --- User model ---
class User(Base):
    __tablename__ = "users"
    __table_args__ = (UniqueConstraint("email", name="uq_users_email"),)

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), nullable=False, index=True)
    password = Column(String(255), nullable=False)  # plain or hashed password
    is_admin = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP"))
    updated_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )


@dataclass(frozen=True)
class AdminSeed:
    email: str
    password: str = "12scrappyfounders"
    is_admin: bool = True


ADMIN_USERS: List[AdminSeed] = [
    AdminSeed("admin@scrappyfounders.com"),
    AdminSeed("derekchen14@gmail.com"),
    AdminSeed("denis.beliauski@gmail.com"),
]


def hash_password(password: str) -> str:
    # You can switch to plain text by returning password instead
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def ensure_schema() -> None:
    Base.metadata.create_all(bind=engine)


def upsert_admin_users() -> None:
    ensure_schema()
    with SessionLocal() as session:
        for admin in ADMIN_USERS:
            hashed = hash_password(admin.password)

            existing = session.query(User).filter_by(email=admin.email).one_or_none()
            if existing:
                existing.password = hashed
                existing.is_admin = True
                existing.updated_at = datetime.utcnow()
                print(f"Updated existing admin: {admin.email}")
            else:
                user = User(
                    email=admin.email,
                    password=hashed,
                    is_admin=admin.is_admin,
                    updated_at=datetime.utcnow(),
                )
                session.add(user)
                print(f"Inserted new admin: {admin.email}")

        session.commit()


if __name__ == "__main__":
    upsert_admin_users()
    print("Seeding complete.")
