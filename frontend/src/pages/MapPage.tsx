import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { petsApi } from '../services/api';
import type { PetReportList, PaginatedResponse } from '../types';
import './MapPage.css';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom icon factory
const makeIcon = (lost: boolean) => L.divIcon({
  className: '',
  html: `<div class="map-marker ${lost ? 'map-marker-lost' : 'map-marker-found'}">${lost ? '🔴' : '🟢'}</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
});

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

function MapController({ center }: { center: [number, number] | null }) {
  const map = useMapEvents({});
  useEffect(() => {
    if (center) {
      map.flyTo(center, 14, { animate: true });
    }
  }, [center, map]);
  return null;
}

export default function MapPage() {
  const [pets, setPets] = useState<PetReportList[]>([]);
  const [loading, setLoading] = useState(true);
  const [geoLoading, setGeoLoading] = useState(false);
  const [userCenter, setUserCenter] = useState<[number, number] | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'LOST' | 'FOUND'>('ALL');

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('مرورگر شما از قابلیت دریافت موقعیت مکانی پشتیبانی نمی‌کند.');
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setUserCenter([pos.coords.latitude, pos.coords.longitude]);
        setGeoLoading(false);
      },
      () => {
        setGeoLoading(false);
        alert('امکان دریافت موقعیت وجود ندارد. لطفاً دسترسی لوکیشن را بررسی کنید.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  useEffect(() => {
    const load = async () => {
      // Fetch all pages
      let page = 1;
      let all: PetReportList[] = [];
      while (true) {
        const { data } = await petsApi.list({ page, page_size: 100 });
        const paged = data as PaginatedResponse<PetReportList>;
        all = [...all, ...paged.results];
        if (!paged.next) break;
        page++;
        if (page > 10) break; // safety
      }
      setPets(all);
      setLoading(false);
    };
    load();
  }, []);

  const visible = pets.filter(p => {
    if (filter !== 'ALL' && p.report_type !== filter) return false;
    return true;
  });

  return (
    <div className="map-page page-enter">
      <div className="map-header">
        <div className="container map-header-inner">
          <h1 className="map-title">🗺️ نقشه آگهی‌های حیوانات</h1>
          <div className="map-filter-chips">
            {(['ALL','LOST','FOUND'] as const).map(f => (
              <button
                key={f}
                className={`chip ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f === 'ALL' ? '📋 همه' : f === 'LOST' ? '🔴 گمشده' : '🟢 پیدا شده'}
              </button>
            ))}
            <button
              className="chip chip-locate"
              onClick={handleLocateMe}
              disabled={geoLoading}
              style={{ background: 'var(--white)', border: '1.5px solid var(--rose)', color: 'var(--rose)', fontWeight: 600 }}
            >
              {geoLoading ? '⏳ دریافت موقعیت...' : '📍 موقعیت من'}
            </button>
          </div>
        </div>
      </div>

      <div className="map-container">
        {loading ? (
          <div className="loading-center" style={{ height: '100%' }}>
            <div className="spinner" style={{ width: 48, height: 48 }} />
          </div>
        ) : (
          <MapContainer center={[35.7, 51.4]} zoom={11} className="full-map">
            <MapController center={userCenter} />
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            {visible.map(pet => {
              const petLat = pet.latitude ? parseFloat(pet.latitude) : null;
              const petLng = pet.longitude ? parseFloat(pet.longitude) : null;
              const hasExactCoords = petLat !== null && petLng !== null && !isNaN(petLat) && !isNaN(petLng);
              
              const pos: [number, number] = hasExactCoords
                ? [petLat, petLng]
                : [35.6892, 51.3890];

              return (
                <Marker
                  key={pet.id}
                  position={pos}
                  icon={makeIcon(pet.report_type === 'LOST')}
                >
                  <Popup>
                    <div className="map-popup">
                      {pet.main_image && (
                        <img
                          src={pet.main_image.startsWith('http') ? pet.main_image : `${API_BASE}${pet.main_image}`}
                          alt={pet.title}
                          className="popup-img"
                        />
                      )}
                      <div className="popup-body">
                        <p className="popup-type">
                          {pet.report_type === 'LOST' ? '🔴 گمشده' : '🟢 پیدا شده'}
                        </p>
                        <h3 className="popup-title">{pet.title}</h3>
                        <p className="popup-location">📍 {pet.city}{pet.district ? ` — ${pet.district}` : ''}</p>
                        <Link to={`/pets/${pet.id}`} className="btn btn-primary btn-sm popup-btn">
                          مشاهده آگهی
                        </Link>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        )}
      </div>

      {/* Side panel */}
      <div className="map-sidebar">
        <div className="map-stats">
          <span>📊 {visible.length} آگهی</span>
        </div>
        <div className="map-list">
          {visible.slice(0, 20).map(pet => (
            <Link to={`/pets/${pet.id}`} key={pet.id} className="map-list-item">
              <span className={`map-list-dot ${pet.report_type === 'LOST' ? 'dot-lost' : 'dot-found'}`} />
              <div className="map-list-info">
                <p className="map-list-title">{pet.title}</p>
                <p className="map-list-city">{pet.city}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
