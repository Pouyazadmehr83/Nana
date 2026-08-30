import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { HomeIcon, MapPinIcon, PlusIcon, HeartIcon, UserIcon } from './Icons';
import './BottomNav.css';

export default function BottomNav() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const path = location.pathname;

  return (
    <nav className="mobile-bottom-nav" aria-label="ناوبری موبایل">
      <Link
        to="/"
        className={`bottom-nav-item ${path === '/' ? 'active' : ''}`}
      >
        <span className="bottom-nav-icon">
          <HomeIcon size={20} />
        </span>
        <span className="bottom-nav-label">آگهی‌ها</span>
      </Link>

      <Link
        to="/map"
        className={`bottom-nav-item ${path === '/map' ? 'active' : ''}`}
      >
        <span className="bottom-nav-icon">
          <MapPinIcon size={20} />
        </span>
        <span className="bottom-nav-label">نقشه زنده</span>
      </Link>

      <Link
        to="/create"
        className={`bottom-nav-item bottom-nav-cta ${path === '/create' ? 'active' : ''}`}
      >
        <span className="bottom-nav-cta-btn">
          <PlusIcon size={22} />
        </span>
        <span className="bottom-nav-label">ثبت آگهی</span>
      </Link>

      <Link
        to={isAuthenticated ? "/my-reports" : "/login"}
        className={`bottom-nav-item ${path === '/my-reports' ? 'active' : ''}`}
      >
        <span className="bottom-nav-icon">
          <HeartIcon size={20} />
        </span>
        <span className="bottom-nav-label">آگهی‌های من</span>
      </Link>

      <Link
        to={isAuthenticated ? "/my-reports" : "/login"}
        className={`bottom-nav-item ${path === '/login' || path === '/register' ? 'active' : ''}`}
      >
        <span className="bottom-nav-icon">
          <UserIcon size={20} />
        </span>
        <span className="bottom-nav-label">{isAuthenticated ? 'حساب من' : 'ورود'}</span>
      </Link>
    </nav>
  );
}
