/**
 * @file LoginScreen.tsx
 * @description Màn hình đăng nhập dành cho Quản trị viên và Quản lý nội dung (Admin / Content Manager).
 * @screen Hiển thị khi người dùng chưa có phiên đăng nhập (token rỗng).
 * @activityDiagram Bước "Đăng nhập hệ thống quản trị".
 * 
 * @customization Điểm cấu hình & Tùy biến nhanh:
 *  - URL API hiển thị dưới chân form: Biến `API_URL`.
 *  - Giao diện form: Class `.login-screen`, `.login-card` trong `styles.css`.
 */

import { useState, type FormEvent } from 'react';
import { api, API_URL, ApiError } from '../../api';

type LoginScreenProps = {
  onLoginSuccess: (token: string) => void;
};

// [TÍNH NĂNG: Màn hình đăng nhập hệ thống quản trị]
export function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [login, setLogin] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);

  // [TÍNH NĂNG: Xử lý đăng nhập tài khoản]
  const signIn = async (event: FormEvent) => {
    event.preventDefault();
    setLoginError('');
    setLoading(true);
    try {
      const result = await api.login(login.username, login.password);
      localStorage.setItem('audio-guide-token', result.accessToken);
      onLoginSuccess(result.accessToken);
    } catch (error) {
      setLoginError(error instanceof ApiError ? error.message : 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={signIn}>
        <div className="brand login-brand">
          <div className="brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div>
            <strong>audio guide</strong>
            <small>Content studio</small>
          </div>
        </div>

        <h1>Đăng nhập để quản lý nội dung.</h1>

        <label>
          Tài khoản
          <input
            value={login.username}
            onChange={(event) => setLogin({ ...login, username: event.target.value })}
            autoComplete="username"
            required
          />
        </label>

        <label>
          Mật khẩu
          <input
            type="password"
            value={login.password}
            onChange={(event) => setLogin({ ...login, password: event.target.value })}
            autoComplete="current-password"
            required
          />
        </label>

        {loginError && <p className="login-error">{loginError}</p>}

        <button className="primary-button" disabled={loading}>
          {loading ? 'Đang kết nối…' : 'Đăng nhập'}
        </button>

        <small className="login-hint">API: {API_URL}</small>
      </form>
    </div>
  );
}
