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
      const saved: string[] = JSON.parse(localStorage.getItem('nana_saved_pets') || '[]');
      setIsSaved(saved.includes(String(pet.id)));
    } catch {
      // ignore
    }
  }, [pet.id]);

  const toggleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const saved: string[] = JSON.parse(localStorage.getItem('nana_saved_pets') || '[]');
      const petIdStr = String(pet.id);
      let updated: string[];
      if (saved.includes(petIdStr)) {
        updated = saved.filter(id => id !== petIdStr);
        setIsSaved(false);
      } else {
        updated = [...saved, petIdStr];
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
    <Link to={`/pets/${pet.id}`} className="pet-card">
      <div className="pet-card-media">
        {imageUrl ? (
          <img src={imageUrl} alt={pet.title} className="pet-card-img" loading="lazy" />
        ) : (
          <div className="pet-card-placeholder">
            <span className="placeholder-emoji">
              {pet.pet_type === 'CAT' ? '🐱' : pet.pet_type === 'DOG' ? '🐶' : pet.pet_type === 'BIRD' ? '🐦' : '🐾'}
            </span>
          </div>
        )}

        {/* Status Pill on Top Right */}
        <div className="pet-card-badge-top">
          <span className={`status-pill ${isLost ? 'pill-lost' : 'pill-found'}`}>
            <span className="status-dot" />
            {isLost ? 'گمشده' : 'پیدا شده'}
          </span>
        </div>

        {/* Bookmark Action */}
        <button
          type="button"
          className={`pet-card-heart ${isSaved ? 'is-active' : ''}`}
          onClick={toggleSave}
          title={isSaved ? 'حذف از نشان‌شده‌ها' : 'نشان کردن'}
          aria-label="نشان کردن"
        >
          <HeartIcon size={15} fill={isSaved ? 'currentColor' : 'none'} />
        </button>

        {/* Resolved Badge */}
        {pet.is_resolved && (
          <div className="pet-card-resolved">
            <CheckCircleIcon size={14} />
            <span>پیدا شد</span>
          </div>
        )}

        {/* Pet Category Pill */}
        <span className="pet-card-category-tag">
          {PET_TYPE_LABELS[pet.pet_type] || 'حیوان خانگی'}
        </span>
      </div>

      <div className="pet-card-content">
        <h3 className="pet-card-title" title={pet.title}>
          {pet.title}
        </h3>

        <div className="pet-card-meta">
          <span className="meta-location">
            <MapPinIcon size={13} className="meta-icon" />
            {pet.city}{pet.district ? `، ${pet.district}` : ''}
          </span>
          <span className="meta-divider">•</span>
          <span className="meta-time">
            <ClockIcon size={13} className="meta-icon" />
            {timeAgo(pet.created_at || pet.event_date)}
          </span>
        </div>

        {pet.reward > 0 && (
          <div className="pet-card-reward">
            <GiftIcon size={13} />
            <span>مژدگانی: <strong>{pet.reward.toLocaleString('fa-IR')}</strong> تومان</span>
          </div>
        )}
      </div>
    </Link>
  );
}
