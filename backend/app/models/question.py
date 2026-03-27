from sqlalchemy import Column, String, Enum, Boolean, Integer, DateTime
from sqlalchemy.sql import func
from app.core.database import Base
from app.core.ulid import BinaryULID, generate_ulid


class Question(Base):
    __tablename__ = "questions"

    id = Column(BinaryULID, primary_key=True, default=generate_ulid)
    category = Column(Enum("work", "relationship", "health"), nullable=False)
    answer_type = Column(Enum("rating", "free"), nullable=False, default="rating")
    text = Column(String(500), nullable=False)
    is_public = Column(Boolean, nullable=False, default=True)
    sort_order = Column(Integer, nullable=False, default=0)
    deleted_at = Column(DateTime)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())
