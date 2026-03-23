from pydantic import BaseModel, field_validator, Field
from typing import Optional, List
from datetime import date, datetime
from enum import Enum

class MeasurementCategory(str, Enum):
    SATISFACTION = "satisfaction"
    RELATIONSHIP = "relationship"
    HEALTH = "health"

class QuestionItemCreate(BaseModel):
    measurement_category: MeasurementCategory
    text: str = Field(..., max_length=500)
    is_public: bool = True
    sort_order: int = Field(0, ge=0) # 0以上

    @field_validator("text")
    @classmethod
    def text_length(cls, value: str) -> str:
        if len(value) > 500:
            raise ValueError("質問文は500文字以内で入力してください")
        return value

class QuestionUpdate(BaseModel):
    measurement_category: Optional[MeasurementCategory] = None
    text: Optional[str] = Field(None, max_length=500)
    is_public: Optional[bool] = None
    sort_order: Optional[int] = Field(None, ge=0)

    @field_validator("text")
    @classmethod
    def text_length(cls, value: Optional[str]) -> Optional[str]:
        if value is not None and len(value) > 500:
            raise ValueError("質問文は500文字以内で入力してください")
        return value

class QuestionVisibilityUpdate(BaseModel):
    is_public: bool

class QuestionSortOrder(BaseModel):
    id: int
    sort_order: int = Field(..., ge=0)

    @field_validator("sort_order")
    @classmethod
    def sort_order_range(cls, value: int) -> int:
        if value < 0:
            raise ValueError("sort_order は 0 以上で入力してください")
        return value

class QuestionBulkReorderPayload(BaseModel):
    orders: List[QuestionSortOrder]

class QuestionResponse(BaseModel):
    id: int
    measurement_category: MeasurementCategory
    text: str = Field(..., max_length=500)
    is_public: bool = True
    sort_order: int = Field(0, ge=0) # 0以上
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
