import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
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
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <span className="navbar-logo-icon">🐾</span>
          <span className="navbar-logo-text">نانا</span>
          <span className="navbar-logo-sub">گمشده‌ها</span>
        </Link>

        {/* Navigation Links */}
        <nav className="navbar-links">
          <Link to="/" className="navbar-link">خانه</Link>
          <Link to="/map" className="navbar-link">🗺️ نقشه</Link>
          {isAuthenticated && (
            <>
              <Link to="/my-reports" className="navbar-link">آگهی‌های من</Link>
              <Link to="/create" className="btn btn-primary btn-sm">+ ثبت آگهی</Link>
            </>
          )}
        </nav>

        {/* Auth */}
        <div className="navbar-auth">
          {isAuthenticated ? (
            <div className="navbar-user">
              <span className="navbar-user-name">
                {user?.first_name || user?.phone_number}
              </span>
              <button className="btn btn-outline btn-sm" onClick={handleLogout}>خروج</button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Link to="/login" className="btn btn-ghost btn-sm">ورود</Link>
              <Link to="/register" className="btn btn-primary btn-sm">ثبت‌نام</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
