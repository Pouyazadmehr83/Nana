import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { petsApi } from '../services/api';
import './CreatePetPage.css';

// Fix leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function LocationPicker({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
  const [pos, setPos] = useState<[number, number] | null>(null);
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPos([lat, lng]);
      onSelect(lat, lng);
    },
  });
  return pos ? <Marker position={pos} /> : null;
}

export default function CreatePetPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

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
    event_date: '',
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
      Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
      if (lat !== null) fd.append('latitude', String(lat));
      if (lng !== null) fd.append('longitude', String(lng));

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
                <label className="form-label">تاریخ و ساعت حادثه *</label>
                <input type="datetime-local" name="event_date" className="form-control" required value={form.event_date} onChange={handleChange} />
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
              <p className="form-label" style={{ marginBottom: 8 }}>
                🗺️ موقعیت روی نقشه (کلیک کنید)
                {lat && <span className="text-xs text-muted" style={{ marginRight: 8 }}>✅ مختصات ثبت شد: {lat.toFixed(4)}, {lng?.toFixed(4)}</span>}
              </p>
              <MapContainer center={[35.7, 51.4]} zoom={11} className="map-picker">
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <LocationPicker onSelect={handleMapSelect} />
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
                onChange={e => setImages(Array.from(e.target.files || []))}
              />
            </div>
            {images.length > 0 && (
              <div className="upload-preview">
                {images.map((f, i) => (
                  <div key={i} className="upload-thumb">
                    <img src={URL.createObjectURL(f)} alt="" />
                    <span className="text-xs">{f.name}</span>
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
