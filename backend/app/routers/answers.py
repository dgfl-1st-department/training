from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
from datetime import date

from app.core.dependencies import get_db, get_current_user
from app.models.answer import Answer
from app.models.question import Question
from app.models.user import User
from app.schemas.answer import AnswersBulkCreate, AnswerUpdate, AnswerResponse

router = APIRouter(prefix="/api/answers", tags=["answers"])


@router.get("", response_model=List[AnswerResponse])
async def get_answers(
    request: Request,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # ログインユーザー自身の回答一覧を返す（期間フィルタ対応）
    query = db.query(Answer).filter(Answer.user_id == current_user.id)

    if start_date:
        query = query.filter(Answer.answer_date >= start_date)
    if end_date:
        query = query.filter(Answer.answer_date <= end_date)

    answers = query.order_by(Answer.answer_date.desc()).all()
    return answers


@router.post("", response_model=List[AnswerResponse])
async def create_answers(
    payload: AnswersBulkCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # 複数質問に対する回答を一括登録。同一日・同一質問は上書き（UPSERT）。
    results = []

    for item in payload.answers:
        # 質問の存在確認
        question = db.query(Question).filter(Question.id == item.question_id).first()
        if not question:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"question_id={item.question_id} は存在しません",
            )

        # 同一ユーザー・同一質問・同一日付の既存回答を検索（UPSERT）
        existing = (
            db.query(Answer)
            .filter(
                Answer.user_id == current_user.id,
                Answer.question_id == item.question_id,
                Answer.answer_date == payload.answer_date,
            )
            .first()
        )

        if existing:
            # 既存レコードを更新
            if item.rating is not None:
                existing.rating = item.rating
            if item.free_text is not None:
                existing.free_text = item.free_text
            db.flush()
            results.append(existing)
        else:
            # 新規登録
            new_answer = Answer(
                user_id=current_user.id,
                question_id=item.question_id,
                answer_date=payload.answer_date,
                rating=item.rating,
                free_text=item.free_text,
            )
            db.add(new_answer)
            db.flush()
            results.append(new_answer)

    db.commit()
    # commit後に各オブジェクトをリフレッシュ
    for ans in results:
        db.refresh(ans)

    return results


@router.put("/{answer_id}", response_model=AnswerResponse)
async def update_answer(
    answer_id: str,
    payload: AnswerUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # 特定の回答を更新する。自ユーザーの回答のみ許可。
    answer = db.query(Answer).filter(Answer.id == answer_id).first()
    if not answer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="回答が見つかりません",
        )

    # 権限チェック：自ユーザーの回答のみ更新可
    if answer.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="他のユーザーの回答は更新できません",
        )

    if payload.rating is not None:
        answer.rating = payload.rating
    if payload.free_text is not None:
        answer.free_text = payload.free_text

    db.commit()
    db.refresh(answer)
    return answer