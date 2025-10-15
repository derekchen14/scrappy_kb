# Backend Analysis - Scrappy Founders Knowledge Base

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Database Connection](#database-connection)
4. [Database Schema](#database-schema)
5. [API Endpoints](#api-endpoints)
6. [Authentication & Authorization](#authentication--authorization)
7. [File Storage](#file-storage)
8. [Data Operations (CRUD)](#data-operations-crud)
9. [Deployment](#deployment)
10. [Key Features](#key-features)
11. [Technical Stack](#technical-stack)

---

## Overview

The **Scrappy Founders Knowledge Base** backend is a RESTful API built with **FastAPI** that serves as a CRM and community management system for founders. It provides comprehensive management of founder profiles, startups, skills, help requests, hobbies, and events.

**Purpose**: Connect founders within a community, track their skills, help requests, startups, and facilitate networking through events.

---

## Architecture

### Design Pattern
The backend follows a **layered architecture** with clear separation of concerns:

```
┌─────────────────────────────────────┐
│         main.py (Routes)            │  ← API Endpoints & HTTP Layer
├─────────────────────────────────────┤
│     auth.py (Authentication)        │  ← Auth0 JWT Verification
├─────────────────────────────────────┤
│      schemas.py (Validation)        │  ← Pydantic Models
├─────────────────────────────────────┤
│    crud.py (Business Logic)         │  ← CRUD Operations
├─────────────────────────────────────┤
│    models.py (Data Models)          │  ← SQLAlchemy ORM Models
├─────────────────────────────────────┤
│   database.py (DB Connection)       │  ← Database Engine & Session
└─────────────────────────────────────┘
```

### File Structure
```
backend/
├── main.py                  # FastAPI app, routes, endpoints
├── database.py              # Database connection and session management
├── models.py                # SQLAlchemy ORM models
├── schemas.py               # Pydantic schemas for validation
├── crud.py                  # CRUD operations and business logic
├── auth.py                  # Auth0 authentication and authorization
├── requirements.txt         # Python dependencies
├── Dockerfile              # Container configuration
├── migrate_*.py            # Database migration scripts
└── uploads/                # Image storage directory
```

---

## Database Connection

### Connection Management

**File**: `database.py`

```python
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./founders_crm.db")
```

### Database Configuration

1. **Environment-Based**:
   - Production: Uses `DATABASE_URL` from environment (PostgreSQL on Railway)
   - Local Development: Falls back to SQLite (`founders_crm.db`)

2. **Engine Creation**:
   ```python
   if DATABASE_URL.startswith("sqlite"):
       engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
   else:
       engine = create_engine(DATABASE_URL)
   ```
   
   - SQLite: Requires `check_same_thread=False` for FastAPI async compatibility
   - PostgreSQL: No special connection args needed

3. **Session Management**:
   ```python
   SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
   ```
   - Uses dependency injection pattern
   - Each request gets its own session
   - Automatic cleanup after request completion

4. **Dependency Injection** (from `main.py`):
   ```python
   def get_db():
       db = database.SessionLocal()
       try:
           yield db
       finally:
           db.close()
   ```

### Database Initialization

**Automatic Table Creation**:
```python
# main.py line 63
models.Base.metadata.create_all(bind=database.engine)
```
- Tables are created automatically on application startup
- Uses SQLAlchemy's `declarative_base()` system
- Idempotent: won't recreate existing tables

### Supported Databases

| Environment | Database | URL Format |
|------------|----------|------------|
| Production | PostgreSQL | `postgresql://user:pass@host:port/db` |
| Development | SQLite | `sqlite:///./founders_crm.db` |

---

## Database Schema

### Entity Relationship Diagram

```
┌──────────────┐
│   Founder    │
├──────────────┤
│ id (PK)      │
│ name         │
│ email (UQ)   │───┐
│ bio          │   │
│ location     │   │
│ linkedin_url │   │
│ twitter_url  │   │
│ github_url   │   │
│ profile_img  │   │
│ visible      │   │
│ auth0_user_id│(UQ)
│ startup_id   │───┼──────────┐
└──────────────┘   │          │
       │           │          │
       │ M:N       │ 1:N      │ N:1
       │           │          │
┌──────▼──────┐   │   ┌──────▼──────┐
│   Skill     │   │   │ HelpRequest │
├─────────────┤   │   ├─────────────┤
│ id (PK)     │   │   │ id (PK)     │
│ name (UQ)   │   │   │ founder_id  │
│ category    │   │   │ title       │
│ description │   │   │ description │
└─────────────┘   │   │ category    │
                  │   │ urgency     │
       │ M:N      │   │ status      │
       │          │   └─────────────┘
┌──────▼──────┐   │
│   Hobby     │   │
├─────────────┤   │          ┌─────────────┐
│ id (PK)     │   │          │   Startup   │
│ name (UQ)   │   └──────────┤─────────────┤
│ category    │              │ id (PK)     │
│ description │              │ name        │
└─────────────┘              │ description │
                             │ industry    │
┌─────────────┐              │ stage       │
│   Event     │              │ website_url │
├─────────────┤              │ target_mkt  │
│ id (PK)     │              │ revenue_arr │
│ title       │              └─────────────┘
│ description │
│ date_time   │
│ location    │
│ attendees   │
│ theme       │
│ link        │
└─────────────┘
```

### Tables

#### 1. **Founder** (Main Entity)
**Table**: `founders`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | Integer | PK, Auto-increment | Unique identifier |
| `name` | String(100) | NOT NULL | Founder's full name |
| `email` | String(100) | UNIQUE, NOT NULL | Contact email |
| `bio` | Text | Nullable | Biography/description |
| `location` | String(100) | Nullable | Geographic location |
| `linkedin_url` | String(200) | NOT NULL | LinkedIn profile (required) |
| `twitter_url` | String(200) | Nullable | Twitter/X profile |
| `github_url` | String(200) | Nullable | GitHub profile |
| `profile_image_url` | String(500) | Nullable | Profile picture URL |
| `profile_visible` | Boolean | DEFAULT True | Visibility toggle for admins |
| `auth0_user_id` | String(100) | UNIQUE, Nullable | Links to Auth0 account |
| `startup_id` | Integer | FK to startups | Current startup (nullable) |
| `created_at` | DateTime | AUTO | Creation timestamp |
| `updated_at` | DateTime | AUTO | Last update timestamp |

**Relationships**:
- Many-to-Many with `Skill` (via `founder_skills`)
- Many-to-Many with `Hobby` (via `founder_hobbies`)
- One-to-Many with `HelpRequest`
- Many-to-One with `Startup`

#### 2. **Skill**
**Table**: `skills`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | Integer | PK | Unique identifier |
| `name` | String(100) | UNIQUE, NOT NULL | Skill name |
| `category` | String(50) | Nullable | e.g., "Technical", "Marketing" |
| `description` | Text | Nullable | Skill description |
| `created_at` | DateTime | AUTO | Creation timestamp |

**Categories**: Technical, Marketing, Business, etc.

#### 3. **Startup**
**Table**: `startups`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | Integer | PK | Unique identifier |
| `name` | String(100) | NOT NULL | Company name |
| `description` | Text | Nullable | What the company does |
| `industry` | String(100) | Nullable | Industry sector |
| `stage` | String(50) | Nullable | e.g., "Seed", "Series A" |
| `website_url` | String(200) | Nullable | Company website |
| `target_market` | String(200) | Nullable | Target customer segment |
| `revenue_arr` | String(100) | Nullable | Annual recurring revenue |
| `created_at` | DateTime | AUTO | Creation timestamp |
| `updated_at` | DateTime | AUTO | Last update timestamp |

**Stages**: Idea, MVP, Seed, Series A, Series B+, etc.

#### 4. **HelpRequest**
**Table**: `help_requests`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | Integer | PK | Unique identifier |
| `founder_id` | Integer | FK, NOT NULL | Request creator |
| `title` | String(200) | NOT NULL | Request title |
| `description` | Text | NOT NULL | Detailed description |
| `category` | String(50) | Nullable | e.g., "Technical", "Funding" |
| `urgency` | String(20) | Nullable | Low, Medium, High |
| `status` | String(20) | DEFAULT "Open" | Open, In Progress, Resolved |
| `created_at` | DateTime | AUTO | Creation timestamp |
| `updated_at` | DateTime | AUTO | Last update timestamp |

#### 5. **Hobby**
**Table**: `hobbies`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | Integer | PK | Unique identifier |
| `name` | String(100) | UNIQUE, NOT NULL | Hobby name |
| `category` | String(50) | Nullable | Sports, Games, Arts, etc. |
| `description` | Text | Nullable | Hobby description |
| `created_at` | DateTime | AUTO | Creation timestamp |

**Categories**: Sports, Games, Arts, Outdoor, Indoor

#### 6. **Event**
**Table**: `events`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | Integer | PK | Unique identifier |
| `title` | String(200) | NOT NULL | Event title |
| `description` | Text | Nullable | Event details |
| `date_time` | DateTime | NOT NULL | Event date and time |
| `location` | String(200) | Nullable | Event location |
| `attendees` | Text | Nullable | Attendee list (text) |
| `theme` | String(50) | Nullable | hiking, poker, basketball, etc. |
| `link` | String(500) | Nullable | External event link (Luma, etc.) |
| `created_at` | DateTime | AUTO | Creation timestamp |
| `updated_at` | DateTime | AUTO | Last update timestamp |

#### 7. **Junction Tables** (Many-to-Many)

**founder_skills**:
- `founder_id` (FK to founders.id) - PK
- `skill_id` (FK to skills.id) - PK

**founder_hobbies**:
- `founder_id` (FK to founders.id) - PK
- `hobby_id` (FK to hobbies.id) - PK

---

## API Endpoints

### Public Endpoints (No Auth Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Root endpoint with API info |
| GET | `/health` | Health check |
| GET | `/uploads/{filename}` | Serve uploaded images (with CORS) |

### Founder Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/founders/` | ✅ | Create new founder |
| GET | `/founders/` | ❌ | List all founders (paginated) |
| GET | `/founders/{id}` | ❌ | Get specific founder |
| PUT | `/founders/{id}` | ❌* | Update founder |
| DELETE | `/founders/{id}` | ✅ Admin | Delete founder |
| POST | `/founders/upload-csv` | ✅ Admin | Bulk import founders from CSV |

*Note: Update likely should require auth based on profile ownership

### Skill Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/skills/` | ❌* | Create skill |
| GET | `/skills/` | ❌ | List skills |
| GET | `/skills/{id}` | ❌ | Get skill |
| PUT | `/skills/{id}` | ❌* | Update skill |
| DELETE | `/skills/{id}` | ❌* | Delete skill |

*Note: These should probably require auth

### Startup Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/startups/` | ❌* | Create startup |
| GET | `/startups/` | ❌ | List startups |
| GET | `/startups/{id}` | ❌ | Get startup |
| GET | `/startups/{id}/founders` | ❌ | Get startup's founders |
| PUT | `/startups/{id}` | ❌* | Update startup |
| DELETE | `/startups/{id}` | ❌* | Delete startup |

### Help Request Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/help-requests/` | ❌* | Create help request |
| GET | `/help-requests/` | ❌ | List help requests |
| GET | `/help-requests/{id}` | ❌ | Get help request |
| PUT | `/help-requests/{id}` | ❌* | Update help request |
| DELETE | `/help-requests/{id}` | ❌* | Delete help request |

### Hobby Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/hobbies/` | ❌* | Create hobby |
| GET | `/hobbies/` | ❌ | List hobbies |
| GET | `/hobbies/{id}` | ❌ | Get hobby |
| PUT | `/hobbies/{id}` | ❌* | Update hobby |
| DELETE | `/hobbies/{id}` | ❌* | Delete hobby |

### Event Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/events/` | ✅ | Create event |
| GET | `/events/` | ❌ | List events |
| GET | `/events/{id}` | ❌ | Get event |
| PUT | `/events/{id}` | ✅ | Update event |
| DELETE | `/events/{id}` | ✅ | Delete event |

### Authentication Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/protected` | ✅ | Test authentication |
| POST | `/auth/check-profile` | ✅ | Check/link user profile |
| GET | `/api/my-profile` | ✅ | Get current user's profile |
| POST | `/api/claim-profile/{id}` | ✅ | Claim unclaimed profile |

### Admin/Debug Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/upload-image/` | ✅ | Upload profile image |
| GET | `/admin/image-storage-info` | ❌* | Image storage documentation |
| GET | `/debug/check-email/{email}` | ✅ | Debug email lookup |

---

## Authentication & Authorization

### Auth0 Integration

**File**: `auth.py`

#### Configuration
```python
AUTH0_DOMAIN = os.getenv("AUTH0_DOMAIN", "dev-example.auth0.com")
AUTH0_AUDIENCE = os.getenv("AUTH0_AUDIENCE", "http://localhost:8000")
AUTH0_ALGORITHMS = ["RS256"]
```

#### JWT Verification Process

1. **Bearer Token Extraction**:
   - Uses FastAPI's `HTTPBearer` security scheme
   - Token extracted from `Authorization: Bearer <token>` header

2. **JWKS Key Retrieval**:
   ```python
   jwks_url = f"https://{AUTH0_DOMAIN}/.well-known/jwks.json"
   ```
   - Fetches public keys from Auth0
   - Matches key ID (`kid`) from token header

3. **Token Verification**:
   - Validates signature using RSA public key
   - Verifies `audience`, `issuer`, and expiration
   - Returns decoded JWT payload

4. **User Information**:
   - Primary: Email from JWT claims
   - Fallback: Fetch from Auth0 UserInfo endpoint
   - Returns: `{ sub, email, ... }` payload

#### Dependencies

**Required Authentication**:
```python
def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    token = credentials.credentials
    payload = auth0_bearer.verify_jwt(token)
    return payload
```

**Optional Authentication**:
```python
def get_current_user_optional(credentials: Optional[...] = Depends(security)) -> Optional[dict]:
    # Returns None if no token provided
```

### Authorization Levels

#### 1. **Public** (No Auth)
- View founders, skills, startups, etc.
- Health check and basic info

#### 2. **Authenticated User**
- Create/update own profile
- Upload images
- Create events and help requests
- Claim profile by email match

#### 3. **Admin Users**
Hardcoded in `auth.py`:
```python
ADMIN_EMAILS = [
    'admin@scrappyfounders.com',
    'derekchen14@gmail.com', 
    'denis.beliauski@gmail.com'
]
```

**Admin Functions**:
```python
def is_admin_user(user_email: str) -> bool:
    return user_email.lower() in [email.lower() for email in ADMIN_EMAILS]

def get_admin_user(current_user: dict = Depends(get_current_user)) -> dict:
    if not is_admin_user(current_user.get('email', '')):
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return current_user
```

**Admin Capabilities**:
- Delete founders (with cascade)
- Bulk import founders from CSV
- Edit any profile
- Full CRUD on all entities

### Profile Linking System

**Flow**:
1. User logs in with Auth0 → receives JWT
2. Backend checks `/auth/check-profile`:
   - Look for `auth0_user_id` match (already linked)
   - Look for email match with no `auth0_user_id` (unlinked)
   - Auto-link if email matches
3. If no profile exists → user creates new profile
4. `auth0_user_id` stored in founder record for future auth

**Key Functions** (from `crud.py`):
```python
get_founder_by_auth0_user_id(db, auth0_user_id)
get_unclaimed_founder_by_email(db, email)  
claim_founder_profile(db, founder_id, auth0_user_id)
```

---

## File Storage

### Image Upload System

**Endpoint**: `POST /upload-image/`

#### Storage Configuration
```python
UPLOAD_DIR = Path("uploads")  # Local directory
UPLOAD_DIR.mkdir(exist_ok=True)
```

#### Upload Process

1. **Validation**:
   ```python
   if not file.content_type.startswith("image/"):
       raise HTTPException(status_code=400, detail="File must be an image")
   ```

2. **Filename Generation**:
   ```python
   file_extension = file.filename.split(".")[-1]
   unique_filename = f"{uuid.uuid4()}.{file_extension}"
   ```
   - Uses UUID v4 for uniqueness
   - Preserves original file extension

3. **Storage**:
   ```python
   file_path = UPLOAD_DIR / unique_filename
   with open(file_path, "wb") as buffer:
       content = await file.read()
       buffer.write(content)
   ```

4. **Response**:
   ```python
   return {"image_url": f"/uploads/{unique_filename}"}
   ```
   - Returns relative path
   - Frontend prepends API base URL

#### Serving Images

**Endpoint**: `GET /uploads/{filename}`

**Custom Implementation** (Not StaticFiles):
```python
@app.get("/uploads/{filename}")
async def serve_uploaded_file(filename: str):
    file_path = UPLOAD_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(
        path=file_path,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET",
            "Access-Control-Allow-Headers": "*",
        }
    )
```

**Why Custom Endpoint?**
- CORS headers needed for frontend access
- `StaticFiles` doesn't allow custom headers easily
- Better error handling

### Image Storage Documentation

**Endpoint**: `GET /admin/image-storage-info`

Provides:
- Upload process documentation
- Files on disk vs. database records
- Founder profiles with images
- Storage location details
- Debugging information

---

## Data Operations (CRUD)

**File**: `crud.py`

### Design Pattern

All CRUD operations follow a consistent pattern:

```python
# CREATE
def create_entity(db: Session, entity: schemas.EntityCreate):
    db_entity = models.Entity(**entity.model_dump())
    db.add(db_entity)
    db.commit()
    db.refresh(db_entity)
    return db_entity

# READ (Single)
def get_entity(db: Session, entity_id: int):
    return db.query(models.Entity).filter(models.Entity.id == entity_id).first()

# READ (Multiple)
def get_entities(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Entity).offset(skip).limit(limit).all()

# UPDATE
def update_entity(db: Session, entity_id: int, entity: schemas.EntityCreate):
    db_entity = get_entity(db, entity_id)
    if db_entity:
        for key, value in entity.model_dump().items():
            setattr(db_entity, key, value)
        db.commit()
        db.refresh(db_entity)
    return db_entity

# DELETE
def delete_entity(db: Session, entity_id: int):
    db_entity = get_entity(db, entity_id)
    if db_entity:
        db.delete(db_entity)
        db.commit()
    return db_entity
```

### Special Operations

#### 1. **Founder with Relationships**

**Create**:
```python
def create_founder(db: Session, founder: schemas.FounderCreate):
    # Create founder
    db_founder = models.Founder(...)
    db.add(db_founder)
    db.commit()
    
    # Add skills (many-to-many)
    if founder.skill_ids:
        skills = db.query(models.Skill).filter(models.Skill.id.in_(founder.skill_ids)).all()
        db_founder.skills = skills
        db.commit()
    
    # Add hobbies (many-to-many)
    if founder.hobby_ids:
        hobbies = db.query(models.Hobby).filter(models.Hobby.id.in_(founder.hobby_ids)).all()
        db_founder.hobbies = hobbies
        db.commit()
    
    return db_founder
```

**Update** (handles relationship changes):
```python
def update_founder(...):
    # Update scalar fields
    for key, value in founder.model_dump(exclude={'skill_ids', 'startup_id', 'hobby_ids'}).items():
        setattr(db_founder, key, value)
    
    # Update startup_id
    db_founder.startup_id = founder.startup_id
    
    # Replace skills
    if founder.skill_ids is not None:
        skills = db.query(models.Skill).filter(...).all()
        db_founder.skills = skills
    
    # Replace hobbies
    if founder.hobby_ids is not None:
        hobbies = db.query(models.Hobby).filter(...).all()
        db_founder.hobbies = hobbies
```

#### 2. **CSV Bulk Import**

**Function**: `create_founders_from_csv(db, csv_input)`

**Features**:
- Decodes UTF-8-sig or Latin-1
- Flexible LinkedIn URL extraction
- Auto-creates skills, hobbies, startups
- Per-row error handling with rollback
- Returns success count + error list

**CSV Column Mapping**:
```python
COL_NAME = "name"
COL_EMAIL = "email"
COL_TWITTER = "twitter url"
COL_LOCATION = "location"
COL_HOBBY = "one thing you love doing outside your startup?"
COL_HELP_OFFERED = "one thing you can help with..."
COL_HELP_WANTED = "something you want other founders to help you with?"
COL_STARTUP_NAME = "startup name"  # Optional
```

**LinkedIn Extraction**:
1. Check columns with "linkedin" in name
2. Fallback: search all values for "linkedin.com"
3. Normalize URL (add https:// if missing)

**Error Handling**:
```python
try:
    created = create_founder(db, founder_data)
    created_founders.append(created)
except Exception as e:
    db.rollback()  # Don't block subsequent rows
    errors.append(f"Row {rownum}: {e}")
```

#### 3. **Helper Functions**

**Get or Create Pattern**:
```python
def get_or_create_skill(db: Session, skill_name: str) -> models.Skill:
    skill = db.query(models.Skill).filter(models.Skill.name.ilike(skill_name)).first()
    if not skill:
        skill = create_skill(db, schemas.SkillCreate(name=skill_name))
    return skill
```

Similarly for:
- `get_or_create_hobby()`
- `get_or_create_startup()`

### Transaction Management

- **Implicit transactions**: Each CRUD function commits
- **Explicit rollback**: CSV import on row errors
- **Session lifecycle**: Managed by FastAPI dependency injection
- **No nested transactions**: Each operation is atomic

---

## Deployment

### Production Environment

**Platform**: Railway (Backend) + Netlify (Frontend)

#### Backend (Railway)

**Database**: PostgreSQL (auto-provisioned by Railway)

**Environment Variables**:
```bash
DATABASE_URL=postgresql://...  # Auto-provided by Railway
AUTH0_DOMAIN=dev-aj7n76ab551kb76m.us.auth0.com
AUTH0_AUDIENCE=https://scrappykb-production.up.railway.app
AUTH0_ALGORITHMS=RS256
```

**Deployment**:
- Auto-deploy on git push to `master`
- Docker container from `Dockerfile`
- Port: Dynamic via `${PORT}` env var (Railway provides)

**Dockerfile**:
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ .
EXPOSE 8080
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}"]
```

**Database Migration**:
- Automatic table creation on startup
- `models.Base.metadata.create_all(bind=engine)`
- Manual migrations for schema changes (migrate_*.py scripts)

#### Local Development

**Database**: SQLite (`founders_crm.db`)

**Setup**:
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8080
```

**Environment**:
```bash
# .env file
DATABASE_URL=sqlite:///./founders_crm.db
AUTH0_DOMAIN=dev-aj7n76ab551kb76m.us.auth0.com
AUTH0_AUDIENCE=http://localhost:8000
AUTH0_ALGORITHMS=RS256
```

### Migration Scripts

**Purpose**: Handle schema changes without data loss

#### 1. **migrate_linkedin_not_null.py**
- Makes `linkedin_url` NOT NULL
- Deletes founders with empty LinkedIn
- Recreates table with new constraint (SQLite limitation)

#### 2. **migrate_startup_fields.py**
- Removes: `team_size`, `location`
- Adds: `target_market`, `revenue_arr`
- Preserves existing startup data

#### 3. **migrate_startup_relationship.py**
- Converts: Many-to-Many → One-to-One (Founder ↔ Startup)
- Migrates `startup_founders` table data
- Adds `startup_id` column to founders
- Drops `startup_founders` junction table

**Usage**:
```bash
python migrate_linkedin_not_null.py
python migrate_startup_fields.py
python migrate_startup_relationship.py
```

---

## Key Features

### 1. **CORS Configuration**
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Production should restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 2. **Pagination**
```python
@app.get("/founders/")
def read_founders(skip: int = 0, limit: int = 10000, db: Session = Depends(get_db)):
    return crud.get_founders(db, skip=skip, limit=limit)
```
- Default limit: varies by endpoint (100-10000)
- Offset-based pagination

### 3. **Cascade Delete**
```python
# main.py - Delete founder endpoint
help_requests = db.query(models.HelpRequest).filter(
    models.HelpRequest.founder_id == founder_id
).all()
for help_request in help_requests:
    db.delete(help_request)

deleted_founder = crud.delete_founder(db, founder_id)
```
- Manually deletes help requests before founder
- Many-to-many relationships auto-cleaned by SQLAlchemy

### 4. **Case-Insensitive Email Lookup**
```python
db.query(models.Founder).filter(models.Founder.email.ilike(email)).first()
```
- Uses `.ilike()` for case-insensitive matching
- Important for email-based profile lookup

### 5. **Error Handling**
```python
try:
    return crud.create_founder(db=db, founder=founder)
except Exception as e:
    error_str = str(e)
    if "UNIQUE constraint failed" in error_str:
        if "email" in error_str.lower():
            raise HTTPException(status_code=400, detail="Email already exists")
        elif "auth0_user_id" in error_str.lower():
            raise HTTPException(status_code=400, detail="Account already linked")
```
- Database-specific error parsing
- User-friendly error messages

### 6. **Profile Visibility Toggle**
```python
# models.py
profile_visible = Column(Boolean, default=True, nullable=False)
```
- Admin can hide/show founder profiles
- Useful for managing active/inactive members

### 7. **Debug Endpoints**
- `/debug/check-email/{email}`: Email lookup diagnostics
- `/admin/image-storage-info`: Image storage state
- Logging throughout for troubleshooting

---

## Technical Stack

### Core Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| **fastapi** | 0.104.1 | Web framework |
| **uvicorn** | 0.24.0 | ASGI server |
| **sqlalchemy** | 2.0.23 | ORM & database toolkit |
| **psycopg2-binary** | 2.9.9 | PostgreSQL adapter |
| **alembic** | 1.13.1 | Database migrations (not actively used) |
| **python-dotenv** | 1.0.0 | Environment variable management |
| **pydantic** | 2.5.0 | Data validation |
| **python-multipart** | 0.0.6 | File upload support |
| **email-validator** | 2.1.0 | Email validation |
| **python-jose** | 3.5.0 | JWT handling (Auth0) |
| **requests** | 2.31.0 | HTTP client (JWKS, UserInfo) |

### Python Version
- **Required**: Python 3.11+
- Uses modern type hints and async features

### Key Libraries

#### FastAPI Features Used
- Dependency injection (`Depends`)
- Path/query parameter validation
- Request/response models (Pydantic)
- File uploads (`UploadFile`)
- Exception handling (`HTTPException`)
- Middleware (CORS)

#### SQLAlchemy Features
- Declarative Base ORM
- Relationships (One-to-Many, Many-to-Many)
- Query API
- Session management
- Multi-database support (SQLite/PostgreSQL)

#### Auth0 Integration
- JWT verification with JWKS
- RS256 signature validation
- UserInfo endpoint integration
- Bearer token authentication

---

## Critical Assessment

### What Actually Works
✅ Basic CRUD operations function  
✅ Auth0 JWT verification is implemented  
✅ Database connection works (SQLite/PostgreSQL)  
✅ CSV import has some error handling  
✅ File upload technically works  

### Critical Issues & Code Smells

#### 🔴 **SECURITY VULNERABILITIES**

1. **NO AUTHORIZATION ON CRITICAL ENDPOINTS**
   ```python
   # Anyone can modify ANY founder profile!
   @app.put("/founders/{founder_id}", response_model=schemas.Founder)
   def update_founder(founder_id: int, founder: schemas.FounderCreate, db: Session = Depends(get_db)):
       # NO AUTH CHECK - anyone can edit anyone's profile!
   ```
   - `/founders/{id}` PUT - No auth required to modify profiles!
   - All skill/hobby/startup endpoints - No auth at all
   - Help requests - Anyone can create/modify/delete

2. **CORS MISCONFIGURATION**
   ```python
   allow_origins=["*"]  # Production accepts requests from ANYWHERE
   allow_credentials=True  # With credentials! Major security risk!
   ```

3. **HARDCODED ADMIN EMAILS**
   ```python
   ADMIN_EMAILS = ['admin@scrappyfounders.com', 'derekchen14@gmail.com', ...]
   ```
   - Requires code deployment to change admins
   - No proper role management
   - Auth0 has built-in RBAC but it's not used

4. **IMAGE SERVING WITHOUT VALIDATION**
   - No file type validation during serving
   - Path traversal potential with `/uploads/{filename}`
   - No access control on uploaded images

#### 🔴 **ARCHITECTURAL PROBLEMS**

1. **MONOLITHIC GOD FILE**
   - `main.py`: 604 lines with ALL routes
   - No route separation by domain/feature
   - Violates single responsibility principle

2. **NO PROPER LAYERING**
   ```
   What it claims:  API → Service → Repository → Database
   What it is:      API → CRUD functions → Database
   ```
   - No service layer (business logic mixed everywhere)
   - No repository pattern (CRUD is just thin SQLAlchemy wrapper)
   - Validation scattered between routes, schemas, and CRUD

3. **INCONSISTENT ERROR HANDLING**
   ```python
   # Some endpoints:
   if not founder:
       raise HTTPException(status_code=404, detail="Founder not found")
   
   # Other endpoints:
   return updated_founder  # Could be None!
   ```

4. **TRANSACTION MANAGEMENT CHAOS**
   ```python
   def create_founder(db, founder):
       db.add(db_founder)
       db.commit()  # First commit
       
       db_founder.skills = skills
       db.commit()  # Second commit
       
       db_founder.hobbies = hobbies
       db.commit()  # Third commit!
   ```
   - Multiple commits for single operation
   - If hobby assignment fails, founder exists with partial data
   - No rollback strategy

5. **MIGRATION DISASTER**
   ```python
   # Alembic installed but not used
   # Manual migration scripts that:
   # - Only work with SQLite
   # - Recreate entire tables
   # - Don't handle production PostgreSQL
   ```

#### 🔴 **DATABASE DESIGN ISSUES**

1. **TEXT FIELDS FOR STRUCTURED DATA**
   ```python
   attendees = Column(Text)  # Should be a relationship table!
   ```

2. **NULLABLE FOREIGN KEYS EVERYWHERE**
   ```python
   startup_id = Column(Integer, ForeignKey('startups.id'), nullable=True)
   founder_id = Column(Integer, ForeignKey('founders.id'), nullable=False)
   ```
   - Inconsistent nullable patterns
   - `auth0_user_id` nullable but required for auth

3. **NO INDEXES**
   - Only primary keys indexed
   - No index on `email`, `auth0_user_id` (frequently queried)
   - No composite indexes for joins

4. **STRING-BASED ENUMS**
   ```python
   status = Column(String(20), default="Open")  # Should be proper Enum
   urgency = Column(String(20))  # Typos possible
   ```

#### 🔴 **CODE QUALITY ISSUES**

1. **DUPLICATE LOGIC**
   ```python
   # Check profile endpoint
   existing_by_email = db.query(models.Founder).filter(models.Founder.email == user_email).first()
   
   # Claim profile endpoint  
   founder = crud.get_founder(db, founder_id)
   if founder.email.lower() != user_email.lower():
       raise HTTPException(...)
   
   # CSV import
   if db.query(models.Founder).filter(models.Founder.email.ilike(founder_email)).first():
   ```
   - Email lookup logic repeated 10+ times
   - Case sensitivity handled inconsistently (==, .lower(), .ilike())

2. **NO DEPENDENCY INJECTION FOR SERVICES**
   - Auth logic directly in routes
   - No testable service boundaries
   - Tight coupling everywhere

3. **MIXED CONCERNS**
   ```python
   @app.post("/founders/")
   def create_founder(founder: schemas.FounderCreate, ...):
       print(f"Creating founder...")  # Debugging
       print(f"Current user: {current_user}")  # Debugging
       
       # Only set auth0_user_id from current user if...
       if not founder.auth0_user_id and current_user and founder.email == current_user.get('email'):
           founder.auth0_user_id = current_user.get('sub')  # Business logic
       
       return crud.create_founder(db=db, founder=founder)  # Data access
   ```

4. **NO LOGGING FRAMEWORK**
   ```python
   print(f"Looking for file: {file_path}")  # main.py
   print(f"Checking profile for user: {user_email}")  # main.py
   import logging
   logger = logging.getLogger(__name__)  # Only in ONE endpoint!
   ```

5. **UNUSED DEPENDENCIES**
   ```python
   # requirements.txt
   alembic==1.13.1  # Not used! Manual migrations instead
   ```

6. **CASCADE DELETE BY HAND**
   ```python
   # Instead of using SQLAlchemy's cascade
   help_requests = db.query(models.HelpRequest).filter(...).all()
   for help_request in help_requests:
       db.delete(help_request)
   deleted_founder = crud.delete_founder(db, founder_id)
   ```

#### 🔴 **API DESIGN PROBLEMS**

1. **INCONSISTENT CONVENTIONS**
   ```python
   GET  /founders/          # Plural
   GET  /api/my-profile     # Different prefix!
   POST /auth/check-profile # Another prefix!
   GET  /admin/image-storage-info  # Yet another!
   ```

2. **NO API VERSIONING**
   - Breaking changes = breaking all clients
   - No migration path

3. **PAGINATION INCONSISTENCY**
   ```python
   @app.get("/founders/")  # limit=10000 (why?)
   @app.get("/skills/")    # limit=100
   @app.get("/startups/")  # limit=1000
   ```

4. **NO REQUEST VALIDATION**
   - No max file size on uploads
   - No rate limiting
   - No request size limits

5. **RESPONSE INCONSISTENCY**
   ```python
   # Some endpoints return the object
   return {"message": "Skill deleted successfully"}
   
   # Others return a message
   return deleted_skill  # Could be None!
   ```

#### 🔴 **DEPLOYMENT & OPERATIONS**

1. **LOCAL FILE STORAGE IN PRODUCTION**
   ```python
   UPLOAD_DIR = Path("uploads")  # Lost on container restart!
   ```
   - Railway uses ephemeral containers
   - Uploaded images will disappear

2. **NO HEALTH CHECKS**
   ```python
   @app.get("/health")
   def health_check():
       return {"status": "healthy"}  # Doesn't check database!
   ```

3. **NO METRICS/MONITORING**
   - No request tracking
   - No error rate monitoring
   - No performance metrics

4. **ENVIRONMENT VARIABLES**
   ```python
   AUTH0_DOMAIN = os.getenv("AUTH0_DOMAIN", "dev-example.auth0.com")  # Dangerous default
   ```

5. **NO GRACEFUL SHUTDOWN**
   - Database connections not closed properly on shutdown
   - In-flight requests not handled

#### 🔴 **TESTING**

- **NO TESTS AT ALL**
- No unit tests
- No integration tests
- No API tests
- No test fixtures
- Manual testing only

---

## Honest Summary

### What This Really Is

This is a **prototype/MVP** that grew organically without planning. It has:
- ❌ No proper architecture (just FastAPI defaults)
- ❌ No security layer (auth checks randomly applied)
- ❌ No service layer (thin CRUD wrapper)
- ❌ No testing
- ❌ No proper error handling
- ❌ No logging strategy
- ❌ No deployment strategy for file storage
- ❌ Multiple critical security vulnerabilities

### Immediate Security Fixes Needed

1. **Add auth to ALL write endpoints**
2. **Implement proper authorization** (user can only edit own profile)
3. **Fix CORS configuration** (whitelist specific origins)
4. **Move file storage to S3/Cloudinary**
5. **Add request validation and rate limiting**
6. **Fix transaction management** (single commit per operation)

### Architectural Refactoring Needed

1. **Separate routes** into feature modules (founders/, startups/, etc.)
2. **Create service layer** for business logic
3. **Implement repository pattern** properly
4. **Add proper logging** (structured logging with context)
5. **Use Alembic** for real migrations
6. **Add comprehensive tests**
7. **Implement proper error handling** middleware
8. **Add API versioning** (/api/v1/)

### Positive Notes

- It works for a small community (< 100 users)
- SQLAlchemy ORM is correctly used (mostly)
- Pydantic validation is in place
- Auth0 integration is functional
- CSV import has decent error handling

**Bottom Line**: This is a working prototype that needs a complete refactor before scaling or adding more features. It's not "clean architecture" - it's a typical MVP that accumulated technical debt.  

### Database Design Notes
- **One-to-One Founder-Startup**: Was previously Many-to-Many, migrated
- **auth0_user_id**: Nullable to support admin-created profiles
- **profile_visible**: Boolean flag for soft-hiding profiles
- **LinkedIn required**: Makes sense for professional network
- **Text-based attendees**: Events use text field instead of proper relationship

---

**Generated**: 2025-10-12  
**Project**: Scrappy Founders Knowledge Base  
**Backend Version**: FastAPI 0.104.1  
**Database**: PostgreSQL (Production) / SQLite (Development)


