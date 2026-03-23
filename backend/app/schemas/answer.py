from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import date, datetime


class AnswerItemCreate(BaseModel):
    question_id: int
    rating: Optional[int] = None
    free_text: Optional[str] = None

    @field_validator("rating")
    @classmethod
    def rating_range(cls, value: Optional[int]) -> Optional[int]:
        if value is not None and not (1 <= value <= 5):
            raise ValueError("rating は 1〜5 の範囲で入力してください")
        return value


class AnswersBulkCreate(BaseModel):
    answer_date: date
    answers: List[AnswerItemCreate]

    @field_validator("answer_date")
    @classmethod
    def not_future_date(cls, value: date) -> date:
        if value > date.today():
            raise ValueError("回答日に未来日は指定できません")
        return value


class AnswerUpdate(BaseModel):
    rating: Optional[int] = None
    free_text: Optional[str] = None

    @field_validator("rating")
    @classmethod
    def rating_range(cls, value: Optional[int]) -> Optional[int]:
        if value is not None and not (1 <= value <= 5):
            raise ValueError("rating は 1〜5 の範囲で入力してください")
        return value


class AnswerResponse(BaseModel):
    id: int
    user_id: int
    question_id: int
    answer_date: date
    rating: Optional[int] = None
    free_text: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
