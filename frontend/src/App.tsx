import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SummaryDashboard from './pages/SummaryDashboard';

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>読み込み中...</div>;
  }

  return (
    <Routes>
      {/* 未認証時のみアクセス可能。認証済みならダッシュボードへ */}
      <Route
        path="/"
        element={
          user ? (
            <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />
          ) : (
            <Login />
          )
        }
      />

      {/* 従業員専用ルート */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={['employee', 'admin']}>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* 管理者専用ルート */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Layout>
              <div className="card-base dashboard-container">
                <h2>質問管理画面 (管理者ダミー)</h2>
                <p>バックエンドから取得した実際のロールに基づき、ここにアクセスしています。</p>
              </div>
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/summary"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Layout>
              <SummaryDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* 共通のダミー画面 */}
      <Route
        path="/history"
        element={
          <ProtectedRoute>
            <Layout>
              <div className="card-base dashboard-container">
                <h2>回答履歴画面 (準備中)</h2>
                <p>設計書 3.3.3 に基づく実装がここに入ります。</p>
              </div>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
