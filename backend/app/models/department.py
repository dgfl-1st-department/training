from sqlalchemy import Column, BigInteger, String, DateTime
from sqlalchemy.sql import func
from app.core.database import Base

class Department(Base):
    __tablename__ = "departments"

    id = Column(BigInteger, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())
