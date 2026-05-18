from calendar import monthrange
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from app.core.dependencies import get_db, get_current_user
from app.models.answer import Answer
from app.models.question import Question
from app.models.user import User
from app.schemas.answer import AnswersBulkCreate, AnswerUpdate, AnswerResponse

router = APIRouter(prefix="/api/answers", tags=["answers"])


def _month_bounds(d: date) -> tuple[date, date]:
    """同一カレンダー月の初日・末日（date）。"""
    last = monthrange(d.year, d.month)[1]
    return date(d.year, d.month, 1), date(d.year, d.month, last)


def _question_answer_type_str(question: Question) -> str:
    """DB/ORM により Enum インスタンスまたは str になる場合があるため統一する。"""
    v = getattr(question, "answer_type", None)
    if v is None:
        return "rating"
    if isinstance(v, str):
        return v
    return getattr(v, "value", str(v))


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
    """一括登録。同一ユーザー・同一質問・同一月内は別日の2回目を禁止。同一日は UPSERT。"""
    results = []
    month_start, month_end = _month_bounds(payload.answer_date)

    for item in payload.answers:
        question = (
            db.query(Question)
            .filter(Question.id == item.question_id, Question.deleted_at.is_(None))
            .first()
        )
        if not question:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"question_id={item.question_id} は存在しません",
            )

        # answer_type に応じた必須項目（Issue #35）
        at = _question_answer_type_str(question)
        if at == "rating":
            if item.rating is None or not (1 <= item.rating <= 5):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="レーティング形式の設問には 1〜5 の評価が必須です",
                )
        elif at == "free":
            if item.free_text is None or not str(item.free_text).strip():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="自由記述形式の設問には本文が必須です",
                )

        # 同一月内・別日の回答があれば不可（同一日のみ UPSERT 可）
        in_month = (
            db.query(Answer)
            .filter(
                Answer.user_id == current_user.id,
                Answer.question_id == item.question_id,
                Answer.answer_date >= month_start,
                Answer.answer_date <= month_end,
            )
            .all()
        )
        for row in in_month:
            if row.answer_date != payload.answer_date:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="同一月内に既に回答が登録されています。履歴画面からご確認ください。",
                )

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
            if at == "rating":
                existing.rating = item.rating
                if item.free_text is not None:
                    existing.free_text = item.free_text
            else:
                existing.free_text = item.free_text.strip() if item.free_text else None
                existing.rating = None
            db.flush()
            results.append(existing)
        else:
            new_answer = Answer(
                user_id=current_user.id,
                question_id=item.question_id,
                answer_date=payload.answer_date,
                rating=item.rating if at == "rating" else None,
                free_text=(item.free_text.strip() if item.free_text else None) if at == "free" else item.free_text,
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