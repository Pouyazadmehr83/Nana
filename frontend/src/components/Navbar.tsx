import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PawIcon, MapPinIcon, PlusIcon, SearchIcon, ChevronDownIcon, XIcon } from './Icons';
import './Navbar.css';

const POPULAR_CITIES = [
  'همه شهرها',
  'تهران',
  'کرج',
  'مشهد',
  'اصفهان',
  'شیراز',
  'تبریز',
  'اهواز',
  'رشت',
  'قم',
  'کرمانشاه',
  'ارومیه',
  'یزد',
  'ساری',
  'قزوین'
];

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [showCityModal, setShowCityModal] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string>('همه شهرها');
  const [citySearch, setCitySearch] = useState('');
  const cityModalRef = useRef<HTMLDivElement>(null);

  // Sync selected city from URL search param or localStorage
  useEffect(() => {
    const urlCity = searchParams.get('city');
    if (urlCity) {
      setSelectedCity(urlCity);
    } else {
      const savedCity = localStorage.getItem('nana_selected_city');
      if (savedCity) setSelectedCity(savedCity);
    }
  }, [searchParams]);

  const handleSelectCity = (city: string) => {
    setSelectedCity(city);
    setShowCityModal(false);
    if (city === 'همه شهرها') {
      localStorage.removeItem('nana_selected_city');
      navigate('/');
    } else {
      localStorage.setItem('nana_selected_city', city);
      navigate(`/?city=${encodeURIComponent(city)}`);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const filteredCities = POPULAR_CITIES.filter(c =>
    c.toLowerCase().includes(citySearch.trim().toLowerCase())
  );

  return (
    <>
      <header className="navbar">
        <div className="container navbar-inner">
          {/* Right section: Brand & City */}
          <div className="navbar-start">
            <Link to="/" className="navbar-logo">
              <div className="navbar-logo-badge">
                <PawIcon size={20} />
              </div>
              <div className="navbar-logo-text-group">
                <div className="navbar-brand-name">
                  <span>نانا</span>
                  <span className="navbar-brand-dot" />
                </div>
                <span className="navbar-brand-tagline">سامانه آگهی حیوانات</span>
              </div>
            </Link>

            {/* City Selector Button (Divar style) */}
            <button
              type="button"
              className="navbar-city-btn"
              onClick={() => setShowCityModal(true)}
              aria-label="انتخاب شهر"
            >
              <MapPinIcon size={16} className="city-icon" />
              <span className="city-label">{selectedCity}</span>
              <ChevronDownIcon size={14} />
            </button>
          </div>

          {/* Middle section: Fast navigation */}
          <nav className="navbar-center">
            <Link
              to="/"
              className={`navbar-tab-link ${location.pathname === '/' ? 'active' : ''}`}
            >
              آگهی‌ها
            </Link>
            <Link
              to="/map"
              className={`navbar-tab-link ${location.pathname === '/map' ? 'active' : ''}`}
            >
              نقشه زنده
            </Link>
            {isAuthenticated && (
              <Link
                to="/my-reports"
                className={`navbar-tab-link ${location.pathname === '/my-reports' ? 'active' : ''}`}
              >
                آگهی‌های من
              </Link>
            )}
          </nav>

          {/* Left section: User & CTA */}
          <div className="navbar-end">
            {isAuthenticated ? (
              <div className="navbar-user-wrap">
                <Link to="/my-reports" className="navbar-user-chip">
                  <span className="user-avatar-circle">
                    {(user?.first_name?.[0] || user?.phone_number?.[3] || 'ن')}
                  </span>
                  <span className="navbar-user-label">
                    {user?.first_name ? `${user.first_name}` : user?.phone_number}
                  </span>
                </Link>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm btn-logout"
                  onClick={handleLogout}
                >
                  خروج
                </button>
              </div>
            ) : (
              <div className="navbar-guest-actions">
                <Link to="/login" className="btn btn-ghost btn-sm btn-nav-login">ورود / ثبت‌نام</Link>
              </div>
            )}

            <Link to="/create" className="btn btn-primary btn-post-ad">
              <PlusIcon size={16} />
              <span>ثبت آگهی</span>
            </Link>
          </div>
        </div>
      </header>

      {/* City Selection Modal */}
      {showCityModal && (
        <div className="modal-backdrop" onClick={() => setShowCityModal(false)}>
          <div
            className="city-modal card-floating"
            ref={cityModalRef}
            onClick={e => e.stopPropagation()}
          >
            <div className="city-modal-header">
              <h3>انتخاب شهر</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowCityModal(false)}
              >
                <XIcon size={18} />
              </button>
            </div>

            <div className="city-modal-search">
              <SearchIcon size={18} className="search-icon" />
              <input
                type="text"
                placeholder="جستجوی نام شهر..."
                value={citySearch}
                onChange={e => setCitySearch(e.target.value)}
                autoFocus
              />
            </div>

            <div className="city-modal-list">
              {filteredCities.map(c => (
                <button
                  key={c}
                  type="button"
                  className={`city-list-item ${selectedCity === c ? 'selected' : ''}`}
                  onClick={() => handleSelectCity(c)}
                >
                  <span>{c}</span>
                  {selectedCity === c && <span className="selected-dot">✓</span>}
                </button>
              ))}
              {filteredCities.length === 0 && (
                <div className="empty-city-msg">شهری با این نام پیدا نشد.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
