from sqlalchemy import Column, String, DateTime
from sqlalchemy.sql import func
from app.core.database import Base
from app.core.ulid import BinaryULID, generate_ulid

class Location(Base):
    __tablename__ = "locations"

    id = Column(BinaryULID, primary_key=True, default=generate_ulid)
    name = Column(String(100), nullable=False)
    deleted_at = Column(DateTime)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())
