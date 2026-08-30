import { useState } from 'react';
import { petsApi, sightingsApi } from '../services/api';
import './Modal.css';

interface Props {
  reportId: string | number;
  reportTitle: string;
  contactPhone: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function FoundModal({ reportId, reportTitle, contactPhone, onClose, onSuccess }: Props) {
  const [step, setStep] = useState<'confirm' | 'contact'>('confirm');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    if (!note.trim()) { setError('لطفاً توضیح مختصری بنویسید.'); return; }
    setLoading(true); setError('');
    try {
      // Register sighting with "found" note
      const fd = new FormData();
      fd.append('report', String(reportId));
      fd.append('location_description', `✅ پیدا شد: ${note}`);
      fd.append('seen_at', new Date().toISOString());
      await sightingsApi.create(fd);

      // Toggle resolved
      await petsApi.toggleResolved(reportId);

      setStep('contact');
      onSuccess();
    } catch (err: any) {
      const d = err.response?.data;
      setError(typeof d === 'object' ? Object.values(d).flat().join(' — ') : 'خطا در ثبت. مجدد تلاش کنید.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box modal-box-sm" onClick={e => e.stopPropagation()}>

        {step === 'confirm' ? (
          <>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">🎉 حیوان پیدا شد!</h2>
                <p className="modal-subtitle">«{reportTitle}»</p>
              </div>
              <button className="modal-close" onClick={onClose}>✕</button>
            </div>

            <div className="modal-form">
              {error && <div className="alert alert-error">{error}</div>}

              <div className="found-banner">
                <div className="found-icon">🐾</div>
                <p>با تأیید این دکمه، پرونده این آگهی به عنوان <strong>«حل‌شده»</strong> علامت‌گذاری می‌شود و گزارش پیدا شدن ثبت می‌گردد.</p>
              </div>

              <div className="form-group">
                <label className="form-label">📝 توضیح مختصر *</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="مثال: حیوان را نزدیک پارک پیدا کردم، حالش خوبه..."
                  value={note}
                  onChange={e => setNote(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={onClose}>انصراف</button>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)', boxShadow: '0 4px 16px rgba(22,163,74,.4)' }}
                  onClick={handleConfirm}
                  disabled={loading}
                >
                  {loading
                    ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> در حال ثبت...</>
                    : '✅ تأیید — این حیوان رو پیدا کردم'}
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Step 2: show contact */}
            <div className="modal-header">
              <h2 className="modal-title">🎊 ثبت شد!</h2>
              <button className="modal-close" onClick={onClose}>✕</button>
            </div>

            <div className="modal-form">
              <div className="found-success">
                <div style={{ fontSize: '4rem', textAlign: 'center' }}>🎉</div>
                <p style={{ textAlign: 'center', fontWeight: 600, color: '#16a34a', fontSize: '1.1rem' }}>
                  عالیه! گزارش پیدا شدن ثبت شد.
                </p>
                {contactPhone ? (
                  <div className="contact-box">
                    <p className="text-sm text-muted" style={{ marginBottom: 8 }}>📞 برای هماهنگی با صاحب تماس بگیرید:</p>
                    <a
                      href={`tel:${contactPhone}`}
                      className="btn btn-primary btn-lg"
                      style={{ width: '100%', justifyContent: 'center', gap: 10 }}
                    >
                      📞 {contactPhone}
                      <span className="text-xs" style={{ opacity: 0.8 }}>— تماس با صاحب</span>
                    </a>
                  </div>
                ) : (
                  <p className="text-sm text-muted" style={{ textAlign: 'center' }}>
                    شماره تماسی برای این آگهی ثبت نشده. منتظر بمانید تا صاحب با شما تماس بگیرد.
                  </p>
                )}
              </div>

              <div className="modal-actions" style={{ marginTop: 8 }}>
                <button className="btn btn-outline" style={{ width: '100%' }} onClick={onClose}>بستن</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
