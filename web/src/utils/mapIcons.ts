/**
 * @file mapIcons.ts
 * @description Định nghĩa các biểu tượng ghim (Marker Icons) tùy biến cho bản đồ Leaflet (Ghim Visitor và Ghim chấm tọa độ Admin).
 * @screen Bản đồ du lịch khách tham quan (VisitorMap) và Bộ chọn tọa độ di tích (LocationMapPicker).
 * @activityDiagram Hiển thị trực quan vị trí địa lý trên bản đồ số (UC07, UC35).
 * 
 * @customization Điểm cấu hình & Tùy biến nhanh:
 *  - Màu sắc và hiệu ứng ghim: Sửa class `.custom-marker-pin.is-visitor`, `.custom-marker-pin.is-picker` trong `styles.css`.
 *  - Kích thước ghim icon: Thuộc tính `iconSize` bên dưới.
 */

import L from 'leaflet';

// [TÍNH NĂNG: Biểu tượng ghim cho Admin chấm tay tọa độ (LocationMapPicker)]
export const pickerIcon = L.divIcon({
  className: 'custom-map-marker-container',
  html: `
    <div class="custom-marker-pin is-picker">
      <div class="pin-icon">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      </div>
      <div class="pin-shadow"></div>
    </div>
  `,
  iconSize: [36, 44],
  iconAnchor: [18, 44],
  popupAnchor: [0, -44],
});

// [TÍNH NĂNG: Biểu tượng ghim cho các Địa điểm đã có trong hệ thống (LocationMapPicker)]
export const existingLocationIcon = L.divIcon({
  className: 'custom-map-marker-container',
  html: `
    <div class="custom-marker-pin is-existing">
      <div class="pin-icon">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      </div>
      <div class="pin-shadow"></div>
    </div>
  `,
  iconSize: [28, 36],
  iconAnchor: [14, 36],
  popupAnchor: [0, -36],
});

// [TÍNH NĂNG: Biểu tượng ghim có hiệu ứng sóng xung kích cho Khách tham quan (VisitorMap)]
export const visitorMarkerIcon = L.divIcon({
  className: 'custom-map-marker-container',
  html: `
    <div class="custom-marker-pin is-visitor">
      <div class="pin-icon">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      </div>
      <div class="pin-pulse"></div>
      <div class="pin-shadow"></div>
    </div>
  `,
  iconSize: [38, 46],
  iconAnchor: [19, 46],
  popupAnchor: [0, -46],
});
