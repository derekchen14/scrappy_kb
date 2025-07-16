# Founders Community CRM

A simple CRM system for founders communities to track skills, help requests, and startups.

## Features

- **Founders Management**: Add, edit, and view founder profiles with social links
- **Skills Tracking**: Manage skills offered by founders with categories
- **Startup Profiles**: Track startup information and associate with founders
- **Help Requests**: Manage help requests with categories, urgency levels, and status

## Tech Stack

- **Frontend**: React with TypeScript
- **Backend**: FastAPI (Python)
- **Database**: PostgreSQL (with SQLite fallback for development)
- **Deployment**: Vercel (frontend) + Railway (backend)

## Local Development

### Prerequisites
- Python 3.11+
- Node.js 16+
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Create and activate virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Run the development server:
   ```bash
   uvicorn main:app --reload
   ```

The API will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

The frontend will be available at `http://localhost:3000`

## API Endpoints

- `GET/POST /founders/` - List/Create founders
- `GET/PUT/DELETE /founders/{id}` - Get/Update/Delete founder
- `GET/POST /skills/` - List/Create skills
- `GET/PUT/DELETE /skills/{id}` - Get/Update/Delete skill
- `GET/POST /startups/` - List/Create startups
- `GET/PUT/DELETE /startups/{id}` - Get/Update/Delete startup
- `GET/POST /help-requests/` - List/Create help requests
- `GET/PUT/DELETE /help-requests/{id}` - Get/Update/Delete help request

## Deployment

### Frontend (Vercel)

1. Push code to GitHub
2. Connect repository to Vercel
3. Set build command to `npm run build`
4. Set output directory to `build`
5. Add environment variable: `REACT_APP_API_URL=<your-backend-url>`

### Backend (Railway)

1. Push code to GitHub
2. Connect repository to Railway
3. Add PostgreSQL database service
4. Set environment variable: `DATABASE_URL=<postgresql-url>`
5. Deploy from `backend` directory

## Environment Variables

### Frontend
- `REACT_APP_API_URL` - Backend API URL

### Backend
- `DATABASE_URL` - PostgreSQL connection string

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