'use client';

import { useRouter } from 'next/navigation';
import useSearchHistory from '../../hooks/useSearchHistory';
import { useToast } from '../../contexts/ToastContext';
import '../History.css';

export default function History() {
    const { history, clearHistory, removeEntry } = useSearchHistory();
    const router = useRouter();
    const { addToast } = useToast();

    function handleRerun(query) {
        // Next.js App Router doesn't have state in navigate, using query params instead.
        router.push(`/?rerunQuery=${encodeURIComponent(query)}`);
    }

    function handleClear() {
        clearHistory();
        addToast('Search history cleared', 'success');
    }

    function handleRemove(id) {
        removeEntry(id);
        addToast('Entry removed from history', 'info');
    }

    function formatTime(iso) {
        const d = new Date(iso);
        const now = new Date();
        const diffMs = now - d;
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    }

    return (
        <main className="history-page">
            <div className="history-header fade-in-up">
                <div>
                    <h2>Search History</h2>
                    <p className="history-subtitle">{history.length} search{history.length !== 1 ? 'es' : ''} saved locally</p>
                </div>
                {history.length > 0 && (
                    <button className="history-clear-btn" onClick={handleClear}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                        Clear All
                    </button>
                )}
            </div>

            {history.length === 0 ? (
                <div className="history-empty fade-in-up stagger-1">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                    </svg>
                    <p>No searches yet.</p>
                    <p className="history-empty-sub">Your searches will appear here once you start exploring.</p>
                </div>
            ) : (
                <div className="history-list">
                    {history.map((entry, i) => (
                        <div key={entry.id} className={`history-item fade-in-up stagger-${(i % 4) + 1}`}>
                            <div className="history-item-main">
                                <p className="history-item-query">"{entry.query}"</p>
                                <div className="history-item-meta">
                                    {entry.intent?.category && (
                                        <span className="history-chip">{entry.intent.category}</span>
                                    )}
                                    {entry.intent?.location && (
                                        <span className="history-chip">{entry.intent.location}</span>
                                    )}
                                    <span className="history-item-results">{entry.resultCount} result{entry.resultCount !== 1 ? 's' : ''}</span>
                                    <span className="history-item-time">{formatTime(entry.timestamp)}</span>
                                </div>
                            </div>
                            <div className="history-item-actions">
                                <button className="history-rerun-btn" onClick={() => handleRerun(entry.query)} title="Search again">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                                    </svg>
                                </button>
                                <button className="history-remove-btn" onClick={() => handleRemove(entry.id)} title="Remove">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </main>
    );
}
