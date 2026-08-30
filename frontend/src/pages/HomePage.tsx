import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import PetCard from '../components/PetCard';
import { petsApi } from '../services/api';
import type { PetReportList, PaginatedResponse, ReportType, PetType } from '../types';
import './HomePage.css';

const PET_TYPES: { value: PetType | ''; label: string }[] = [
  { value: '', label: '🐾 همه' },
  { value: 'DOG', label: '🐕 سگ' },
  { value: 'CAT', label: '🐈 گربه' },
  { value: 'BIRD', label: '🐦 پرنده' },
  { value: 'OTHER', label: '🐾 سایر' },
];

const REPORT_TYPES: { value: ReportType | ''; label: string }[] = [
  { value: '', label: '📋 همه' },
  { value: 'LOST', label: '🔴 گمشده' },
  { value: 'FOUND', label: '🟢 پیدا شده' },
];

export default function HomePage() {
  const [pets, setPets] = useState<PetReportList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [reportType, setReportType] = useState<ReportType | ''>('');
  const [petType, setPetType] = useState<PetType | ''>('');
  const [hasReward, setHasReward] = useState<boolean | null>(null);
  const [city, setCity] = useState('');
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);

  const fetchPets = useCallback(async (reset = false) => {
    setLoading(true);
    setError('');
    const currentPage = reset ? 1 : page;
    try {
      const params: Record<string, string | number | boolean> = { page: currentPage };
      if (search)              params.search     = search;
      if (reportType)          params.report_type = reportType;
      if (petType)             params.pet_type    = petType;
      if (city)                params.city        = city;
      if (hasReward !== null)  params.has_reward  = hasReward;

      const { data } = await petsApi.list(params as any);
      const paged = data as PaginatedResponse<PetReportList>;

      if (reset || currentPage === 1) {
        setPets(paged.results);
      } else {
        setPets(prev => [...prev, ...paged.results]);
      }
      setCount(paged.count);
      setHasNext(!!paged.next);
    } catch {
      setError('خطا در دریافت آگهی‌ها. لطفاً مجدد تلاش کنید.');
    } finally {
      setLoading(false);
    }
  }, [search, reportType, petType, city, hasReward, page]);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setPage(1);
    fetchPets(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, reportType, petType, city, hasReward]);

  useEffect(() => {
    if (page > 1) fetchPets(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchPets(true);
  };

  return (
    <div className="home-page page-enter">
      {/* Hero Banner */}
      <section className="hero">
        <div className="hero-bg-blob blob1" />
        <div className="hero-bg-blob blob2" />
        <div className="container hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              🐾 پلتفرم جستجوی<br />
              <span className="hero-gradient">حیوانات گمشده</span>
            </h1>
            <p className="hero-desc">
              آگهی حیوان گمشده یا پیدا شده ثبت کنید، روی نقشه مشاهده کنید و با صاحبان
              آن‌ها در تماس باشید.
            </p>
            <div className="hero-actions">
              <Link to="/create" className="btn btn-primary btn-lg">+ ثبت آگهی جدید</Link>
              <Link to="/map" className="btn btn-outline btn-lg">🗺️ مشاهده نقشه</Link>
            </div>
          </div>
          <div className="hero-emoji">🐕🐈🐦</div>
        </div>
      </section>

      {/* Stats bar */}
      <div className="container">
        <div className="stats-bar">
          <div className="stat-item">
            <span className="stat-num">{count.toLocaleString('fa-IR')}</span>
            <span className="stat-label">آگهی فعال</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-num">🔴</span>
            <span className="stat-label">گمشده</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-num">🟢</span>
            <span className="stat-label">پیدا شده</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="container">
        <div className="filters-section">
          {/* Search */}
          <form className="search-bar" onSubmit={handleSearch}>
            <input
              type="text"
              className="form-control search-input"
              placeholder="جستجو در عنوان، نژاد، رنگ، شهر..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <button type="submit" className="btn btn-primary">جستجو</button>
          </form>

          {/* Chip filters */}
          <div className="chip-filters">
            <div className="chip-group">
              {REPORT_TYPES.map(rt => (
                <button
                  key={rt.value}
                  className={`chip ${reportType === rt.value ? 'active' : ''}`}
                  onClick={() => setReportType(rt.value as ReportType | '')}
                >
                  {rt.label}
                </button>
              ))}
            </div>
            <div className="chip-group">
              {PET_TYPES.map(pt => (
                <button
                  key={pt.value}
                  className={`chip ${petType === pt.value ? 'active' : ''}`}
                  onClick={() => setPetType(pt.value as PetType | '')}
                >
                  {pt.label}
                </button>
              ))}
              <button
                className={`chip ${hasReward === true ? 'active' : ''}`}
                onClick={() => setHasReward(prev => (prev === true ? null : true))}
                style={{ borderColor: 'var(--rose)' }}
              >
                💰 دارای مژدگانی
              </button>
            </div>
          </div>

          {/* City filter */}
          <div className="city-filter">
            <input
              type="text"
              className="form-control"
              placeholder="🏙️ فیلتر بر اساس شهر..."
              value={city}
              onChange={e => setCity(e.target.value)}
              style={{ maxWidth: 240 }}
            />
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="container">
        {error && <div className="alert alert-error" style={{ marginBottom: 24 }}>{error}</div>}

        {loading && pets.length === 0 ? (
          <div className="grid-pets">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 340, borderRadius: 20 }} />
            ))}
          </div>
        ) : pets.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: '4rem' }}>🔍</div>
            <h3>آگهی‌ای پیدا نشد</h3>
            <p>فیلترها را تغییر دهید یا آگهی جدیدی ثبت کنید.</p>
            <Link to="/create" className="btn btn-primary">+ ثبت آگهی</Link>
          </div>
        ) : (
          <>
            <div className="grid-pets">
              {pets.map(pet => <PetCard key={pet.id} pet={pet} />)}
            </div>
            {hasNext && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 40 }}>
                <button
                  className="btn btn-outline btn-lg"
                  onClick={() => setPage(p => p + 1)}
                  disabled={loading}
                >
                  {loading ? <span className="spinner" style={{ width: 20, height: 20 }} /> : 'بارگذاری بیشتر'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
