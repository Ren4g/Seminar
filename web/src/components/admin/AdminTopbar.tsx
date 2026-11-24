/**
 * @file AdminTopbar.tsx
 * @description Thanh tiêu đề trên cùng (Topbar) của Admin: Breadcrumb đường dẫn, chuông thông báo bài chờ duyệt, nút tạo nội dung.
 * @screen Nằm trên cùng của khu vực làm việc Admin.
 * @activityDiagram Bước "Người dùng mở thông báo hoặc bắt đầu tạo nội dung mới".
 * 
 * @customization Điểm cấu hình & Tùy biến nhanh:
 *  - Nút "+ Tạo nội dung": Sự kiện `onClick={onOpenCreate}`.
 *  - Thông báo số bài chờ duyệt: Sự kiện `onClick={onShowNotification}`.
 */

type AdminTopbarProps = {
  activeNav: string;
  pendingCount: number;
  onShowNotification: () => void;
  onOpenCreate: () => void;
};

// [TÍNH NĂNG: Thanh tiêu đề trên cùng Admin Topbar]
export function AdminTopbar({
  activeNav,
  pendingCount,
  onShowNotification,
  onOpenCreate,
}: AdminTopbarProps) {
  return (
    <header className="topbar">
      <div>
        <span className="breadcrumb">Studio / {activeNav}</span>
        <h1>{activeNav}</h1>
      </div>

      <div className="top-actions">
        {/* [TÍNH NĂNG: Chuông thông báo bài viết đang chờ phê duyệt] */}
        <button
          type="button"
          className="quiet-button"
          aria-label="Thông báo"
          onClick={onShowNotification}
        >
          Thông báo {pendingCount > 0 ? `(${pendingCount})` : ''}
        </button>

        {/* [TÍNH NĂNG: Huy hiệu ngôn ngữ giao diện quản trị] */}
        <button type="button" className="lang-button" title="Giao diện Content Studio (Tiếng Việt)">
          VI
        </button>

        {/* [TÍNH NĂNG: Nút mở popup tạo nội dung thuyết minh mới] */}
        <button type="button" className="primary-button" onClick={onOpenCreate}>
          + Tạo nội dung
        </button>
      </div>
    </header>
  );
}
