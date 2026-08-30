import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './AuthPages.css';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(phone, password);
      navigate('/');
    } catch (err: any) {
      const detail = err.response?.data?.detail || err.response?.data;
      if (typeof detail === 'string') setError(detail);
      else setError('شماره موبایل یا رمز عبور اشتباه است.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page page-enter">
      <div className="auth-card card-floating">
        <div className="auth-logo">🐾</div>
        <h1 className="auth-title">ورود به نانا</h1>
        <p className="auth-subtitle">برای ثبت و مدیریت آگهی‌ها وارد شوید</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="alert alert-error">{error}</div>}

          <div className="form-group">
            <label className="form-label">شماره موبایل</label>
            <input
              className="form-control"
              type="tel"
              placeholder="09..."
              value={phone}
              onChange={e => setPhone(e.target.value)}
              required
              dir="ltr"
            />
          </div>

          <div className="form-group">
            <label className="form-label">رمز عبور</label>
            <input
              className="form-control"
              type="password"
              placeholder="رمز عبور"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> در حال ورود...</> : 'ورود'}
          </button>
        </form>

        <p className="auth-footer">
          حساب ندارید؟ <Link to="/register" className="auth-link">ثبت‌نام کنید</Link>
        </p>
      </div>
    </div>
  );
}
