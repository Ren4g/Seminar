/**
 * @file LoginScreen.tsx
 * @description Màn hình đăng nhập và khôi phục mật khẩu dành cho Quản trị viên và Quản lý nội dung.
 * @screen Hiển thị khi người dùng chưa có phiên đăng nhập (token rỗng).
 * @useCase UC01 – Đăng nhập, UC04 – Khôi phục mật khẩu
 * @activityDiagram Bước "Đăng nhập hệ thống quản trị" và "Khôi phục mật khẩu".
 */

import { useState, type FormEvent } from 'react';
import { api, API_URL, ApiError } from '../../api';

type LoginScreenProps = {
  onLoginSuccess: (token: string) => void;
};

type ScreenMode = 'login' | 'forgot' | 'reset';

// [TÍNH NĂNG: Màn hình đăng nhập hệ thống quản trị & Khôi phục mật khẩu]
export function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [mode, setMode] = useState<ScreenMode>('login');
  const [login, setLogin] = useState({ username: '', password: '' });
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetData, setResetData] = useState({ token: '', newPassword: '', confirmPassword: '' });
  const [demoToken, setDemoToken] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // [TÍNH NĂNG: UC01 - Xử lý đăng nhập tài khoản]
  const signIn = async (event: FormEvent) => {
    event.preventDefault();
    setErrorMessage('');
    setStatusMessage('');
    setLoading(true);
    try {
      const result = await api.login(login.username, login.password);
      localStorage.setItem('audio-guide-token', result.accessToken);
      onLoginSuccess(result.accessToken);
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Đăng nhập thất bại.');
    } finally {
      setLoading(false);
    }
  };

  // [TÍNH NĂNG: UC04 - Gửi yêu cầu khôi phục mật khẩu]
  const requestForgotPassword = async (event: FormEvent) => {
    event.preventDefault();
    setErrorMessage('');
    setStatusMessage('');
    setLoading(true);
    try {
      const res = await api.forgotPassword(forgotEmail);
      setStatusMessage(res.message);
      if (res.resetToken) {
        setDemoToken(res.resetToken);
        setResetData((prev) => ({ ...prev, token: res.resetToken! }));
      }
      setMode('reset');
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Không thể gửi yêu cầu khôi phục.');
    } finally {
      setLoading(false);
    }
  };

  // [TÍNH NĂNG: UC04 - Xác thực mã và hoàn tất đặt lại mật khẩu]
  const submitResetPassword = async (event: FormEvent) => {
    event.preventDefault();
    setErrorMessage('');
    setStatusMessage('');

    if (resetData.newPassword.length < 8) {
      setErrorMessage('Mật khẩu mới phải có ít nhất 8 ký tự.');
      return;
    }

    if (resetData.newPassword !== resetData.confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không trùng khớp.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.resetPassword(resetData.token, resetData.newPassword);
      setStatusMessage(res.message);
      setMode('login');
      setResetData({ token: '', newPassword: '', confirmPassword: '' });
      setDemoToken('');
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Không thể đặt lại mật khẩu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card">
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

        {/* ==================== CHẾ ĐỘ 1: ĐĂNG NHẬP (UC01) ==================== */}
        {mode === 'login' && (
          <form onSubmit={signIn}>
            <div className="login-header-text">
              <h1>Đăng nhập để quản lý nội dung.</h1>
            </div>

            {statusMessage && (
              <div className="login-alert login-alert--success">
                {statusMessage}
              </div>
            )}

            <label>
              Tài khoản
              <input
                value={login.username}
                onChange={(event) => setLogin({ ...login, username: event.target.value })}
                autoComplete="username"
                placeholder="Tên đăng nhập"
                required
              />
            </label>

            <label>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Mật khẩu</span>
                <button
                  type="button"
                  className="login-switch-btn"
                  onClick={() => {
                    setMode('forgot');
                    setErrorMessage('');
                    setStatusMessage('');
                  }}
                >
                  Quên mật khẩu?
                </button>
              </div>
              <input
                type="password"
                value={login.password}
                onChange={(event) => setLogin({ ...login, password: event.target.value })}
                autoComplete="current-password"
                placeholder="Mật khẩu"
                required
              />
            </label>

            {errorMessage && <p className="login-error">{errorMessage}</p>}

            <button className="primary-button" disabled={loading} style={{ width: '100%', marginTop: '8px' }}>
              {loading ? 'Đang kết nối…' : 'Đăng nhập'}
            </button>
          </form>
        )}

        {/* ==================== CHẾ ĐỘ 2: QUÊN MẬT KHẨU (UC04) ==================== */}
        {mode === 'forgot' && (
          <form onSubmit={requestForgotPassword}>
            <div className="login-header-text">
              <h1>Khôi phục mật khẩu.</h1>
              <p>Nhập email tài khoản đã đăng ký để nhận mã khôi phục hiệu lực trong 30 phút.</p>
            </div>

            <label>
              Email đăng ký
              <input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="example@audioguide.vn"
                autoComplete="email"
                required
              />
            </label>

            {errorMessage && <p className="login-error">{errorMessage}</p>}

            <button className="primary-button" disabled={loading} style={{ width: '100%', marginTop: '8px' }}>
              {loading ? 'Đang gửi yêu cầu…' : 'Gửi mã khôi phục'}
            </button>

            <div className="login-switch-row">
              <button
                type="button"
                className="quiet-button"
                onClick={() => {
                  setMode('login');
                  setErrorMessage('');
                }}
              >
                ← Quay lại đăng nhập
              </button>
              <button
                type="button"
                className="login-switch-btn"
                onClick={() => {
                  setMode('reset');
                  setErrorMessage('');
                }}
              >
                Đã có mã? Nhập mã →
              </button>
            </div>
          </form>
        )}

        {/* ==================== CHẾ ĐỘ 3: ĐẶT LẠI MẬT KHẨU (UC04) ==================== */}
        {mode === 'reset' && (
          <form onSubmit={submitResetPassword}>
            <div className="login-header-text">
              <h1>Đặt lại mật khẩu mới.</h1>
              <p>Nhập mã khôi phục 8 ký tự kèm mật khẩu mới cho tài khoản của bạn.</p>
            </div>

            {statusMessage && (
              <div className="login-alert login-alert--success">
                {statusMessage}
              </div>
            )}

            {demoToken && (
              <div className="login-code-box">
                <span>Mã khôi phục (Demo):</span>
                <strong>{demoToken}</strong>
              </div>
            )}

            <label>
              Mã khôi phục
              <input
                value={resetData.token}
                onChange={(e) => setResetData({ ...resetData, token: e.target.value.toUpperCase() })}
                placeholder="Mã 8 ký tự"
                required
              />
            </label>

            <label>
              Mật khẩu mới (tối thiểu 8 ký tự)
              <input
                type="password"
                value={resetData.newPassword}
                onChange={(e) => setResetData({ ...resetData, newPassword: e.target.value })}
                placeholder="Mật khẩu mới"
                minLength={8}
                required
              />
            </label>

            <label>
              Xác nhận mật khẩu mới
              <input
                type="password"
                value={resetData.confirmPassword}
                onChange={(e) => setResetData({ ...resetData, confirmPassword: e.target.value })}
                placeholder="Nhập lại mật khẩu mới"
                minLength={8}
                required
              />
            </label>

            {errorMessage && <p className="login-error">{errorMessage}</p>}

            <button className="primary-button" disabled={loading} style={{ width: '100%', marginTop: '8px' }}>
              {loading ? 'Đang cập nhật…' : 'Xác nhận đặt lại mật khẩu'}
            </button>

            <div className="login-switch-row" style={{ justifyContent: 'center' }}>
              <button
                type="button"
                className="quiet-button"
                onClick={() => {
                  setMode('login');
                  setErrorMessage('');
                  setStatusMessage('');
                }}
              >
                ← Quay lại đăng nhập
              </button>
            </div>
          </form>
        )}

        <small className="login-hint">API: {API_URL}</small>
      </div>
    </div>
  );
}
