from sqlalchemy import Column, String, DateTime, Enum, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.core.ulid import BinaryULID, generate_ulid
from app.models.location import Location
from app.models.department import Department


class User(Base):
    __tablename__ = "users"

    id = Column(BinaryULID, primary_key=True, default=generate_ulid)
    email = Column(String(255), nullable=False, unique=True, index=True)
    name = Column(String(100))
    role = Column(Enum("employee", "manager", "admin"), nullable=False)
    location_id = Column(BinaryULID, ForeignKey("locations.id", ondelete="SET NULL"))
    department_id = Column(BinaryULID, ForeignKey("departments.id", ondelete="SET NULL"))
    onboarding_at = Column(DateTime)
    deleted_at = Column(DateTime)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    department = relationship("Department")
    location = relationship("Location")
