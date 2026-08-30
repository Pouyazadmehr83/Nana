import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PetCard from '../components/PetCard';
import { petsApi } from '../services/api';
import type { PetReportList, PaginatedResponse } from '../types';
import './MyReportsPage.css';

export default function MyReportsPage() {
  const [pets, setPets] = useState<PetReportList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await petsApi.myReports();
        const paged = data as PaginatedResponse<PetReportList>;
        setPets(paged.results || []);
      } catch {
        setError('خطا در دریافت آگهی‌ها');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm('آیا مطمئن هستید؟')) return;
    try {
      await petsApi.delete(id);
      setPets(prev => prev.filter(p => p.id !== id));
    } catch {
      alert('خطا در حذف');
    }
  };

  const handleToggle = async (id: number) => {
    try {
      const { data } = await petsApi.toggleResolved(id);
      setPets(prev => prev.map(p => p.id === id ? { ...p, is_resolved: data.is_resolved } : p));
    } catch {
      alert('خطا');
    }
  };

  return (
    <div className="my-reports-page page-enter">
      <div className="container">
        <div className="my-reports-header">
          <div>
            <h1>📋 آگهی‌های من</h1>
            <p className="text-muted">{pets.length} آگهی ثبت‌شده</p>
          </div>
          <Link to="/create" className="btn btn-primary">+ ثبت آگهی جدید</Link>
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: 24 }}>{error}</div>}

        {loading ? (
          <div className="grid-pets">
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 340, borderRadius: 20 }} />)}
          </div>
        ) : pets.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: '4rem' }}>📭</div>
            <h3>هنوز آگهی ثبت نکرده‌اید</h3>
            <p>برای کمک به پیدا کردن حیوانات گمشده، اولین آگهی خود را ثبت کنید.</p>
            <Link to="/create" className="btn btn-primary">+ ثبت آگهی</Link>
          </div>
        ) : (
          <div className="my-reports-grid">
            {pets.map(pet => (
              <div key={pet.id} className="my-report-item">
                <PetCard pet={pet} />
                <div className="my-report-actions">
                  <Link to={`/edit/${pet.id}`} className="btn btn-outline btn-sm">✏️ ویرایش</Link>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleToggle(pet.id)}
                  >
                    {pet.is_resolved ? '🔓 بازگشایی' : '✅ پیدا شد'}
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => handleDelete(pet.id)}
                    style={{ color: '#ef4444' }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
