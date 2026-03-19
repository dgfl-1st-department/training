from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from pydantic import BaseModel
from datetime import date
from app.models.answer import Answer
from app.models.question import Question

router = APIRouter(prefix="/api/answers", tags=["answers"])

class AnswerCreate(BaseModel):
    answer_date: date
    rating: int

@router.post("")
async def callback(answer_data: AnswerCreate, request: Request, db: Session = Depends(get_db)):

    test_text="これはテスト用のメッセージです。"

    # questionsがない場合は作成
    question = db.query(Question).first()
    if not question:
        question = Question(
            measurement_category="satisfaction",
            text="Test Question",
        )
        db.add(question)
        db.commit()
        db.refresh(question)

    # テスト用のAnswer登録処理
    db_answer = Answer(
        user_id=1,
        question_id=question.id,
        answer_date=answer_data.answer_date,
        rating=answer_data.rating,
        free_text=test_text,
    )
    db.add(db_answer)
    db.commit()
    return {"status": "ok"}

@router.get("")
async def callback(request: Request, db: Session = Depends(get_db)):
    answers = db.query(Answer).all()
    return answers