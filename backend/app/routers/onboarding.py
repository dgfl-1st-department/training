from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from datetime import datetime

from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.schemas.user import User as UserSchema, OnboardingUpdate
from app.core.audit import log_audit
from app.models.department import Department
from app.models.location import Location

router = APIRouter(prefix="/api", tags=["onboarding"])

@router.patch("/onboarding", response_model=UserSchema)
async def patch_onboarding(
    payload: OnboardingUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    user.department_id = payload.department_id
    user.location_id = payload.location_id
    user.onboarding_at = datetime.now()
    
    db.commit()
    db.refresh(user)
    
    log_audit(db, "onboarding_complete", user_id=user.id, details={
        "department_id": payload.department_id,
        "location_id": payload.location_id
    })
    
    return user
