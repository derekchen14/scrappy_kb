# 🚀 Deployment Configuration

This document contains the current deployment setup for the Scrappy Founders Knowledge Base.

## 🏗️ Current Infrastructure

### Backend - Railway
- **Service**: Railway
- **Repository**: `scrappy_kb` (GitHub)
- **Database**: PostgreSQL (automatically provisioned)
- **Runtime**: Python 3.11+ with FastAPI
- **Build**: Automatic from `requirements.txt`
- **Entry Point**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- **URL**: `https://scrappykb-production.up.railway.app`

### Frontend - Netlify  
- **Service**: Netlify
- **Repository**: `scrappy_kb` (GitHub)
- **Framework**: React with TypeScript
- **Build Command**: `npm run build`
- **Publish Directory**: `build/`
- **Node Version**: 16+
- **URL**: `https://scrappykb.netlify.app`

### Database - PostgreSQL
- **Provider**: Railway PostgreSQL
- **Connection**: Automatic via `DATABASE_URL` environment variable
- **Migration**: Auto-creates tables on first run using SQLAlchemy
- **Schema**: Defined in `backend/models.py`

## 🔐 Admin Configuration

### Admin Users (Hardcoded):
- `admin@scrappyfounders.com`
- `derekchen14@gmail.com`
- `denis.beliauski@gmail.com`

### Admin Files to Update:
- `backend/auth.py` - Line 17-21
- `frontend/src/utils/admin.ts` - Line 2-6

## 🌍 Environment Variables

### Railway (Backend):
```bash
DATABASE_URL=postgresql://... (auto-provided)
AUTH0_DOMAIN=dev-aj7n76ab551kb76m.us.auth0.com
AUTH0_AUDIENCE=https://scrappykb-production.up.railway.app
AUTH0_ALGORITHMS=RS256
```

### Netlify (Frontend):
```bash
REACT_APP_AUTH0_DOMAIN=dev-aj7n76ab551kb76m.us.auth0.com
REACT_APP_AUTH0_CLIENT_ID=os53h5vETvUvt7tUqTcYjTaEgd70fNLK
REACT_APP_AUTH0_AUDIENCE=https://scrappykb-production.up.railway.app
```

## 🔄 Deployment Process

### Automatic Deployment:
1. **Push to `scrappy_kb` GitHub repo** triggers automatic deploys
2. **Railway** builds and deploys backend from repo
3. **Netlify** builds and deploys frontend from repo to `scrappykb.netlify.app`
4. **Database migrations** run automatically on backend startup

### Manual Steps:
1. Update Auth0 settings with production URLs (`scrappykb.netlify.app`)
2. Set environment variables in Railway/Netlify dashboards
3. Verify database connection and table creation

## 🧪 Testing Production

### Health Checks:
- Backend: `https://scrappykb-production.up.railway.app/health`
- Frontend: `https://scrappykb.netlify.app`
- Auth: Login flow should redirect properly between sites

### Database Verification:
- Tables auto-created: founders, skills, startups, help_requests, hobbies
- Relationships established: many-to-many tables
- Admin emails can access admin dashboard

## 📁 Key Files

### Backend Configuration:
- `requirements.txt` - Dependencies
- `main.py` - FastAPI app entry point
- `auth.py` - Auth0 configuration and admin emails
- `models.py` - Database schema
- `database.py` - Database connection

### Frontend Configuration:
- `package.json` - Dependencies and build scripts
- `src/index.tsx` - Auth0Provider setup
- `src/utils/admin.ts` - Admin email configuration
- `src/hooks/useAuthenticatedAPI.ts` - API authentication

### Deployment Files:
- `backend/.env.example` - Environment template
- `frontend/.env.example` - Environment template
- `PRODUCTION_SETUP.md` - Setup instructions
- `AUTH0_SETUP.md` - Auth0 configuration guide

## 🚨 Important Notes

1. **Database**: Already using PostgreSQL in production (not SQLite)
2. **Admin Emails**: Currently configured for the specific admin users
3. **Authentication**: Full Auth0 integration with role-based access
4. **File Uploads**: Local storage with UUID naming (production-ready)
5. **CORS**: Configured for production domains

This configuration is production-ready and actively deployed.