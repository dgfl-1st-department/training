from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
from datetime import date, datetime

from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.assignment import Assignment
from app.models.department import Department
from app.schemas.assignments import AssignmentCreate, AssignmentUpdate, AssignmentResponse
from app.core.audit import log_audit

router = APIRouter(prefix="/api/assignments", tags=["assignments"])


@router.get("", response_model=List[AssignmentResponse])
async def get_assignments(
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
    assignments = db.query(Assignment).filter(Assignment.deleted_at == None).all()
    return assignments


@router.post("", response_model=AssignmentResponse)
async def create_assignments(
    payload: AssignmentCreate,
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

    # 部署の存在チェック
    department = db.query(Department).filter(Department.id == payload.department_id).first()
    if not department:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="部署が見つかりません",
        )

    # ユーザの存在チェック
    manager = db.query(User).filter(User.id == payload.manager_id).first()
    if not manager:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ユーザが見つかりません",
        )

    # 部署とユーザの組み合わせが既に存在するかチェック
    existing_assignment = db.query(Assignment).filter(
        Assignment.department_id == payload.department_id,
        Assignment.manager_id == payload.manager_id,
        Assignment.deleted_at == None
    ).first()
    if existing_assignment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="既に登録されています",
        )

    # 削除済みとして組み合わせが既に存在している場合は、削除済みフラグを削除する
    existing_assignment = db.query(Assignment).filter(
        Assignment.department_id == payload.department_id,
        Assignment.manager_id == payload.manager_id,
        Assignment.deleted_at != None
    ).first()
    if existing_assignment:
        existing_assignment.deleted_at = None
        db.commit()
        db.refresh(existing_assignment)
        log_audit(db, "assignment_create", current_user.id, "assignment", existing_assignment.id, details={"department_id": existing_assignment.department_id, "manager_id": existing_assignment.manager_id})
        return existing_assignment


    # 新規登録
    new_assignment = Assignment(
        department_id=payload.department_id,
        manager_id=payload.manager_id,
    )
    db.add(new_assignment)
    db.commit()
    db.refresh(new_assignment)

    # 監視ログの更新：assignment_create　user_id, resource_id, 変更内容
    log_audit(db, "assignment_create", current_user.id, "assignment", new_assignment.id, details={"department_id": new_assignment.department_id, "manager_id": new_assignment.manager_id})
    return new_assignment


@router.delete("/{assignment_id}", response_model=AssignmentResponse)
async def delete_assignment(
    assignment_id: str,
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
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="割当が見つかりません",
        )
    assignment.deleted_at = datetime.now()
    db.commit()
    db.refresh(assignment)
    log_audit(db, "assignment_delete", current_user.id, "assignment", assignment.id)
    return assignment