from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import date, datetime


class DepartmentCreate(BaseModel):
    name: str

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("名称は必須です")
        return value


class DepartmentUpdate(BaseModel):
    name: Optional[str] = None

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, value: Optional[str]) -> Optional[str]:
        if value is not None and not value.strip():
            raise ValueError("名称は必須です")
        return value

class DepartmentResponse(BaseModel):
    id: str
    name: str
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None

    class Config:
        from_attributes = True
