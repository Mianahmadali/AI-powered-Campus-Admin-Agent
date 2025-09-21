from __future__ import annotations

from typing import List, Optional

from bson import ObjectId
from fastapi import APIRouter, HTTPException, Query, Response
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ASCENDING, DESCENDING
from pymongo.errors import DuplicateKeyError

from db import get_db
from models.student import (
    StudentCreate,
    StudentOut,
    StudentUpdate,
    object_id_from_str,
    student_entity,
)

router = APIRouter()


@router.post("/", response_model=StudentOut, status_code=201)
async def create_student(payload: StudentCreate) -> StudentOut:
    db: AsyncIOMotorDatabase = get_db()
    doc = payload.model_dump()
    result = None
    try:
        result = await db.students.insert_one(doc)
    except DuplicateKeyError as e:
        # Determine which field caused the duplicate
        detail = "Duplicate key"
        msg = str(e).lower()
        if "student_id" in msg:
            detail = "student_id already exists"
        elif "email" in msg:
            detail = "email already exists"
        raise HTTPException(status_code=409, detail=detail)

    inserted = await db.students.find_one({"_id": result.inserted_id})
    return student_entity(inserted)


@router.get("/", response_model=List[StudentOut])
async def list_students(
    limit: int = Query(50, ge=1, le=200),
    skip: int = Query(0, ge=0),
    department: Optional[str] = None,
    status: Optional[str] = Query(None, pattern="^(active|inactive)$"),
    q: Optional[str] = Query(None, description="Free-text search on name, email, student_id"),
) -> List[StudentOut]:
    db: AsyncIOMotorDatabase = get_db()
    flt: dict = {}

    if department:
        flt["department"] = department
    if status:
        flt["status"] = status
    if q:
        flt["$or"] = [
            {"name": {"$regex": q, "$options": "i"}},
            {"email": {"$regex": q, "$options": "i"}},
            {"student_id": {"$regex": q, "$options": "i"}},
        ]

    cursor = (
        db.students.find(flt)
        .sort([("joined_at", DESCENDING)])
        .skip(skip)
        .limit(limit)
    )

    items: List[StudentOut] = []
    async for doc in cursor:
        items.append(student_entity(doc))
    return items


@router.get("/{student_id}", response_model=StudentOut)
async def get_student_by_id(student_id: str) -> StudentOut:
    db: AsyncIOMotorDatabase = get_db()
    # Allow both ObjectId and custom student_id lookups
    flt = {"$or": [{"student_id": student_id}]}
    if ObjectId.is_valid(student_id):
        flt["$or"].append({"_id": ObjectId(student_id)})

    doc = await db.students.find_one(flt)
    if not doc:
        raise HTTPException(status_code=404, detail="Student not found")
    return student_entity(doc)


@router.put("/{id}", response_model=StudentOut)
async def update_student(id: str, payload: StudentUpdate) -> StudentOut:
    db: AsyncIOMotorDatabase = get_db()
    try:
        oid = object_id_from_str(id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid id format")

    updates = {k: v for k, v in payload.model_dump(exclude_unset=True).items()}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    try:
        res = await db.students.update_one({"_id": oid}, {"$set": updates})
    except DuplicateKeyError as e:
        detail = "Duplicate key"
        msg = str(e).lower()
        if "student_id" in msg:
            detail = "student_id already exists"
        elif "email" in msg:
            detail = "email already exists"
        raise HTTPException(status_code=409, detail=detail)

    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Student not found")

    doc = await db.students.find_one({"_id": oid})
    return student_entity(doc)


@router.delete("/{id}", status_code=204)
async def delete_student(id: str) -> Response:
    db: AsyncIOMotorDatabase = get_db()
    try:
        oid = object_id_from_str(id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid id format")

    res = await db.students.delete_one({"_id": oid})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Student not found")

    return Response(status_code=204)
