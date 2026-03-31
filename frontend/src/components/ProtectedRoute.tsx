import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('employee' | 'manager' | 'admin')[];
  allowOnboarding?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles, allowOnboarding = false }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>読み込み中...</div>;
  }

  if (!user) {
    // ログインしていない場合はログイン画面へ（トップページ）
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // オンボーディング未完了の場合はオンボーディング画面へ
  if (!user.onboarding_at && !allowOnboarding && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // 権限がない場合は、適切な画面へリダイレクト
    const target = user.role === 'admin' ? '/admin/settings' : user.role === 'manager' ? '/admin' : '/answer';
    return <Navigate to={target} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
