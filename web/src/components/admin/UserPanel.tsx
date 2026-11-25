/**
 * @file UserPanel.tsx
 * @description Màn hình "Người dùng workspace": Quản trị toàn diện tài khoản nhân sự, phân quyền (ADMIN / CONTENT_MANAGER),
 * phân công & thu hồi địa điểm phụ trách, đặt lại mật khẩu, mở khóa tài khoản, tìm kiếm và lọc.
 * @screen Tab "Người dùng" trong trang quản trị Admin.
 * @useCase UC05 – Quản lý tài khoản nhân sự
 * @activityDiagram Bước "Phân quyền và quản lý tài khoản nhân viên / biên tập viên".
 */

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { api, ApiError, type ApiLocation, type ApiUser } from '../../api';

type UserPanelProps = {
  token: string;
  onToast: (message: string) => void;
};

// [TÍNH NĂNG: UC05 - Quản lý tài khoản nhân sự và phân quyền nâng cao]
export function UserPanel({ token, onToast }: UserPanelProps) {
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [locations, setLocations] = useState<ApiLocation[]>([]);
  const [busy, setBusy] = useState(false);

  // Bộ lọc & Tìm kiếm
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'CONTENT_MANAGER'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE' | 'LOCKED'>('ALL');

  // Form tạo tài khoản mới
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    roleName: 'CONTENT_MANAGER',
    selectedLocationIds: [] as number[],
  });

  // Modal Sửa thông tin / Đổi vai trò
  const [editingUser, setEditingUser] = useState<ApiUser | null>(null);
  const [editForm, setEditForm] = useState({ email: '', roleName: 'CONTENT_MANAGER' });

  // Modal Đặt lại mật khẩu (Admin Override)
  const [resettingUser, setResettingUser] = useState<ApiUser | null>(null);
  const [adminNewPassword, setAdminNewPassword] = useState('');

  const getLocationLabel = (loc: ApiLocation): string => {
    const vi = loc.translations.find((t) => t.languageCode === 'vi')?.name;
    const fallback = loc.translations[0]?.name;
    return vi || fallback || loc.address || `Địa điểm #${loc.id}`;
  };

  const reload = async () => {
    try {
      const [nextUsers, nextLocations] = await Promise.all([api.users(token), api.locations(token)]);
      setUsers(nextUsers);
      setLocations(nextLocations);
    } catch (error) {
      onToast(error instanceof Error ? error.message : 'Không thể tải danh sách người dùng.');
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  // [TÍNH NĂNG: UC05 - Tạo tài khoản người dùng mới có bắt buộc phân công cho Content Manager]
  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();

    if (form.roleName === 'CONTENT_MANAGER' && form.selectedLocationIds.length === 0) {
      onToast('Lỗi: Content Manager bắt buộc phải được phân công ít nhất một địa điểm phụ trách.');
      return;
    }

    setBusy(true);
    try {
      await api.createUser(
        token,
        form.username,
        form.email,
        form.password,
        form.roleName,
        form.roleName === 'CONTENT_MANAGER' ? form.selectedLocationIds : undefined,
      );
      await reload();
      setForm({
        username: '',
        email: '',
        password: '',
        roleName: 'CONTENT_MANAGER',
        selectedLocationIds: [],
      });
      onToast('Tạo tài khoản người dùng thành công.');
    } catch (error) {
      onToast(error instanceof ApiError ? error.message : 'Không thể tạo người dùng.');
    } finally {
      setBusy(false);
    }
  };

  // [TÍNH NĂNG: UC05 - Khóa hoặc mở khóa tài khoản]
  const handleToggleActive = async (user: ApiUser) => {
    try {
      await api.setUserActive(token, user.id, !user.isActive);
      await reload();
      onToast(user.isActive ? `Đã khóa tài khoản ${user.username}.` : `Đã kích hoạt tài khoản ${user.username}.`);
    } catch (error) {
      onToast(error instanceof ApiError ? error.message : 'Không thể thay đổi trạng thái tài khoản.');
    }
  };

  // [TÍNH NĂNG: UC05 - Mở khóa tài khoản tạm khóa do sai mật khẩu 5 lần]
  const handleUnlock = async (user: ApiUser) => {
    try {
      await api.unlockUser(token, user.id);
      await reload();
      onToast(`Đã mở khóa tài khoản ${user.username}.`);
    } catch (error) {
      onToast(error instanceof ApiError ? error.message : 'Không thể mở khóa tài khoản.');
    }
  };

  // [TÍNH NĂNG: UC05 - Gán địa điểm phụ trách]
  const handleAssignLocation = async (userId: number, locationId: number) => {
    try {
      await api.assignUserLocation(token, userId, locationId);
      await reload();
      onToast('Đã phân công địa điểm cho nhân sự.');
    } catch (error) {
      onToast(error instanceof ApiError ? error.message : 'Không thể gán địa điểm.');
    }
  };

  // [TÍNH NĂNG: UC05 - Thu hồi địa điểm phụ trách kèm cảnh báo nội dung chờ duyệt]
  const handleUnassignLocation = async (user: ApiUser, locationId: number, locationName: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn thu hồi quyền phụ trách "${locationName}" của ${user.username}?`)) {
      return;
    }
    try {
      const res = await api.unassignUserLocation(token, user.id, locationId);
      await reload();
      if (res.warning) {
        alert(`⚠️ Lưu ý: ${res.warning}`);
      }
      onToast(`Đã thu hồi địa điểm ${locationName}.`);
    } catch (error) {
      onToast(error instanceof ApiError ? error.message : 'Không thể thu hồi địa điểm.');
    }
  };

  // [TÍNH NĂNG: UC05 - Lưu cập nhật thông tin và vai trò]
  const handleSaveEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setBusy(true);
    try {
      await api.updateUser(token, editingUser.id, {
        email: editForm.email,
        roleName: editForm.roleName,
      });
      await reload();
      setEditingUser(null);
      onToast('Cập nhật thông tin tài khoản thành công.');
    } catch (error) {
      onToast(error instanceof ApiError ? error.message : 'Không thể cập nhật người dùng.');
    } finally {
      setBusy(false);
    }
  };

  // [TÍNH NĂNG: UC05 - Đặt lại mật khẩu nhân sự bởi Admin]
  const handleAdminResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!resettingUser) return;
    if (adminNewPassword.length < 8) {
      onToast('Mật khẩu mới phải có tối thiểu 8 ký tự.');
      return;
    }
    setBusy(true);
    try {
      const res = await api.adminResetPassword(token, resettingUser.id, adminNewPassword);
      onToast(res.message);
      setResettingUser(null);
      setAdminNewPassword('');
    } catch (error) {
      onToast(error instanceof ApiError ? error.message : 'Không thể đặt lại mật khẩu.');
    } finally {
      setBusy(false);
    }
  };

  // [TÍNH NĂNG: UC05 - Xóa tài khoản nhân sự]
  const handleDeleteUser = async (user: ApiUser) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản "${user.username}"?`)) {
      return;
    }
    try {
      await api.deleteUser(token, user.id);
      await reload();
      onToast(`Đã xóa tài khoản ${user.username}.`);
    } catch (error) {
      onToast(error instanceof ApiError ? error.message : 'Không thể xóa tài khoản.');
    }
  };

  // Lọc danh sách người dùng
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = search.trim().toLowerCase();
      const matchSearch = !q || u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      const matchRole = roleFilter === 'ALL' || u.role === roleFilter;

      const isLocked = Boolean(u.lockedUntil && new Date(u.lockedUntil) > new Date());
      let matchStatus = true;
      if (statusFilter === 'ACTIVE') matchStatus = Boolean(u.isActive && !isLocked);
      else if (statusFilter === 'INACTIVE') matchStatus = !u.isActive;
      else if (statusFilter === 'LOCKED') matchStatus = isLocked;

      return matchSearch && matchRole && matchStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  // Thống kê nhanh
  const stats = useMemo(() => {
    const adminCount = users.filter((u) => u.role === 'ADMIN').length;
    const cmCount = users.filter((u) => u.role === 'CONTENT_MANAGER').length;
    const lockedCount = users.filter((u) => u.lockedUntil && new Date(u.lockedUntil) > new Date()).length;
    const inactiveCount = users.filter((u) => !u.isActive).length;
    return { adminCount, cmCount, lockedCount, inactiveCount };
  }, [users]);

  return (
    <section className="catalog-panel">
      {/* Tiêu đề & KPI tổng quan */}
      <div className="catalog-heading user-heading">
        <div>
          <h2>Quản trị tài khoản nhân sự & phân quyền.</h2>
          <p className="user-description">
            Quản lý tài khoản Administrator & Content Manager, kiểm soát phạm vi địa điểm và an toàn bảo mật.
          </p>
        </div>
        <div className="user-kpi-strip">
          <span className="user-kpi-badge">{users.length} tài khoản</span>
          <span className="user-kpi-badge">{stats.adminCount} Admin</span>
          <span className="user-kpi-badge">{stats.cmCount} Content Manager</span>
          {stats.lockedCount > 0 && (
            <span className="user-kpi-badge user-kpi-badge--alert">{stats.lockedCount} tạm khóa</span>
          )}
        </div>
      </div>

      {/* Form Tạo tài khoản mới */}
      <div className="user-create-box">
        <h3>Thêm tài khoản nhân sự</h3>
        <form className="crud-form user-form" onSubmit={handleCreate}>
          <label>
            Tên đăng nhập
            <input
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="ví dụ: huongcm"
              required
            />
          </label>

          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="huong@audioguide.vn"
              required
            />
          </label>

          <label>
            Mật khẩu khởi tạo
            <input
              type="password"
              minLength={8}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Tối thiểu 8 ký tự"
              required
            />
          </label>

          <label>
            Vai trò
            <select
              value={form.roleName}
              onChange={(e) => setForm({ ...form, roleName: e.target.value })}
            >
              <option value="CONTENT_MANAGER">Content Manager (Biên tập viên)</option>
              <option value="ADMIN">Administrator (Toàn quyền)</option>
            </select>
          </label>

          {/* Phân công địa điểm ban đầu nếu là Content Manager */}
          {form.roleName === 'CONTENT_MANAGER' && (
            <div className="user-locations-picker">
              <span className="user-locations-picker-title">
                Địa điểm phụ trách ban đầu <span className="user-required">* (Chọn ít nhất 1)</span>
              </span>
              <div className="user-locations-grid">
                {locations.map((loc) => {
                  const isChecked = form.selectedLocationIds.includes(loc.id);
                  return (
                    <label key={loc.id} className={`user-location-check ${isChecked ? 'is-checked' : ''}`}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...form.selectedLocationIds, loc.id]
                            : form.selectedLocationIds.filter((id) => id !== loc.id);
                          setForm({ ...form, selectedLocationIds: next });
                        }}
                      />
                      {getLocationLabel(loc)}
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <div className="user-form-actions">
            <button type="submit" className="primary-button" disabled={busy}>
              {busy ? 'Đang tạo…' : '+ Tạo tài khoản'}
            </button>
          </div>
        </form>
      </div>

      {/* Thanh Tìm kiếm & Lọc */}
      <div className="user-filter-bar">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo tên đăng nhập hoặc email"
          className="user-search"
        />

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as any)}
          className="user-select"
        >
          <option value="ALL">Tất cả vai trò</option>
          <option value="ADMIN">Administrator</option>
          <option value="CONTENT_MANAGER">Content Manager</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="user-select"
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="ACTIVE">Đang hoạt động</option>
          <option value="INACTIVE">Đã khóa</option>
          <option value="LOCKED">Bị khóa tạm (15p)</option>
        </select>

        {(search || roleFilter !== 'ALL' || statusFilter !== 'ALL') && (
          <button
            type="button"
            className="quiet-button user-clear-filters"
            onClick={() => {
              setSearch('');
              setRoleFilter('ALL');
              setStatusFilter('ALL');
            }}
          >
            Xóa bộ lọc
          </button>
        )}
      </div>

      {/* Bảng danh sách người dùng */}
      <div className="user-table-wrap">
        <table className="user-table">
          <thead>
            <tr>
              <th style={{ padding: '0.75rem 1rem' }}>Tài khoản</th>
              <th style={{ padding: '0.75rem 1rem' }}>Vai trò</th>
              <th style={{ padding: '0.75rem 1rem' }}>Địa điểm phụ trách</th>
              <th style={{ padding: '0.75rem 1rem' }}>Trạng thái</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Thao tác quản trị</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="user-empty-cell">
                  Không tìm thấy tài khoản nhân sự phù hợp với bộ lọc.
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => {
                const isLocked = Boolean(user.lockedUntil && new Date(user.lockedUntil) > new Date());
                const assigned = user.assignedLocations ?? [];
                const assignedIds = assigned.map((a) => a.locationId);
                const unassignedLocs = locations.filter((l) => !assignedIds.includes(l.id));

                return (
                  <tr key={user.id}>
                    {/* Thông tin tài khoản */}
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div className="user-account-row">
                        <span className="user-account-avatar">
                          {user.username.slice(0, 2).toUpperCase()}
                        </span>
                        <div>
                          <strong>{user.username}</strong>
                          <div className="user-account-email">{user.email}</div>
                          {user.lastLoginAt && (
                            <div className="user-account-date">
                              Đăng nhập: {new Date(user.lastLoginAt).toLocaleDateString('vi-VN')}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Vai trò */}
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span className={`user-role-badge ${user.role === 'ADMIN' ? 'user-role-badge--admin' : 'user-role-badge--cm'}`}>
                        {user.role === 'ADMIN' ? 'Administrator' : 'Content Manager'}
                      </span>
                    </td>

                    {/* Địa điểm phụ trách */}
                    <td style={{ padding: '0.75rem 1rem', maxWidth: '300px' }}>
                      {user.role === 'ADMIN' ? (
                        <span className="user-admin-scope">
                          Toàn bộ hệ thống (Toàn quyền)
                        </span>
                      ) : (
                        <div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.35rem' }}>
                            {assigned.length === 0 ? (
                              <span className="user-unassigned">Chưa gán địa điểm</span>
                            ) : (
                              assigned.map((loc) => (
                                <span
                                  key={loc.locationId}
                                  className="user-assignment-tag"
                                >
                                  {loc.name}
                                  <button
                                    type="button"
                                    onClick={() => handleUnassignLocation(user, loc.locationId, loc.name)}
                                    title="Thu hồi quyền quản lý địa điểm này"
                                    className="user-assignment-remove"
                                  >
                                    ×
                                  </button>
                                </span>
                              ))
                            )}
                          </div>

                          {/* Dropdown gán thêm địa điểm */}
                          {unassignedLocs.length > 0 && (
                            <select
                              value=""
                              onChange={(e) => {
                                if (e.target.value) {
                                  void handleAssignLocation(user.id, Number(e.target.value));
                                }
                              }}
                              style={{ fontSize: '0.75rem', padding: '0.2rem 0.4rem', height: 'auto', width: 'auto' }}
                            >
                              <option value="">+ Gán thêm địa điểm…</option>
                              {unassignedLocs.map((loc) => (
                                <option key={loc.id} value={loc.id}>
                                  {getLocationLabel(loc)}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Trạng thái tài khoản */}
                    <td style={{ padding: '0.75rem 1rem' }}>
                      {isLocked ? (
                        <div>
                          <span
                            className="user-state-badge is-locked"
                          >
                            Tạm khóa (15p)
                          </span>
                          <div style={{ marginTop: '0.25rem' }}>
                            <button
                              type="button"
                              className="user-unlock-button"
                              onClick={() => handleUnlock(user)}
                            >
                              Mở khóa ngay
                            </button>
                          </div>
                        </div>
                      ) : user.isActive ? (
                        <span
                          className="user-state-badge is-active"
                        >
                          Hoạt động
                        </span>
                      ) : (
                        <span
                          className="user-state-badge is-inactive"
                        >
                          Đã khóa
                        </span>
                      )}
                    </td>

                    {/* Các hành động quản trị */}
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                      <div className="user-actions">
                        {/* Nút sửa thông tin */}
                        <button
                          type="button"
                          className="ghost-button"
                          style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                          title="Sửa thông tin / Đổi vai trò"
                          onClick={() => {
                            setEditingUser(user);
                            setEditForm({ email: user.email, roleName: user.role });
                          }}
                        >
                          <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m13.5 3.5 3 3M4 16l3.6-.8L16 6.8 13.2 4 4.8 12.4 4 16Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> Sửa
                        </button>

                        {/* Nút đặt lại mật khẩu */}
                        <button
                          type="button"
                          className="ghost-button"
                          style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                          title="Đặt lại mật khẩu cho nhân sự này"
                          onClick={() => {
                            setResettingUser(user);
                            setAdminNewPassword('');
                          }}
                        >
                          <svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="7" cy="10" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.5"/><path d="M10.5 10H17m-2 0v2m-2-2v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> Đặt lại MK
                        </button>

                        {/* Nút Khóa / Mở khóa */}
                        <button
                          type="button"
                          className="ghost-button user-toggle-action"
                          onClick={() => handleToggleActive(user)}
                        >
                          <><svg viewBox="0 0 20 20" aria-hidden="true"><rect x="3.5" y="8" width="13" height="9" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5"/><path d={user.isActive ? 'M6.5 8V6a3.5 3.5 0 0 1 7 0' : 'M6.5 8V6a3.5 3.5 0 0 1 7 0v2'} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>{user.isActive ? 'Khóa' : 'Kích hoạt'}</>
                        </button>

                        {/* Nút Xóa */}
                        <button
                          type="button"
                          className="ghost-button user-delete-action"
                          title="Xóa tài khoản"
                          onClick={() => handleDeleteUser(user)}
                        >
                          <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 6h12m-10 0 .7 10h6.6L14 6M8 6V4h4v2m-3 3v4m2-4v4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ==================== MODAL 1: SỬA THÔNG TIN & ĐỔI VAI TRÒ ==================== */}
      {editingUser && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Chỉnh sửa tài khoản: {editingUser.username}</h3>
              <button
                type="button"
                className="icon-button"
                onClick={() => setEditingUser(null)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="crud-form" style={{ marginTop: '1rem' }}>
              <label>
                Email
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  required
                />
              </label>

              <label>
                Vai trò
                <select
                  value={editForm.roleName}
                  onChange={(e) => setEditForm({ ...editForm, roleName: e.target.value })}
                >
                  <option value="CONTENT_MANAGER">Content Manager (Biên tập viên)</option>
                  <option value="ADMIN">Administrator (Toàn quyền)</option>
                </select>
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => setEditingUser(null)}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={busy}
                >
                  {busy ? 'Đang lưu…' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL 2: ĐẶT LẠI MẬT KHẨU NHÂN SỰ BỞI ADMIN ==================== */}
      {resettingUser && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Đặt lại mật khẩu cho: {resettingUser.username}</h3>
              <button
                type="button"
                className="icon-button"
                onClick={() => setResettingUser(null)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAdminResetPassword} className="crud-form" style={{ marginTop: '1rem' }}>
              <p style={{ color: 'var(--ink-secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                Nhập mật khẩu mới cho tài khoản này. Người dùng có thể sử dụng mật khẩu này để đăng nhập ngay lập tức.
              </p>
              <label>
                Mật khẩu mới (tối thiểu 8 ký tự)
                <input
                  type="password"
                  minLength={8}
                  value={adminNewPassword}
                  onChange={(e) => setAdminNewPassword(e.target.value)}
                  placeholder="Mật khẩu mới"
                  required
                  autoFocus
                />
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => setResettingUser(null)}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={busy}
                >
                  {busy ? 'Đang đặt lại…' : 'Xác nhận đặt mật khẩu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
