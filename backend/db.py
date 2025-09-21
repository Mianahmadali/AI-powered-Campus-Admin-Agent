import logging
import os
from typing import Optional

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo.errors import PyMongoError

logger = logging.getLogger("campus_admin.db")

# Client state
_client: Optional[AsyncIOMotorClient] = None
_db: Optional[AsyncIOMotorDatabase] = None


async def connect_to_mongo() -> None:
    """Initialize MongoDB client and verify connection."""
    global _client, _db
    if _client is not None:
        return
    try:
        # Read env vars at runtime so .env works reliably
        mongodb_uri: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
        mongodb_db: str = os.getenv("MONGODB_DB", "campus_admin")

        _client = AsyncIOMotorClient(
            mongodb_uri,
            serverSelectionTimeoutMS=5000,
            uuidRepresentation="standard",
            tz_aware=True,
        )
        # Validate connection
        await _client.admin.command("ping")
        _db = _client[mongodb_db]
        logger.info("Connected to MongoDB at %s (db=%s)", mongodb_uri, mongodb_db)
    except Exception as e:
        logger.exception("Failed to connect to MongoDB: %s", e)
        raise


async def close_mongo_connection() -> None:
    """Close MongoDB client."""
    global _client, _db
    try:
        if _client is not None:
            _client.close()
            logger.info("MongoDB connection closed")
    finally:
        _client = None
        _db = None


def get_db() -> AsyncIOMotorDatabase:
    """Return the active database instance."""
    if _db is None:
        raise RuntimeError("Database not initialized. Ensure connect_to_mongo() was called.")
    return _db


async def ensure_indexes() -> None:
    """Create indexes for collections used by the application."""
    db = get_db()
    users = db.get_collection("users")
    students = db.get_collection("students")
    conversations = db.get_collection("conversations")

    try:
        # Users
        await users.create_index("email", unique=True, name="uid_user_email")
        await users.create_index([("role", 1)], name="idx_user_role")
        await users.create_index([("is_active", 1)], name="idx_user_is_active")
        await users.create_index([("created_at", -1)], name="idx_user_created_at_desc")
        await users.create_index([("last_login", -1)], name="idx_user_last_login_desc")
        logger.info("Indexes ensured for 'users' collection")
        
        # Students
        await students.create_index("student_id", unique=True, name="uid_student_id")
        await students.create_index("email", unique=True, name="uid_email")
        await students.create_index([("department", 1)], name="idx_department")
        await students.create_index([("status", 1)], name="idx_status")
        await students.create_index([("joined_at", -1)], name="idx_joined_at_desc")
        await students.create_index([("last_active_at", -1)], name="idx_last_active_at_desc")
        logger.info("Indexes ensured for 'students' collection")

        # Conversations
        await conversations.create_index("session_id", unique=True, name="uid_session_id")
        await conversations.create_index([("updated_at", -1)], name="idx_updated_at_desc")
        logger.info("Indexes ensured for 'conversations' collection")
    except PyMongoError as e:
        logger.exception("Error creating indexes: %s", e)
        raise
