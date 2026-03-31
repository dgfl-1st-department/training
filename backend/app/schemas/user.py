from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    role: str
    department_id: Optional[str] = None
    location_id: Optional[str] = None

class UserUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    department_id: Optional[str] = None
    location_id: Optional[str] = None
    is_active: Optional[bool] = None

class UserBulkUpdatePayload(BaseModel):
    user_ids: list[str]
    updates: UserUpdate

class User(UserBase):
    id: str
    onboarding_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class SessionBase(BaseModel):
    user_id: str
    expires_at: datetime

class Session(SessionBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True
