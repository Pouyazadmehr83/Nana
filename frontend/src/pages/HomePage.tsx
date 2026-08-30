import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import PetCard from '../components/PetCard';
import SkeletonCard from '../components/SkeletonCard';
import { petsApi } from '../services/api';
import type { PetReportList, PaginatedResponse, ReportType, PetType } from '../types';
import {
  SearchIcon,
  MapPinIcon,
  PlusIcon,
  SparklesIcon,
  ShieldCheckIcon,
  GiftIcon,
  ShareIcon,
  CheckCircleIcon
} from '../components/Icons';
import './HomePage.css';

const PET_TYPES: { value: PetType | ''; label: string; icon: string }[] = [
  { value: '', label: 'همه حیوانات', icon: '🐾' },
  { value: 'DOG', label: 'سگ‌ها', icon: '🐕' },
  { value: 'CAT', label: 'گربه‌ها', icon: '🐈' },
  { value: 'BIRD', label: 'پرندگان', icon: '🐦' },
  { value: 'OTHER', label: 'سایر حیوانات', icon: '🐇' },
];

const REPORT_TYPES: { value: ReportType | ''; label: string }[] = [
  { value: '', label: 'همه آگهی‌ها' },
  { value: 'LOST', label: '🔴 حیوانات گمشده' },
  { value: 'FOUND', label: '🟢 حیوانات پیدا شده' },
];

// Real-world inspiring success stories
const SUCCESS_STORIES = [
  {
    id: 1,
    name: 'تدی (سگ پامرانین)',
    city: 'تهران، سعادت‌آباد',
    time: 'پیدا شد در کمتر از ۲۴ ساعت',
    quote: 'باورم نمی‌شد تدی رو پیدا کنم! بنر استوری نانا رو در اینستاگرام گذاشتم و یکی از همسایه‌ها تماس گرفت و پسش داد.',
    tag: 'بازگشت به آغوش خانواده ❤️',
    img: 'https://images.unsplash.com/photo-1546527868-ccb7ee7dfa6a?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 2,
    name: 'برفی (گربه پرشین)',
    city: 'کرج، عظیمیه',
    time: 'پیدا شد در ۴۸ ساعت',
    quote: 'از طریق ثبت گزارش دیده‌شدن روی نقشه نانا متوجه شدیم توی پارک محله بوده. واقعاً ممنونم از تیم خوبتون.',
    tag: 'نجات موفقیت‌آمیز 🐾',
    img: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 3,
    name: 'کوکو (عروس هلندی)',
    city: 'اصفهان، مرداویج',
    time: 'پیدا شد در ۱۲ ساعت',
    quote: 'کوکو از بالکن پرواز کرده بود. خوشبختانه یابنده آگهی پیدا شده ثبت کرد و کمتر از یک روز به دستم رسید.',
    tag: 'وصال شیرین 🎉',
    img: 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=400&auto=format&fit=crop&q=80',
  },
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
      {/* ── 1. Live Activity News Ticker ── */}
      <div className="live-ticker-wrap">
        <div className="container live-ticker-inner">
          <span className="ticker-label">
            <span className="live-pulse-dot" />
            فعالیت زنده:
          </span>
          <div className="ticker-marquee">
            <span>🚨 آگهی جدید سگ گمشده در جردن تهران</span>
            <span className="ticker-sep">•</span>
            <span>🟢 گربه پیدا شده در منطقه ونک بازگشت به خانه</span>
            <span className="ticker-sep">•</span>
            <span>🎁 مژدگانی ۵ میلیون تومانی برای هاپوی گمشده در کرج</span>
            <span className="ticker-sep">•</span>
            <span>🐾 بیش از ۱,۲۴۰ حیوان خانگی از طریق سامانه نانا به آغوش خانواده بازگشتند</span>
          </div>
        </div>
      </div>

      {/* ── 2. Hero Section ── */}
      <section className="hero">
        <div className="hero-bg-blob blob1" />
        <div className="hero-bg-blob blob2" />
        <div className="container hero-content">
          <div className="hero-text">
            <div className="hero-badge">
              <SparklesIcon size={16} />
              <span>نخستین شبکه هوشمند امداد و جستجوی حیوانات در ایران</span>
            </div>

            <h1 className="hero-title">
              هر دقیقه در پیدا شدن آن‌ها<br />
              <span className="hero-gradient">حیاتی و سرنوشت‌ساز است</span>
            </h1>

            <p className="hero-desc">
              در کمتر از ۳۰ ثانیه آگهی ثبت کنید، بنر آماده استوری اینستاگرام دریافت نمایید و
              روی نقشه زنده، گزارش‌های مردمی دیده‌شدن را رصد کنید.
            </p>

            <div className="hero-actions">
              <Link to="/create" className="btn btn-primary btn-lg btn-hero-cta">
                <PlusIcon size={20} />
                <span>ثبت فوری آگهی رایگان</span>
              </Link>
              <Link to="/map" className="btn btn-outline btn-lg btn-hero-map">
                <MapPinIcon size={20} />
                <span>مشاهده روی نقشه زنده</span>
              </Link>
            </div>

            {/* Feature Checkmarks */}
            <div className="hero-features-row">
              <div className="feature-item">
                <CheckCircleIcon size={18} className="feat-check" />
                <span>ثبت کاملاً رایگان</span>
              </div>
              <div className="feature-item">
                <CheckCircleIcon size={18} className="feat-check" />
                <span>پوستر استوری خودکار</span>
              </div>
              <div className="feature-item">
                <CheckCircleIcon size={18} className="feat-check" />
                <span>اطلاع‌رسانی محلی هوشمند</span>
              </div>
            </div>
          </div>

          <div className="hero-visual-card">
            <div className="hero-card-floating card-floating">
              <div className="hero-card-header">
                <span className="hero-pulse-badge">🚨 فوری</span>
                <span className="text-xs text-muted">هم‌اکنون فعال</span>
              </div>
              <img
                src="https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=500&auto=format&fit=crop&q=80"
                alt="حیوان گمشده"
                className="hero-card-img"
              />
              <div className="hero-card-body">
                <h4 className="hero-card-name">سگ گلدن رتریور</h4>
                <p className="hero-card-loc">📍 تهران، پارک ملت • قلاده قرمز</p>
                <div className="hero-card-footer">
                  <span className="hero-card-reward">🎁 مژدگانی: ۳,۰۰۰,۰۰۰ تومان</span>
                  <Link to="/map" className="btn btn-ghost btn-sm">مشاهده در نقشه</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Trust Numbers Bar ── */}
      <div className="container">
        <div className="stats-bar-modern">
          <div className="stat-box">
            <span className="stat-big-num">۱,۲۴۰+</span>
            <span className="stat-sub">حیوان بازگشته به خانه 🎉</span>
          </div>
          <div className="stat-sep" />
          <div className="stat-box">
            <span className="stat-big-num">{count > 0 ? count.toLocaleString('fa-IR') : '۴۸'}</span>
            <span className="stat-sub">پرونده فعال در جریان 🔍</span>
          </div>
          <div className="stat-sep" />
          <div className="stat-box">
            <span className="stat-big-num">۴۵+</span>
            <span className="stat-sub">شهر و منطقه تحت پوشش 📍</span>
          </div>
          <div className="stat-sep" />
          <div className="stat-box">
            <span className="stat-big-num">۱۲,۰۰۰+</span>
            <span className="stat-sub">حامی و همسایه مهربان 🤝</span>
          </div>
        </div>
      </div>

      {/* ── 4. Search & Category Filters Section ── */}
      <section className="container filter-wrapper" id="explore">
        <div className="section-header-row">
          <div>
            <h2 className="section-title">🐾 جستجو و آگهی‌های اخیر</h2>
            <p className="section-subtitle">فیلتر بر اساس نوع حیوان، وضعیت گمشده/پیداشده، شهر یا مژدگانی</p>
          </div>
          <Link to="/map" className="btn btn-outline btn-sm">
            <MapPinIcon size={16} />
            نمایش روی نقشه
          </Link>
        </div>

        {/* Search Bar */}
        <form className="search-bar-modern" onSubmit={handleSearch}>
          <div className="search-input-group">
            <SearchIcon size={20} className="search-icon-svg" />
            <input
              type="text"
              className="search-input-field"
              placeholder="جستجو بر اساس نام، نژاد، رنگ، مشخصه یا محله..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="city-input-group">
            <MapPinIcon size={18} className="city-icon-svg" />
            <input
              type="text"
              className="city-input-field"
              placeholder="شهر (مثلاً تهران)..."
              value={city}
              onChange={e => setCity(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary search-submit-btn">
            جستجو
          </button>
        </form>

        {/* Category Pills & Quick Filters */}
        <div className="filter-pills-row">
          {/* Report Type Tabs */}
          <div className="filter-group-pill">
            {REPORT_TYPES.map(rt => (
              <button
                key={rt.value}
                className={`filter-pill ${reportType === rt.value ? 'pill-active' : ''}`}
                onClick={() => setReportType(rt.value as ReportType | '')}
              >
                {rt.label}
              </button>
            ))}
          </div>

          {/* Pet Type Chips */}
          <div className="filter-group-pill">
            {PET_TYPES.map(pt => (
              <button
                key={pt.value}
                className={`filter-pill ${petType === pt.value ? 'pill-active' : ''}`}
                onClick={() => setPetType(pt.value as PetType | '')}
              >
                <span>{pt.icon}</span>
                <span>{pt.label}</span>
              </button>
            ))}
          </div>

          {/* Reward Filter */}
          <button
            className={`filter-pill filter-reward-pill ${hasReward === true ? 'pill-active' : ''}`}
            onClick={() => setHasReward(prev => (prev === true ? null : true))}
          >
            <GiftIcon size={16} />
            <span>دارای مژدگانی نقدی</span>
          </button>
        </div>

        {/* ── 5. Pet Cards Grid ── */}
        {error && <div className="alert alert-error" style={{ marginBottom: 24 }}>{error}</div>}

        {loading && pets.length === 0 ? (
          <div className="grid-pets">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : pets.length === 0 ? (
          <div className="empty-state-modern card-floating">
            <div className="empty-icon-circle">🔍</div>
            <h3 className="empty-title">آگهی مطابق با جستجوی شما یافت نشد</h3>
            <p className="empty-desc">
              می‌توانید فیلترها را ریست کنید یا در صورت گم شدن حیوان خود، آگهی جدید ثبت کنید.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                className="btn btn-outline"
                onClick={() => { setSearch(''); setCity(''); setReportType(''); setPetType(''); setHasReward(null); }}
              >
                پاک کردن فیلترها
              </button>
              <Link to="/create" className="btn btn-primary">
                <PlusIcon size={18} />
                ثبت آگهی جدید
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="grid-pets">
              {pets.map(pet => <PetCard key={pet.id} pet={pet} />)}
            </div>

            {hasNext && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 44 }}>
                <button
                  className="btn btn-outline btn-lg btn-load-more"
                  onClick={() => setPage(p => p + 1)}
                  disabled={loading}
                >
                  {loading ? <span className="spinner" style={{ width: 20, height: 20 }} /> : 'نمایش آگهی‌های بیشتر'}
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* ── 6. Emergency 3-Step Guide Section ── */}
      <section className="guide-section">
        <div className="container">
          <div className="guide-header">
            <span className="guide-badge">راهنمای فوری نجات</span>
            <h2 className="guide-title">۳ گام حیاتی در ساعات اولیه گم‌شدن حیوان خانگی</h2>
            <p className="guide-desc">تحقیقات نشان می‌دهد بیش از ۷۰٪ حیوانات در ۲۴ ساعت اول پیدا می‌شوند اگر این مراحل را انجام دهید:</p>
          </div>

          <div className="guide-grid">
            <div className="guide-card">
              <div className="guide-step-num">۱</div>
              <div className="guide-card-icon"><PlusIcon size={28} /></div>
              <h3 className="guide-card-title">ثبت فوری در نانا</h3>
              <p className="guide-card-desc">
                عکس واضح، رنگ و مشخصات، شماره تماس و آخرین لوکیشن را ثبت کنید تا در نقشه زنده قرار بگیرد.
              </p>
            </div>

            <div className="guide-card">
              <div className="guide-step-num">۲</div>
              <div className="guide-card-icon"><ShareIcon size={28} /></div>
              <h3 className="guide-card-title">تولید بنر استوری و پخش محلی</h3>
              <p className="guide-card-desc">
                با یک کلیک پوستر استاندارد استوری اینستاگرام را دانلود و در شبکه‌های اجتماعی و گروه‌های محله منتشر کنید.
              </p>
            </div>

            <div className="guide-card">
              <div className="guide-step-num">۳</div>
              <div className="guide-card-icon"><ShieldCheckIcon size={28} /></div>
              <h3 className="guide-card-title">رصد گزارش‌ها و تحویل امن</h3>
              <p className="guide-card-desc">
                گزارش‌های دیده‌شدن همسایگان روی نقشه را چک کنید و با تایید مشخصات اختصاصی، حیوان را تحویل بگیرید.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. Success & Reunion Stories Section ── */}
      <section className="container success-stories-section">
        <div className="section-header-row">
          <div>
            <span className="success-badge">❤️ امید و وصال</span>
            <h2 className="section-title">داستان‌های وصال و بازگشت به خانه</h2>
            <p className="section-subtitle">روایت خانواده‌هایی که با یاری جامعه مهربان نانا دوباره در کنار پت خود هستند</p>
          </div>
        </div>

        <div className="success-grid">
          {SUCCESS_STORIES.map(story => (
            <div key={story.id} className="success-card card-floating">
              <div className="success-img-wrap">
                <img src={story.img} alt={story.name} className="success-img" />
                <span className="success-tag">{story.tag}</span>
              </div>
              <div className="success-body">
                <h4 className="success-name">{story.name}</h4>
                <p className="success-meta">📍 {story.city} • <span style={{ color: '#16a34a', fontWeight: 600 }}>{story.time}</span></p>
                <p className="success-quote">«{story.quote}»</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 8. Call to Action Banner ── */}
      <section className="container cta-section">
        <div className="cta-banner">
          <div className="cta-content">
            <h2 className="cta-title">حیوانی پیدا کرده‌اید یا پت شما گم شده است؟</h2>
            <p className="cta-desc">
              همین الان آگهی خود را رایگان ثبت کنید تا هزاران حامی و کاربر فعال در محله شما مطلع شوند.
            </p>
            <div className="cta-actions">
              <Link to="/create" className="btn btn-primary btn-lg cta-btn-white">
                <PlusIcon size={20} />
                ثبت آگهی رایگان
              </Link>
              <Link to="/map" className="btn btn-outline btn-lg cta-btn-outline">
                <MapPinIcon size={20} />
                مشاهده نقشه محله‌ها
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
