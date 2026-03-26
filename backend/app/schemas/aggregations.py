from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import date, datetime

class DepartmentResponse(BaseModel):
    id: int
    name: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class RatingDistribution(BaseModel):
    rating_1: int = 0
    rating_2: int = 0
    rating_3: int = 0
    rating_4: int = 0
    rating_5: int = 0

class AggregationResult(BaseModel):
    period_start: date
    department_id: Optional[int] = None
    department_name: Optional[str] = None
    question_id: int
    question_text: str
    average_rating: float
    answer_count: int
    distribution: RatingDistribution
    free_texts: List[str] = []

class AggregationResponse(BaseModel):
    aggregates: List[AggregationResult]
