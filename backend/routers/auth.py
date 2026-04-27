import logging
from typing import Any
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel

from db.models import get_user_by_email, create_user
from db.models import get_db
from services.auth import get_password_hash, verify_password, create_access_token

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])

# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class UserSignUp(BaseModel):
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/signup", response_model=Token)
async def signup(payload: UserSignUp, db: Any = Depends(get_db)):
    """Create a new user and return a token."""
    # Check if user already exists
    existing = await get_user_by_email(db, payload.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists."
        )
    
    # Hash password and create user
    hashed = get_password_hash(payload.password)
    user = await create_user(db, payload.email, hashed)
    
    # Create token
    access_token = create_access_token(data={"sub": user["_id"], "email": user["email"]})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user["_id"],
            "email": user["email"],
            "plan": user["plan"]
        }
    }

@router.post("/login", response_model=Token)
async def login(payload: UserLogin, db: Any = Depends(get_db)):
    """Authenticate user and return a token."""
    user = await get_user_by_email(db, payload.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password."
        )
    
    if not verify_password(payload.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password."
        )
    
    # Create token
    access_token = create_access_token(data={"sub": user["_id"], "email": user["email"]})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user["_id"],
            "email": user["email"],
            "plan": user["plan"]
        }
    }


from fastapi import Request
from db.models import update_user_preferences

def get_current_user(request: Request):
    """Dependency to get the current authenticated user from request state."""
    user = getattr(request.state, "user", None)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user


class PreferencesPayload(BaseModel):
    skeptic_level: str
    focus_area: str


@router.patch("/me/preferences")
async def update_preferences(
    payload: PreferencesPayload,
    db: Any = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update user preferences for analysis (skepticism level and focus)."""
    updated = await update_user_preferences(
        db, 
        current_user["user_id"], 
        payload.skeptic_level, 
        payload.focus_area
    )
    if not updated:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "status": "success", 
        "preferences": {
            "skeptic_level": updated.get("skeptic_level", "high"),
            "focus_area": updated.get("focus_area", "general")
        }
    }
