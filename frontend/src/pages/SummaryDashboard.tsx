import React from 'react';

const SummaryDashboard: React.FC = () => {
  return (
    <div className="card-base dashboard-container">
      <h2>集計ダッシュボード</h2>
      <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '24px' }}>
        ※表示されているデータはすべてテスト用のダミーデータです。
      </p>

      {/* フィルタセクション */}
      <section style={{ 
        padding: '20px', 
        background: '#f9fafb', 
        borderRadius: '8px', 
        border: '1px solid #e5e7eb',
        marginBottom: '32px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '20px',
        alignItems: 'flex-end'
      }}>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.875rem' }}>期間:</label>
          <select style={{ padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}>
            <option>日</option>
            <option selected>週</option>
            <option>月</option>
          </select>
        </div>
        <div style={{ flex: '2', minWidth: '200px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.875rem' }}>部署 (複数選択):</label>
          <div style={{ 
            padding: '4px 12px', 
            borderRadius: '4px', 
            border: '1px solid #d1d5db', 
            background: 'white',
            height: '38px',
            overflowY: 'auto',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            alignItems: 'center'
          }}>
            {['第1営業部', '第2営業部', '開発部', '人事部', '総務部'].map(dept => (
              <label key={dept} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 'normal', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                <input type="checkbox" defaultChecked={dept === '開発部'} style={{ margin: 0 }} /> {dept}
              </label>
            ))}
          </div>
        </div>
        <button className="save-button" style={{ padding: '8px 24px', height: '38px' }}>反映</button>
      </section>

      {/* 5段階評価の平均セクション */}
      <section style={{ marginBottom: '40px' }}>
        <h3 style={{ borderLeft: '4px solid var(--primary-color)', paddingLeft: '12px', marginBottom: '20px' }}>
          5段階評価の平均（質問ごと）
        </h3>
        <div style={{ padding: '24px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid #f3f4f6' }}>
                <th style={{ padding: '12px' }}>質問項目</th>
                <th style={{ padding: '12px', width: '120px' }}>平均スコア</th>
                <th style={{ padding: '12px' }}>分布</th>
              </tr>
            </thead>
            <tbody>
              {[
                { q: "今日の気分はどうですか？", s: "4.2", b: "80%" },
                { q: "業務量は適切ですか？", s: "3.8", b: "65%" },
                { q: "チームの協力体制はどうですか？", s: "4.5", b: "90%" }
              ].map((item, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '12px' }}>{item.q}</td>
                  <td style={{ padding: '12px', fontWeight: '700', color: 'var(--primary-color)' }}>{item.s}</td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ width: '100%', maxWidth: '200px', height: '12px', background: '#e5e7eb', borderRadius: '6px', overflow: 'hidden' }}>
                      <div style={{ width: item.b, height: '100%', background: 'var(--primary-color)' }}></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 自由記述一覧セクション */}
      <section>
        <h3 style={{ borderLeft: '4px solid var(--primary-color)', paddingLeft: '12px', marginBottom: '20px' }}>
          自由記述一覧（要約表示）
        </h3>
        <div style={{ padding: '0', background: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '12px', width: '100px' }}>日付</th>
                <th style={{ padding: '12px', width: '150px' }}>部署</th>
                <th style={{ padding: '12px' }}>内容（要約）</th>
              </tr>
            </thead>
            <tbody>
              {[
                { d: "2024/03/15", dep: "開発部", t: "新プロジェクトの立ち上げがスムーズで、チームの士気が高まっている。" },
                { d: "2024/03/14", dep: "営業部", t: "リモートワークと出社のバランスについて、もう少し柔軟性が欲しいとの声あり。" },
                { d: "2024/03/14", dep: "人事部", t: "研修制度の充実が必要。特に技術研修への要望が強い。" }
              ].map((item, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '12px', fontSize: '0.875rem', color: '#6b7280' }}>{item.d}</td>
                  <td style={{ padding: '12px', fontSize: '0.875rem' }}>{item.dep}</td>
                  <td style={{ padding: '12px', fontSize: '0.875rem' }}>{item.t}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default SummaryDashboard;
