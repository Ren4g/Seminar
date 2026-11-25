/**
 * @file UserPanel.tsx
 * @description Màn hình "Người dùng": Tạo tài khoản mới, phân quyền (CONTENT_MANAGER / ADMIN), gán địa điểm phụ trách, khóa/kích hoạt tài khoản.
 * @screen Tab "Người dùng" trong trang quản trị Admin.
 * @activityDiagram Bước "Phân quyền và quản lý tài khoản nhân viên / biên tập viên".
 * 
 * @customization Điểm cấu hình & Tùy biến nhanh:
 *  - Form tạo người dùng: Thẻ `<form className="crud-form user-form">`.
 *  - Phân quyền gán địa điểm: Thẻ `<select>` trong từng hàng danh sách.
 */

import { useEffect, useState, type FormEvent } from 'react';
import { api, type ApiLocation, type ApiUser } from '../../api';

type UserPanelProps = {
  token: string;
  onToast: (message: string) => void;
};

// [TÍNH NĂNG: Quản lý người dùng workspace và phân quyền địa điểm]
export function UserPanel({ token, onToast }: UserPanelProps) {
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [locations, setLocations] = useState<ApiLocation[]>([]);
  const [assignments, setAssignments] = useState<Record<number, number[]>>({});
  const [form, setForm] = useState({ username: '', email: '', password: '', roleName: 'CONTENT_MANAGER' });
  const [busy, setBusy] = useState(false);

  const reload = async () => {
    const [nextUsers, nextLocations] = await Promise.all([api.users(token), api.locations(token)]);
    setUsers(nextUsers);
    setLocations(nextLocations);
    const pairs = await Promise.all(
      nextUsers.map(async (user) => [user.id, await api.userLocations(token, user.id)] as const)
    );
    setAssignments(Object.fromEntries(pairs));
  };

  useEffect(() => {
    void reload().catch((error: unknown) =>
      onToast(error instanceof Error ? error.message : 'Không thể tải người dùng')
    );
  }, []);

  // [TÍNH NĂNG: Tạo tài khoản người dùng mới]
  const create = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      await api.createUser(token, form.username, form.email, form.password, form.roleName);
      await reload();
      setForm({ username: '', email: '', password: '', roleName: 'CONTENT_MANAGER' });
      onToast('Đã tạo người dùng.');
    } catch (error) {
      onToast(error instanceof Error ? error.message : 'Không thể tạo người dùng');
    } finally {
      setBusy(false);
    }
  };

  // [TÍNH NĂNG: Khóa hoặc mở khóa tài khoản]
  const toggle = async (user: ApiUser) => {
    try {
      await api.setUserActive(token, user.id, !user.isActive);
      await reload();
      onToast(user.isActive ? 'Đã khóa tài khoản.' : 'Đã kích hoạt tài khoản.');
    } catch (error) {
      onToast(error instanceof Error ? error.message : 'Không thể cập nhật tài khoản');
    }
  };

  // [TÍNH NĂNG: Gán quyền quản lý địa điểm cho người dùng]
  const assign = async (userId: number, locationId: number) => {
    try {
      await api.assignUserLocation(token, userId, locationId);
      setAssignments((current) => ({
        ...current,
        [userId]: [...(current[userId] ?? []), locationId],
      }));
      onToast('Đã gán location cho người dùng.');
    } catch (error) {
      onToast(error instanceof Error ? error.message : 'Không thể gán location');
    }
  };

  return (
    <section className="catalog-panel">
      <div className="catalog-heading">
        <div>
          <h2>Người dùng workspace.</h2>
        </div>
        <span className="catalog-count">{users.length} tài khoản</span>
      </div>

      <form className="crud-form user-form" onSubmit={create}>
        <label>
          Tên đăng nhập
          <input
            value={form.username}
            onChange={(event) => setForm({ ...form, username: event.target.value })}
            required
          />
        </label>
        <label>
          Email
          <input
            type="email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            required
          />
        </label>
        <label>
          Mật khẩu
          <input
            type="password"
            minLength={8}
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            required
          />
        </label>
        <label>
          Vai trò
          <select
            value={form.roleName}
            onChange={(event) => setForm({ ...form, roleName: event.target.value })}
          >
            <option value="CONTENT_MANAGER">Content Manager</option>
            <option value="ADMIN">Admin</option>
          </select>
        </label>
        <button type="submit" className="primary-button" disabled={busy}>
          {busy ? 'Đang tạo…' : 'Tạo người dùng'}
        </button>
      </form>

      <div className="crud-table">
        {users.map((user) => (
          <div className="crud-row user-row" key={user.id}>
            <strong>{user.username}</strong>
            <span>{user.email}</span>
            <span>{user.role === 'CONTENT_MANAGER' ? 'Content Manager' : user.role}</span>
            <select
              value=""
              onChange={(event) => {
                if (event.target.value) void assign(user.id, Number(event.target.value));
              }}
            >
              <option value="">Gán location…</option>
              {locations
                .filter((location) => !(assignments[user.id] ?? []).includes(location.id))
                .map((location) => (
                  <option key={location.id} value={location.id}>
                    Location #{location.id}
                  </option>
                ))}
            </select>
            <small>
              {(assignments[user.id] ?? []).map((id) => `Location #${id}`).join(', ') ||
                'Chưa gán location'}
            </small>
            <button type="button" className="quiet-button" onClick={() => toggle(user)}>
              {user.isActive ? 'Khóa' : 'Kích hoạt'}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
