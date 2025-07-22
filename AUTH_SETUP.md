# Authentication Setup Guide

This guide will help you set up Auth0 authentication with separate login and sign-up flows.

## Prerequisites

1. **Auth0 Account**: Sign up at [auth0.com](https://auth0.com)
2. **Python packages**: `pip install requests python-dotenv`

## Step 1: Configure Auth0 Application

### Create SPA Application (for Frontend)
1. Go to Auth0 Dashboard > Applications
2. Click "Create Application"
3. Choose "Single Page Application" 
4. Note down:
   - Domain (e.g., `dev-example.auth0.com`)
   - Client ID

### Configure SPA Settings
1. In your SPA application settings:
   - **Allowed Callback URLs**: `http://localhost:3000, https://yourdomain.com`
   - **Allowed Logout URLs**: `http://localhost:3000, https://yourdomain.com`
   - **Allowed Web Origins**: `http://localhost:3000, https://yourdomain.com`

### Create Machine-to-Machine Application (for User Setup)
1. Go to Auth0 Dashboard > Applications
2. Click "Create Application"
3. Choose "Machine to Machine Application"
4. Authorize it for "Auth0 Management API"
5. Add scopes: `create:users`, `read:users`
6. Note down:
   - Client ID (different from SPA)
   - Client Secret

## Step 2: Configure Database Connection

1. Go to Auth0 Dashboard > Authentication > Database
2. Ensure you have a "Username-Password-Authentication" connection
3. Configure password policy as needed
4. Enable "Disable Sign Ups" if you want invite-only registration

## Step 3: Set Up Environment Variables

### For Backend User Setup (Root directory)
Create `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your Auth0 credentials:

```env
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_CLIENT_ID=your-management-api-client-id
AUTH0_CLIENT_SECRET=your-management-api-client-secret
AUTH0_AUDIENCE=https://your-domain.auth0.com/api/v2/
```

### For Frontend (frontend directory)
Create `frontend/.env` file:

```env
REACT_APP_AUTH0_DOMAIN=your-domain.auth0.com
REACT_APP_AUTH0_CLIENT_ID=your-spa-client-id
REACT_APP_AUTH0_AUDIENCE=http://localhost:8080
```

## Step 4: Create Auth0 Users for Existing Founders

Run the setup script to create Auth0 users for all existing founders:

```bash
python setup_auth0_users.py
```

This will:
- Create Auth0 users for all founders in your database
- Set default password `12scrappyfounders` for all users
- Mark emails as verified

## Step 5: Test Authentication

1. Start your backend: `cd backend && python main.py`
2. Start your frontend: `cd frontend && npm start`
3. Visit `http://localhost:3000`
4. Try logging in with existing user credentials:
   - Email: `withlinkedin@test.com` (or any founder email)
   - Password: `12scrappyfounders`

## Features

### Login Flow
- Existing users can log in with email/password
- Default password: `12scrappyfounders`
- Redirects to profile setup if incomplete

### Sign Up Flow  
- New users can create accounts
- Must complete profile setup before accessing app
- Email field locked to Auth0 email
- All required fields enforced

### User Permissions
- Non-admin users can only edit their own profiles
- Email cannot be changed by non-admin users
- Admin users have full access to all features

## Troubleshooting

### Common Issues

1. **"Access Denied" when running setup script**
   - Check Management API credentials in `.env`
   - Ensure M2M app has `create:users` and `read:users` scopes

2. **Login redirects to wrong URL**
   - Check Allowed Callback URLs in Auth0 SPA settings
   - Ensure `redirect_uri` matches exactly

3. **"Audience not found" error**
   - Check that `REACT_APP_AUTH0_AUDIENCE` matches your API identifier
   - Ensure API is created in Auth0 Dashboard

4. **Users can't access certain features**
   - Check admin user list in `frontend/src/utils/admin.ts`
   - Ensure email addresses match exactly

### Password Reset

Users can reset their passwords through Auth0's built-in flow:
1. Click "Forgot Password" on login screen
2. Enter email address
3. Follow instructions in reset email

### Admin Access

To make a user an admin, add their email to the admin list in:
`frontend/src/utils/admin.ts`

## Security Notes

- Default password `12scrappyfounders` should be changed by users
- Consider enforcing password changes on first login
- Monitor Auth0 logs for suspicious activity
- Enable MFA for admin accounts if needed