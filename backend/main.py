from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from common.config import settings

# Import feature routers
from features.auth.router import router as auth_router
from features.founders.router import router as founders_router
from features.skills.router import router as skills_router
from features.startups.router import router as startups_router
from features.help_requests.router import router as help_requests_router
from features.hobbies.router import router as hobbies_router
from features.events.router import router as events_router

# Initialize FastAPI app
app = FastAPI(title=settings.APP_NAME)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth_router)
app.include_router(founders_router)
app.include_router(skills_router)
app.include_router(startups_router)
app.include_router(help_requests_router)
app.include_router(hobbies_router)
app.include_router(events_router)

# Root endpoints
@app.get("/")
def read_root():
    return {"message": "Scrappy Founders Knowledge Base API"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "message": "API is running"}

