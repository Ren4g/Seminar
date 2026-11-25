/**
 * @file VisitorMapToolbar.tsx
 * @description Thanh tiêu đề trên cùng của bản đồ du lịch: Hiển thị số lượng địa điểm có tọa độ và nút chuyển về chế độ danh sách.
 * @screen Nằm trên cùng của màn hình Bản đồ số khách tham quan (VisitorMap).
 * @activityDiagram Bước "Khách chuyển đổi giữa chế độ xem Bản đồ và xem Danh sách" (UC35).
 * 
 * @customization Điểm cấu hình & Tùy biến nhanh:
 *  - Nút chuyển về danh sách: Sự kiện `onClick={onSwitchToList}`.
 *  - Tiêu đề bản đồ: Thẻ `<h2>`.
 */

type VisitorMapToolbarProps = {
  locationsWithCoordsCount: number;
  locationsWithoutCoordsCount: number;
  onSwitchToList: () => void;
};

// [TÍNH NĂNG: Thanh công cụ điều khiển trên bản đồ du lịch]
export function VisitorMapToolbar({
  locationsWithCoordsCount,
  locationsWithoutCoordsCount,
  onSwitchToList,
}: VisitorMapToolbarProps) {
  return (
    <div className="visitor-map-toolbar">
      <div className="visitor-map-info">
        <h2>Bản đồ địa điểm du lịch</h2>
        <span className="visitor-map-stats">
          {locationsWithCoordsCount} địa điểm trên bản đồ
          {locationsWithoutCoordsCount > 0 && ` · ${locationsWithoutCoordsCount} địa điểm chưa có tọa độ`}
        </span>
      </div>
      <button type="button" className="quiet-button view-list-btn" onClick={onSwitchToList}>
        ☰ Xem dạng danh sách
      </button>
    </div>
  );
}
