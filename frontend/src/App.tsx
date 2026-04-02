import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import AnswerInput from './pages/AnswerInput';
import AnswerHistory from './pages/AnswerHistory';
import QuestionManage from './pages/QuestionManage';
import SummaryDashboard from './pages/SummaryDashboard';
import AdminSettings from './pages/AdminSettings';
import Onboarding from './pages/Onboarding';

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>読み込み中...</div>;
  }

  return (
    <Routes>
      {/* 未認証時のみアクセス可能。認証済みなら権限に応じた画面へ */}
      <Route
        path="/"
        element={
          user ? (
            <Navigate to={user.role === 'admin' ? '/admin/settings' : user.role === 'manager' ? '/admin' : '/answer'} replace />
          ) : (
            <Login />
          )
        }
      />

      {/* 従業員専用ルート */}
      <Route
        path="/answer"
        element={
          <ProtectedRoute allowedRoles={['employee', 'manager', 'admin']}>
            <Layout>
              <AnswerInput />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* 管理者専用ルート */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['manager', 'admin']}>
            <Layout>
              <QuestionManage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/summary"
        element={
          <ProtectedRoute allowedRoles={['manager', 'admin']}>
            <Layout>
              <SummaryDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* システム管理者専用ルート */}
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Layout>
              <AdminSettings />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* 共通画面 */}
      <Route
        path="/history"
        element={
          <ProtectedRoute>
            <Layout>
              <AnswerHistory />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/onboarding"
        element={
          <ProtectedRoute allowOnboarding={true}>
            <Onboarding />
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
