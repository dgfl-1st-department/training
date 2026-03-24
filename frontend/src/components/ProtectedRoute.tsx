import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('employee' | 'admin')[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>読み込み中...</div>;
  }

  if (!user) {
    // ログインしていない場合はログイン画面へ（トップページ）
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // 権限がない場合は、適切な画面へリダイレクト
    return <Navigate to={user.role === 'admin' ? '/admin' : '/answer'} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
