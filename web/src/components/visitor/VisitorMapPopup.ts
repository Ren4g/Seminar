/**
 * @file VisitorMapPopup.ts
 * @description Hàm tạo nội dung Popup tương tác cho từng ghim địa điểm trên bản đồ du lịch (Tên, Địa chỉ, Mô tả, Nút nghe thuyết minh các POI).
 * @screen Hiển thị khi khách tham quan nhấp chuột vào một Marker trên bản đồ.
 * @activityDiagram Bước "Khách nhấp vào địa điểm trên bản đồ -> Bấm nghe thuyết minh POI" (UC35 -> UC28).
 * 
 * @customization Điểm cấu hình & Tùy biến nhanh:
 *  - Nút nghe thuyết minh chính: Class `.popup-listen-btn`.
 *  - Danh sách điểm tham quan con: Class `.popup-poi-sublist`.
 */

import type { ApiLocation, ApiPoi } from '../../api';

// [TÍNH NĂNG: Khởi tạo DOM Popup tương tác cho điểm tham quan trên bản đồ Leaflet]
export function createVisitorMapPopup(
  location: ApiLocation,
  pois: ApiPoi[],
  language: string,
  onNavigateToPoi: (poiId: number) => void
): HTMLDivElement {
  const locName =
    location.translations.find((item) => item.languageCode === language)?.name ??
    location.translations.find((item) => item.languageCode === 'en')?.name ??
    '';

  const locDesc =
    location.translations.find((item) => item.languageCode === language)?.shortDescription ??
    location.translations.find((item) => item.languageCode === 'en')?.shortDescription ??
    '';

  const locPois = pois.filter((poi) => poi.locationId === location.id && poi.isActive);

  const translatePoi = (translations: ApiPoi['translations']) =>
    translations.find((item) => item.languageCode === language)?.name ??
    translations.find((item) => item.languageCode === 'en')?.name ??
    '';

  const popupDiv = document.createElement('div');
  popupDiv.className = 'visitor-map-popup';

  // [TÍNH NĂNG: Tiêu đề địa điểm trong Popup]
  const titleEl = document.createElement('h3');
  titleEl.className = 'popup-title';
  titleEl.textContent = locName;
  popupDiv.appendChild(titleEl);

  // [TÍNH NĂNG: Địa chỉ thực tế]
  if (location.address) {
    const addrEl = document.createElement('p');
    addrEl.className = 'popup-address';
    addrEl.innerHTML = `<span class="popup-icon">📍</span> ${location.address}`;
    popupDiv.appendChild(addrEl);
  }

  // [TÍNH NĂNG: Đoạn văn mô tả ngắn]
  if (locDesc) {
    const descEl = document.createElement('p');
    descEl.className = 'popup-desc';
    descEl.textContent = locDesc;
    popupDiv.appendChild(descEl);
  }

  // [TÍNH NĂNG: Danh sách POI trực thuộc và nút bấm nghe thuyết minh]
  const poiSection = document.createElement('div');
  poiSection.className = 'popup-pois-section';

  if (locPois.length > 0) {
    const poiHeading = document.createElement('div');
    poiHeading.className = 'popup-pois-heading';
    poiHeading.textContent = `${locPois.length} điểm tham quan:`;
    poiSection.appendChild(poiHeading);

    // Nút nghe thuyết minh điểm đầu tiên
    const primaryListenBtn = document.createElement('button');
    primaryListenBtn.className = 'popup-listen-btn';
    primaryListenBtn.innerHTML = `🎧 Nghe thuyết minh: <strong>${translatePoi(locPois[0].translations)}</strong>`;
    primaryListenBtn.onclick = (e) => {
      e.preventDefault();
      onNavigateToPoi(locPois[0].id);
    };
    poiSection.appendChild(primaryListenBtn);

    // Danh sách các điểm tiếp theo nếu có nhiều hơn 1
    if (locPois.length > 1) {
      const poiList = document.createElement('div');
      poiList.className = 'popup-poi-sublist';
      locPois.slice(1).forEach((poi) => {
        const poiLink = document.createElement('button');
        poiLink.className = 'popup-subpoi-btn';
        poiLink.textContent = `▶ ${translatePoi(poi.translations)}`;
        poiLink.onclick = (e) => {
          e.preventDefault();
          onNavigateToPoi(poi.id);
        };
        poiList.appendChild(poiLink);
      });
      poiSection.appendChild(poiList);
    }
  } else {
    const emptyEl = document.createElement('p');
    emptyEl.className = 'popup-empty-notice';
    emptyEl.textContent = 'Địa điểm chưa có điểm thuyết minh chi tiết.';
    poiSection.appendChild(emptyEl);
  }

  popupDiv.appendChild(poiSection);
  return popupDiv;
}
