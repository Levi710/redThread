import './ResultCard.css';

export default function ResultCard({ result, index, onClick }) {
    return (
        <article
            className={`result-card fade-in-up stagger-${(index % 4) + 1}`}
            onClick={onClick}
            role="button"
            tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter') onClick?.(); }}
        >
            <div className="result-card-header">
                <div className="result-card-title-row">
                    <h3 className="result-card-name">{result.name}</h3>
                    <span className="result-card-category">{result.category}</span>
                </div>
                <div className="result-card-rating">
                    {result.rating !== 'N/A' && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="#fdcb6e" stroke="none">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                    )}
                    <span>{result.rating}</span>
                </div>
            </div>

            <p className="result-card-address">{result.address}</p>
            {result.priceRange && result.priceRange !== 'N/A' && (
                <p className="result-card-price">{result.priceRange}</p>
            )}

            {result.features && result.features.length > 0 && (
                <div className="result-card-features">
                    {result.features.map((f, i) => (
                        <span key={i} className="result-card-tag">{f}</span>
                    ))}
                </div>
            )}

            {result.reviewSummary && (
                <p className="result-card-review">"{result.reviewSummary}"</p>
            )}

            <div className="result-card-footer">
                <span className="result-card-source">
                    Source: {result.source}
                    {result.cached && <span className="cache-badge">⚡ Cached</span>}
                </span>
                <span className="result-card-expand">View Details →</span>
            </div>
        </article>
    );
}
