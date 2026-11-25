/**
 * @file AdminSidebar.tsx
 * @description Thanh menu bên trái (Sidebar) của trang quản trị: Logo, 6 tab chức năng, số bài chờ duyệt, thu gọn menu, đổi mật khẩu và đăng xuất.
 * @screen Cột bên trái toàn bộ hệ thống quản trị Admin.
 * @activityDiagram Điều hướng giữa các phân hệ: Tổng quan, Nội dung, Địa điểm, Ngôn ngữ, QR code, Người dùng.
 */

import { Icon } from '../common/Icon';

// ==================== CẤU HÌNH MENU SIDEBAR ====================
const NAV_ITEMS = [
  'Tổng quan',
  'Nội dung',
  'Địa điểm & POI',
  'Ngôn ngữ & giọng đọc',
  'QR code',
  'Người dùng',
] as const;

function NavIcon({ label }: { label: (typeof NAV_ITEMS)[number] }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      {label === 'Tổng quan' ? (
        <><path d="M3 10h5V4H3v6Zm9 6h5V9h-5v7ZM3 16h5v-3H3v3Zm9-10v1h5V4h-5v2Z" stroke="currentColor" strokeWidth="1.35" strokeLinejoin="round" /></>
      ) : label === 'Nội dung' ? (
        <><path d="M5 2.8h7l3.2 3.3v11.1H5V2.8Z" stroke="currentColor" strokeWidth="1.35" strokeLinejoin="round" /><path d="M12 3v3.5h3M7.5 10h5M7.5 13h5" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" /></>
      ) : label === 'Địa điểm & POI' ? (
        <><path d="M10 17s5-5.1 5-9a5 5 0 1 0-10 0c0 3.9 5 9 5 9Z" stroke="currentColor" strokeWidth="1.35" /><circle cx="10" cy="8" r="1.7" stroke="currentColor" strokeWidth="1.35" /></>
      ) : label === 'Ngôn ngữ & giọng đọc' ? (
        <><circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.35" /><path d="M3.5 10h13M10 3c1.8 1.9 2.6 4.2 2.6 7s-.8 5.1-2.6 7c-1.8-1.9-2.6-4.2-2.6-7S8.2 4.9 10 3Z" stroke="currentColor" strokeWidth="1.2" /></>
      ) : label === 'QR code' ? (
        <><path d="M3 3h5v5H3zM12 3h5v5h-5zM3 12h5v5H3zM12 12h2v2h-2zM15 15h2v2h-2zM15 11h2" stroke="currentColor" strokeWidth="1.35" strokeLinejoin="round" /></>
      ) : (
        <><circle cx="10" cy="7" r="3" stroke="currentColor" strokeWidth="1.35" /><path d="M4 17c.5-2.6 2.7-4.2 6-4.2s5.5 1.6 6 4.2H4Z" stroke="currentColor" strokeWidth="1.35" strokeLinejoin="round" /></>
      )}
    </svg>
  );
}

type AdminSidebarProps = {
  activeNav: string;
  pendingCount: number;
  sidebarCollapsed: boolean;
  onSelectNav: (nav: string) => void;
  onToggleSidebar: () => void;
  onChangePassword: () => void;
  onLogout: () => void;
};

// [TÍNH NĂNG: Thanh điều hướng bên trái Admin Sidebar]
export function AdminSidebar({
  activeNav,
  pendingCount,
  sidebarCollapsed,
  onSelectNav,
  onToggleSidebar,
  onChangePassword,
  onLogout,
}: AdminSidebarProps) {
  return (
    <aside className="sidebar">
      {/* [TÍNH NĂNG: Logo hệ thống và nút thu gọn/mở rộng sidebar] */}
      <div className="brand">
        <div className="brand-mark" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div>
          <strong>audio guide</strong>
          <small>Content studio</small>
        </div>
        <button
          type="button"
          className="sidebar-toggle"
          aria-label={sidebarCollapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'}
          title={sidebarCollapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'}
          onClick={onToggleSidebar}
        >
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d={sidebarCollapsed ? 'm8 4 6 6-6 6' : 'm12 4-6 6 6 6'} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </div>

      {/* [TÍNH NĂNG: Danh sách 6 tab điều hướng chính] */}
      <nav className="nav" aria-label="Điều hướng chính">
        {NAV_ITEMS.map((label) => (
          <button
            key={label}
            className={`nav-item ${activeNav === label ? 'is-active' : ''}`}
            onClick={() => onSelectNav(label)}
          >
            <Icon><NavIcon label={label} /></Icon>
            <span>{label}</span>
            {label === 'Nội dung' && pendingCount > 0 && <b>{pendingCount}</b>}
          </button>
        ))}
      </nav>

      {/* [TÍNH NĂNG: Trạng thái hệ thống, Đổi mật khẩu (UC03) và Đăng xuất (UC02)] */}
      <div className="sidebar-foot">
        <div className="system-state">
          <span className="signal" /> Hệ thống đang hoạt động
        </div>
        <div className="sidebar-account-box">
          <div className="account">
            <span className="avatar">AD</span>
            <span>
              <strong>Quản trị viên</strong>
              <small>Workspace</small>
            </span>
          </div>
          <div className="sidebar-actions">
            <button
              type="button"
              className="sidebar-action-btn"
              title="Đổi mật khẩu tài khoản"
              onClick={onChangePassword}
            >
              <Icon><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><rect x="3.5" y="8" width="13" height="9" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M6.5 8V6a3.5 3.5 0 0 1 7 0v2M10 11.5v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg></Icon>
              <span>Đổi MK</span>
            </button>
            <button
              type="button"
              className="sidebar-action-btn"
              title="Đăng xuất khỏi hệ thống"
              onClick={onLogout}
            >
              <Icon><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M8 4H4.5A1.5 1.5 0 0 0 3 5.5v9A1.5 1.5 0 0 0 4.5 16H8M11 13l3-3-3-3M14 10H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></Icon>
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
