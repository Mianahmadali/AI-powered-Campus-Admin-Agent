import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, status, Depends
from pymongo.errors import DuplicateKeyError
from bson import ObjectId

from db import get_db
from auth import (
    hash_password, 
    verify_password, 
    create_token_response,
    get_current_user_from_token
)
from models.user import (
    UserCreate, 
    UserLogin, 
    UserOut, 
    UserUpdate,
    TokenData,
    user_entity,
    object_id_from_str,
    now_utc
)

logger = logging.getLogger("campus_admin.auth")

router = APIRouter()


@router.post("/signup", response_model=TokenData, status_code=status.HTTP_201_CREATED)
async def signup(user_data: UserCreate):
    """Register a new user account"""
    db = get_db()
    users_collection = db.get_collection("users")
    
    try:
        # Check if user already exists
        existing_user = await users_collection.find_one({"email": user_data.email})
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Hash password and create user document
        hashed_password = hash_password(user_data.password)
        user_doc = {
            "name": user_data.name,
            "email": user_data.email,
            "password_hash": hashed_password,
            "role": user_data.role,
            "department": user_data.department,
            "is_active": True,
            "created_at": now_utc(),
            "last_login": None,
        }
        
        # Insert user into database
        result = await users_collection.insert_one(user_doc)
        user_doc["_id"] = result.inserted_id
        
        # Create user output model and generate token
        user_out = user_entity(user_doc)
        token_response = create_token_response(user_out)
        
        logger.info("New user registered: %s", user_data.email)
        return TokenData(**token_response)
        
    except DuplicateKeyError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    except Exception as e:
        logger.error("Error during signup: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.post("/login", response_model=TokenData)
async def login(credentials: UserLogin):
    """Authenticate user and return access token"""
    db = get_db()
    users_collection = db.get_collection("users")
    
    try:
        # Find user by email
        user_doc = await users_collection.find_one({"email": credentials.email})
        if not user_doc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Verify password
        if not verify_password(credentials.password, user_doc["password_hash"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Check if user is active
        if not user_doc.get("is_active", True):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account is deactivated"
            )
        
        # Update last login time
        await users_collection.update_one(
            {"_id": user_doc["_id"]},
            {"$set": {"last_login": now_utc()}}
        )
        user_doc["last_login"] = now_utc()
        
        # Create user output model and generate token
        user_out = user_entity(user_doc)
        token_response = create_token_response(user_out)
        
        logger.info("User logged in: %s", credentials.email)
        return TokenData(**token_response)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error during login: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/me", response_model=UserOut)
async def get_current_user(current_user: dict = Depends(get_current_user_from_token)):
    """Get current authenticated user information"""
    db = get_db()
    users_collection = db.get_collection("users")
    
    try:
        user_id = current_user.get("user_id")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        
        user_doc = await users_collection.find_one({"_id": object_id_from_str(user_id)})
        if not user_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return user_entity(user_doc)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error fetching user: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.put("/me", response_model=UserOut)
async def update_current_user(
    user_update: UserUpdate,
    current_user: dict = Depends(get_current_user_from_token)
):
    """Update current authenticated user information"""
    db = get_db()
    users_collection = db.get_collection("users")
    
    try:
        user_id = current_user.get("user_id")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        
        # Build update document
        update_data = {}
        if user_update.name is not None:
            update_data["name"] = user_update.name
        if user_update.email is not None:
            # Check if new email is already taken
            existing = await users_collection.find_one({
                "email": user_update.email,
                "_id": {"$ne": object_id_from_str(user_id)}
            })
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already in use"
                )
            update_data["email"] = user_update.email
        if user_update.department is not None:
            update_data["department"] = user_update.department
        
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update"
            )
        
        # Update user
        result = await users_collection.update_one(
            {"_id": object_id_from_str(user_id)},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Fetch updated user
        updated_user = await users_collection.find_one({"_id": object_id_from_str(user_id)})
        return user_entity(updated_user)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error updating user: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.post("/refresh", response_model=TokenData)
async def refresh_token(current_user: dict = Depends(get_current_user_from_token)):
    """Refresh access token"""
    db = get_db()
    users_collection = db.get_collection("users")
    
    try:
        user_id = current_user.get("user_id")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        
        user_doc = await users_collection.find_one({"_id": object_id_from_str(user_id)})
        if not user_doc or not user_doc.get("is_active", True):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive"
            )
        
        user_out = user_entity(user_doc)
        token_response = create_token_response(user_out)
        
        return TokenData(**token_response)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error refreshing token: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.post("/verify-token")
async def verify_token_endpoint(current_user: dict = Depends(get_current_user_from_token)):
    """Verify if the current token is valid"""
    return {
        "valid": True,
        "user_id": current_user.get("user_id"),
        "email": current_user.get("sub")
    }