from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    role: str
    department_id: Optional[int] = None

class User(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class SessionBase(BaseModel):
    user_id: int
    expires_at: datetime

class Session(SessionBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True
