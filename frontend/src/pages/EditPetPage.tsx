import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { petsApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import type { PetReportDetail } from '../types';
import '../pages/CreatePetPage.css';
import './EditPetPage.css';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function LocationPicker({ initial, onSelect }: { initial: [number, number] | null; onSelect: (lat: number, lng: number) => void }) {
  const [pos, setPos] = useState<[number, number] | null>(initial);
  useMapEvents({
    click(e) {
      const p: [number, number] = [e.latlng.lat, e.latlng.lng];
      setPos(p);
      onSelect(p[0], p[1]);
    },
  });
  return pos ? <Marker position={pos} /> : null;
}

export default function EditPetPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [newImages, setNewImages] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    report_type: 'LOST', pet_type: 'DOG', title: '', name: '', breed: '',
    color: '', gender: 'UNKNOWN', age: '', has_collar: false, microchip_id: '',
    special_features: '', event_date: '', event_time: '12:00', city: '', district: '',
    address_description: '', contact_phone: '', reward: '0',
  });

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await petsApi.detail(Number(id)) as { data: PetReportDetail };
        // Check ownership
        if (isAuthenticated && user && user.id !== data.user) {
          navigate(`/pets/${id}`);
          return;
        }
        const dateObj = data.event_date ? new Date(data.event_date) : null;
        const eventDate = dateObj ? dateObj.toISOString().slice(0, 10) : '';
        const eventTime = dateObj ? dateObj.toTimeString().slice(0, 5) : '12:00';

        setForm({
          report_type: data.report_type,
          pet_type: data.pet_type,
          title: data.title,
          name: data.name || '',
          breed: data.breed || '',
          color: data.color,
          gender: data.gender,
          age: data.age || '',
          has_collar: data.has_collar,
          microchip_id: data.microchip_id || '',
          special_features: data.special_features || '',
          event_date: eventDate,
          event_time: eventTime,
          city: data.city,
          district: data.district || '',
          address_description: data.address_description || '',
          contact_phone: data.contact_phone || '',
          reward: String(data.reward || 0),
        });
        if (data.latitude) setLat(parseFloat(data.latitude));
        if (data.longitude) setLng(parseFloat(data.longitude));
      } catch {
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, navigate, user, isAuthenticated]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleMapSelect = useCallback((la: number, lo: number) => {
    setLat(la); setLng(lo);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.color || !form.event_date || !form.city) {
      setError('لطفاً تمام فیلدهای اجباری را پر کنید.');
      return;
    }
    setSaving(true); setError('');
    try {
      const fd = new FormData();
      const timeStr = form.event_time || '12:00';
      const isoDateTime = new Date(`${form.event_date}T${timeStr}:00`).toISOString();

      Object.entries(form).forEach(([k, v]) => {
        if (k !== 'event_date' && k !== 'event_time') {
          fd.append(k, String(v));
        }
      });
      fd.append('event_date', isoDateTime);
      if (lat !== null) fd.append('latitude', lat.toFixed(6));
      if (lng !== null) fd.append('longitude', lng.toFixed(6));
      await petsApi.update(Number(id), fd);

      // Upload new images
      for (const file of newImages) {
        const imgFd = new FormData();
        imgFd.append('image', file);
        await petsApi.uploadImage(Number(id), imgFd);
      }
      setSuccess(true);
      setTimeout(() => navigate(`/pets/${id}`), 1200);
    } catch (err: any) {
      const detail = err.response?.data;
      setError(typeof detail === 'object' ? Object.values(detail).flat().join(' — ') : 'خطا در ذخیره تغییرات.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="loading-center" style={{ minHeight: '60vh' }}>
      <div className="spinner" style={{ width: 48, height: 48 }} />
    </div>
  );

  const mapCenter: [number, number] = lat && lng ? [lat, lng] : [35.7, 51.4];
  const mapZoom = lat && lng ? 14 : 11;

  return (
    <div className="create-page page-enter">
      <div className="container">
        <div className="edit-breadcrumb">
          <Link to={`/pets/${id}`}>← بازگشت به آگهی</Link>
        </div>

        <div className="create-header">
          <h1>✏️ ویرایش آگهی</h1>
          <p>تغییرات مورد نظر را اعمال کنید</p>
        </div>

        <form className="create-form" onSubmit={handleSubmit}>
          {error   && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">✅ تغییرات با موفقیت ذخیره شد! در حال انتقال...</div>}

          {/* نوع آگهی */}
          <div className="form-section">
            <h2 className="form-section-title">📋 نوع آگهی</h2>
            <div className="type-selector">
              <button type="button" className={`type-btn ${form.report_type === 'LOST' ? 'active-lost' : ''}`}
                onClick={() => setForm(p => ({ ...p, report_type: 'LOST' }))}>🔴 حیوان گمشده</button>
              <button type="button" className={`type-btn ${form.report_type === 'FOUND' ? 'active-found' : ''}`}
                onClick={() => setForm(p => ({ ...p, report_type: 'FOUND' }))}>🟢 حیوان پیدا شده</button>
            </div>
          </div>

          {/* اطلاعات حیوان */}
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
                <input name="title" className="form-control" required value={form.title} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">نام حیوان</label>
                <input name="name" className="form-control" value={form.name} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">نژاد</label>
                <input name="breed" className="form-control" value={form.breed} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">رنگ و طرح *</label>
                <input name="color" className="form-control" required value={form.color} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">سن تقریبی</label>
                <input name="age" className="form-control" value={form.age} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">شماره میکروچیپ</label>
                <input name="microchip_id" className="form-control" value={form.microchip_id} onChange={handleChange} />
              </div>
              <div className="form-group form-full" style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <input type="checkbox" name="has_collar" id="has_collar" checked={form.has_collar as boolean} onChange={handleChange} style={{ width: 18, height: 18, accentColor: 'var(--rose)' }} />
                <label htmlFor="has_collar" className="form-label" style={{ margin: 0 }}>قلاده دارد؟</label>
              </div>
              <div className="form-group form-full">
                <label className="form-label">ویژگی‌های خاص</label>
                <textarea name="special_features" className="form-control" rows={3} value={form.special_features} onChange={handleChange} />
              </div>
            </div>
          </div>

          {/* زمان و مکان */}
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
                <input name="city" className="form-control" required value={form.city} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">محله / منطقه</label>
                <input name="district" className="form-control" value={form.district} onChange={handleChange} />
              </div>
              <div className="form-group form-full">
                <label className="form-label">توضیحات دقیق محل</label>
                <textarea name="address_description" className="form-control" rows={2} value={form.address_description} onChange={handleChange} />
              </div>
            </div>

            <div className="map-picker-wrap">
              <p className="form-label" style={{ marginBottom: 8 }}>
                🗺️ موقعیت روی نقشه (برای تغییر کلیک کنید)
                {lat && <span className="text-xs text-muted" style={{ marginRight: 8 }}>✅ {lat.toFixed(4)}, {lng?.toFixed(4)}</span>}
              </p>
              <MapContainer center={mapCenter} zoom={mapZoom} className="map-picker">
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <LocationPicker
                  initial={lat && lng ? [lat, lng] : null}
                  onSelect={handleMapSelect}
                />
              </MapContainer>
            </div>
          </div>

          {/* تماس */}
          <div className="form-section">
            <h2 className="form-section-title">📞 تماس</h2>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">شماره تماس</label>
                <input name="contact_phone" className="form-control" value={form.contact_phone} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">مژدگانی (تومان)</label>
                <input type="number" name="reward" className="form-control" min="0" value={form.reward} onChange={handleChange} />
              </div>
            </div>
          </div>

          {/* تصاویر جدید */}
          <div className="form-section">
            <h2 className="form-section-title">📷 اضافه کردن تصاویر جدید</h2>
            <div className="upload-zone" onClick={() => fileRef.current?.click()}>
              <span style={{ fontSize: '2rem' }}>📷</span>
              <p>برای انتخاب تصویر جدید کلیک کنید</p>
              <p className="text-xs text-muted">تصاویر قبلی حذف نمی‌شوند</p>
              <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.webp" multiple style={{ display: 'none' }}
                onChange={e => setNewImages(Array.from(e.target.files || []))} />
            </div>
            {newImages.length > 0 && (
              <div className="upload-preview">
                {newImages.map((f, i) => (
                  <div key={i} className="upload-thumb">
                    <img src={URL.createObjectURL(f)} alt="" />
                    <span className="text-xs">{f.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="edit-form-actions">
            <Link to={`/pets/${id}`} className="btn btn-ghost btn-lg">انصراف</Link>
            <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
              {saving
                ? <><span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> در حال ذخیره...</>
                : '💾 ذخیره تغییرات'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
