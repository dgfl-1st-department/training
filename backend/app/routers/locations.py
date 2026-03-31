from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
from datetime import date, datetime

from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.location import Location
from app.schemas.locations import LocationCreate, LocationUpdate, LocationResponse
from app.core.audit import log_audit

router = APIRouter(prefix="/api", tags=["locations"])


@router.get("/locations", response_model=List[LocationResponse])
async def get_locations(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    locations = db.query(Location).filter(Location.deleted_at == None).all()
    return locations

@router.get("/admin/locations", response_model=List[LocationResponse])
async def get_admin_locations(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # 権限チェック：システム管理者のみアクセス可能
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="システム管理者のみアクセス可能です",
        )

    locations = db.query(Location).filter(Location.deleted_at == None).all()
    return locations

@router.post("/admin/locations", response_model=LocationResponse)
async def create_locations(
    payload: LocationCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # 権限チェック：システム管理者のみアクセス可能
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="システム管理者のみアクセス可能です",
        )

    # 新規登録
    new_location = Location(
        name=payload.name,
    )
    db.add(new_location)
    db.commit()
    db.refresh(new_location)

    # 監視ログの更新：location_create　user_id, resource_id, 変更内容
    log_audit(db, "location_create", current_user.id, "location", new_location.id, details={"name": new_location.name})
    return new_location


@router.put("/admin/locations/{location_id}", response_model=LocationResponse)
async def update_location(
    location_id: str,
    payload: LocationUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # 権限チェック：システム管理者のみアクセス可能
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="システム管理者のみアクセス可能です",
        )

    # 特定の回答を更新する。自ユーザーの回答のみ許可。
    location = db.query(Location).filter(Location.id == location_id).first()
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="拠点が見つかりません",
        )

    if payload.name is not None:
        location.name = payload.name

    db.commit()
    db.refresh(location)
    log_audit(db, "location_update", current_user.id, "location", location.id, details={"name": location.name})
    return location


@router.delete("/admin/locations/{location_id}", response_model=LocationResponse)
async def delete_location(
    location_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # 権限チェック：システム管理者のみアクセス可能
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="システム管理者のみアクセス可能です",
        )

    # 特定の回答を削除する。自ユーザーの回答のみ許可。
    location = db.query(Location).filter(Location.id == location_id).first()
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="回答が見つかりません",
        )
    location.deleted_at = datetime.now()
    db.commit()
    db.refresh(location)
    log_audit(db, "location_delete", current_user.id, "location", location.id, details={"name": location.name})
    return location