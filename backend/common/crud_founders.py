"""CRUD operations for Founders"""
import csv
import io
from sqlalchemy.orm import Session, selectinload
from typing import List, Dict, Union

from common import models
import schemas
from common import crud_skills, crud_hobbies, crud_startups


# =========================
# Founder CRUD operations
# =========================

def create_founder(db: Session, founder: schemas.FounderCreate):
    db_founder = models.Founder(
        name=founder.name,
        email=founder.email,
        bio=founder.bio,
        location=founder.location,
        linkedin_url=founder.linkedin_url,
        twitter_url=founder.twitter_url,
        github_url=founder.github_url,
        profile_image_url=founder.profile_image_url,
        profile_visible=founder.profile_visible,
        auth0_user_id=founder.auth0_user_id,
        startup_id=founder.startup_id
    )
    
    db.add(db_founder)
    db.commit()
    db.refresh(db_founder)
    
    # Add skills
    if founder.skill_ids and len(founder.skill_ids) > 0:
        skills = db.query(models.Skill).filter(models.Skill.id.in_(founder.skill_ids)).all()
        db_founder.skills = skills
        db.commit()
        db.refresh(db_founder)
    
    # Add hobbies
    if founder.hobby_ids and len(founder.hobby_ids) > 0:
        hobbies = db.query(models.Hobby).filter(models.Hobby.id.in_(founder.hobby_ids)).all()
        db_founder.hobbies = hobbies
        db.commit()
        db.refresh(db_founder)
    
    return db_founder


def get_founder(db: Session, founder_id: int):
    return db.query(models.Founder)\
        .options(selectinload(models.Founder.skills))\
        .options(selectinload(models.Founder.hobbies))\
        .options(selectinload(models.Founder.startup))\
        .filter(models.Founder.id == founder_id)\
        .first()


def get_founders(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Founder)\
        .options(selectinload(models.Founder.skills))\
        .options(selectinload(models.Founder.hobbies))\
        .options(selectinload(models.Founder.startup))\
        .offset(skip)\
        .limit(limit)\
        .all()


def update_founder(db: Session, founder_id: int, founder: schemas.FounderCreate):
    db_founder = db.query(models.Founder).filter(models.Founder.id == founder_id).first()
    if db_founder:
        for key, value in founder.model_dump(exclude={'skill_ids', 'startup_id', 'hobby_ids'}).items():
            if value is not None:
                setattr(db_founder, key, value)
        
        # Update startup_id directly
        if founder.startup_id is not None:
            db_founder.startup_id = founder.startup_id
        
        # Update skills
        if founder.skill_ids is not None:
            if len(founder.skill_ids) > 0:
                skills = db.query(models.Skill).filter(models.Skill.id.in_(founder.skill_ids)).all()
                db_founder.skills = skills
            else:
                db_founder.skills = []
        
        # Update hobbies
        if founder.hobby_ids is not None:
            if len(founder.hobby_ids) > 0:
                hobbies = db.query(models.Hobby).filter(models.Hobby.id.in_(founder.hobby_ids)).all()
                db_founder.hobbies = hobbies
            else:
                db_founder.hobbies = []
        
        db.commit()
        db.refresh(db_founder)
    return db_founder


def delete_founder(db: Session, founder_id: int):
    db_founder = db.query(models.Founder).filter(models.Founder.id == founder_id).first()
    if db_founder:
        db.delete(db_founder)
        db.commit()
    return db_founder


# ====================================
# User profile matching / associations
# ====================================

def get_founder_by_auth0_user_id(db: Session, auth0_user_id: str):
    """Get founder profile by Auth0 user ID (for claimed profiles)."""
    return db.query(models.Founder)\
        .options(selectinload(models.Founder.skills))\
        .options(selectinload(models.Founder.hobbies))\
        .options(selectinload(models.Founder.startup))\
        .filter(models.Founder.auth0_user_id == auth0_user_id)\
        .first()


def get_unclaimed_founder_by_email(db: Session, email: str):
    """Get unclaimed founder profile by email."""
    return db.query(models.Founder)\
        .options(selectinload(models.Founder.skills))\
        .options(selectinload(models.Founder.hobbies))\
        .options(selectinload(models.Founder.startup))\
        .filter(
            models.Founder.email.ilike(email),
            models.Founder.auth0_user_id.is_(None)
        ).first()


def claim_founder_profile(db: Session, founder_id: int, auth0_user_id: str):
    """Claim a founder profile by linking it to an Auth0 user."""
    db_founder = db.query(models.Founder)\
        .options(selectinload(models.Founder.skills))\
        .options(selectinload(models.Founder.hobbies))\
        .options(selectinload(models.Founder.startup))\
        .filter(models.Founder.id == founder_id)\
        .first()
    if db_founder:
        db_founder.auth0_user_id = auth0_user_id
        db.commit()
        db.refresh(db_founder)
    return db_founder


def get_founders_by_startup_id(db: Session, startup_id: int):
    """Get all founders associated with a specific startup."""
    return db.query(models.Founder)\
        .options(selectinload(models.Founder.skills))\
        .options(selectinload(models.Founder.hobbies))\
        .options(selectinload(models.Founder.startup))\
        .filter(models.Founder.startup_id == startup_id)\
        .all()


# =========================
# CSV helpers / import
# =========================

def decode_csv_bytes(csv_bytes: bytes) -> str:
    """Decode CSV content with utf-8-sig first, then fallback to latin-1 (no external deps)."""
    try:
        return csv_bytes.decode("utf-8-sig")
    except UnicodeDecodeError:
        return csv_bytes.decode("latin-1", errors="replace")


def normalize_url(u: str) -> str:
    u = (u or "").strip()
    if not u:
        return ""
    if not u.startswith(("http://", "https://")):
        u = "https://" + u
    return u


def extract_linkedin_url(row: Dict[str, str]) -> str:
    """
    1) ищем в колонках, где ключ содержит 'linkedin'
    2) если не нашли — ищем по всем значениям подстроку 'linkedin.com'
    """
    # 1) по ключам
    for k, v in row.items():
        if "linkedin" in (k or "") and v:
            vv = v.strip()
            if vv:
                return normalize_url(vv)
    # 2) по значениям
    for v in row.values():
        if isinstance(v, str) and "linkedin.com" in v.lower():
            return normalize_url(v)
    return ""


def create_founders_from_csv(db: Session, csv_input: Union[bytes, str]):
    """
    Parses a CSV (bytes or decoded text) and creates founders, startups (optional), skills, and hobbies.
    - Startup is OPTIONAL
    - LinkedIn берётся из любой колонки с "linkedin" в названии или из любого значения, где встречается "linkedin.com"
    - На ошибке строки делаем db.rollback(), чтобы следующие строки продолжали создаваться
    Returns a dict compatible with schemas.FounderUploadResponse.
    """
    created_founders = []
    errors: List[str] = []

    # --- decode if needed ---
    try:
        if isinstance(csv_input, bytes):
            text = decode_csv_bytes(csv_input)
        else:
            text = csv_input
    except Exception as e:
        return {"message": "Failed to decode CSV", "created_count": 0, "errors": [str(e)]}

    # --- build reader & normalize headers ---
    try:
        reader = csv.DictReader(io.StringIO(text))
        if not reader.fieldnames:
            return {"message": "No headers found", "created_count": 0, "errors": ["CSV has no header row"]}
        reader.fieldnames = [h.strip().lower() for h in reader.fieldnames]
    except Exception as e:
        return {"message": "Failed to read CSV", "created_count": 0, "errors": [f"Reader error: {e}"]}

    # Колонки (нижний регистр) — лишние игнорируем
    COL_NAME = "name"
    COL_EMAIL = "email"
    COL_TWITTER = "twitter url"
    COL_LOCATION = "location"
    COL_HOBBY = "one thing you love doing outside your startup?"
    COL_HELP_OFFERED = "one thing you can help with (your specialization/passion)"
    COL_HELP_WANTED = "something you want other founders to help you with? (customer acquisition, gtm, fundraising, engineering, product, etc.)"

    COL_STARTUP_NAME = "startup name"          # OPTIONAL
    COL_STARTUP_DESC = "describe what your startup does (in 1 sentence)"
    COL_STARTUP_STAGE = "where are you now (stage)?"
    COL_STARTUP_INDUSTRY = "what is your startup industry?"
    COL_STARTUP_MARKET = "who are you building for?"
    COL_STARTUP_REVENUE = "current revenue (arr $)"
    COL_STARTUP_WEBSITE = "startup website"

    for rownum, raw_row in enumerate(reader, 2):
        try:
            # нормализуем ключи/значения
            row = {(k or "").strip().lower(): (v or "").strip() for k, v in raw_row.items()}

            # --- email обязателен и должен быть уникален ---
            founder_email = row.get(COL_EMAIL, "")
            if not founder_email:
                errors.append(f"Row {rownum}: '{COL_EMAIL}' is required.")
                continue
            if db.query(models.Founder).filter(models.Founder.email.ilike(founder_email)).first():
                errors.append(f"Row {rownum}: Founder with email '{founder_email}' already exists.")
                continue

            # --- LinkedIn: гибкая выемка + нормализация ---
            linkedin_url = extract_linkedin_url(row)
            if not linkedin_url:
                errors.append(f"Row {rownum}: 'linkedin url' is required (provide any field containing linkedin.com).")
                continue

            # --- Startup: опционально ---
            startup_id = None
            startup_name = row.get(COL_STARTUP_NAME, "")
            if startup_name:
                startup_data = {
                    "name": startup_name,
                    "description": row.get(COL_STARTUP_DESC, ""),
                    "stage": row.get(COL_STARTUP_STAGE, ""),
                    "industry": row.get(COL_STARTUP_INDUSTRY, ""),
                    "target_market": row.get(COL_STARTUP_MARKET, ""),
                    "revenue_arr": row.get(COL_STARTUP_REVENUE, ""),
                    "website_url": row.get(COL_STARTUP_WEBSITE, ""),
                }
                startup = crud_startups.get_or_create_startup(db, startup_name, startup_data)
                startup_id = startup.id

            # --- Skills ---
            skill_ids: List[int] = []
            help_offered = row.get(COL_HELP_OFFERED, "")
            help_wanted = row.get(COL_HELP_WANTED, "")
            all_skills = [s.strip() for s in (help_offered + "," + help_wanted).split(",") if s.strip()]
            seen = set()
            for sname in all_skills:
                key = sname.lower()
                if key in seen:
                    continue
                seen.add(key)
                skill = crud_skills.get_or_create_skill(db, sname)
                skill_ids.append(skill.id)

            # --- Hobbies ---
            hobby_ids: List[int] = []
            hobbies_str = row.get(COL_HOBBY, "")
            for hname in [h.strip() for h in hobbies_str.split(",") if h.strip()]:
                hobby = crud_hobbies.get_or_create_hobby(db, hname)
                if hobby.id not in hobby_ids:
                    hobby_ids.append(hobby.id)

            # --- Create founder ---
            founder_data = schemas.FounderCreate(
                name=row.get(COL_NAME, ""),
                email=founder_email,
                location=row.get(COL_LOCATION, ""),
                linkedin_url=linkedin_url,                # уже нормализован
                twitter_url=row.get(COL_TWITTER, ""),
                startup_id=startup_id,                     # может быть None
                skill_ids=skill_ids,
                hobby_ids=hobby_ids,
                profile_visible=True,
            )

            created = create_founder(db, founder_data)
            created_founders.append(created)

        except Exception as e:
            db.rollback()  # критично: не блокируем следующие строки
            errors.append(f"Row {rownum}: Unexpected error - {e}")

    return {
        "message": f"Imported {len(created_founders)} founders",
        "created_count": len(created_founders),
        "errors": errors,
    }

