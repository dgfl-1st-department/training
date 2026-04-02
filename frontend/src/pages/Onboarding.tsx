import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getDepartments, getLocations, patchOnboarding, Department, Location } from '../services/api';

const Onboarding: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [deps, locs] = await Promise.all([getDepartments(), getLocations()]);
        setDepartments(deps);
        setLocations(locs);
      } catch (err) {
        console.error('Failed to fetch master data', err);
        setError('データの取得に失敗しました。');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDepartment || !selectedLocation) {
      setError('部署と拠点を両方選択してください。');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await patchOnboarding(selectedDepartment, selectedLocation);
      await refreshUser();
    } catch (err) {
      console.error('Onboarding failed', err);
      setError('登録に失敗しました。');
      setSubmitting(false);
    }
  };

  // ユーザー情報が更新されたら適切な画面へ（オンボーディング完了済みの場合）
  useEffect(() => {
    if (user?.onboarding_at) {
      const target = user.role === 'admin' ? '/admin/settings' : user.role === 'manager' ? '/admin' : '/answer';
      navigate(target, { replace: true });
    }
  }, [user, navigate]);

  if (loading) return <div className="dashboard-container">読み込み中...</div>;

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>初期設定</h1>
        <p style={{ marginBottom: '24px', color: 'var(--text-muted)' }}>
          ご利用を開始するために、所属部署と拠点を選択してください。
        </p>

        {error && <div className="alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ textAlign: 'left' }}>
            <label htmlFor="department">部署</label>
            <select
              id="department"
              className="form-select"
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              required
              disabled={submitting}
            >
              <option value="">選択してください</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ textAlign: 'left' }}>
            <label htmlFor="location">拠点</label>
            <select
              id="location"
              className="form-select"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              required
              disabled={submitting}
            >
              <option value="">選択してください</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="save-button"
            style={{ width: '100%', marginTop: '16px' }}
            disabled={submitting || !selectedDepartment || !selectedLocation}
          >
            {submitting ? '登録中...' : '登録して開始する'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Onboarding;
