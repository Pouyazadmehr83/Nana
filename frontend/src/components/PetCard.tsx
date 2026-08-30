import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { PetReportList } from '../types';
import { PET_TYPE_LABELS } from '../types';
import { MapPinIcon, ClockIcon, GiftIcon, HeartIcon, CheckCircleIcon } from './Icons';
import { timeAgo } from '../utils/timeAgo';
import './PetCard.css';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

interface Props {
  pet: PetReportList;
}

export default function PetCard({ pet }: Props) {
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('nana_saved_pets') || '[]');
      setIsSaved(saved.includes(pet.id));
    } catch {
      // ignore
    }
  }, [pet.id]);

  const toggleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const saved: number[] = JSON.parse(localStorage.getItem('nana_saved_pets') || '[]');
      let updated: number[];
      if (saved.includes(pet.id)) {
        updated = saved.filter(id => id !== pet.id);
        setIsSaved(false);
      } else {
        updated = [...saved, pet.id];
        setIsSaved(true);
      }
      localStorage.setItem('nana_saved_pets', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const imageUrl = pet.main_image
    ? (pet.main_image.startsWith('http') ? pet.main_image : `${API_BASE}${pet.main_image}`)
    : null;

  const isLost = pet.report_type === 'LOST';

  return (
    <Link to={`/pets/${pet.id}`} className="pet-card card">
      {/* Image & Overlays */}
      <div className="pet-card-img-wrap">
        {imageUrl ? (
          <img src={imageUrl} alt={pet.title} className="pet-card-img" loading="lazy" />
        ) : (
          <div className="pet-card-img-placeholder">
            <span>{pet.pet_type === 'CAT' ? '🐱' : pet.pet_type === 'DOG' ? '🐶' : pet.pet_type === 'BIRD' ? '🐦' : '🐾'}</span>
          </div>
        )}

        {/* Top Badges */}
        <div className="pet-card-top-bar">
          <span className={`pet-status-pill ${isLost ? 'pill-lost' : 'pill-found'}`}>
            <span className="pulse-dot" />
            {isLost ? 'گمشده' : 'پیدا شده'}
          </span>

          <button
            type="button"
            className={`pet-card-bookmark ${isSaved ? 'is-saved' : ''}`}
            onClick={toggleSave}
            title={isSaved ? 'حذف از نشان‌شده‌ها' : 'نشان کردن آگهی'}
          >
            <HeartIcon size={16} fill={isSaved ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Resolved Badge */}
        {pet.is_resolved && (
          <div className="pet-card-resolved-banner">
            <CheckCircleIcon size={16} />
            <span>پیدا شد / بازگشت به خانه</span>
          </div>
        )}

        {/* Pet Type Tag overlay */}
        <span className="pet-card-type-overlay">
          {PET_TYPE_LABELS[pet.pet_type]}
        </span>
      </div>

      {/* Content */}
      <div className="pet-card-body">
        <h3 className="pet-card-title">{pet.title}</h3>

        <div className="pet-card-location">
          <MapPinIcon size={15} className="location-icon" />
          <span>{pet.city}{pet.district ? `، ${pet.district}` : ''}</span>
        </div>

        <div className="pet-card-footer">
          <div className="pet-card-time">
            <ClockIcon size={14} />
            <span>{timeAgo(pet.created_at || pet.event_date)}</span>
          </div>

          {pet.reward > 0 && (
            <div className="pet-card-reward-badge">
              <GiftIcon size={14} />
              <span>{pet.reward.toLocaleString('fa-IR')} تومان</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
