import { useEffect } from 'react';
import './ResultModal.css';

export default function ResultModal({ result, onClose }) {
    useEffect(() => {
        function handleKey(e) {
            if (e.key === 'Escape') onClose();
        }
        document.addEventListener('keydown', handleKey);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handleKey);
            document.body.style.overflow = '';
        };
    }, [onClose]);

    if (!result) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>

                <div className="modal-header">
                    <div>
                        <h2 className="modal-name">{result.name}</h2>
                        <span className="modal-category">{result.category}</span>
                    </div>
                    <div className="modal-rating">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="#fdcb6e" stroke="none">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                        <span>{result.rating}</span>
                    </div>
                </div>

                <div className="modal-detail-grid">
                    <div className="modal-detail">
                        <span className="modal-detail-label">Address</span>
                        <span>{result.address}</span>
                    </div>
                    {result.priceRange && result.priceRange !== 'N/A' && (
                        <div className="modal-detail">
                            <span className="modal-detail-label">Price Range</span>
                            <span className="modal-price">{result.priceRange}</span>
                        </div>
                    )}
                    <div className="modal-detail">
                        <span className="modal-detail-label">Data Source</span>
                        <span>{result.source}</span>
                    </div>
                </div>

                {result.features && result.features.length > 0 && (
                    <div className="modal-section">
                        <h4 className="modal-section-title">Features</h4>
                        <div className="modal-features">
                            {result.features.map((f, i) => (
                                <span key={i} className="modal-feature-tag">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                    {f}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {result.reviewSummary && (
                    <div className="modal-section">
                        <h4 className="modal-section-title">AI Review Summary</h4>
                        <blockquote className="modal-review">
                            {result.reviewSummary}
                        </blockquote>
                    </div>
                )}

                <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${result.name} ${result.address}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="modal-map-button"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                    </svg>
                    View on Google Maps
                </a>
            </div>
        </div>
    );
}
