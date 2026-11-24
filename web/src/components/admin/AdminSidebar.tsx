/**
 * @file AdminSidebar.tsx
 * @description Thanh menu bên trái (Sidebar) của trang quản trị: Logo, 6 tab chức năng, số bài chờ duyệt, thu gọn menu và đăng xuất.
 * @screen Cột bên trái toàn bộ hệ thống quản trị Admin.
 * @activityDiagram Điều hướng giữa các phân hệ: Tổng quan, Nội dung, Địa điểm, Ngôn ngữ, QR code, Người dùng.
 * 
 * @customization Điểm cấu hình & Tùy biến nhanh:
 *  - Danh sách các tab chức năng: Mảng `NAV_ITEMS` bên dưới.
 *  - Tên người dùng hiển thị ở góc dưới: Khối `<button className="account">`.
 */

import { Icon } from '../common/Icon';

// ==================== CẤU HÌNH MENU SIDEBAR ====================
const NAV_ITEMS = [
  ['Tổng quan', '◌'],
  ['Nội dung', '▤'],
  ['Địa điểm & POI', '⌖'],
  ['Ngôn ngữ & giọng đọc', '文'],
  ['QR code', '⌁'],
  ['Người dùng', 'U'],
] as const;

type AdminSidebarProps = {
  activeNav: string;
  pendingCount: number;
  sidebarCollapsed: boolean;
  onSelectNav: (nav: string) => void;
  onToggleSidebar: () => void;
  onLogout: () => void;
};

// [TÍNH NĂNG: Thanh điều hướng bên trái Admin Sidebar]
export function AdminSidebar({
  activeNav,
  pendingCount,
  sidebarCollapsed,
  onSelectNav,
  onToggleSidebar,
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
          aria-label={sidebarCollapsed ? 'Expand navigation' : 'Collapse navigation'}
          title={sidebarCollapsed ? 'Expand navigation' : 'Collapse navigation'}
          onClick={onToggleSidebar}
        >
          {sidebarCollapsed ? '»' : '«'}
        </button>
      </div>

      {/* [TÍNH NĂNG: Danh sách 6 tab điều hướng chính] */}
      <nav className="nav" aria-label="Điều hướng chính">
        {NAV_ITEMS.map(([label, icon]) => (
          <button
            key={label}
            className={`nav-item ${activeNav === label ? 'is-active' : ''}`}
            onClick={() => onSelectNav(label)}
          >
            <Icon>{icon}</Icon>
            <span>{label}</span>
            {label === 'Nội dung' && pendingCount > 0 && <b>{pendingCount}</b>}
          </button>
        ))}
      </nav>

      {/* [TÍNH NĂNG: Trạng thái hệ thống và nút Đăng xuất] */}
      <div className="sidebar-foot">
        <div className="system-state">
          <span className="signal" /> Hệ thống đang hoạt động
        </div>
        <button type="button" className="account" onClick={onLogout}>
          <span className="avatar">AN</span>
          <span>
            <strong>An Nguyễn</strong>
            <small>Đăng xuất</small>
          </span>
          <span className="account-chevron">⌄</span>
        </button>
      </div>
    </aside>
  );
}
