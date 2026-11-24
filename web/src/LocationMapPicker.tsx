import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const pickerIcon = L.divIcon({
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

interface LocationMapPickerProps {
  latitude: number | null | undefined;
  longitude: number | null | undefined;
  onChange: (latitude: number, longitude: number) => void;
  height?: number | string;
}

export function LocationMapPicker({ latitude, longitude, onChange, height = 260 }: LocationMapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Default center if no coordinates: Hanoi center
  const defaultLat = 21.028511;
  const defaultLng = 105.854444;

  const currentLat = latitude != null && !Number.isNaN(latitude) ? latitude : null;
  const currentLng = longitude != null && !Number.isNaN(longitude) ? longitude : null;

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialCenter: [number, number] = [
        currentLat ?? defaultLat,
        currentLng ?? defaultLng,
      ];
      const initialZoom = currentLat && currentLng ? 16 : 13;

      const map = L.map(mapContainerRef.current, {
        center: initialCenter,
        zoom: initialZoom,
        attributionControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      // Click to pick location
      map.on('click', (event: L.LeafletMouseEvent) => {
        const { lat, lng } = event.latlng;
        const fixedLat = Number(lat.toFixed(7));
        const fixedLng = Number(lng.toFixed(7));
        onChange(fixedLat, fixedLng);
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

  // Update marker position and map center when latitude/longitude props change
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
