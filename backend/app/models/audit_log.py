from sqlalchemy import Column, BigInteger, String, JSON, DateTime
from sqlalchemy.sql import func
from app.core.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(BigInteger, primary_key=True, index=True)
    user_id = Column(BigInteger, index=True)
    action = Column(String(50), nullable=False, index=True)
    resource_type = Column(String(50))
    resource_id = Column(String(100))
    details = Column(JSON)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
