import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PawIcon, MapPinIcon, PlusIcon } from './Icons';
import './Navbar.css';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        {/* Brand Logo */}
        <Link to="/" className="navbar-logo">
          <div className="navbar-logo-badge">
            <PawIcon size={22} />
          </div>
          <div className="navbar-logo-text-group">
            <div className="navbar-brand-name">
              <span>نانا</span>
              <span className="navbar-brand-dot" />
            </div>
            <span className="navbar-brand-tagline">امداد و جستجوی حیوانات</span>
          </div>
        </Link>

        {/* Live Network Badge (Desktop) */}
        <div className="navbar-network-status">
          <span className="live-pulse-dot" />
          <span>شبکه فعال نجات سراسری</span>
        </div>

        {/* Navigation Links */}
        <nav className="navbar-links">
          <Link to="/" className="navbar-link">خانه</Link>
          <Link to="/map" className="navbar-link">
            <MapPinIcon size={16} />
            <span>نقشه زنده</span>
          </Link>
          {isAuthenticated && (
            <Link to="/my-reports" className="navbar-link">آگهی‌های من</Link>
          )}
        </nav>

        {/* Auth & Primary Action */}
        <div className="navbar-auth-group">
          {isAuthenticated ? (
            <div className="navbar-user-wrap">
              <span className="navbar-user-chip">
                <span className="user-avatar-circle">
                  {(user?.first_name?.[0] || user?.phone_number?.[3] || 'ن')}
                </span>
                <span className="navbar-user-label">
                  {user?.first_name ? `${user.first_name}` : user?.phone_number}
                </span>
              </span>
              <button className="btn btn-ghost btn-sm btn-logout" onClick={handleLogout}>
                خروج
              </button>
            </div>
          ) : (
            <div className="navbar-guest-actions">
              <Link to="/login" className="btn btn-ghost btn-sm">ورود</Link>
              <Link to="/register" className="btn btn-outline btn-sm">ثبت‌نام</Link>
            </div>
          )}

          <Link to="/create" className="btn btn-primary btn-sm btn-new-report">
            <PlusIcon size={16} />
            <span>ثبت آگهی</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
