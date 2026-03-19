from sqlalchemy import Column, BigInteger, String, Enum, Boolean, Integer, DateTime
from sqlalchemy.sql import func
from app.core.database import Base

class Question(Base):
    __tablename__ = "questions"

    id = Column(BigInteger, primary_key=True, index=True)
    measurement_category = Column(Enum("satisfaction", "relationship", "health"), nullable=False)
    text = Column(String(500), nullable=False)
    is_public = Column(Boolean, nullable=False, default=True)
    sort_order = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())
