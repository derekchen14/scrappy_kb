# Final Backend Architecture

## ✅ Complete Structure

```
backend/
├── main.py                    # NEW: Clean entry point (48 lines)
├── schemas.py                 # Still at root (used everywhere)
├── auth.py                    # Wrapper: imports from common.auth (backwards compat)
│
├── common/                    # ✅ NEW: Shared code
│   ├── __init__.py
│   ├── database.py            # NEW: Database config, Base, and get_db()
│   ├── auth.py                # NEW: Authentication utilities
│   ├── models/                # NEW: One file per table
│   │   ├── __init__.py
│   │   ├── founder.py
│   │   ├── skill.py
│   │   ├── startup.py
│   │   ├── help_request.py
│   │   ├── hobby.py
│   │   ├── event.py
│   │   ├── founder_skills.py      # Junction table
│   │   └── founder_hobbies.py     # Junction table
│   ├── crud_founders.py
│   ├── crud_skills.py
│   ├── crud_startups.py
│   ├── crud_help_requests.py
│   ├── crud_hobbies.py
│   └── crud_events.py
│
├── features/                  # ✅ Feature-based routers
│   ├── auth/
│   │   └── router.py          # Auth, uploads, profile endpoints
│   ├── founders/
│   │   └── router.py          # Founder CRUD
│   ├── skills/
│   │   └── router.py          # Skills CRUD
│   ├── startups/
│   │   └── router.py          # Startups CRUD
│   ├── help_requests/
│   │   └── router.py          # Help requests CRUD
│   ├── hobbies/
│   │   └── router.py          # Hobbies CRUD
│   └── events/
│       └── router.py          # Events CRUD
│
├── alembic/                   # ✅ Migrations
│   ├── versions/
│   ├── env.py
│   └── script.py.mako
├── alembic.ini
│
├── old_main.py                # OLD: 604 lines (reference only)
├── models.py                  # OLD: Monolithic (not used)
└── crud.py                    # OLD: Monolithic (if exists, not used)
```

## Import Patterns

### ✅ Correct Imports (NEW)

```python
# In features/*/router.py
from common import models
from common.auth import get_current_user, is_admin_user
from common.database import get_db
from common.crud_founders import create_founder, get_founder
import schemas

# In common/models/*.py
from common.database import Base
from sqlalchemy import Column, Integer, String, ...

# In common/crud_*.py
from common import models
import schemas

# In alembic/env.py
from common.database import Base
from common import models
```

### ❌ Old Imports (REMOVED)

```python
# ❌ NO MORE sys.path.append hacks
# ❌ NO MORE from auth import ...
# ✅ USE from common.auth import ...
```

## What's in `common/`?

### `common/database.py`
- Database engine configuration
- SessionLocal (session factory)
- Base (declarative base for models)
- **`get_db()` - Database session dependency**

### `common/auth.py`
- Auth0 JWT verification
- `get_current_user()` dependency
- `is_admin_user()` helper
- `get_admin_user()` dependency
- Admin email list

### `common/models/`
- One file per database table
- Each model is a separate module
- Association tables in separate files
- All exported via `__init__.py`

### `common/crud_*.py`
- CRUD operations organized by entity
- One file per main model
- Uses models from `common.models`

## Backwards Compatibility

### Root-level wrappers
- `auth.py` → Wrapper that imports from `common.auth` (for any legacy imports)
- `schemas.py` → Still at root (imported everywhere, can be moved to common/ later)

## Running the Application

### Development
```bash
cd backend
uvicorn main:app --reload
```

### Docker
```bash
docker-compose up
```

The Dockerfile sets `WORKDIR /app` and copies backend files there, so imports work correctly.

## Alembic Migrations

### Create Migration
```bash
docker exec scrappy_kb_app alembic revision --autogenerate -m "Description"
```

### Apply Migration
```bash
docker exec scrappy_kb_app alembic upgrade head
```

## Files Safe to Delete (After Testing)

- `backend/old_main.py` - Old 604-line main file (keep for reference)
- `backend/models.py` - Old monolithic models (not used)
- `backend/crud.py` - Old monolithic CRUD (if exists, not used)
- `backend/auth.py` - Can be deleted once you confirm no legacy imports (wrapper only)

## Key Improvements

✅ **No more sys.path.append hacks**
✅ **Clean separation of concerns**
✅ **Each table = one file**
✅ **Auth moved to common/auth.py**
✅ **Database config + get_db() in common/database.py**
✅ **No duplicate get_db() functions**
✅ **Feature-based routing**
✅ **Alembic migrations configured**
✅ **PostgreSQL required for migrations**
✅ **Proper Python package structure**

## Next Steps

1. Test the application
2. Run initial Alembic migration
3. Delete old files after confirming everything works
4. Consider moving `schemas.py` to `common/schemas.py` later

