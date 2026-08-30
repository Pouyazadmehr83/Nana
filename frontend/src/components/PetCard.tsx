import { Link } from 'react-router-dom';
import type { PetReportList } from '../types';
import { PET_TYPE_LABELS } from '../types';
import './PetCard.css';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

interface Props {
  pet: PetReportList;
}

export default function PetCard({ pet }: Props) {
  const imageUrl = pet.main_image
    ? (pet.main_image.startsWith('http') ? pet.main_image : `${API_BASE}${pet.main_image}`)
    : null;

  const isLost = pet.report_type === 'LOST';

  return (
    <Link to={`/pets/${pet.id}`} className="pet-card card">
      {/* Image */}
      <div className="pet-card-img-wrap">
        {imageUrl ? (
          <img src={imageUrl} alt={pet.title} className="pet-card-img" loading="lazy" />
        ) : (
          <div className="pet-card-img-placeholder">
            <span>{pet.pet_type === 'CAT' ? '🐈' : pet.pet_type === 'DOG' ? '🐕' : pet.pet_type === 'BIRD' ? '🐦' : '🐾'}</span>
          </div>
        )}
        {/* Status badge overlay */}
        <div className={`pet-card-badge ${isLost ? 'badge-lost' : 'badge-found'}`}>
          {isLost ? '🔴 گمشده' : '🟢 پیدا شده'}
        </div>
        {pet.is_resolved && (
          <div className="pet-card-resolved">✅ حل شد</div>
        )}
      </div>

      {/* Content */}
      <div className="pet-card-body">
        <div className="pet-card-type badge badge-type">
          {PET_TYPE_LABELS[pet.pet_type]}
        </div>
        <h3 className="pet-card-title">{pet.title}</h3>
        <div className="pet-card-meta">
          <span>📍 {pet.city}{pet.district ? ` — ${pet.district}` : ''}</span>
        </div>
        <div className="pet-card-footer">
          <span className="pet-card-date text-xs text-muted">
            {new Date(pet.event_date).toLocaleDateString('fa-IR')}
          </span>
          {pet.reward > 0 && (
            <span className="pet-card-reward">
              🎁 {pet.reward.toLocaleString('fa-IR')} تومان
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
