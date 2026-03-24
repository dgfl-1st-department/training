import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const appName = import.meta.env.VITE_APP_NAME || '従業員アンケートシステム';

  return (
    <div className="layout">
      <header className="header">
        <div className="header-inner">
          <div className="header-left">
            <span className="logo">
              {appName}
            </span>
            {user && (
              <nav className="nav">
                <button onClick={() => navigate('/answer')}>回答入力</button>
                <button onClick={() => navigate('/history')}>回答履歴</button>
                {user.role === 'admin' && (
                  <>
                    <button onClick={() => navigate('/admin')}>質問管理</button>
                    <button onClick={() => navigate('/admin/summary')}>集計ダッシュボード</button>
                  </>
                )}
              </nav>
            )}
          </div>
          {user && (
            <div className="header-right">
              <span className="user-name">
                [{user.role === 'admin' ? '管理者' : '従業員'}] {user.name || user.email}
              </span>
              <button className="logout-button" onClick={logout}>ログアウト</button>
            </div>
          )}
        </div>
      </header>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;
