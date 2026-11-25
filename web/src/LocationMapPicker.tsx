/**
 * @file LocationMapPicker.tsx
 * @description Bản đồ số Leaflet cho phép Admin kéo ghim hoặc nhấp chuột để chấm tay tọa độ (Vĩ độ - Latitude, Kinh độ - Longitude) cho khu di tích.
 * @screen Tab "Địa điểm & POI" (Form tạo địa điểm và Modal chỉnh sửa địa điểm).
 * @activityDiagram Bước "UC07 - Quản lý địa điểm: Thiết lập và hiệu chỉnh tọa độ địa lý di tích".
 * 
 * @customization Điểm cấu hình & Tùy biến nhanh:
 *  - Tọa độ trung tâm mặc định (Hà Nội): Biến `DEFAULT_LAT`, `DEFAULT_LNG` bên dưới.
 *  - Mức phóng to (Zoom): Biến `DEFAULT_ZOOM`, `ZOOM_WITH_COORDS`.
 *  - Nhà cung cấp bản đồ nền (Tile Server): Biến `TILE_LAYER_URL`.
 */

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { pickerIcon } from './utils/mapIcons';

// ==================== CẤU HÌNH BẢN ĐỒ CHẤM TỌA ĐỘ ====================
const DEFAULT_LAT = 21.028511; // Tọa độ trung tâm mặc định (Hà Nội)
const DEFAULT_LNG = 105.854444;
const DEFAULT_ZOOM = 13;
const ZOOM_WITH_COORDS = 16;
const TILE_LAYER_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

interface LocationMapPickerProps {
  latitude: number | null | undefined;
  longitude: number | null | undefined;
  onChange: (latitude: number, longitude: number) => void;
  height?: number | string;
}

// [TÍNH NĂNG: Bản đồ chấm tay tọa độ cho Admin]
export function LocationMapPicker({ latitude, longitude, onChange, height = 260 }: LocationMapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const currentLat = latitude != null && !Number.isNaN(latitude) ? latitude : null;
  const currentLng = longitude != null && !Number.isNaN(longitude) ? longitude : null;

  // [TÍNH NĂNG: Khởi tạo bản đồ Leaflet và bắt sự kiện click chấm tọa độ]
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialCenter: [number, number] = [
        currentLat ?? DEFAULT_LAT,
        currentLng ?? DEFAULT_LNG,
      ];
      const initialZoom = currentLat && currentLng ? ZOOM_WITH_COORDS : DEFAULT_ZOOM;

      const map = L.map(mapContainerRef.current, {
        center: initialCenter,
        zoom: initialZoom,
        attributionControl: false,
      });

      L.tileLayer(TILE_LAYER_URL, {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      // Bắt sự kiện click trên bản đồ để lấy tọa độ
      map.on('click', (event: L.LeafletMouseEvent) => {
        const { lat, lng } = event.latlng;
        onChange(Number(lat.toFixed(7)), Number(lng.toFixed(7)));
      });

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  // [TÍNH NĂNG: Cập nhật vị trí ghim Marker khi tọa độ thay đổi hoặc kéo ghim]
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (currentLat != null && currentLng != null) {
      const pos: [number, number] = [currentLat, currentLng];

      if (!markerRef.current) {
        const marker = L.marker(pos, {
          icon: pickerIcon,
          draggable: true,
          title: 'Kéo thả để điều chỉnh tọa độ',
        }).addTo(map);

        marker.on('dragend', () => {
          const newPos = marker.getLatLng();
          onChange(Number(newPos.lat.toFixed(7)), Number(newPos.lng.toFixed(7)));
        });

        marker.bindTooltip('Kéo thả hoặc click để đổi vị trí', { permanent: false, direction: 'top' });
        markerRef.current = marker;
      } else {
        markerRef.current.setLatLng(pos);
      }

      map.setView(pos, map.getZoom() < 14 ? 15 : map.getZoom(), { animate: true });
    } else {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
    }
  }, [currentLat, currentLng]);

  return (
    <div className="location-picker-wrapper">
      <div
        ref={mapContainerRef}
        className="location-picker-map"
        style={{ width: '100%', height, borderRadius: '8px', overflow: 'hidden' }}
      />
      <div className="picker-map-hint">
        <span>📍 Nhấp chuột trên bản đồ hoặc kéo ghim để chấm tay tọa độ</span>
      </div>
    </div>
  );
}
