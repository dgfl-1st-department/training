from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.schemas.user import User as UserSchema, UserUpdate, UserBulkUpdatePayload
from app.core.audit import log_audit

router = APIRouter(prefix="/api/admin/users", tags=["admin_users"])

@router.get("", response_model=List[UserSchema])
async def get_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="管理者のみアクセス可能です",
        )
    # 削除済みのユーザーも含めて取得
    users = db.query(User).all()
    return users

@router.get("/{user_id}", response_model=UserSchema)
async def get_user_detail(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="管理者のみアクセス可能です",
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ユーザーが見つかりません",
        )
    return user

@router.patch("/bulk", response_model=dict)
async def bulk_update_users(
    payload: UserBulkUpdatePayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="管理者のみアクセス可能です",
        )

    updated_ids = []
    for user_id in payload.user_ids:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            continue
        
        update_data = payload.updates.model_dump(exclude_unset=True)
        
        if "name" in update_data:
            user.name = update_data["name"]
        if "role" in update_data:
            user.role = update_data["role"]
        if "department_id" in update_data:
            user.department_id = update_data["department_id"]
        if "location_id" in update_data:
            user.location_id = update_data["location_id"]
        
        if "is_active" in update_data:
            is_active = update_data["is_active"]
            if is_active:
                user.deleted_at = None
            else:
                if user.deleted_at is None:
                    user.deleted_at = datetime.now()
        
        updated_ids.append(user.id)
        log_audit(db, "user_update", current_user.id, "user", user.id, details=update_data)

    db.commit()
    return {"message": f"{len(updated_ids)}件のユーザーを更新しました", "updated_ids": updated_ids}

@router.patch("/{user_id}", response_model=UserSchema)
async def update_user(
    user_id: str,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="管理者のみアクセス可能です",
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ユーザーが見つかりません",
        )

    update_data = payload.model_dump(exclude_unset=True)
    
    if "name" in update_data:
        user.name = update_data["name"]
    if "role" in update_data:
        user.role = update_data["role"]
    if "department_id" in update_data:
        user.department_id = update_data["department_id"]
    if "location_id" in update_data:
        user.location_id = update_data["location_id"]
    
    if "is_active" in update_data:
        is_active = update_data["is_active"]
        if is_active:
            user.deleted_at = None
        else:
            if user.deleted_at is None:
                user.deleted_at = datetime.now()

    db.commit()
    db.refresh(user)
    
    log_audit(db, "user_update", current_user.id, "user", user.id, details=update_data)
    
    return user
