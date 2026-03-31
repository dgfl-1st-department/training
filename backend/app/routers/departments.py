from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
from datetime import date, datetime

from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.department import Department
from app.schemas.departments import DepartmentCreate, DepartmentUpdate, DepartmentResponse
from app.core.audit import log_audit

router = APIRouter(prefix="/api", tags=["departments"])

@router.get("/departments", response_model=List[DepartmentResponse])
async def get_departments(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    departments = db.query(Department).filter(Department.deleted_at == None).all()
    return departments

@router.get("/admin/departments", response_model=List[DepartmentResponse])
async def get_admin_departments(
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
    
    departments =  db.query(Department).filter(Department.deleted_at == None).all()
    return departments

@router.post("/admin/departments", response_model=DepartmentResponse)
async def create_departments(
    payload: DepartmentCreate,
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
    new_department = Department(
        name=payload.name,
    )
    db.add(new_department)
    db.commit()
    db.refresh(new_department)

    # 監視ログの更新：department_create　user_id, resource_id, 変更内容
    log_audit(db, "department_create", current_user.id, "department", new_department.id, details={"name": new_department.name})
    return new_department


@router.put("/admin/departments/{department_id}", response_model=DepartmentResponse)
async def update_department(
    department_id: str,
    payload: DepartmentUpdate,
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
    department = db.query(Department).filter(Department.id == department_id).first()
    if not department:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="部署が見つかりません",
        )

    if payload.name is not None:
        department.name = payload.name

    db.commit()
    db.refresh(department)
    log_audit(db, "department_update", current_user.id, "department", department.id, details={"name": department.name})
    return department


@router.delete("/admin/departments/{department_id}", response_model=DepartmentResponse)
async def delete_department(
    department_id: str,
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
    department = db.query(Department).filter(Department.id == department_id).first()
    if not department:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="回答が見つかりません",
        )
    department.deleted_at = datetime.now()
    db.commit()
    db.refresh(department)
    log_audit(db, "department_delete", current_user.id, "department", department.id, details={"name": department.name})
    return department