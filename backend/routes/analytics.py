from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List

from fastapi import APIRouter
from motor.motor_asyncio import AsyncIOMotorDatabase

from db import get_db

router = APIRouter()


@router.get("")
async def get_analytics() -> Dict[str, Any]:
    db: AsyncIOMotorDatabase = get_db()

    # Total students
    total_students = await db.students.estimated_document_count()

    # By department
    by_dept: Dict[str, int] = {}
    async for row in db.students.aggregate([
        {"$group": {"_id": "$department", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]):
        by_dept[row["_id"]] = row["count"]

    # Active last 7 days
    since_7 = datetime.now(timezone.utc) - timedelta(days=7)
    active_last_7_days = await db.students.count_documents({"last_active_at": {"$gte": since_7}})

    # Recent onboarded
    recent_onboarded: List[Dict[str, Any]] = []
    async for doc in db.students.find({}).sort([("joined_at", -1)]).limit(5):
        recent_onboarded.append({
            "student_id": doc.get("student_id"),
            "name": doc.get("name"),
            "email": doc.get("email"),
            "department": doc.get("department"),
            "joined_at": doc.get("joined_at"),
        })

    # Timeseries last 14 days
    since_14 = datetime.now(timezone.utc) - timedelta(days=14)

    # last_14_days_active grouped by day
    last_14_days_active: List[Dict[str, Any]] = []
    try:
        cursor = db.students.aggregate([
            {"$match": {"last_active_at": {"$gte": since_14}}},
            {"$group": {
                "_id": {"$dateTrunc": {"date": "$last_active_at", "unit": "day"}},
                "count": {"$sum": 1}
            }},
            {"$sort": {"_id": 1}},
        ])
    except Exception:
        # Fallback using dateToString for older Mongo versions
        cursor = db.students.aggregate([
            {"$match": {"last_active_at": {"$gte": since_14}}},
            {"$group": {
                "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$last_active_at"}},
                "count": {"$sum": 1}
            }},
            {"$sort": {"_id": 1}},
        ])
    async for row in cursor:
        day = row["_id"]
        if isinstance(day, datetime):
            day = day.date().isoformat()
        last_14_days_active.append({"date": day, "count": row["count"]})

    # last_14_days_onboarded grouped by day on joined_at
    last_14_days_onboarded: List[Dict[str, Any]] = []
    try:
        cursor2 = db.students.aggregate([
            {"$match": {"joined_at": {"$gte": since_14}}},
            {"$group": {
                "_id": {"$dateTrunc": {"date": "$joined_at", "unit": "day"}},
                "count": {"$sum": 1}
            }},
            {"$sort": {"_id": 1}},
        ])
    except Exception:
        cursor2 = db.students.aggregate([
            {"$match": {"joined_at": {"$gte": since_14}}},
            {"$group": {
                "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$joined_at"}},
                "count": {"$sum": 1}
            }},
            {"$sort": {"_id": 1}},
        ])
    async for row in cursor2:
        day = row["_id"]
        if isinstance(day, datetime):
            day = day.date().isoformat()
        last_14_days_onboarded.append({"date": day, "count": row["count"]})

    return {
        "total_students": total_students,
        "by_department": by_dept,
        "active_last_7_days": active_last_7_days,
        "recent_onboarded": recent_onboarded,
        "timeseries": {
            "last_14_days_active": last_14_days_active,
            "last_14_days_onboarded": last_14_days_onboarded,
        },
    }
