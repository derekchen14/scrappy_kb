# 🚀 Production Setup Guide

This guide will help you get the Scrappy Founders Knowledge Base running in production.

**Note**: This application is already configured for deployment to Railway (backend) and Netlify (frontend) with PostgreSQL database.

## ✅ Pre-Requirements

- Node.js 16+ and npm
- Python 3.8+ and pip
- Auth0 account (free tier works)
- Railway account (for backend + PostgreSQL)
- Netlify account (for frontend)

## 🔧 Step 1: Backend Setup

### 1.1 Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 1.2 Configure Environment
Create `backend/.env` for local development:
```bash
# Database (local development)
DATABASE_URL=sqlite:///./founders_crm.db

# Auth0 Configuration (replace with your values)
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_AUDIENCE=https://your-api-domain.com
AUTH0_ALGORITHMS=RS256
```

**For Railway Production:**
Railway will automatically provide PostgreSQL via `DATABASE_URL` environment variable.
Set these environment variables in Railway dashboard:
- `AUTH0_DOMAIN`
- `AUTH0_AUDIENCE` 
- `AUTH0_ALGORITHMS=RS256`

### 1.3 Test Backend
```bash
# From project root
python test_auth0.py

# Start backend
cd backend
uvicorn main:app --reload --port 8000
```

Backend should be running at http://localhost:8000

## 🎨 Step 2: Frontend Setup

### 2.1 Install Dependencies
```bash
cd frontend
npm install
```

### 2.2 Configure Environment
Create `frontend/.env` for local development:
```bash
# Auth0 Configuration (replace with your values)
REACT_APP_AUTH0_DOMAIN=your-tenant.auth0.com
REACT_APP_AUTH0_CLIENT_ID=your-spa-client-id
REACT_APP_AUTH0_AUDIENCE=https://your-api-domain.com
```

**For Netlify Production:**
Set these environment variables in Netlify dashboard:
- `REACT_APP_AUTH0_DOMAIN`
- `REACT_APP_AUTH0_CLIENT_ID`
- `REACT_APP_AUTH0_AUDIENCE`

### 2.3 Test Frontend
```bash
cd frontend
npm start
```

Frontend should be running at http://localhost:3000

## 🔐 Step 3: Auth0 Setup

### 3.1 Create Auth0 Application (SPA)
1. Go to [Auth0 Dashboard](https://manage.auth0.com)
2. Create new **Single Page Application**
3. Configure:
   - **Allowed Callback URLs**: `http://localhost:3000` (or your domain)
   - **Allowed Logout URLs**: `http://localhost:3000` (or your domain)
   - **Allowed Web Origins**: `http://localhost:3000` (or your domain)

### 3.2 Create Auth0 API
1. Go to **APIs** in Auth0 Dashboard
2. Create new API:
   - **Name**: Scrappy KB API
   - **Identifier**: `https://your-api-domain.com` (or `http://localhost:8000` for local)
   - **Signing Algorithm**: RS256

### 3.3 Update Environment Files
Replace placeholders with your actual Auth0 values from the dashboard.

## 🔧 Step 4: Admin Setup

### 4.1 Configure Admin Emails
The admin emails are already configured:

**Backend**: `backend/auth.py`
```python
ADMIN_EMAILS = [
    'admin@scrappyfounders.com',
    'derekchen14@gmail.com', 
    'denis.beliauski@gmail.com'
]
```

**Frontend**: `frontend/src/utils/admin.ts`
```typescript
const ADMIN_EMAILS = [
  'admin@scrappyfounders.com',
  'derekchen14@gmail.com',
  'denis.beliauski@gmail.com'
];
```

These emails will have admin privileges including access to the admin dashboard, user management, and advanced controls.

## 🧪 Step 5: Testing

### 5.1 Test Authentication Flow
1. Open http://localhost:3000
2. You should see the login screen
3. Click "Log In" - it should redirect to Auth0
4. Create an account or log in
5. You should be redirected back to the app

### 5.2 Test Admin Functionality
1. Log in with one of the admin emails
2. You should see an "Admin" tab in the navigation
3. Click the Admin tab to see the dashboard with statistics
4. Test profile visibility toggles and user management

### 5.3 Test CRUD Operations
1. Try creating a new founder profile
2. Test editing your own profile
3. Test creating startups with the new field options
4. Test image upload functionality

## 🐛 Troubleshooting

### Common Issues:

**1. Auth0 Login Loop**
- Check that callback URLs match exactly in Auth0 settings
- Verify domain and client ID are correct

**2. API Authentication Errors**
- Ensure audience matches between frontend and backend
- Check that Auth0 domain is correctly configured

**3. Admin Features Not Working**
- Verify your email is in the ADMIN_EMAILS list
- Make sure you're logged in with the correct email
- Check browser console for errors

**4. Database Issues**
- Database is created automatically on first run
- Check that the backend directory is writable

## 📱 Features Available

### For All Users:
- ✅ View founders, skills, startups, help requests
- ✅ Edit own profile only
- ✅ Upload profile images
- ✅ Global search across all data
- ✅ Multiple view options (table, card, compact)

### For Admin Users:
- ✅ Admin dashboard with statistics
- ✅ Edit any user profile
- ✅ Delete users
- ✅ Toggle profile visibility
- ✅ User management interface

## 🎯 Production Deployment

This application is pre-configured for deployment:

### Railway Backend Deployment:
1. **Database**: PostgreSQL is automatically provisioned by Railway
2. **Environment Variables**: Set Auth0 config in Railway dashboard
3. **Deploy**: Connect GitHub repo to Railway for automatic deployments
4. **URL**: Railway will provide your backend API URL

### Netlify Frontend Deployment:
1. **Build Command**: `npm run build` (already configured)
2. **Environment Variables**: Set Auth0 config in Netlify dashboard  
3. **Deploy**: Connect GitHub repo to Netlify for automatic deployments
4. **URL**: Netlify will provide your frontend URL

### Auth0 Configuration:
Update your Auth0 application settings with production URLs:
- **Allowed Callback URLs**: `https://your-netlify-domain.com`
- **Allowed Logout URLs**: `https://your-netlify-domain.com`
- **API Audience**: `https://your-railway-domain.com`

### Database Migration:
The application will automatically create tables and relationships on first run with PostgreSQL.

The application is now ready for production use! 🚀