import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import {
  getQuestions,
  createAnswers,
  getAnswers,
  Question,
  AnswerCreate,
  QuestionAnswerType,
} from '../services/api';

/** ローカル日付 YYYY-MM-DD（回答日はシステム日付で固定。Issue #35） */
function todayLocalYmd(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function monthRangeYmd(d: Date): { start: string; end: string } {
  const y = d.getFullYear();
  const m = d.getMonth();
  const start = `${y}-${String(m + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(y, m + 1, 0).getDate();
  const end = `${y}-${String(m + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { start, end };
}

const AnswerInput: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dateParam = searchParams.get('date');

  const fixedToday = useMemo(() => todayLocalYmd(), []);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [answerDate, setAnswerDate] = useState<string>(
    () => dateParam || fixedToday
  );
  const [answers, setAnswers] = useState<Record<string, AnswerCreate>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** 新規入力かつ当月に既存回答あり（Issue #35: 質問は出さずメッセージ＋履歴リンク） */
  const [alreadyAnsweredThisMonth, setAlreadyAnsweredThisMonth] = useState(false);

  const showError = (message: string) => {
    setError(message);
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setAlreadyAnsweredThisMonth(false);

        if (!dateParam) {
          const { start, end } = monthRangeYmd(new Date());
          const [questionsData, monthAnswers] = await Promise.all([
            getQuestions(),
            getAnswers(start, end),
          ]);
          if (monthAnswers.length > 0) {
            setAlreadyAnsweredThisMonth(true);
            setQuestions([]);
            setAnswers({});
            return;
          }
          setAnswerDate(fixedToday);

          setQuestions(questionsData.sort((a, b) => a.sort_order - b.sort_order));
          const initialAnswers: Record<string, AnswerCreate> = {};
          questionsData.forEach(q => {
            initialAnswers[q.id] = {
              question_id: q.id,
              rating: null,
              free_text: ''
            };
          });
          setAnswers(initialAnswers);
          return;
        }

        setAnswerDate(dateParam);
        const [questionsData, existingAnswersData] = await Promise.all([
          getQuestions(),
          getAnswers(dateParam, dateParam),
        ]);

        // 指定された日付の回答がない場合はエラーを表示
        if (existingAnswersData.length === 0) {
          showError('指定された日付には回答履歴がありません。');
          return;
        }

        // 編集モード：既存の回答がある質問のみを表示
        const displayQuestions = existingAnswersData.map(ans => {
          const q = questionsData.find(pq => pq.id === ans.question_id);
          if (q) return q;
          const inferredFree = ans.rating == null && !!(ans.free_text && String(ans.free_text).trim());
          const answerType: QuestionAnswerType = inferredFree ? 'free' : 'rating';
          return {
            id: ans.question_id,
            text: '（現在非公開、または取得できない質問内容です）',
            category: 'work',
            answer_type: answerType,
            is_public: false,
            sort_order: 999,
            is_missing: true
          } as any;
        });

        displayQuestions.sort((a: any, b: any) => a.sort_order - b.sort_order);
        setQuestions(displayQuestions);

        const initialAnswers: Record<string, AnswerCreate> = {};
        existingAnswersData.forEach(ans => {
          initialAnswers[ans.question_id] = {
            question_id: ans.question_id,
            rating: ans.rating,
            free_text: ans.free_text || ''
          };
        });
        setAnswers(initialAnswers);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        showError('データの取得に失敗しました。');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    return () => {
      setError(null);
      setAnswers({});
    };
  }, [dateParam, fixedToday]);

  const handleRatingChange = (questionId: string, rating: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: { ...prev[questionId], rating }
    }));
  };

  const handleTextChange = (questionId: string, text: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: { ...prev[questionId], free_text: text }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const today = todayLocalYmd();
    if (answerDate > today) {
      showError('未来の日付で回答を登録することはできません。');
      return;
    }

    const atype = (q: Question) => q.answer_type ?? 'rating';
    for (const q of questions) {
      if ((q as any).is_missing) continue;
      const a = answers[q.id];
      if (!a) continue;
      if (atype(q) === 'rating') {
        if (a.rating === null || a.rating === undefined) {
          showError('レーティング形式の設問はすべて 1〜5 を選択してください。');
          return;
        }
      } else {
        if (!a.free_text?.trim()) {
          showError('自由記述形式の設問は本文の入力が必須です。');
          return;
        }
      }
    }

    try {
      setSubmitting(true);
      setError(null);
      await createAnswers({
        answer_date: answerDate,
        answers: Object.values(answers)
      });
      setIsSubmitted(true);
      setTimeout(() => {
        navigate('/history');
      }, 3000);
    } catch (err) {
      console.error('Failed to save answers:', err);
      let msg = '回答の保存に失敗しました。';
      if (axios.isAxiosError(err)) {
        const d = err.response?.data;
        if (typeof d?.detail === 'string') msg = d.detail;
        else if (Array.isArray(d?.detail)) msg = d.detail.map((x: { msg?: string }) => x.msg || '').join(' ') || msg;
      }
      showError(msg);
      setIsSubmitted(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="dashboard-container">読み込み中...</div>;

  if (!dateParam && alreadyAnsweredThisMonth) {
    return (
      <div className="card-base dashboard-container">
        <h2>回答入力</h2>
        <div className="alert-info">
          <p className="alert-info-text">
            当月は既に回答を登録しています。履歴画面から内容をご確認ください。
          </p>
          <Link to="/history" className="save-button alert-info-link">
            回答履歴を見る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="card-base dashboard-container">
      <h2>回答入力</h2>

      {error ? (
        <div className="alert-error">
          {error}
        </div>
      ) : isSubmitted ? (
        <div className="alert-success">
          <div className="progress-bar"></div>
          ご回答ありがとうございました。<br />3秒後に一覧画面へ遷移します。
        </div>
      ) : (
        <></>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-item form-item-date">
          <label htmlFor="answer-date">回答日</label>
          {dateParam ? (
            <input
              id="answer-date"
              type="date"
              value={answerDate}
              readOnly
              className="form-date-input"
            />
          ) : (
            <input
              id="answer-date"
              type="text"
              value={answerDate}
              readOnly
              className="form-date-input"
              aria-readonly="true"
            />
          )}
        </div>

        <div className="questions-container">
          {questions.map((q) => (
            <div key={q.id} className="question-item">
              <p className={`question-text ${(q as any).is_missing ? 'text-muted' : ''}`}>
                {q.text} <span className="required-star">*</span>
                {(q as any).is_missing && (
                  <span style={{ fontSize: '0.8rem', color: '#ef4444', display: 'block', marginTop: '4px' }}>
                    ※この質問は現在非公開のため、内容を確認・編集することができません。
                  </span>
                )}
              </p>

              {(q.answer_type ?? 'rating') === 'rating' ? (
                <div className="rating">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <label key={num} className="rating-label">
                      <input
                        type="radio"
                        name={`question-${q.id}`}
                        value={num}
                        checked={answers[q.id]?.rating === num}
                        onChange={() => handleRatingChange(q.id, num)}
                        className="rating-input"
                        disabled={submitting || (q as any).is_missing}
                      />
                      {num}
                    </label>
                  ))}
                </div>
              ) : (
                <div className="free-text-container">
                  <label className="free-text-label">自由記述（必須）</label>
                  <textarea
                    className="free-text-area"
                    value={answers[q.id]?.free_text || ''}
                    onChange={(e) => handleTextChange(q.id, e.target.value)}
                    placeholder={(q as any).is_missing ? '編集できません' : '回答を入力してください'}
                    disabled={submitting || (q as any).is_missing}
                    required
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="form-actions">
          {questions.length > 0 ? (
            <>
              <button type="submit" className="save-button" disabled={submitting}>
                {submitting ? '保存中...' : '保存する'}
              </button>
              <button
                type="button"
                className="logout-button"
                onClick={() => navigate('/history')}
              >
                キャンセル
              </button>
            </>
          ) : (
            error ? (
              <button
                type="button"
                className="save-button"
                onClick={() => navigate('/history')}
              >
                一覧に戻る
              </button>
            ) : (
              <p>現在、公開中の質問はありません。</p>
            )
          )}
        </div>
      </form>
    </div>
  );
};

export default AnswerInput;
