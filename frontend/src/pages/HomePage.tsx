import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import PetCard from '../components/PetCard';
import SkeletonCard from '../components/SkeletonCard';
import { petsApi } from '../services/api';
import type { PetReportList, PaginatedResponse, ReportType, PetType } from '../types';
import {
  SearchIcon,
  MapPinIcon,
  PlusIcon,
  GiftIcon,
  XIcon,
  SparklesIcon
} from '../components/Icons';
import './HomePage.css';

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [pets, setPets] = useState<PetReportList[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  
  // Filters state
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCity, setSelectedCity] = useState(searchParams.get('city') || '');
  const [petType, setPetType] = useState<PetType | ''>((searchParams.get('pet_type') as PetType) || '');
  const [reportType, setReportType] = useState<ReportType | ''>((searchParams.get('report_type') as ReportType) || '');
  const [hasReward, setHasReward] = useState<boolean | null>(
    searchParams.get('has_reward') === 'true' ? true : null
  );

  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);

  // Sync state when URL params change (e.g. from City Selector in Navbar)
  useEffect(() => {
    const urlCity = searchParams.get('city') || '';
    if (urlCity !== selectedCity) setSelectedCity(urlCity);
  }, [searchParams]);

  const fetchPets = useCallback(async (pageNum: number, isReset: boolean) => {
    if (isReset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    setError('');

    try {
      const params: Record<string, string | number | boolean> = { page: pageNum };
      if (searchQuery)         params.search     = searchQuery;
      if (selectedCity && selectedCity !== 'همه شهرها') params.city = selectedCity;
      if (petType)             params.pet_type    = petType;
      if (reportType)          params.report_type = reportType;
      if (hasReward !== null)  params.has_reward  = hasReward;

      const { data } = await petsApi.list(params as any);
      const paged = data as PaginatedResponse<PetReportList>;

      if (isReset) {
        setPets(paged.results);
      } else {
        setPets(prev => [...prev, ...paged.results]);
      }
      setCount(paged.count);
      setHasNext(!!paged.next);
    } catch {
      setError('خطا در دریافت لیست آگهی‌ها. لطفاً دوباره امتحان کنید.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [searchQuery, selectedCity, petType, reportType, hasReward]);

  // Initial and filter change trigger
  useEffect(() => {
    setPage(1);
    fetchPets(1, true);
  }, [searchQuery, selectedCity, petType, reportType, hasReward, fetchPets]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput.trim());
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
  };

  const handleLoadMore = () => {
    if (hasNext && !loadingMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchPets(nextPage, false);
    }
  };

  const handleClearAllFilters = () => {
    setSearchInput('');
    setSearchQuery('');
    setSelectedCity('');
    setPetType('');
    setReportType('');
    setHasReward(null);
    setSearchParams({});
  };

  const hasActiveFilters = !!(searchQuery || (selectedCity && selectedCity !== 'همه شهرها') || petType || reportType || hasReward !== null);

  return (
    <div className="home-feed-page page-enter">
      {/* ── 1. Top Web-App Search Bar ── */}
      <div className="feed-header-bar">
        <div className="container feed-header-inner">
          <form className="feed-search-form" onSubmit={handleSearchSubmit}>
            <SearchIcon size={18} className="feed-search-icon" />
            <input
              type="text"
              placeholder="جستجو در نام، نژاد، مشخصات یا محله..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              className="feed-search-input"
            />
            {searchInput && (
              <button
                type="button"
                className="feed-search-clear"
                onClick={handleClearSearch}
                aria-label="پاک کردن"
              >
                <XIcon size={16} />
              </button>
            )}
            <button type="submit" className="feed-search-btn">
              جستجو
            </button>
          </form>

          <Link to="/map" className="feed-map-shortcut" title="مشاهده روی نقشه زنده">
            <MapPinIcon size={18} />
            <span className="shortcut-label">نقشه</span>
          </Link>
        </div>
      </div>

      <div className="container feed-main-container">
        {/* ── 2. Clean Status Filters Row (All, Lost, Found, Reward) ── */}
        <div className="feed-quick-filters">
          <div className="quick-filter-group">
            <button
              type="button"
              className={`quick-pill ${reportType === '' && hasReward === null ? 'active' : ''}`}
              onClick={() => { setReportType(''); setHasReward(null); }}
            >
              همه آگهی‌ها
            </button>

            <button
              type="button"
              className={`quick-pill pill-red ${reportType === 'LOST' ? 'active' : ''}`}
              onClick={() => setReportType(reportType === 'LOST' ? '' : 'LOST')}
            >
              <span className="dot dot-red" />
              گمشده
            </button>

            <button
              type="button"
              className={`quick-pill pill-green ${reportType === 'FOUND' ? 'active' : ''}`}
              onClick={() => setReportType(reportType === 'FOUND' ? '' : 'FOUND')}
            >
              <span className="dot dot-green" />
              پیدا شده
            </button>

            <button
              type="button"
              className={`quick-pill pill-gold ${hasReward === true ? 'active' : ''}`}
              onClick={() => setHasReward(hasReward === true ? null : true)}
            >
              <GiftIcon size={14} />
              مژدگانی‌دار
            </button>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              className="clear-filters-btn"
              onClick={handleClearAllFilters}
            >
              <XIcon size={14} />
              پاکسازی فیلترها
            </button>
          )}
        </div>

        {/* ── 3. Feed Status Row (Count & Tip) ── */}
        <div className="feed-status-row">
          <div className="feed-count-badge">
            <span>
              {loading ? 'در حال دریافت آگهی‌ها...' : `${count.toLocaleString('fa-IR')} آگهی`}
              {selectedCity && selectedCity !== 'همه شهرها' ? ` در ${selectedCity}` : ''}
            </span>
          </div>

          <div className="feed-tip">
            <SparklesIcon size={14} />
            <span>آگهی‌ها بلافاصله منتشر می‌شوند</span>
          </div>
        </div>

        {/* ── 4. Error Alert ── */}
        {error && (
          <div className="alert alert-error" style={{ marginBottom: 20 }}>
            {error}
          </div>
        )}

        {/* ── 5. Ads Grid ── */}
        {loading ? (
          <div className="feed-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : pets.length === 0 ? (
          <div className="feed-empty-state">
            <div className="empty-state-icon">🐾🔍</div>
            <h3>هیچ آگهی با این مشخصات یافت نشد</h3>
            <p>می‌توانید فیلترها را تغییر دهید یا خودتان اولین آگهی را برای این مشخصات ثبت کنید.</p>
            <div className="empty-actions">
              {hasActiveFilters && (
                <button type="button" className="btn btn-outline" onClick={handleClearAllFilters}>
                  پاکسازی فیلترها
                </button>
              )}
              <Link to="/create" className="btn btn-primary">
                <PlusIcon size={16} />
                ثبت آگهی رایگان
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="feed-grid">
              {pets.map(pet => (
                <PetCard key={pet.id} pet={pet} />
              ))}
            </div>

            {/* ── 6. Load More Pagination ── */}
            {hasNext && (
              <div className="feed-pagination">
                <button
                  type="button"
                  className="btn btn-outline btn-load-more"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? 'در حال بارگذاری...' : 'نمایش آگهی‌های بیشتر'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
