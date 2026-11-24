import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { ApiLocation, ApiPoi } from './api';

const visitorMarkerIcon = L.divIcon({
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

interface VisitorMapProps {
  locations: ApiLocation[];
  pois: ApiPoi[];
  language: string;
  onNavigateToPoi: (poiId: number) => void;
  onSwitchToList: () => void;
}

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
      !Number.isNaN(Number(loc.latitude)) && !Number.isNaN(Number(loc.longitude)),
  );
  const locationsWithoutCoordsCount = locations.filter((loc) => loc.isActive).length - activeLocationsWithCoords.length;

  const translateLocation = (translations: ApiLocation['translations']) =>
    translations.find((item) => item.languageCode === language)?.name ??
    translations.find((item) => item.languageCode === 'en')?.name ??
    '';

  const translateLocationDesc = (translations: ApiLocation['translations']) =>
    translations.find((item) => item.languageCode === language)?.shortDescription ??
    translations.find((item) => item.languageCode === 'en')?.shortDescription ??
    '';

  const translatePoi = (translations: ApiPoi['translations']) =>
    translations.find((item) => item.languageCode === language)?.name ??
    translations.find((item) => item.languageCode === 'en')?.name ??
    '';

  useEffect(() => {
    if (!mapContainerRef.current) return;

    try {
      if (!mapInstanceRef.current) {
        const defaultCenter: [number, number] = [21.028511, 105.854444]; // Hanoi
        const map = L.map(mapContainerRef.current, {
          center: defaultCenter,
          zoom: 13,
          attributionControl: true,
        });

        const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        });

        tileLayer.on('tileerror', () => {
          // If offline or tiles fail to load
          setMapError('Không thể tải các mảnh bản đồ số (tile error). Vui lòng kiểm tra kết nối mạng.');
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

  // Update markers when locations or language changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    if (activeLocationsWithCoords.length === 0) {
      return;
    }

    const bounds = L.latLngBounds([]);

    activeLocationsWithCoords.forEach((loc) => {
      const lat = Number(loc.latitude);
      const lng = Number(loc.longitude);
      const pos: [number, number] = [lat, lng];
      bounds.extend(pos);

      const locName = translateLocation(loc.translations);
      const locDesc = translateLocationDesc(loc.translations);
      const locPois = pois.filter((poi) => poi.locationId === loc.id && poi.isActive);

      const marker = L.marker(pos, {
        icon: visitorMarkerIcon,
        title: locName,
      });

      // Construct popup HTML
      const popupDiv = document.createElement('div');
      popupDiv.className = 'visitor-map-popup';

      const titleEl = document.createElement('h3');
      titleEl.className = 'popup-title';
      titleEl.textContent = locName;
      popupDiv.appendChild(titleEl);

      if (loc.address) {
        const addrEl = document.createElement('p');
        addrEl.className = 'popup-address';
        addrEl.innerHTML = `<span class="popup-icon">📍</span> ${loc.address}`;
        popupDiv.appendChild(addrEl);
      }

      if (locDesc) {
        const descEl = document.createElement('p');
        descEl.className = 'popup-desc';
        descEl.textContent = locDesc;
        popupDiv.appendChild(descEl);
      }

      const poiSection = document.createElement('div');
      poiSection.className = 'popup-pois-section';

      if (locPois.length > 0) {
        const poiHeading = document.createElement('div');
        poiHeading.className = 'popup-pois-heading';
        poiHeading.textContent = `${locPois.length} điểm tham quan:`;
        poiSection.appendChild(poiHeading);

        // Primary Listen button for the first POI
        const primaryListenBtn = document.createElement('button');
        primaryListenBtn.className = 'popup-listen-btn';
        primaryListenBtn.innerHTML = `🎧 Nghe thuyết minh: <strong>${translatePoi(locPois[0].translations)}</strong>`;
        primaryListenBtn.onclick = (e) => {
          e.preventDefault();
          onNavigateToPoi(locPois[0].id);
        };
        poiSection.appendChild(primaryListenBtn);

        // List remaining POIs if more than 1
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
      <div className="visitor-map-toolbar">
        <div className="visitor-map-info">
          <h2>Bản đồ địa điểm du lịch</h2>
          <span className="visitor-map-stats">
            {activeLocationsWithCoords.length} địa điểm trên bản đồ
            {locationsWithoutCoordsCount > 0 && ` · ${locationsWithoutCoordsCount} địa điểm chưa có tọa độ`}
          </span>
        </div>
        <button type="button" className="quiet-button view-list-btn" onClick={onSwitchToList}>
          ☰ Xem dạng danh sách
        </button>
      </div>

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

      <div
        ref={mapContainerRef}
        className="visitor-leaflet-container"
        style={{ display: mapError ? 'none' : 'block' }}
      />
    </section>
  );
}
