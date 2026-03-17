import React from 'react';

const Dashboard: React.FC = () => {
  return (
    <div className="card-base dashboard-container">
      <h2>回答入力画面 (ダミー)</h2>
      <p>設計書 3.3.2 に基づく実装がここに入ります。</p>
      <div className="dummy-form">
        <div className="form-item">
          <label>回答日:</label>
          <input type="date" defaultValue={new Date().toISOString().split('T')[0]} />
        </div>
        <div className="question">
          <p>質問1: 今日の気分はどうですか？</p>
          <div className="rating">
            {[1, 2, 3, 4, 5].map(n => (
              <label key={n}>
                <input type="radio" name="q1" value={n} /> {n}
              </label>
            ))}
          </div>
        </div>
        <button className="save-button">保存</button>
      </div>
    </div>
  );
};

export default Dashboard;
