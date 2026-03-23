from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
from datetime import date

from app.core.dependencies import get_db, get_current_user
from app.core.audit import log_audit
from app.models.answer import Answer
from app.models.question import Question
from app.models.user import User
from app.schemas.questions import QuestionItemCreate, QuestionUpdate, QuestionResponse, QuestionVisibilityUpdate, QuestionBulkReorderPayload

router = APIRouter(prefix="/api", tags=["questions"])

# GET /api/questions 質問一覧取得（公開中のみ）
@router.get("/questions", response_model=List[QuestionResponse])
async def get_questions(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # 公開中(is_public=True)の質問一覧を返す
    query = db.query(Question).filter(Question.is_public == True)
    questions = query.order_by(Question.sort_order.asc()).all()
    return questions

# GET /api/admin/questions 質問一覧取得（全件）
@router.get("/api/admin/questions", response_model=List[QuestionResponse])
async def get_questions(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # 権限チェック：管理者のみアクセス可能
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="管理者のみアクセス可能です",
        )

    # 質問一覧を返す
    query = db.query(Question)
    questions = query.order_by(Question.sort_order.asc()).all()
    return questions

@router.post("/admin/questions", response_model=QuestionResponse)
async def create_question(
    payload: QuestionItemCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # 権限チェック：管理者のみアクセス可能
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="管理者のみアクセス可能です",
        )

    # 新規登録
    new_question = Question(
        measurement_category=payload.measurement_category,
        text=payload.text,
        is_public=payload.is_public,
        sort_order=payload.sort_order,
    )
    db.add(new_question)
    db.commit()
    db.refresh(new_question)

    # 監視ログの更新：question_create　user_id, resource_id, 変更内容
    log_audit(db, "question_create", current_user.id, "question", new_question.id, details={"text": new_question.text})
    return new_question

@router.put("/admin/questions/reorder", response_model=dict)
async def bulk_update_question_reorder(
    payload: QuestionBulkReorderPayload,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # 権限チェック：管理者のみアクセス可能
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="管理者のみアクセス可能です",
        )

    updated_ids = []
    for order in payload.orders:
        question = db.query(Question).filter(Question.id == order.id).first()
        if not question:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="質問が見つかりません",
            )
        question.sort_order = order.sort_order
        updated_ids.append(question.id)

    db.commit()
    db.refresh(question)

    return {"message": "表示順序を一括更新しました", "updated_ids": updated_ids}

@router.put("/admin/questions/{question_id}", response_model=QuestionResponse)
async def update_question(
    question_id: int,
    payload: QuestionUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # 権限チェック：管理者のみアクセス可能
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="管理者のみアクセス可能です",
        )

    # 特定の質問を更新する
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="質問が見つかりません",
        )

    if payload.measurement_category is not None:
        question.measurement_category = payload.measurement_category
    if payload.text is not None:
        question.text = payload.text
    if payload.is_public is not None:
        question.is_public = payload.is_public
    if payload.sort_order is not None:
        question.sort_order = payload.sort_order

    db.commit()
    db.refresh(question)

    # 監視ログの更新：question_update　user_id, resource_id, 変更内容
    log_audit(db, "question_update", current_user.id, "question", question.id, details=payload.dict())

    return question

@router.delete("/admin/questions/{question_id}", response_model=QuestionResponse)
async def delete_question(
    question_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # 権限チェック：管理者のみアクセス可能
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="管理者のみアクセス可能です",
        )

    # 質問を削除する
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="質問が見つかりません",
        )
    db.delete(question)
    db.commit()

    # 監視ログの更新：question_delete　user_id, resource_id, 変更内容
    log_audit(db, "question_delete", current_user.id, "question", question.id, details={"text": question.text})

    return question 

@router.patch("/admin/questions/{question_id}/visibility", response_model=QuestionResponse)
async def update_question_visibility(
    question_id: int,
    payload: QuestionVisibilityUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # 権限チェック：管理者のみアクセス可能
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="管理者のみアクセス可能です",
        )

    # 特定の質問の公開状態を更新する
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="質問が見つかりません",
        )
    if payload.is_public is not None:
        question.is_public = payload.is_public
    db.commit()
    db.refresh(question)
    # 監視ログの更新：question_visibility_change　user_id, resource_id, 変更内容
    log_audit(db, "question_visibility_change", current_user.id, "question", question.id, details={"is_public": question.is_public})

    return question

