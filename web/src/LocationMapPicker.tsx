/**
 * @file LocationMapPicker.tsx
 * @description Bản đồ số Leaflet cho phép Admin kéo ghim hoặc nhấp chuột để chấm tay tọa độ (Vĩ độ - Latitude, Kinh độ - Longitude) cho khu di tích, đồng thời hiển thị các địa điểm đã có để tránh trùng lặp.
 * @screen Tab "Địa điểm & POI" (Form tạo địa điểm và Modal chỉnh sửa địa điểm).
 * @activityDiagram Bước "UC07 - Quản lý địa điểm: Thiết lập và hiệu chỉnh tọa độ địa lý di tích".
 * 
 * @customization Điểm cấu hình & Tùy biến nhanh:
 *  - Cấu hình bản đồ nền và tọa độ: Chỉnh sửa tại `constants/mapConfig.ts`.
 *  - Màu sắc ghim: Ghim chấm tay (`.is-picker` cam), Ghim địa điểm đã có (`.is-existing` xanh dương).
 */

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { pickerIcon, existingLocationIcon } from './utils/mapIcons';
import { MAP_CONFIG } from './constants/mapConfig';

export interface ExistingLocationPin {
  id: number | string;
  name: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

interface LocationMapPickerProps {
  latitude: number | null | undefined;
  longitude: number | null | undefined;
  onChange: (latitude: number, longitude: number) => void;
  height?: number | string;
  existingLocations?: ExistingLocationPin[];
  excludeId?: number | string;
}

// [TÍNH NĂNG: Bản đồ chấm tay tọa độ cho Admin kết hợp xem các địa điểm đã có]
export function LocationMapPicker({
  latitude,
  longitude,
  onChange,
  height = 260,
  existingLocations = [],
  excludeId,
}: LocationMapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const existingLayerRef = useRef<L.LayerGroup | null>(null);

  const currentLat = latitude != null && !Number.isNaN(latitude) ? latitude : null;
  const currentLng = longitude != null && !Number.isNaN(longitude) ? longitude : null;

  // Lọc các địa điểm đã có hợp lệ (loại trừ địa điểm đang sửa nếu có)
  const validExisting = existingLocations.filter(
    (loc) =>
      (excludeId == null || String(loc.id) !== String(excludeId)) &&
      loc.latitude != null &&
      loc.longitude != null &&
      !Number.isNaN(Number(loc.latitude)) &&
      !Number.isNaN(Number(loc.longitude))
  );

  // [TÍNH NĂNG: Khởi tạo bản đồ Leaflet và bắt sự kiện click chấm tọa độ]
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const firstExisting = validExisting[0];
      const initialCenter: [number, number] = [
        currentLat ?? (firstExisting ? Number(firstExisting.latitude) : MAP_CONFIG.DEFAULT_CENTER_LAT),
        currentLng ?? (firstExisting ? Number(firstExisting.longitude) : MAP_CONFIG.DEFAULT_CENTER_LNG),
      ];
      const initialZoom =
        currentLat && currentLng ? MAP_CONFIG.ZOOM_WITH_COORDS : firstExisting ? 14 : MAP_CONFIG.DEFAULT_ZOOM;

      const map = L.map(mapContainerRef.current, {
        center: initialCenter,
        zoom: initialZoom,
        attributionControl: false,
      });

      L.tileLayer(MAP_CONFIG.TILE_LAYER_URL, {
        maxZoom: MAP_CONFIG.MAX_ZOOM,
        subdomains: MAP_CONFIG.SUBDOMAINS,
        attribution: MAP_CONFIG.ATTRIBUTION,
      }).addTo(map);

      // Khởi tạo nhóm layer chứa marker các địa điểm đã có
      const existingLayer = L.layerGroup().addTo(map);
      existingLayerRef.current = existingLayer;

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
        existingLayerRef.current = null;
      }
    };
  }, []);

  // [TÍNH NĂNG: Hiển thị các địa điểm đã có trong hệ thống trên bản đồ]
  useEffect(() => {
    const layer = existingLayerRef.current;
    if (!layer) return;

    layer.clearLayers();

    validExisting.forEach((loc) => {
      const lat = Number(loc.latitude);
      const lng = Number(loc.longitude);

      const m = L.marker([lat, lng], {
        icon: existingLocationIcon,
        title: loc.name,
      });

      m.bindTooltip(`📍 ${loc.name}`, { direction: 'top', offset: [0, -28] });

      m.bindPopup(`
        <div style="font-family: inherit; font-size: 13px; line-height: 1.4; min-width: 150px;">
          <strong style="color: #202820; display: block; margin-bottom: 2px;">📍 ${loc.name}</strong>
          ${loc.address ? `<div style="color: #68736b; font-size: 11px;">${loc.address}</div>` : ''}
          <div style="color: #2563eb; font-size: 11px; margin-top: 4px; font-weight: 500;">
            (${lat.toFixed(6)}, ${lng.toFixed(6)})
          </div>
          <div style="margin-top: 6px; font-size: 11px; color: #68736b; font-style: italic;">
            (Địa điểm đã lưu trong hệ thống)
          </div>
        </div>
      `);

      layer.addLayer(m);
    });
  }, [existingLocations, excludeId]);

  // [TÍNH NĂNG: Cập nhật vị trí ghim Marker đang chọn khi tọa độ thay đổi hoặc kéo ghim]
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
      <div
        className="picker-map-hint"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}
      >
        <span>📍 Nhấp chuột trên bản đồ hoặc kéo ghim cam để chấm tay tọa độ</span>
        {validExisting.length > 0 && (
          <span style={{ fontSize: '11px', color: '#68736b', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#2563eb', display: 'inline-block' }}></span>
            Địa điểm đã có ({validExisting.length})
          </span>
        )}
      </div>
    </div>
  );
}
