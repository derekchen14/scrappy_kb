# Backend Refactoring Structure

## New Folder Structure

```
backend/
├── features/                    # Feature-based organization
│   ├── __init__.py
│   ├── founders/
│   │   ├── __init__.py
│   │   └── router.py           # All founder-related endpoints
│   ├── skills/
│   │   ├── __init__.py
│   │   └── router.py           # All skill-related endpoints
│   ├── startups/
│   │   ├── __init__.py
│   │   └── router.py           # All startup-related endpoints
│   ├── help_requests/
│   │   ├── __init__.py
│   │   └── router.py           # All help request endpoints
│   ├── hobbies/
│   │   ├── __init__.py
│   │   └── router.py           # All hobby-related endpoints
│   ├── events/
│   │   ├── __init__.py
│   │   └── router.py           # All event-related endpoints
│   └── auth/
│       ├── __init__.py
│       └── router.py           # Auth, profile, image upload endpoints
├── common/                      # Shared code (models, CRUD)
│   └── __init__.py
├── models.py                    # SQLAlchemy models (will move to common/)
├── schemas.py                   # Pydantic schemas (will move to common/)
├── crud.py                      # CRUD operations (will move to common/)
├── database.py                  # Database connection (will move to common/)
├── auth.py                      # Auth utilities (will move to common/)
├── main.py                      # FastAPI app entry point (will be updated)
└── requirements.txt
```

## What Was Created

### Feature Routers

Each feature has its own router with:
- **Prefix**: Defines the base path (e.g., `/founders`, `/skills`)
- **Tags**: For API documentation grouping
- **Endpoints**: All CRUD operations for that feature
- **Dependencies**: Database session and auth dependencies

### Features Breakdown

1. **founders** (`/founders`)
   - POST `/` - Create founder (auth required)
   - POST `/upload-csv` - Bulk import (admin only)
   - GET `/` - List founders
   - GET `/{id}` - Get founder
   - PUT `/{id}` - Update founder (⚠️ no auth yet)
   - DELETE `/{id}` - Delete founder (admin only)
   - GET `/debug/check-email/{email}` - Debug endpoint

2. **skills** (`/skills`)
   - Standard CRUD operations
   - ⚠️ No auth requirements yet

3. **startups** (`/startups`)
   - Standard CRUD operations
   - GET `/{id}/founders` - Get startup's founders
   - ⚠️ No auth requirements yet

4. **help_requests** (`/help-requests`)
   - Standard CRUD operations
   - ⚠️ No auth requirements yet

5. **hobbies** (`/hobbies`)
   - Standard CRUD operations
   - ⚠️ No auth requirements yet

6. **events** (`/events`)
   - Standard CRUD operations
   - POST, PUT, DELETE require auth ✅

7. **auth** (root level)
   - GET `/uploads/{filename}` - Serve images
   - GET `/protected` - Test auth
   - POST `/upload-image/` - Upload image (auth required)
   - POST `/auth/check-profile` - Check/link profile (auth required)
   - GET `/api/my-profile` - Get current user profile (auth required)
   - POST `/api/claim-profile/{id}` - Claim profile (auth required)
   - GET `/admin/image-storage-info` - Image storage docs

## Current State

✅ **Completed:**
- Feature folders created
- All routers extracted from `main.py`
- Each router is self-contained with its endpoints
- Proper imports and dependencies in each router

⚠️ **Not Yet Done:**
- `main.py` still unchanged (needs to include these routers)
- `models.py`, `schemas.py`, `crud.py`, `database.py`, `auth.py` still in root (should move to `common/`)
- No shared dependencies file (get_db repeated in every router)
- Import paths use `sys.path.append` hack (temporary solution)

## Next Steps

1. Move common files to `common/` folder:
   - `models.py` → `common/models.py`
   - `schemas.py` → `common/schemas.py`
   - `crud.py` → `common/crud.py`
   - `database.py` → `common/database.py`
   - `auth.py` → `common/auth.py`

2. Create `common/dependencies.py`:
   - Move `get_db()` dependency
   - Centralize common dependencies

3. Update `main.py`:
   - Import all feature routers
   - Include them with `app.include_router()`
   - Keep health check and root endpoints
   - Remove old route definitions

4. Fix imports:
   - Remove `sys.path.append` hacks
   - Use proper relative imports
   - Update all import statements

5. Security fixes (from analysis):
   - Add auth requirements to all write endpoints
   - Implement proper authorization (users can only edit their own data)
   - Fix CORS configuration

## Benefits of New Structure

✅ **Separation of Concerns**: Each feature is isolated
✅ **Easier Navigation**: Find endpoints by feature, not by scrolling
✅ **Scalability**: New features don't bloat main.py
✅ **Testability**: Can test features in isolation
✅ **Team Work**: Different devs can work on different features
✅ **Clear Ownership**: Each feature has its own boundaries

## Migration Path

The old `main.py` still works. Once we:
1. Update `main.py` to use the new routers
2. Test everything works
3. Can delete the old route definitions from `main.py`

No breaking changes for the API consumers - all endpoints stay the same!

