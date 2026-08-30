import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { petsApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import type { PetReportDetail } from '../types';
import { PET_TYPE_LABELS, REPORT_TYPE_LABELS, GENDER_LABELS } from '../types';
import SightingModal from '../components/SightingModal';
import FoundModal    from '../components/FoundModal';
import StoryBannerModal from '../components/StoryBannerModal';
import './PetDetailPage.css';

// Fix leaflet marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

function absUrl(url: string | null) {
  if (!url) return null;
  return url.startsWith('http') ? url : `${API_BASE}${url}`;
}

export default function PetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [pet, setPet] = useState<PetReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const [resolving, setResolving] = useState(false);
  const [showSightingModal, setShowSightingModal] = useState(false);
  const [showFoundModal, setShowFoundModal] = useState(false);
  const [showStoryModal, setShowStoryModal] = useState(false);

  const loadPet = async () => {
    try {
      const { data } = await petsApi.detail(id!);
      setPet(data);
      setError(null);
    } catch {
      setError('آگهی مورد نظر یافت نشد یا ممکن است توسط ثبت‌کننده حذف شده باشد.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPet(); }, [id]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareTelegram = () => {
    if (!pet) return;
    const isLost = pet.report_type === 'LOST';
    const text = encodeURIComponent(
      `📢 ${isLost ? 'حیوان گمشده' : 'حیوان پیدا شده'}: ${pet.title}\n📍 شهر: ${pet.city}${pet.district ? `، ${pet.district}` : ''}\n${pet.reward ? `🎁 مژدگانی: ${pet.reward.toLocaleString('fa-IR')} تومان\n` : ''}مشاهده در سامانه نانا:`
    );
    window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${text}`, '_blank');
  };

  const handleShareWhatsApp = () => {
    if (!pet) return;
    const isLost = pet.report_type === 'LOST';
    const text = encodeURIComponent(
      `📢 *${isLost ? 'حیوان گمشده' : 'حیوان پیدا شده'}*\n📌 ${pet.title}\n📍 شهر: ${pet.city}${pet.district ? `، ${pet.district}` : ''}\n${pet.reward ? `🎁 مژدگانی: ${pet.reward.toLocaleString('fa-IR')} تومان\n` : ''}🔗 مشاهده آگهی:\n${window.location.href}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleShareTwitter = () => {
    if (!pet) return;
    const isLost = pet.report_type === 'LOST';
    const text = encodeURIComponent(
      `🚨 ${isLost ? 'حیوان گمشده' : 'حیوان پیدا شده'}: ${pet.title}\n📍 ${pet.city}${pet.district ? `، ${pet.district}` : ''}\n${pet.reward ? `🎁 مژدگانی: ${pet.reward.toLocaleString('fa-IR')} تومان\n` : ''}مشاهده در سامانه نانا:`
    );
    const url = encodeURIComponent(window.location.href);
    const hashtags = 'حیوان_گمشده,نانا,سگ,گربه';
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}&hashtags=${hashtags}`, '_blank');
  };

  const handleToggleResolved = async () => {
    if (!pet) return;
    setResolving(true);
    try {
      const { data } = await petsApi.toggleResolved(pet.id);
      setPet(data);
    } finally {
      setResolving(false);
    }
  };

  const handleDelete = async () => {
    if (!pet || !window.confirm('آیا مطمئن هستید؟ این عمل قابل بازگشت نیست.')) return;
    try {
      await petsApi.delete(pet.id);
      navigate('/');
    } catch {
      alert('خطا در حذف آگهی');
    }
  };

  if (loading) return (
    <div className="loading-center" style={{ minHeight: '60vh' }}>
      <div className="spinner" style={{ width: 48, height: 48 }} />
    </div>
  );

  if (error || !pet) {
    return (
      <div className="container" style={{ padding: '80px 16px', textAlign: 'center' }}>
        <div className="card-floating" style={{ maxWidth: 480, margin: '0 auto', padding: '40px 24px' }}>
          <span style={{ fontSize: '4rem', display: 'block', marginBottom: 16 }}>🔍🐾</span>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 12 }}>آگهی پیدا نشد</h2>
          <p style={{ color: 'var(--gray-600)', marginBottom: 24, fontSize: '0.95rem', lineHeight: 1.6 }}>
            {error || 'آگهی مورد نظر در دسترس نیست یا پاک شده است.'}
          </p>
          <Link to="/" className="btn btn-primary btn-lg" style={{ display: 'inline-flex' }}>
            🏠 بازگشت به صفحه اصلی
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = isAuthenticated && user && user.id === pet.user;
  const lat = pet.latitude ? parseFloat(pet.latitude) : null;
  const lng = pet.longitude ? parseFloat(pet.longitude) : null;
  const hasMap = lat !== null && lng !== null;
  const canReportFound = isAuthenticated && !isOwner && pet.report_type === 'LOST' && !pet.is_resolved;
  const canReportSighting = isAuthenticated && !isOwner && !pet.is_resolved;

  return (
    <div className="pet-detail-page page-enter">
      <div className="container">
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <Link to="/">خانه</Link>
          <span>›</span>
          <span>{pet.title}</span>
        </div>

        {/* ── Community Action Buttons (for non-owners) ── */}
        {isAuthenticated && !isOwner && !pet.is_resolved && (
          <div className="community-actions">
            <div className="community-banner">
              <span className="community-icon">🤝</span>
              <div>
                <p className="community-title">آیا این حیوان را دیده‌اید؟</p>
                <p className="community-sub">گزارش دهید تا صاحبش سریع‌تر پیدا شود</p>
              </div>
            </div>
            <div className="community-btns">
              {canReportSighting && (
                <button
                  className="btn btn-outline community-btn"
                  onClick={() => setShowSightingModal(true)}
                >
                  👁️ این حیوان رو دیدم
                </button>
              )}
              {canReportFound && (
                <button
                  className="btn btn-primary community-btn community-found"
                  onClick={() => setShowFoundModal(true)}
                >
                  🎉 پیداش کردم!
                </button>
              )}
            </div>
          </div>
        )}

        {/* Resolved banner */}
        {pet.is_resolved && (
          <div className="resolved-banner">
            ✅ این حیوان پیدا شده / پرونده مختومه است
          </div>
        )}

        <div className="pet-detail-layout">
          {/* Left: Images + Map */}
          <div className="pet-detail-media">
            {/* Image Gallery */}
            <div className="gallery">
              <div className="gallery-main">
                {pet.images.length > 0 ? (
                  <img
                    src={absUrl(pet.images[activeImg]?.image) || ''}
                    alt={pet.title}
                    className="gallery-main-img"
                  />
                ) : (
                  <div className="gallery-placeholder">
                    <span style={{ fontSize: '6rem' }}>
                      {pet.pet_type === 'CAT' ? '🐈' : pet.pet_type === 'DOG' ? '🐕' : pet.pet_type === 'BIRD' ? '🐦' : '🐾'}
                    </span>
                    <p>تصویری ثبت نشده</p>
                  </div>
                )}
              </div>
              {pet.images.length > 1 && (
                <div className="gallery-thumbs">
                  {pet.images.map((img, i) => (
                    <img
                      key={img.id}
                      src={absUrl(img.image) || ''}
                      alt=""
                      className={`gallery-thumb ${i === activeImg ? 'active' : ''}`}
                      onClick={() => setActiveImg(i)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Map */}
            {hasMap && (
              <div className="detail-map-wrap">
                <h3 className="detail-section-title">📍 موقعیت روی نقشه</h3>
                <MapContainer center={[lat!, lng!]} zoom={14} className="detail-map">
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={[lat!, lng!]}>
                    <Popup>{pet.title}</Popup>
                  </Marker>
                  <Circle center={[lat!, lng!]} radius={300} pathOptions={{ color: '#FF6B9D', fillOpacity: 0.1 }} />
                </MapContainer>
              </div>
            )}
          </div>

          {/* Right: Info */}
          <div className="pet-detail-info">
            <div className="detail-header">
              <div className="flex gap-2 items-center" style={{ flexWrap: 'wrap' }}>
                <span className={`badge ${pet.report_type === 'LOST' ? 'badge-lost' : 'badge-found'}`}>
                  {pet.report_type === 'LOST' ? '🔴' : '🟢'} {REPORT_TYPE_LABELS[pet.report_type]}
                </span>
                <span className="badge badge-type">{PET_TYPE_LABELS[pet.pet_type]}</span>
                {pet.is_resolved && <span className="badge badge-resolved">✅ پیدا شد</span>}
              </div>
              <h1 className="detail-title">{pet.title}</h1>
              <p className="detail-location">📍 {pet.city}{pet.district ? ` — ${pet.district}` : ''}</p>
            </div>

            {/* Sightings count badge */}
            {pet.sightings.length > 0 && (
              <div className="sightings-count-badge">
                <span>👁️ {pet.sightings.length} گزارش مشاهده ثبت شده</span>
                <a href="#sightings" className="text-xs text-pink">مشاهده همه ↓</a>
              </div>
            )}

            {/* Info Grid */}
            <div className="info-grid">
              {pet.name && <InfoRow icon="🏷️" label="نام" value={pet.name} />}
              <InfoRow icon="🗓️" label="تاریخ حادثه" value={new Date(pet.event_date).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' })} />
              <InfoRow icon="🎨" label="رنگ" value={pet.color} />
              {pet.breed && <InfoRow icon="🐾" label="نژاد" value={pet.breed} />}
              <InfoRow icon="⚥" label="جنسیت" value={GENDER_LABELS[pet.gender]} />
              {pet.age && <InfoRow icon="📅" label="سن" value={pet.age} />}
              <InfoRow icon="🔗" label="قلاده" value={pet.has_collar ? 'دارد' : 'ندارد'} />
              {pet.microchip_id && <InfoRow icon="💾" label="میکروچیپ" value={pet.microchip_id} />}
              {pet.contact_phone && (
                <div className="info-row info-row-phone">
                  <span className="info-icon">📞</span>
                  <span className="info-label">تماس</span>
                  <a href={`tel:${pet.contact_phone}`} className="info-value info-phone-link">
                    {pet.contact_phone}
                  </a>
                </div>
              )}
              {pet.reward > 0 && <InfoRow icon="🎁" label="مژدگانی" value={`${pet.reward.toLocaleString('fa-IR')} تومان`} highlight />}
            </div>

            {pet.special_features && (
              <div className="detail-block">
                <h3 className="detail-section-title">✨ ویژگی‌های خاص</h3>
                <p className="detail-text">{pet.special_features}</p>
              </div>
            )}

            {pet.address_description && (
              <div className="detail-block">
                <h3 className="detail-section-title">📍 توضیحات محل</h3>
                <p className="detail-text">{pet.address_description}</p>
              </div>
            )}

            {/* Social Sharing */}
            <div className="detail-block share-block" style={{ background: 'linear-gradient(135deg, #fff5f8 0%, #fff 100%)', padding: '20px 22px', borderRadius: 'var(--radius-xl)', border: '1.5px solid var(--pink-200)', marginTop: 22, boxShadow: '0 8px 24px rgba(255, 107, 157, 0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: '1.4rem' }}>📢</span>
                <div>
                  <h3 className="detail-section-title" style={{ fontSize: '1.05rem', margin: 0, color: 'var(--gray-900)' }}>اشتراک‌گذاری و بازنشر آگهی</h3>
                  <p className="text-xs text-muted" style={{ margin: 0 }}>هر بازنشر، شانس پیدا شدن این حیوان را چندین برابر می‌کند.</p>
                </div>
              </div>

              {/* Instagram Story Action */}
              <button
                type="button"
                className="btn btn-lg"
                onClick={() => setShowStoryModal(true)}
                style={{
                  width: '100%',
                  margin: '14px 0 10px',
                  background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  boxShadow: '0 4px 16px rgba(220, 39, 67, 0.35)',
                  justifyContent: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                📸 ساخت و دانلود بنر استوری اینستاگرام
              </button>

              {/* Social Channels Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={handleShareTwitter}
                  style={{ justifyContent: 'center', borderColor: '#000000', color: '#000000', fontWeight: 600, background: '#f8fafc' }}
                >
                  𝕏 توییتر / X
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={handleShareTelegram}
                  style={{ justifyContent: 'center', borderColor: '#229ED9', color: '#229ED9', fontWeight: 600, background: '#f0f9ff' }}
                >
                  ✈️ تلگرام
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={handleShareWhatsApp}
                  style={{ justifyContent: 'center', borderColor: '#25D366', color: '#25D366', fontWeight: 600, background: '#f0fdf4' }}
                >
                  💬 واتساپ
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={handleCopyLink}
                  style={{ justifyContent: 'center', fontWeight: 600 }}
                >
                  {copied ? '✅ کپی شد!' : '📋 کپی لینک'}
                </button>
              </div>
            </div>

            {/* Owner actions */}
            {isOwner && (
              <div className="owner-actions">
                <Link to={`/edit/${pet.id}`} className="btn btn-outline">✏️ ویرایش</Link>
                <button
                  className="btn btn-primary"
                  onClick={handleToggleResolved}
                  disabled={resolving}
                >
                  {pet.is_resolved ? '🔓 بازگشایی پرونده' : '✅ علامت‌گذاری پیدا شد'}
                </button>
                <button className="btn btn-ghost" onClick={handleDelete} style={{ color: '#ef4444' }}>
                  🗑️ حذف
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sightings section */}
        {pet.sightings.length > 0 && (
          <div className="sightings-section" id="sightings">
            <h2 className="detail-section-title" style={{ fontSize: '1.2rem', marginBottom: 20 }}>
              👁️ گزارش‌های دیده‌شدن ({pet.sightings.length})
            </h2>
            <div className="sightings-grid">
              {pet.sightings.map(s => (
                <div key={s.id} className="sighting-card card-floating">
                  <div className="flex justify-between items-center" style={{ marginBottom: 8 }}>
                    <span className="text-sm font-medium">📍 {s.location_description}</span>
                    <span className="text-xs text-muted">
                      {new Date(s.seen_at).toLocaleDateString('fa-IR')}
                    </span>
                  </div>
                  {s.user_phone && <p className="text-xs text-muted">👤 {s.user_phone}</p>}
                  {s.image && (
                    <img src={absUrl(s.image) || ''} alt="دیده‌شدن" className="sighting-img" />
                  )}
                  {s.latitude && s.longitude && (
                    <div className="sighting-map-wrap">
                      <MapContainer
                        center={[parseFloat(s.latitude), parseFloat(s.longitude)]}
                        zoom={14}
                        className="sighting-map"
                        dragging={false}
                        scrollWheelZoom={false}
                        zoomControl={false}
                      >
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <Marker position={[parseFloat(s.latitude), parseFloat(s.longitude)]} />
                      </MapContainer>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty sightings CTA */}
        {pet.sightings.length === 0 && !pet.is_resolved && isAuthenticated && !isOwner && (
          <div className="sightings-empty-cta">
            <p>🔍 هنوز هیچ گزارش مشاهده‌ای ثبت نشده.</p>
            <button className="btn btn-outline" onClick={() => setShowSightingModal(true)}>
              👁️ اولین گزارش رو ثبت کنید
            </button>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {showSightingModal && (
        <SightingModal
          reportId={pet.id}
          reportTitle={pet.title}
          centerLat={lat ?? undefined}
          centerLng={lng ?? undefined}
          onClose={() => setShowSightingModal(false)}
          onSuccess={loadPet}
        />
      )}
      {showFoundModal && (
        <FoundModal
          reportId={pet.id}
          reportTitle={pet.title}
          contactPhone={pet.contact_phone}
          onClose={() => setShowFoundModal(false)}
          onSuccess={loadPet}
        />
      )}
      {showStoryModal && (
        <StoryBannerModal
          pet={pet}
          onClose={() => setShowStoryModal(false)}
        />
      )}
    </div>
  );
}

function InfoRow({ icon, label, value, highlight = false }: { icon: string; label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`info-row ${highlight ? 'info-row-highlight' : ''}`}>
      <span className="info-icon">{icon}</span>
      <span className="info-label">{label}</span>
      <span className="info-value">{value}</span>
    </div>
  );
}
