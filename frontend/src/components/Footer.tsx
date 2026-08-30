import { Link } from 'react-router-dom';
import { PawIcon, HeartIcon, ShieldCheckIcon, PhoneIcon } from './Icons';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="site-footer">
      {/* Top Banner: Emergency helpline */}
      <div className="footer-top-banner">
        <div className="container footer-banner-inner">
          <div className="banner-text">
            <ShieldCheckIcon size={24} className="banner-icon" />
            <div>
              <p className="banner-title">پشتیبانی و امداد اضطراری نانا</p>
              <p className="banner-sub">سامانه هوشمند نجات و وصل مجدد حیوانات خانگی به آغوش خانواده</p>
            </div>
          </div>
          <div className="banner-phone">
            <PhoneIcon size={18} />
            <span>پشتیبانی شبانه‌روزی: ۰۲۱-۸۸۸۸۴۳۲۱</span>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="container footer-main">
        <div className="footer-grid">
          {/* Col 1: About Platform */}
          <div className="footer-col footer-col-about">
            <div className="footer-brand">
              <span className="footer-logo-icon"><PawIcon size={24} /></span>
              <span className="footer-logo-text">نانا | Nana</span>
            </div>
            <p className="footer-desc">
              نانا پلتفرم تخصصی ثبت و جستجوی هوشمند حیوانات گمشده و پیدا شده در سراسر کشور است. هدف ما تسریع در بازگشت حیوانات خانگی به خانه از طریق اتصال شبکه‌ای حامیان، همسایگان و کلینیک‌های دامپزشکی است.
            </p>
            <div className="footer-social-links">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="social-icon" title="اینستاگرام">
                📸
              </a>
              <a href="https://t.me" target="_blank" rel="noopener noreferrer" className="social-icon" title="تلگرام">
                ✈️
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="social-icon" title="توییتر / X">
                𝕏
              </a>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="footer-col">
            <h4 className="footer-col-title">دسترسی سریع</h4>
            <ul className="footer-links">
              <li><Link to="/">صفحه اصلی</Link></li>
              <li><Link to="/map">نقشه آگهی‌ها</Link></li>
              <li><Link to="/create">ثبت آگهی گمشده</Link></li>
              <li><Link to="/create">ثبت حیوان پیدا شده</Link></li>
              <li><Link to="/my-reports">داشبورد آگهی‌های من</Link></li>
            </ul>
          </div>

          {/* Col 3: Guidelines & Safety */}
          <div className="footer-col">
            <h4 className="footer-col-title">راهنما و امنیت</h4>
            <ul className="footer-links">
              <li><a href="#how-it-works">نحوه کارکرد سامانه</a></li>
              <li><a href="#emergency-guide">راهنمای ساعات اولیه گم شدن</a></li>
              <li><a href="#safety-tips">نکات ایمنی تحویل حیوان</a></li>
              <li><a href="#faq">سوالات متداول</a></li>
              <li><a href="#privacy">حریم خصوصی و قوانین</a></li>
            </ul>
          </div>

          {/* Col 4: Trust & Partners */}
          <div className="footer-col">
            <h4 className="footer-col-title">همکاری و حامیان</h4>
            <p className="footer-text-sm">
              همکاری نزدیک با بیش از ۱۲۰ کلینیک دامپزشکی، پناهگاه‌ها و گروه‌های امداد حیوانات در سراسر ایران.
            </p>
            <div className="footer-badges">
              <div className="trust-badge">
                <span className="trust-icon">🛡️</span>
                <span>تأیید هویت تلفنی</span>
              </div>
              <div className="trust-badge">
                <span className="trust-icon">📍</span>
                <span>موقعیت‌یابی زنده</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} پلتفرم نانا. تمامی حقوق برای حمایت از حیوانات محفوظ است.</p>
          <p className="footer-love">
            ساخته شده با <HeartIcon size={16} fill="#ff6b9d" style={{ color: '#ff6b9d' }} /> برای یاری حیوانات بی‌پناه
          </p>
        </div>
      </div>
    </footer>
  );
}
