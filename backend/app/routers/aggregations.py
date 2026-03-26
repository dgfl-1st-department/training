from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, case, and_, text
from typing import List, Optional
from datetime import date
from sqlalchemy.types import Date

from app.core.dependencies import get_db, get_current_user
from app.core.audit import log_audit
from app.models.department import Department
from app.models.user import User
from app.models.question import Question
from app.models.answer import Answer
from app.schemas.aggregations import DepartmentResponse, AggregationResponse, AggregationResult, RatingDistribution

router = APIRouter(prefix="/api/admin", tags=["admin_aggregations"])

@router.get("/departments", response_model=List[DepartmentResponse])
async def get_departments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # 権限チェック：管理者のみアクセス可能
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="管理者のみアクセス可能です",
        )
    return db.query(Department).all()

@router.get("/aggregations", response_model=AggregationResponse)
async def get_aggregations(
    request: Request,
    period: str = Query(..., pattern="^(day|week|month)$", description="集計期間（day:日次, week:週次, month:月次）"),
    start_date: Optional[date] = Query(None, description="集計開始日（YYYY-MM-DD）"),
    end_date: Optional[date] = Query(None, description="集計終了日（YYYY-MM-DD）"),
    department_ids: Optional[List[int]] = Query(None, description="部署IDのリスト"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # 権限チェック：管理者のみアクセス可能
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="管理者のみアクセス可能です",
        )

    # 期間の丸め処理
    if period == "day":
        date_trunc = Answer.answer_date
    elif period == "week":
        # 月曜日を週の開始とする
        date_trunc = func.date_sub(
            Answer.answer_date, 
            text("INTERVAL WEEKDAY(answers.answer_date) DAY")
        )
    elif period == "month":
        # 月の初日
        date_trunc = func.date_format(Answer.answer_date, "%Y-%m-01")

    print("date_trunc", date_trunc)

    # 集計クエリの構築
    query = (
        db.query(
            func.cast(date_trunc, Date).label("period_start"),
            User.department_id,
            Department.name.label("department_name"),
            Question.id.label("question_id"),
            Question.text.label("question_text"),
            func.avg(Answer.rating).label("average_rating"),
            func.count(Answer.id).label("answer_count"),
            func.sum(case((Answer.rating == 1, 1), else_=0)).label("rating_1"),
            func.sum(case((Answer.rating == 2, 1), else_=0)).label("rating_2"),
            func.sum(case((Answer.rating == 3, 1), else_=0)).label("rating_3"),
            func.sum(case((Answer.rating == 4, 1), else_=0)).label("rating_4"),
            func.sum(case((Answer.rating == 5, 1), else_=0)).label("rating_5"),
        )
        .join(User, Answer.user_id == User.id)
        .join(Question, Answer.question_id == Question.id)
        .outerjoin(Department, User.department_id == Department.id)
    )

    if start_date:
        query = query.filter(Answer.answer_date >= start_date)

    if end_date:
        query = query.filter(Answer.answer_date <= end_date)

    if department_ids:
        query = query.filter(User.department_id.in_(department_ids))

    # グループ化
    query = query.group_by(
        "period_start",
        User.department_id,
        "department_name",
        Question.id,
        "question_text"
    ).order_by("period_start", "department_name", Question.sort_order)

    print("query", query)
    results = query.all()

    # 2. 自由記述一覧の取得 (別のクエリで非NULLのfree_textを取得。DecryptionはAnswer.free_text取得時に自動で行われる)
    free_text_query = (
        db.query(
            func.cast(date_trunc, Date).label("period_start"),
            User.department_id,
            Answer.question_id,
            Answer.free_text
        )
        .join(User, Answer.user_id == User.id)
        .filter(and_(Answer.free_text.isnot(None), Answer.free_text != ""))
    )

    if start_date:
        free_text_query = free_text_query.filter(Answer.answer_date >= start_date)
    if end_date:
        free_text_query = free_text_query.filter(Answer.answer_date <= end_date)
    if department_ids:
        free_text_query = free_text_query.filter(User.department_id.in_(department_ids))

    free_texts_results = free_text_query.all()

    # グループごとに自由記述をマッピング
    # キー: (period_start, department_id, question_id)
    free_text_map = {}
    for ft_row in free_texts_results:
        key = (ft_row.period_start, ft_row.department_id, ft_row.question_id)
        if key not in free_text_map:
            free_text_map[key] = []
        free_text_map[key].append(ft_row.free_text)

    # レスポンス形式に変換
    aggregation_data = []
    for row in results:
        key = (row.period_start, row.department_id, row.question_id)
        aggregation_data.append(
            AggregationResult(
                period_start=row.period_start,
                department_id=row.department_id,
                department_name=row.department_name,
                question_id=row.question_id,
                question_text=row.question_text,
                average_rating=float(row.average_rating) if row.average_rating else 0.0,
                answer_count=row.answer_count,
                distribution=RatingDistribution(
                    rating_1=int(row.rating_1 or 0),
                    rating_2=int(row.rating_2 or 0),
                    rating_3=int(row.rating_3 or 0),
                    rating_4=int(row.rating_4 or 0),
                    rating_5=int(row.rating_5 or 0),
                ),
                free_texts=free_text_map.get(key, [])
            )
        )

    # 監査ログの記録
    log_audit(
        db, 
        "aggregation_view", 
        current_user.id, 
        "aggregation", 
        None, 
        details={
            "period": period,
            "start_date": str(start_date) if start_date else None,
            "end_date": str(end_date) if end_date else None,
            "department_ids": department_ids
        }
    )

    return AggregationResponse(aggregates=aggregation_data)
