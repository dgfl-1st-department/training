from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from app.routers import auth, answers, questions, aggregations, locations, departments, assignments, admin_users
from app.core.config import settings
# Ensure all models are imported so they register with SQLAlchemy Base
from app.models.department import Department
from app.models.user import User
from app.models.session import Session
from app.models.question import Question
from app.models.answer import Answer
from app.models.audit_log import AuditLog

app = FastAPI(title=settings.PROJECT_NAME)

# Session Middleware for OAuth State (not for long-term session)
app.add_middleware(
    SessionMiddleware, 
    secret_key=settings.ENCRYPTION_KEY, # Use encryption key as secret
)

# CORS Settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(answers.router)
app.include_router(questions.router)
app.include_router(aggregations.router)
app.include_router(locations.router)
app.include_router(departments.router)
app.include_router(assignments.router)
app.include_router(admin_users.router)

@app.get("/")
async def root():
    return {"message": "Welcome to Training WebApp API"}
