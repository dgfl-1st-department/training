from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import date, datetime


class AssignmentCreate(BaseModel):
    department_id: str
    manager_id: str

    @field_validator("department_id", "manager_id")
    @classmethod
    def id_not_empty(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("IDは必須です")
        return value


class AssignmentUpdate(BaseModel):
    department_id: Optional[str] = None
    manager_id: Optional[str] = None

    @field_validator("department_id", "manager_id")
    @classmethod
    def id_not_empty(cls, value: Optional[str]) -> Optional[str]:
        if value is not None and not value.strip():
            raise ValueError("IDは必須です")
        return value

class AssignmentResponse(BaseModel):
    id: str
    department_id: str
    manager_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
