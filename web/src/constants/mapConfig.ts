/**
 * @file mapConfig.ts
 * @description Cấu hình bản đồ số du lịch Leaflet: URL máy chủ gạch bản đồ (Tile Server), tọa độ mặc định và thông tin bản quyền.
 * @screen Dùng chung cho Bản đồ du lịch (VisitorMap) và Bản đồ chấm tọa độ (LocationMapPicker).
 * @activityDiagram Hiển thị bản đồ số du lịch (UC35, UC07).
 * 
 * @customization Điểm cấu hình & Tùy biến nhanh:
 *  - Đổi nhà cung cấp bản đồ: Thay `TILE_LAYER_URL` (mặc định dùng CartoDB Voyager CDN tốc độ cao, không bị chặn bởi các nhà mạng VN).
 *  - Đổi tọa độ trung tâm mặc định: Thay `DEFAULT_CENTER_LAT` và `DEFAULT_CENTER_LNG`.
 */

// ==================== CẤU HÌNH BẢN ĐỒ SỐ DU LỊCH ====================
export const MAP_CONFIG = {
  // CartoDB Voyager: Bản đồ du lịch sắc nét, máy chủ CDN Châu Á (Hong Kong), miễn phí và không bị chặn IP tại Việt Nam
  TILE_LAYER_URL: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
  SUBDOMAINS: 'abcd',
  ATTRIBUTION: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',

  // Tile Server dự phòng (ESRI World Street Map) nếu cần
  FALLBACK_TILE_URL: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',

  // Tọa độ trung tâm mặc định (Thủ đô Hà Nội)
  DEFAULT_CENTER_LAT: 21.028511,
  DEFAULT_CENTER_LNG: 105.854444,

  // Mức phóng to mặc định
  DEFAULT_ZOOM: 13,
  ZOOM_WITH_COORDS: 16,
  MAX_ZOOM: 19,
};
