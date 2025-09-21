from __future__ import annotations

from datetime import datetime, timezone
from typing import Literal, Optional

from bson import ObjectId
from pydantic import BaseModel, EmailStr, Field


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


class UserCreate(BaseModel):
    """User creation model for signup"""
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)
    role: Literal["admin", "staff", "user"] = "user"
    department: Optional[str] = Field(None, max_length=100)


class UserLogin(BaseModel):
    """User login model"""
    email: EmailStr
    password: str = Field(..., min_length=1, max_length=128)


class UserUpdate(BaseModel):
    """User update model"""
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    email: Optional[EmailStr] = None
    department: Optional[str] = Field(None, max_length=100)
    role: Optional[Literal["admin", "staff", "user"]] = None
    is_active: Optional[bool] = None


class UserOut(BaseModel):
    """User output model (no password)"""
    id: str = Field(..., description="MongoDB document id as string")
    name: str
    email: EmailStr
    role: Literal["admin", "staff", "user"]
    department: Optional[str] = None
    is_active: bool = True
    created_at: datetime
    last_login: Optional[datetime] = None


class TokenData(BaseModel):
    """Token data model"""
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserOut


def object_id_from_str(oid: str) -> ObjectId:
    if not ObjectId.is_valid(oid):
        raise ValueError("Invalid ObjectId")
    return ObjectId(oid)


def user_entity(doc: dict) -> UserOut:
    """Convert MongoDB document to UserOut model"""
    return UserOut(
        id=str(doc.get("_id")),
        name=doc["name"],
        email=doc["email"],
        role=doc.get("role", "user"),
        department=doc.get("department"),
        is_active=doc.get("is_active", True),
        created_at=doc.get("created_at"),
        last_login=doc.get("last_login"),
    )