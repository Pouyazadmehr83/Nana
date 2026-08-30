import './SkeletonCard.css';

export default function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-img skeleton-shimmer" />
      <div className="skeleton-body">
        <div className="skeleton-badge skeleton-shimmer" />
        <div className="skeleton-title skeleton-shimmer" />
        <div className="skeleton-line skeleton-shimmer" style={{ width: '60%' }} />
        <div className="skeleton-line skeleton-shimmer" style={{ width: '80%' }} />
      </div>
    </div>
  );
}
