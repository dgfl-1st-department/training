import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAnswers, Answer } from '../services/api';

const AnswerHistory: React.FC = () => {
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // フィルタ用ステート
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const data = await getAnswers(startDate || undefined, endDate || undefined);
      setAnswers(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch answers:', err);
      setError('履歴の取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchHistory();
  };

  // 日付ごとにグループ化
  const groupedAnswers = answers.reduce((acc, curr) => {
    const date = curr.answer_date;
    if (!acc[date]) {
      acc[date] = { date, count: 0 };
    }
    acc[date].count += 1;
    return acc;
  }, {} as Record<string, { date: string; count: number }>);

  const historyList = Object.values(groupedAnswers).sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="card-base dashboard-container">
      <h2>回答履歴</h2>

      <form onSubmit={handleSearch} className="filter-form">
        <div className="filter-item">
          <label className="filter-label">開始日</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="filter-input"
          />
        </div>
        <div className="filter-item">
          <label className="filter-label">終了日</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="filter-input"
          />
        </div>
        <button
          type="submit"
          className="save-button search-button"
        >
          検索
        </button>
      </form>

      {error && <p className="alert-error">{error}</p>}

      {loading ? (
        <p>読み込み中...</p>
      ) : historyList.length === 0 ? (
        <p className="text-muted">回答履歴がありません。</p>
      ) : (
        <div className="table-container">
          <table className="history-table">
            <thead>
              <tr className="table-header-row">
                <th className="table-header-cell">回答日</th>
                <th className="table-header-cell">回答数</th>
                <th className="table-header-cell">操作</th>
              </tr>
            </thead>
            <tbody>
              {historyList.map((item) => (
                <tr key={item.date} className="table-body-row">
                  <td className="table-body-cell">{item.date}</td>
                  <td className="table-body-cell">{item.count}件</td>
                  <td className="table-body-cell">
                    <button
                      onClick={() => navigate(`/dashboard?date=${item.date}`)}
                      className="edit-button"
                    >
                      編集
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AnswerHistory;
