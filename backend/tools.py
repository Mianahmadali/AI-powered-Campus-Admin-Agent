from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo.errors import DuplicateKeyError

from models.student import StudentCreate, StudentUpdate, student_entity

logger = logging.getLogger("campus_admin.tools")


# -----------------------------
# Student Management Tools
# -----------------------------

async def add_student(db: AsyncIOMotorDatabase, payload: Dict[str, Any]) -> Dict[str, Any]:
    data = StudentCreate(**payload).model_dump()
    try:
        result = await db.students.insert_one(data)
        doc = await db.students.find_one({"_id": result.inserted_id})
        return {"ok": True, "student": student_entity(doc).model_dump()}
    except DuplicateKeyError as e:
        detail = "Duplicate key"
        msg = str(e).lower()
        if "student_id" in msg:
            detail = "student_id already exists"
        elif "email" in msg:
            detail = "email already exists"
        return {"ok": False, "error": detail}


async def get_student(db: AsyncIOMotorDatabase, student_id: str) -> Dict[str, Any]:
    doc = await db.students.find_one({"student_id": student_id})
    if not doc:
        return {"ok": False, "error": "Student not found"}
    return {"ok": True, "student": student_entity(doc).model_dump()}


async def update_student_tool(db: AsyncIOMotorDatabase, student_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
    upd = StudentUpdate(**updates).model_dump(exclude_unset=True)
    if not upd:
        return {"ok": False, "error": "No fields to update"}
    try:
        res = await db.students.update_one({"student_id": student_id}, {"$set": upd})
    except DuplicateKeyError as e:
        detail = "Duplicate key"
        msg = str(e).lower()
        if "student_id" in msg:
            detail = "student_id already exists"
        elif "email" in msg:
            detail = "email already exists"
        return {"ok": False, "error": detail}

    if res.matched_count == 0:
        return {"ok": False, "error": "Student not found"}
    doc = await db.students.find_one({"student_id": student_id})
    return {"ok": True, "student": student_entity(doc).model_dump()}


async def delete_student_tool(db: AsyncIOMotorDatabase, student_id: str) -> Dict[str, Any]:
    res = await db.students.delete_one({"student_id": student_id})
    if res.deleted_count == 0:
        return {"ok": False, "error": "Student not found"}
    return {"ok": True}


async def list_students_tool(
    db: AsyncIOMotorDatabase,
    department: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 20,
) -> Dict[str, Any]:
    flt: Dict[str, Any] = {}
    if department:
        flt["department"] = department
    if status:
        flt["status"] = status

    cursor = db.students.find(flt).sort([("joined_at", -1)]).limit(max(1, min(100, limit)))
    items: List[Dict[str, Any]] = []
    async for doc in cursor:
        items.append(student_entity(doc).model_dump())
    return {"ok": True, "students": items}


# -----------------------------
# Analytics Tools
# -----------------------------

async def get_total_students(db: AsyncIOMotorDatabase) -> Dict[str, Any]:
    count = await db.students.estimated_document_count()
    return {"ok": True, "total_students": count}


async def get_students_by_department(db: AsyncIOMotorDatabase) -> Dict[str, Any]:
    pipeline = [
        {"$group": {"_id": "$department", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    out: Dict[str, int] = {}
    async for row in db.students.aggregate(pipeline):
        out[row["_id"]] = row["count"]
    return {"ok": True, "by_department": out}


async def get_recent_onboarded_students(db: AsyncIOMotorDatabase, limit: int = 5) -> Dict[str, Any]:
    cursor = db.students.find({}).sort([("joined_at", -1)]).limit(max(1, min(20, limit)))
    items: List[Dict[str, Any]] = []
    async for doc in cursor:
        items.append(student_entity(doc).model_dump())
    return {"ok": True, "recent_onboarded": items}


async def get_active_students_last_7_days(db: AsyncIOMotorDatabase) -> Dict[str, Any]:
    since = datetime.now(timezone.utc) - timedelta(days=7)
    count = await db.students.count_documents({"last_active_at": {"$gte": since}})
    return {"ok": True, "active_last_7_days": count}


# -----------------------------
# FAQ (Optional) and Notifications
# -----------------------------

async def get_cafeteria_timings() -> Dict[str, Any]:
    return {
        "ok": True,
        "cafeteria_timings": {
            "weekdays": "8:00 AM - 8:00 PM",
            "weekends": "9:00 AM - 6:00 PM",
        },
    }


async def get_library_hours() -> Dict[str, Any]:
    return {
        "ok": True,
        "library_hours": {
            "weekdays": "8:00 AM - 10:00 PM",
            "weekends": "10:00 AM - 6:00 PM",
        },
    }


async def get_event_schedule() -> Dict[str, Any]:
    return {
        "ok": True,
        "events": [
            {"title": "Tech Talk", "date": "2025-10-01"},
            {"title": "Sports Day", "date": "2025-10-15"},
        ],
    }


async def send_email(student_id: str, message: str) -> Dict[str, Any]:
    # Mock email: log only
    logger.info("[MOCK EMAIL] to student_id=%s: %s", student_id, message)
    return {"ok": True, "sent": True}


# JSON Schemas for OpenAI function-calling
TOOL_SCHEMAS: List[Dict[str, Any]] = [
    {
        "type": "function",
        "function": {
            "name": "add_student",
            "description": "Add a new student to the database.",
            "parameters": {
                "type": "object",
                "properties": {
                    "student_id": {"type": "string"},
                    "name": {"type": "string"},
                    "email": {"type": "string", "format": "email"},
                    "department": {"type": "string"},
                    "year": {"type": "integer", "minimum": 1, "maximum": 8},
                    "status": {"type": "string", "enum": ["active", "inactive"]},
                },
                "required": ["student_id", "name", "email", "department", "year"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_student",
            "description": "Fetch a student's details by student_id.",
            "parameters": {
                "type": "object",
                "properties": {"student_id": {"type": "string"}},
                "required": ["student_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "update_student_tool",
            "description": "Update an existing student by student_id with partial fields.",
            "parameters": {
                "type": "object",
                "properties": {
                    "student_id": {"type": "string"},
                    "updates": {
                        "type": "object",
                        "properties": {
                            "name": {"type": "string"},
                            "email": {"type": "string", "format": "email"},
                            "department": {"type": "string"},
                            "year": {"type": "integer", "minimum": 1, "maximum": 8},
                            "status": {"type": "string", "enum": ["active", "inactive"]},
                        },
                    },
                },
                "required": ["student_id", "updates"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "delete_student_tool",
            "description": "Delete a student by student_id.",
            "parameters": {
                "type": "object",
                "properties": {"student_id": {"type": "string"}},
                "required": ["student_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "list_students_tool",
            "description": "List students with optional filters.",
            "parameters": {
                "type": "object",
                "properties": {
                    "department": {"type": "string"},
                    "status": {"type": "string", "enum": ["active", "inactive"]},
                    "limit": {"type": "integer", "minimum": 1, "maximum": 100, "default": 20},
                },
            },
        },
    },
    {  # Analytics
        "type": "function",
        "function": {
            "name": "get_total_students",
            "description": "Get total number of students.",
            "parameters": {"type": "object", "properties": {}},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_students_by_department",
            "description": "Get counts of students grouped by department.",
            "parameters": {"type": "object", "properties": {}},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_recent_onboarded_students",
            "description": "Get most recently onboarded students.",
            "parameters": {
                "type": "object",
                "properties": {"limit": {"type": "integer", "minimum": 1, "maximum": 20, "default": 5}},
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_active_students_last_7_days",
            "description": "Get number of students active in the last 7 days.",
            "parameters": {"type": "object", "properties": {}},
        },
    },
    {  # FAQ & Notifications
        "type": "function",
        "function": {
            "name": "get_cafeteria_timings",
            "description": "Get cafeteria opening hours.",
            "parameters": {"type": "object", "properties": {}},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_library_hours",
            "description": "Get library opening hours.",
            "parameters": {"type": "object", "properties": {}},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_event_schedule",
            "description": "Get campus event schedule.",
            "parameters": {"type": "object", "properties": {}},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "send_email",
            "description": "Send a notification email to a student (mock).",
            "parameters": {
                "type": "object",
                "properties": {
                    "student_id": {"type": "string"},
                    "message": {"type": "string"},
                },
                "required": ["student_id", "message"],
            },
        },
    },
]
