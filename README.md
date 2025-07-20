# Scrappy Founders Knowledge Base

A comprehensive knowledge base and CRM system for founders communities with secure authentication and admin management.

## 🚀 Features

### Core Functionality:
- **Founders Management**: Comprehensive profiles with images, skills, hobbies, and startup associations
- **Skills Tracking**: Categorized skills with multi-select tagging
- **Startup Profiles**: Detailed startup information with predefined industry/stage options
- **Help Requests**: Community help system with categorization and status tracking
- **Global Search**: Search across all data types with real-time filtering

### Authentication & Security:
- **Auth0 Integration**: Secure login/logout with JWT token verification
- **Role-Based Access**: Admin users with enhanced privileges
- **Profile Permissions**: Users can only edit their own profiles (admins can edit any)
- **Protected Operations**: Write operations require authentication

### Admin Features:
- **Admin Dashboard**: Real-time statistics and user management
- **User Management**: Toggle profile visibility, delete users
- **Comprehensive Controls**: Edit any profile, manage all data
- **Statistics View**: User counts, profile visibility metrics

## 🛠️ Tech Stack

- **Frontend**: React with TypeScript + Auth0 SDK
- **Backend**: FastAPI with Auth0 JWT verification
- **Database**: PostgreSQL (Railway) with SQLAlchemy ORM
- **Authentication**: Auth0 with role-based access control
- **Deployment**: Netlify (frontend) + Railway (backend + PostgreSQL)

## 🏃 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 16+
- Auth0 account

### Setup Instructions
1. **Follow the complete setup guide**: See `PRODUCTION_SETUP.md`
2. **Test your setup**: Run `python test_auth0.py` from project root
3. **Start development**: Backend on :8000, Frontend on :3000

### Local Development Commands

**Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

**Frontend:**
```bash
cd frontend  
npm install
npm start
```

## API Endpoints

- `GET/POST /founders/` - List/Create founders
- `GET/PUT/DELETE /founders/{id}` - Get/Update/Delete founder
- `GET/POST /skills/` - List/Create skills
- `GET/PUT/DELETE /skills/{id}` - Get/Update/Delete skill
- `GET/POST /startups/` - List/Create startups
- `GET/PUT/DELETE /startups/{id}` - Get/Update/Delete startup
- `GET/POST /help-requests/` - List/Create help requests
- `GET/PUT/DELETE /help-requests/{id}` - Get/Update/Delete help request

## 🚀 Production Deployment

**This application is pre-configured for Railway + Netlify deployment.**

### Current Setup:
- **Backend**: Railway with PostgreSQL
- **Frontend**: Netlify with automatic builds
- **Database**: PostgreSQL automatically provisioned
- **Auth**: Auth0 integration with environment variables

### Deployment Process:
1. **Configure Auth0**: Set up Auth0 application and API
2. **Set Environment Variables**: Configure in Railway/Netlify dashboards
3. **Deploy**: Automatic deployment via GitHub integration
4. **Update Auth0**: Add production URLs to Auth0 settings

See `PRODUCTION_SETUP.md` for detailed deployment instructions.

## 🔐 Admin Access

### Admin Users:
- `admin@scrappyfounders.com`
- `derekchen14@gmail.com`
- `denis.beliauski@gmail.com`

### Admin Capabilities:
- Access admin dashboard with user statistics
- Edit any user profile
- Delete users and manage profile visibility
- Full CRUD operations on all data

## Database Schema

The application uses the following main entities:

- **Founders**: User profiles with contact information and social links
- **Skills**: Categorized skills that founders can offer
- **Startups**: Company profiles with stage and industry information
- **Help Requests**: Requests for help with categorization and status tracking

Many-to-many relationships exist between founders and skills, and between founders and startups.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License