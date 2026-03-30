from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog
from typing import Optional, Any, Dict

def log_audit(
    db: Session,
    action: str,
    user_id: Optional[str] = None,
    resource_type: Optional[str] = None,
    resource_id: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None
):
    # 監査ログを記録する共通関数
    db_log = AuditLog(
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details=details
    )
    db.add(db_log)
    db.commit()

