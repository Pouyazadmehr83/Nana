import { useState, useCallback, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { sightingsApi } from '../services/api';
import './Modal.css';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function LocationPicker({ pos, onSelect }: { pos: [number, number] | null; onSelect: (lat: number, lng: number) => void }) {
  const map = useMapEvents({
    click(e) {
      onSelect(Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6)));
    },
  });

  useEffect(() => {
    if (pos) {
      map.flyTo(pos, 14, { animate: true });
    }
  }, [pos, map]);

  return pos ? <Marker position={pos} /> : null;
}

interface Props {
  reportId: number;
  reportTitle: string;
  centerLat?: number;
  centerLng?: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SightingModal({ reportId, reportTitle, centerLat, centerLng, onClose, onSuccess }: Props) {
  const [desc, setDesc] = useState('');
  const [seenDate, setSeenDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [seenTime, setSeenTime] = useState(() => new Date().toTimeString().slice(0, 5));
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('مرورگر شما از دریافت موقعیت مکانی پشتیبانی نمی‌کند.');
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const userLat = Number(pos.coords.latitude.toFixed(6));
        const userLng = Number(pos.coords.longitude.toFixed(6));
        setLat(userLat);
        setLng(userLng);
        setGeoLoading(false);
      },
      () => {
        setGeoLoading(false);
        alert('امکان دریافت موقعیت وجود ندارد. لطفاً دسترسی لوکیشن را بررسی کنید.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleMapSelect = useCallback((la: number, lo: number) => {
    setLat(la); setLng(lo);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc.trim()) { setError('توضیحات محل مشاهده اجباری است.'); return; }
    setLoading(true); setError('');
    try {
      const fd = new FormData();
      const timeStr = seenTime || '12:00';
      const isoDateTime = new Date(`${seenDate}T${timeStr}:00`).toISOString();

      fd.append('report', String(reportId));
      fd.append('location_description', desc);
      fd.append('seen_at', isoDateTime);
      if (lat !== null) fd.append('latitude', lat.toFixed(6));
      if (lng !== null) fd.append('longitude', lng.toFixed(6));
      if (image) fd.append('image', image);
      await sightingsApi.create(fd);
      onSuccess();
      onClose();
    } catch (err: any) {
      const d = err.response?.data;
      setError(typeof d === 'object' ? Object.values(d).flat().join(' — ') : 'خطا در ثبت گزارش.');
    } finally {
      setLoading(false);
    }
  };

  const mapCenter: [number, number] = centerLat && centerLng
    ? [centerLat, centerLng]
    : [35.7, 51.4];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">👁️ گزارش مشاهده</h2>
            <p className="modal-subtitle">«{reportTitle}» رو دیدم</p>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          {error && <div className="alert alert-error">{error}</div>}

          <div className="form-group">
            <label className="form-label">📍 توضیح محل مشاهده *</label>
            <textarea
              className="form-control"
              rows={3}
              placeholder="مثال: نزدیک پارک لاله، جلوی کافه‌ای در خیابان ولیعصر..."
              value={desc}
              onChange={e => setDesc(e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">📅 تاریخ مشاهده *</label>
              <input
                type="date"
                className="form-control"
                value={seenDate}
                onChange={e => setSeenDate(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">🕐 ساعت مشاهده</label>
              <input
                type="time"
                className="form-control"
                value={seenTime}
                onChange={e => setSeenTime(e.target.value)}
              />
            </div>
          </div>

          {/* Map */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap', gap: 6 }}>
              <label className="form-label" style={{ margin: 0 }}>
                🗺️ موقعیت روی نقشه (کلیک کنید)
                {lat && (
                  <span className="text-xs text-muted" style={{ marginRight: 8, fontWeight: 400 }}>
                    ✅ {lat.toFixed(4)}, {lng?.toFixed(4)}
                  </span>
                )}
              </label>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={handleGetCurrentLocation}
                disabled={geoLoading}
                style={{ padding: '4px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                {geoLoading ? <span className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} /> : '📍 موقعیت من'}
              </button>
            </div>
            <div className="modal-map-wrap">
              <MapContainer center={mapCenter} zoom={13} className="modal-map">
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <LocationPicker pos={lat && lng ? [lat, lng] : null} onSelect={handleMapSelect} />
              </MapContainer>
            </div>
          </div>

          {/* Image upload */}
          <div className="form-group">
            <label className="form-label">📷 تصویر (اختیاری)</label>
            <div
              className="upload-zone-sm"
              onClick={() => document.getElementById('sighting-img')?.click()}
            >
              {image ? (
                <div className="sighting-img-preview">
                  <img src={URL.createObjectURL(image)} alt="" />
                  <span className="text-xs">{image.name}</span>
                </div>
              ) : (
                <>
                  <span style={{ fontSize: '1.5rem' }}>📷</span>
                  <span className="text-sm text-muted">انتخاب تصویر</span>
                </>
              )}
              <input
                id="sighting-img"
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                style={{ display: 'none' }}
                onChange={e => setImage(e.target.files?.[0] || null)}
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>انصراف</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading
                ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> در حال ثبت...</>
                : '✅ ثبت گزارش مشاهده'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
