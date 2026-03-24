import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getQuestions, createAnswers, getAnswers, Question, AnswerCreate } from '../services/api';

const AnswerInput: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dateParam = searchParams.get('date');

  const [questions, setQuestions] = useState<Question[]>([]);
  const [answerDate, setAnswerDate] = useState<string>(
    dateParam || new Date().toISOString().split('T')[0]
  );
  const [answers, setAnswers] = useState<Record<number, AnswerCreate>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        const [questionsData, existingAnswersData] = await Promise.all([
          getQuestions(),
          dateParam ? getAnswers(dateParam, dateParam) : Promise.resolve([])
        ]);

        // 指定された日付の回答がない場合はエラーを表示
        if (dateParam && existingAnswersData.length === 0) {
          showError('指定された日付には回答履歴がありません。');
          return;
        }

        if (dateParam) {
          // 編集モード：既存の回答がある質問のみを表示
          const displayQuestions = existingAnswersData.map(ans => {
            const q = questionsData.find(pq => pq.id === ans.question_id);
            if (q) return q;
            return {
              id: ans.question_id,
              text: '（現在非公開、または取得できない質問内容です）',
              measurement_category: 'satisfaction',
              is_public: false,
              sort_order: 999,
              is_missing: true
            } as any;
          });

          // 表示順序でソート
          displayQuestions.sort((a: any, b: any) => a.sort_order - b.sort_order);
          setQuestions(displayQuestions);

          const initialAnswers: Record<number, AnswerCreate> = {};
          existingAnswersData.forEach(ans => {
            initialAnswers[ans.question_id] = {
              question_id: ans.question_id,
              rating: ans.rating,
              free_text: ans.free_text || ''
            };
          });
          setAnswers(initialAnswers);
        } else {
          // 新規作成モード：すべての公開中質問を表示
          setQuestions(questionsData.sort((a, b) => a.sort_order - b.sort_order));

          const initialAnswers: Record<number, AnswerCreate> = {};
          questionsData.forEach(q => {
            initialAnswers[q.id] = {
              question_id: q.id,
              rating: null,
              free_text: ''
            };
          });
          setAnswers(initialAnswers);
        }
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
  }, [dateParam]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = e.target.value;
    setAnswerDate(selectedDate);
    const today = new Date().toISOString().split('T')[0];
    if (selectedDate > today) {
      setError('未来の日付で回答を登録することはできません。');
    } else {
      setError(null);
    }
  };

  const handleRatingChange = (questionId: number, rating: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: { ...prev[questionId], rating }
    }));
  };

  const handleTextChange = (questionId: number, text: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: { ...prev[questionId], free_text: text }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // バリデーション
    const today = new Date().toISOString().split('T')[0];
    if (answerDate > today) {
      showError('未来の日付で回答を登録することはできません。');
      return;
    }

    // 必須チェック（5段階評価）
    const missingRating = questions.some(q => answers[q.id]?.rating === null);
    if (missingRating) {
      showError('すべての質問に対して5段階評価を入力してください。');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await createAnswers({
        answer_date: answerDate,
        answers: Object.values(answers)
      });
      setIsSubmitted(true);
      // alert('回答を保存しました。');
      // navigate('/history');
      // 3秒後に一覧画面へ自動遷移
      setTimeout(() => {
        navigate('/history'); // 一覧のパス
      }, 3000);
    } catch (err) {
      console.error('Failed to save answers:', err);
      showError('回答の保存に失敗しました。');
      setIsSubmitted(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="dashboard-container">読み込み中...</div>;

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
          <input
            id="answer-date"
            type="date"
            value={answerDate}
            onChange={handleDateChange}
            max={new Date().toISOString().split('T')[0]}
            required
            disabled={!!dateParam} // 編集時は日付固定
            className="form-date-input"
          />
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

              <div className="free-text-container">
                <label className="free-text-label">自由記述（任意）</label>
                <textarea
                  className="free-text-area"
                  value={answers[q.id]?.free_text || ''}
                  onChange={(e) => handleTextChange(q.id, e.target.value)}
                  placeholder={(q as any).is_missing ? "編集できません" : "具体的に気になることがあれば記入してください"}
                  disabled={submitting || (q as any).is_missing}
                />
              </div>
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
