import os
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
import models
import incident_models
import database

# Create database tables
try:
    models.Base.metadata.create_all(bind=database.engine)
    incident_models.Incident.__table__.create(bind=database.engine, checkfirst=True)
    incident_models.IncidentNote.__table__.create(bind=database.engine, checkfirst=True)
except Exception as e:
    print(f"Warning: Failed to connect to database on startup: {e}")

app = FastAPI(
    title="Cyber Threat Intelligence API",
    description="API for the AI-Powered Cyber Threat Intelligence & Anomaly Detection Platform",
    version="2.0.0"
)

# Configurable CORS
cors_origins = os.getenv("CORS_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from routers import analytics, events, ml, monitor, incidents, auth, users
from auth_utils import get_current_user

app.include_router(auth.router)
app.include_router(users.router, dependencies=[Depends(get_current_user)])
app.include_router(analytics.router, dependencies=[Depends(get_current_user)])
app.include_router(events.router, dependencies=[Depends(get_current_user)])
app.include_router(ml.router, dependencies=[Depends(get_current_user)])
app.include_router(monitor.router, dependencies=[Depends(get_current_user)])
app.include_router(incidents.router, dependencies=[Depends(get_current_user)])

@app.get("/api/health")
def health_check():
    """
    Basic health check API endpoint.
    """
    return {"status": "healthy", "service": "Cyber Threat Intelligence API"}

@app.get("/api/database/health")
def database_health_check(db: Session = Depends(database.get_db)):
    """
    Verify PostgreSQL database is accessible.
    """
    try:
        db.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "PostgreSQL connected"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database connection failed: {str(e)}")
