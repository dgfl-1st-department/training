from sqlalchemy import Column, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.core.ulid import BinaryULID, generate_ulid

class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(BinaryULID, primary_key=True, default=generate_ulid)
    department_id = Column(BinaryULID, ForeignKey("departments.id", ondelete="CASCADE"), nullable=False)
    manager_id = Column(BinaryULID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    deleted_at = Column(DateTime)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint("department_id", "manager_id", name="uk_dept_manager"),
    )

    department = relationship("Department")
    manager = relationship("User")
