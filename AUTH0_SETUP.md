# Auth0 Setup Guide for Production

This application uses Auth0 for authentication. Follow these steps to set up Auth0 for production deployment.

## Quick Start for Production

If you want to get this working immediately, follow these exact steps:

## 1. Create Auth0 Account

1. Go to [auth0.com](https://auth0.com) and sign up for a free account
2. Create a new tenant (or use your existing one)

## 2. Create Auth0 Application

1. In the Auth0 Dashboard, go to **Applications** > **Applications**
2. Click **Create Application**
3. Choose:
   - Name: `Scrappy KB Frontend`
   - Application Type: **Single Page Application**
4. Click **Create**

## 3. Configure Application Settings

In your application settings:

### Allowed Callback URLs
```
http://localhost:3000
```

### Allowed Logout URLs
```
http://localhost:3000
```

### Allowed Web Origins
```
http://localhost:3000
```

### Allowed Origins (CORS)
```
http://localhost:3000
```

## 4. Create Auth0 API

1. In the Auth0 Dashboard, go to **Applications** > **APIs**
2. Click **Create API**
3. Configure:
   - Name: `Scrappy KB API`
   - Identifier: `http://localhost:8000` (this will be your audience)
   - Signing Algorithm: `RS256`
4. Click **Create**

## 5. Update Environment Variables

### Frontend (.env)
```bash
REACT_APP_AUTH0_DOMAIN=your-tenant.auth0.com
REACT_APP_AUTH0_CLIENT_ID=your-spa-client-id
REACT_APP_AUTH0_AUDIENCE=https://your-api-domain.com
```

### Backend (.env)
```bash
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_AUDIENCE=https://your-api-domain.com
AUTH0_ALGORITHMS=RS256
DATABASE_URL=sqlite:///./founders_crm.db
```

**Important for Production:**
- Replace `your-tenant.auth0.com` with your actual Auth0 domain
- Replace `your-spa-client-id` with your SPA Client ID from Auth0
- Replace `https://your-api-domain.com` with your production API URL
- For local testing, you can use `http://localhost:8000` as the audience

## 6. Enable Email/Password Authentication

1. In Auth0 Dashboard, go to **Authentication** > **Database**
2. Create a new Database Connection or use the default "Username-Password-Authentication"
3. Make sure it's enabled for your application

## 7. Test the Setup

1. Start your backend server: `uvicorn main:app --reload`
2. Start your frontend: `npm start`
3. Navigate to `http://localhost:3000`
4. You should see a login screen
5. Click "Log In" to test the Auth0 flow

## Troubleshooting

### Common Issues:

1. **Invalid audience**: Make sure the audience in your frontend matches the API identifier in Auth0
2. **CORS errors**: Ensure all URLs are added to the allowed origins in Auth0
3. **Login loops**: Check that callback URLs are correctly configured
4. **Token verification fails**: Verify that your domain and algorithms match between frontend and backend

### Testing Authentication

You can test the protected endpoints:
- GET `/health` - No auth required
- GET `/protected` - Requires authentication
- POST `/founders/` - Requires authentication

Use the browser's developer tools to inspect the Authorization header being sent with requests.