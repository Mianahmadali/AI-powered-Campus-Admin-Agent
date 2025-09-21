import logging
import os
from contextlib import asynccontextmanager
from typing import List
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from db import close_mongo_connection, connect_to_mongo, ensure_indexes
from routes.students import router as students_router
from routes.chat import router as chat_router
from routes.analytics import router as analytics_router
from routes.auth import router as auth_router


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)
logger = logging.getLogger("campus_admin")

# Load environment variables from backend/.env first, then project .env as fallback
_backend_env = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=_backend_env)
load_dotenv()

# Allow starting the API without a database (for local dev) when BACKEND_SKIP_DB is set
SKIP_DB = os.getenv("BACKEND_SKIP_DB", "0").lower() in ("1", "true", "yes", "on")


@asynccontextmanager
async def lifespan(app: FastAPI):
    if not SKIP_DB:
        # Startup
        await connect_to_mongo()
        await ensure_indexes()
        try:
            yield
        finally:
            # Shutdown
            await close_mongo_connection()
    else:
        logger.warning("BACKEND_SKIP_DB is set; starting without MongoDB connection.")
        yield


app = FastAPI(title="Campus Admin Agent Backend", version="0.1.0", lifespan=lifespan)

# CORS - adjust origins for production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth_router, prefix="/auth", tags=["auth"])  # authentication
app.include_router(students_router, prefix="/students", tags=["students"])  # RESTful CRUD
app.include_router(chat_router, prefix="/chat", tags=["chat"])  # chat + streaming
app.include_router(analytics_router, prefix="/analytics", tags=["analytics"])  # analytics


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}
