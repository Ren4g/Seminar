/**
 * @file ChangePasswordModal.tsx
 * @description Popup đổi mật khẩu tài khoản cho người dùng đang đăng nhập (Admin / Content Manager).
 * @useCase UC03 – Đổi mật khẩu
 * @activityDiagram Bước "Đổi mật khẩu người dùng".
 */

import { useState, type FormEvent } from 'react';
import { api, ApiError } from '../../api';

type ChangePasswordModalProps = {
  token: string;
  isOpen: boolean;
  onClose: () => void;
  onToast: (message: string) => void;
};

// [TÍNH NĂNG: UC03 - Popup đổi mật khẩu tài khoản đang đăng nhập]
export function ChangePasswordModal({
  token,
  isOpen,
  onClose,
  onToast,
}: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('Mật khẩu mới phải có tối thiểu 8 ký tự.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không trùng khớp.');
      return;
    }

    if (newPassword === currentPassword) {
      setError('Mật khẩu mới không được trùng với mật khẩu hiện tại.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.changePassword(token, currentPassword, newPassword);
      onToast(res.message || 'Đã đổi mật khẩu thành công.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không thể đổi mật khẩu. Vui lòng kiểm tra lại mật khẩu hiện tại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card">
        <div className="modal-header">
          <h3>Đổi mật khẩu tài khoản</h3>
          <button
            type="button"
            className="icon-button"
            aria-label="Đóng popup"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="crud-form" style={{ gridTemplateColumns: '1fr', marginTop: '16px', borderBottom: 'none', paddingBottom: 0 }}>
          <p className="login-hint" style={{ margin: 0 }}>
            Nhập mật khẩu hiện tại và mật khẩu mới để cập nhật bảo mật tài khoản.
          </p>

          <label>
            Mật khẩu hiện tại
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Nhập mật khẩu đang dùng"
              required
              autoComplete="current-password"
            />
          </label>

          <label>
            Mật khẩu mới (tối thiểu 8 ký tự)
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mật khẩu mới"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </label>

          <label>
            Xác nhận mật khẩu mới
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu mới"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </label>

          {error && <p className="login-error">{error}</p>}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
            <button
              type="button"
              className="ghost-button"
              onClick={onClose}
              disabled={loading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="primary-button"
              disabled={loading}
            >
              {loading ? 'Đang lưu…' : 'Cập nhật mật khẩu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
