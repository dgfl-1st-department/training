import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
  const { login } = useAuth();
  const appName = import.meta.env.VITE_APP_NAME || '従業員アンケートシステム';

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>{appName}</h1>
        <button className="google-login-button" onClick={login}>
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
          Google でログイン
        </button>
      </div>
    </div>
  );
};

export default Login;
