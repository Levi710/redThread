import './SkeletonCard.css';

export default function SkeletonCard() {
    return (
        <div className="skeleton-card">
            <div className="skeleton-header">
                <div className="skeleton-line skeleton-title"></div>
                <div className="skeleton-line skeleton-badge"></div>
            </div>
            <div className="skeleton-line skeleton-address"></div>
            <div className="skeleton-line skeleton-price"></div>
            <div className="skeleton-tags">
                <div className="skeleton-line skeleton-tag"></div>
                <div className="skeleton-line skeleton-tag"></div>
                <div className="skeleton-line skeleton-tag"></div>
            </div>
            <div className="skeleton-line skeleton-review"></div>
            <div className="skeleton-line skeleton-review-short"></div>
        </div>
    );
}
