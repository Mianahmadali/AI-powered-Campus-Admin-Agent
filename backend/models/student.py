from __future__ import annotations

from datetime import datetime, timezone
from typing import Literal, Optional

from bson import ObjectId
from pydantic import BaseModel, EmailStr, Field


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


class StudentCreate(BaseModel):
    student_id: str = Field(..., min_length=2, max_length=50, pattern=r"^[A-Za-z0-9_-]+$")
    name: str = Field(..., min_length=1, max_length=200)
    email: EmailStr
    department: str = Field(..., min_length=1, max_length=100)
    year: int = Field(..., ge=1, le=8)
    status: Literal["active", "inactive"] = "active"
    joined_at: datetime = Field(default_factory=now_utc)
    last_active_at: Optional[datetime] = None


class StudentUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    email: Optional[EmailStr] = None
    department: Optional[str] = Field(None, min_length=1, max_length=100)
    year: Optional[int] = Field(None, ge=1, le=8)
    status: Optional[Literal["active", "inactive"]] = None
    last_active_at: Optional[datetime] = None


class StudentOut(BaseModel):
    id: str = Field(..., description="MongoDB document id as string")
    student_id: str
    name: str
    email: EmailStr
    department: str
    year: int
    status: Literal["active", "inactive"]
    joined_at: datetime
    last_active_at: Optional[datetime] = None


def object_id_from_str(oid: str) -> ObjectId:
    if not ObjectId.is_valid(oid):
        raise ValueError("Invalid ObjectId")
    return ObjectId(oid)


def student_entity(doc: dict) -> StudentOut:
    return StudentOut(
        id=str(doc.get("_id")),
        student_id=doc["student_id"],
        name=doc["name"],
        email=doc["email"],
        department=doc["department"],
        year=doc["year"],
        status=doc.get("status", "active"),
        joined_at=doc.get("joined_at"),
        last_active_at=doc.get("last_active_at"),
    )
