import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { petsApi } from '../services/api';
import { normalizeDigits } from '../utils/normalizeDigits';
import './CreatePetPage.css';

// Fix leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function LocationPicker({ pos, onSelect }: { pos: [number, number] | null; onSelect: (lat: number, lng: number) => void }) {
  const map = useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      onSelect(Number(lat.toFixed(6)), Number(lng.toFixed(6)));
    },
  });

  useEffect(() => {
    if (pos) {
      map.flyTo(pos, 14, { animate: true });
    }
  }, [pos, map]);

  return pos ? <Marker position={pos} /> : null;
}

export default function CreatePetPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [error, setError] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

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
        alert('امکان دریافت موقعیت وجود ندارد. لطفاً دسترسی موقعیت مکانی مرورگر را بررسی کنید.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files);
    setImages(prev => [...prev, ...newFiles]);
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const [form, setForm] = useState({
    report_type: 'LOST',
    pet_type: 'DOG',
    title: '',
    name: '',
    breed: '',
    color: '',
    gender: 'UNKNOWN',
    age: '',
    has_collar: false,
    microchip_id: '',
    special_features: '',
    event_date: new Date().toISOString().slice(0, 10),
    event_time: '12:00',
    city: '',
    district: '',
    address_description: '',
    contact_phone: '',
    reward: '0',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleMapSelect = useCallback((la: number, lo: number) => {
    setLat(la);
    setLng(lo);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.color || !form.event_date || !form.city) {
      setError('لطفاً تمام فیلدهای اجباری را پر کنید.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const fd = new FormData();
      const timeStr = form.event_time || '12:00';
      const isoDateTime = new Date(`${form.event_date}T${timeStr}:00`).toISOString();

      Object.entries(form).forEach(([k, v]) => {
        if (k !== 'event_date' && k !== 'event_time') {
          if (k === 'contact_phone' || k === 'reward' || k === 'age') {
            fd.append(k, normalizeDigits(String(v)));
          } else {
            fd.append(k, String(v));
          }
        }
      });
      fd.append('event_date', isoDateTime);
      if (lat !== null) fd.append('latitude', lat.toFixed(6));
      if (lng !== null) fd.append('longitude', lng.toFixed(6));

      const { data } = await petsApi.create(fd);

      // Upload images one by one
      for (const file of images) {
        const imgFd = new FormData();
        imgFd.append('image', file);
        await petsApi.uploadImage(data.id, imgFd);
      }

      navigate(`/pets/${data.id}`);
    } catch (err: any) {
      const detail = err.response?.data;
      if (typeof detail === 'object') {
        setError(Object.values(detail).flat().join(' — '));
      } else {
        setError('خطا در ثبت آگهی. مجدد تلاش کنید.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-page page-enter">
      <div className="container">
        <div className="create-header">
          <h1>🐾 ثبت آگهی جدید</h1>
          <p>اطلاعات حیوان گمشده یا پیدا‌شده را وارد کنید</p>
        </div>

        <form className="create-form" onSubmit={handleSubmit}>
          {error && <div className="alert alert-error">{error}</div>}

          {/* Step 1: نوع آگهی */}
          <div className="form-section">
            <h2 className="form-section-title">📋 نوع آگهی</h2>
            <div className="type-selector">
              <button
                type="button"
                className={`type-btn ${form.report_type === 'LOST' ? 'active-lost' : ''}`}
                onClick={() => setForm(p => ({ ...p, report_type: 'LOST' }))}
              >
                🔴 حیوان گمشده
              </button>
              <button
                type="button"
                className={`type-btn ${form.report_type === 'FOUND' ? 'active-found' : ''}`}
                onClick={() => setForm(p => ({ ...p, report_type: 'FOUND' }))}
              >
                🟢 حیوان پیدا شده
              </button>
            </div>
          </div>

          {/* Step 2: اطلاعات حیوان */}
          <div className="form-section">
            <h2 className="form-section-title">🐾 اطلاعات حیوان</h2>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">نوع حیوان *</label>
                <select name="pet_type" className="form-control" value={form.pet_type} onChange={handleChange}>
                  <option value="DOG">🐕 سگ</option>
                  <option value="CAT">🐈 گربه</option>
                  <option value="BIRD">🐦 پرنده</option>
                  <option value="OTHER">🐾 سایر</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">جنسیت</label>
                <select name="gender" className="form-control" value={form.gender} onChange={handleChange}>
                  <option value="MALE">نر</option>
                  <option value="FEMALE">ماده</option>
                  <option value="UNKNOWN">نامشخص</option>
                </select>
              </div>
              <div className="form-group form-full">
                <label className="form-label">عنوان آگهی *</label>
                <input name="title" className="form-control" placeholder="مثال: گمشدن سگ گلدن در پارک ملت" required value={form.title} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">نام حیوان</label>
                <input name="name" className="form-control" placeholder="نام" value={form.name} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">نژاد</label>
                <input name="breed" className="form-control" placeholder="نژاد" value={form.breed} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">رنگ و طرح *</label>
                <input name="color" className="form-control" placeholder="مثال: قهوه‌ای با لکه‌های سفید" required value={form.color} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">سن تقریبی</label>
                <input name="age" className="form-control" placeholder="مثال: ۲ سال" value={form.age} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">شماره میکروچیپ</label>
                <input name="microchip_id" className="form-control" placeholder="اختیاری" value={form.microchip_id} onChange={handleChange} />
              </div>
              <div className="form-group form-full" style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <input type="checkbox" name="has_collar" id="has_collar" checked={form.has_collar as boolean} onChange={handleChange} style={{ width: 18, height: 18, accentColor: 'var(--rose)' }} />
                <label htmlFor="has_collar" className="form-label" style={{ margin: 0 }}>قلاده دارد؟</label>
              </div>
              <div className="form-group form-full">
                <label className="form-label">ویژگی‌های خاص</label>
                <textarea name="special_features" className="form-control" rows={3} placeholder="هرگونه مشخصه خاص ظاهری یا رفتاری..." value={form.special_features} onChange={handleChange} />
              </div>
            </div>
          </div>

          {/* Step 3: زمان و مکان */}
          <div className="form-section">
            <h2 className="form-section-title">📍 زمان و مکان</h2>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">تاریخ حادثه *</label>
                <input type="date" name="event_date" className="form-control" required value={form.event_date} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">ساعت حادثه (تقریبی)</label>
                <input type="time" name="event_time" className="form-control" value={form.event_time} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">شهر *</label>
                <input name="city" className="form-control" placeholder="تهران" required value={form.city} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">محله / منطقه</label>
                <input name="district" className="form-control" placeholder="ونک" value={form.district} onChange={handleChange} />
              </div>
              <div className="form-group form-full">
                <label className="form-label">توضیحات دقیق محل</label>
                <textarea name="address_description" className="form-control" rows={2} placeholder="نزدیک به..." value={form.address_description} onChange={handleChange} />
              </div>
            </div>

            {/* Map picker */}
            <div className="map-picker-wrap">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                <p className="form-label" style={{ margin: 0 }}>
                  🗺️ موقعیت روی نقشه (کلیک کنید)
                  {lat && <span className="text-xs text-muted" style={{ marginRight: 8 }}>✅ مختصات: {lat.toFixed(4)}, {lng?.toFixed(4)}</span>}
                </p>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={handleGetCurrentLocation}
                  disabled={geoLoading}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  {geoLoading ? <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> : '📍 موقعیت فعلی من'}
                </button>
              </div>
              <MapContainer center={[35.7, 51.4]} zoom={11} className="map-picker">
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <LocationPicker pos={lat && lng ? [lat, lng] : null} onSelect={handleMapSelect} />
              </MapContainer>
            </div>
          </div>

          {/* Step 4: تماس و مژدگانی */}
          <div className="form-section">
            <h2 className="form-section-title">📞 تماس</h2>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">شماره تماس اضطراری</label>
                <input name="contact_phone" className="form-control" placeholder="09..." value={form.contact_phone} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">مژدگانی (تومان)</label>
                <input type="number" name="reward" className="form-control" min="0" value={form.reward} onChange={handleChange} />
              </div>
            </div>
          </div>

          {/* Step 5: تصاویر */}
          <div className="form-section">
            <h2 className="form-section-title">📷 تصاویر</h2>
            <div
              className="upload-zone"
              onClick={() => fileRef.current?.click()}
            >
              <span style={{ fontSize: '2.5rem' }}>📷</span>
              <p>برای انتخاب تصویر کلیک کنید</p>
              <p className="text-xs text-muted">حداکثر ۵ مگابایت — JPG, PNG, WEBP</p>
              <input
                ref={fileRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                multiple
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
            </div>
            {images.length > 0 && (
              <div className="upload-preview" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 16 }}>
                {images.map((f, i) => (
                  <div key={i} className="upload-thumb" style={{ position: 'relative', width: 100, height: 100, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--gray-200)' }}>
                    <img src={URL.createObjectURL(f)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleRemoveImage(i); }}
                      style={{
                        position: 'absolute', top: 4, right: 4, background: 'rgba(239,68,68,0.85)',
                        color: '#fff', border: 'none', borderRadius: '50%', width: 22, height: 22,
                        fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}
                      title="حذف تصویر"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
            {loading ? <><span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> در حال ثبت...</> : '✅ ثبت آگهی'}
          </button>
        </form>
      </div>
    </div>
  );
}
