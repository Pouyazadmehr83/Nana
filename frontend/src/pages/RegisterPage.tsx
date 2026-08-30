import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import './AuthPages.css';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [form, setForm] = useState({
    phone_number: '',
    password: '',
    password2: '',
    first_name: '',
    last_name: '',
    email: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.password2) {
      setError('رمز عبور با تکرار آن یکسان نیست.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await authApi.register(form);
      // Auto-login after register
      const { data } = await authApi.login(form.phone_number, form.password);
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      await refreshUser();
      navigate('/');
    } catch (err: any) {
      const detail = err.response?.data;
      if (typeof detail === 'object') {
        setError(Object.values(detail).flat().join(' — '));
      } else {
        setError('خطا در ثبت‌نام. مجدد تلاش کنید.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page page-enter">
      <div className="auth-card card-floating">
        <div className="auth-logo">🐾</div>
        <h1 className="auth-title">ثبت‌نام در نانا</h1>
        <p className="auth-subtitle">برای کمک به پیدا کردن حیوانات عضو شوید</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="alert alert-error">{error}</div>}

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">نام</label>
              <input name="first_name" className="form-control" placeholder="نام" value={form.first_name} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">نام خانوادگی</label>
              <input name="last_name" className="form-control" placeholder="نام خانوادگی" value={form.last_name} onChange={handleChange} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">شماره موبایل *</label>
            <input name="phone_number" className="form-control" type="tel" placeholder="09..." required value={form.phone_number} onChange={handleChange} dir="ltr" />
          </div>

          <div className="form-group">
            <label className="form-label">ایمیل (اختیاری)</label>
            <input name="email" className="form-control" type="email" placeholder="example@email.com" value={form.email} onChange={handleChange} dir="ltr" />
          </div>

          <div className="form-group">
            <label className="form-label">رمز عبور *</label>
            <input name="password" className="form-control" type="password" placeholder="حداقل ۸ کاراکتر" required value={form.password} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label className="form-label">تکرار رمز عبور *</label>
            <input name="password2" className="form-control" type="password" placeholder="تکرار رمز عبور" required value={form.password2} onChange={handleChange} />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> در حال ثبت‌نام...</> : 'ثبت‌نام'}
          </button>
        </form>

        <p className="auth-footer">
          قبلاً ثبت‌نام کرده‌اید؟ <Link to="/login" className="auth-link">وارد شوید</Link>
        </p>
      </div>
    </div>
  );
}
