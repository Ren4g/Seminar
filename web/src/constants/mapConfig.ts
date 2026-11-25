/**
 * @file mapConfig.ts
 * @description Cấu hình bản đồ số du lịch Leaflet: URL máy chủ gạch bản đồ (Tile Server), tọa độ mặc định và thông tin bản quyền.
 * @screen Dùng chung cho Bản đồ du lịch (VisitorMap) và Bản đồ chấm tọa độ (LocationMapPicker).
 * @activityDiagram Hiển thị bản đồ số du lịch (UC35, UC07).
 * 
 * @customization Điểm cấu hình & Tùy biến nhanh:
 *  - Đổi nhà cung cấp bản đồ: Thay `TILE_LAYER_URL`.
 *  - Đổi tọa độ trung tâm mặc định: Thay `DEFAULT_CENTER_LAT` và `DEFAULT_CENTER_LNG`.
 */

// ==================== CẤU HÌNH BẢN ĐỒ SỐ DU LỊCH ====================
export const MAP_CONFIG = {
  // Máy chủ OSM Humanitarian (HOT) qua CDN Châu Âu (OSM France): 
  // Hoàn toàn miễn phí, KHÔNG CẦN API KEY, KHÔNG CÓ WATERMARK, tải nhanh và không bị các nhà mạng tại VN chặn
  TILE_LAYER_URL: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
  SUBDOMAINS: 'abc',
  ATTRIBUTION: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/">HOT</a>',

// Tọa độ trung tâm mặc định (TP. Hồ Chí Minh - Quận 1)
  DEFAULT_CENTER_LAT: 10.776889,
  DEFAULT_CENTER_LNG: 106.700806,

  // Mức phóng to mặc định
  DEFAULT_ZOOM: 13,
  ZOOM_WITH_COORDS: 16,
  MAX_ZOOM: 19,
};
