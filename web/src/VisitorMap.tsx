/**
 * @file VisitorMap.tsx
 * @description Bản đồ số du lịch hiển thị toàn bộ các điểm đến và POI, tự động căn khung (fitBounds) và mở popup nghe thuyết minh.
 * @screen Màn hình Bản đồ số khách tham quan (URL: `/map` hoặc tab Bản đồ).
 * @activityDiagram Bước "UC35 - Xem bản đồ: Khách tham quan khám phá di tích trên bản đồ tương tác".
 * 
 * @customization Điểm cấu hình & Tùy biến nhanh:
 *  - Cấu hình bản đồ nền và tọa độ: Chỉnh sửa tại `constants/mapConfig.ts`.
 */

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { ApiLocation, ApiPoi } from './api';
import { visitorMarkerIcon } from './utils/mapIcons';
import { MAP_CONFIG } from './constants/mapConfig';
import { VisitorMapToolbar } from './components/visitor/VisitorMapToolbar';
import { createVisitorMapPopup } from './components/visitor/VisitorMapPopup';

interface VisitorMapProps {
  locations: ApiLocation[];
  pois: ApiPoi[];
  language: string;
  onNavigateToPoi: (poiId: number) => void;
  onSwitchToList: () => void;
}

// [TÍNH NĂNG: Toàn bộ màn hình Bản đồ số du lịch cho Khách tham quan]
export function VisitorMap({
  locations,
  pois,
  language,
  onNavigateToPoi,
  onSwitchToList,
}: VisitorMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  const activeLocationsWithCoords = locations.filter(
    (loc) => loc.isActive && loc.latitude != null && loc.longitude != null &&
      !Number.isNaN(Number(loc.latitude)) && !Number.isNaN(Number(loc.longitude))
  );
  const locationsWithoutCoordsCount =
    locations.filter((loc) => loc.isActive).length - activeLocationsWithCoords.length;

  // [TÍNH NĂNG: Khởi tạo bản đồ Leaflet và lớp gạch nền TileLayer]
  useEffect(() => {
    if (!mapContainerRef.current) return;

    try {
      if (!mapInstanceRef.current) {
        const defaultCenter: [number, number] = [
          MAP_CONFIG.DEFAULT_CENTER_LAT,
          MAP_CONFIG.DEFAULT_CENTER_LNG,
        ];
        const map = L.map(mapContainerRef.current, {
          center: defaultCenter,
          zoom: MAP_CONFIG.DEFAULT_ZOOM,
          attributionControl: true,
        });

        // Sử dụng TileLayer CartoDB Voyager tốc độ cao, không bị chặn bởi các nhà mạng tại VN
        const tileLayer = L.tileLayer(MAP_CONFIG.TILE_LAYER_URL, {
          maxZoom: MAP_CONFIG.MAX_ZOOM,
          subdomains: MAP_CONFIG.SUBDOMAINS,
          attribution: MAP_CONFIG.ATTRIBUTION,
        });

        tileLayer.on('tileerror', () => {
          // Ghi nhận cảnh báo nếu 1 vài mảnh tile mạng chậm, không ẩn toàn bộ bản đồ
          console.warn('Lưu ý: Không thể tải một số mảnh tile bản đồ.');
        });

        tileLayer.addTo(map);

        const markersLayer = L.layerGroup().addTo(map);
        markersLayerRef.current = markersLayer;
        mapInstanceRef.current = map;
      }
    } catch (err) {
      setMapError(err instanceof Error ? err.message : 'Không thể khởi tạo bản đồ.');
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersLayerRef.current = null;
      }
    };
  }, []);

  // [TÍNH NĂNG: Cập nhật các Marker địa điểm và căn chỉnh khung hình fitBounds]
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();
    if (activeLocationsWithCoords.length === 0) return;

    const bounds = L.latLngBounds([]);

    activeLocationsWithCoords.forEach((loc) => {
      const pos: [number, number] = [Number(loc.latitude), Number(loc.longitude)];
      bounds.extend(pos);

      const marker = L.marker(pos, { icon: visitorMarkerIcon });
      const popupDiv = createVisitorMapPopup(loc, pois, language, onNavigateToPoi);

      marker.bindPopup(popupDiv, { maxWidth: 300, minWidth: 240, className: 'custom-leaflet-popup' });
      markersLayer.addLayer(marker);
    });

    if (activeLocationsWithCoords.length === 1) {
      const loc = activeLocationsWithCoords[0];
      map.setView([Number(loc.latitude), Number(loc.longitude)], 15);
    } else if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }
  }, [activeLocationsWithCoords.length, language, pois]);

  return (
    <section className="visitor-map-page">
      {/* [TÍNH NĂNG: Thanh tiêu đề và nút chuyển đổi danh sách] */}
      <VisitorMapToolbar
        locationsWithCoordsCount={activeLocationsWithCoords.length}
        locationsWithoutCoordsCount={locationsWithoutCoordsCount}
        onSwitchToList={onSwitchToList}
      />

      {/* [TÍNH NĂNG: Xử lý ngoại lệ khi mất kết nối bản đồ hoặc chưa có tọa độ] */}
      {mapError ? (
        <div className="visitor-map-fallback">
          <div className="fallback-card">
            <span className="fallback-icon">⚠️</span>
            <h3>Không thể tải bản đồ</h3>
            <p>{mapError}</p>
            <button type="button" className="primary-button" onClick={onSwitchToList}>
              Xem danh sách địa điểm thay thế
            </button>
          </div>
        </div>
      ) : activeLocationsWithCoords.length === 0 ? (
        <div className="visitor-map-fallback">
          <div className="fallback-card">
            <span className="fallback-icon">🗺️</span>
            <h3>Chưa có địa điểm nào có tọa độ</h3>
            <p>Các địa điểm hiện tại chưa được cập nhật tọa độ trên bản đồ. Bạn có thể xem toàn bộ địa điểm tại danh sách.</p>
            <button type="button" className="primary-button" onClick={onSwitchToList}>
              Xem danh sách địa điểm
            </button>
          </div>
        </div>
      ) : null}

      {/* [TÍNH NĂNG: Khung chứa bản đồ Leaflet] */}
      <div
        ref={mapContainerRef}
        className="visitor-leaflet-container"
        style={{ display: mapError ? 'none' : 'block' }}
      />
    </section>
  );
}
