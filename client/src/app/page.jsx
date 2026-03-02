'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import SearchBar from '../components/SearchBar';
import ResultCard from '../components/ResultCard';
import SafetyBanner from '../components/SafetyBanner';
import FilterPanel from '../components/FilterPanel';
import SkeletonCard from '../components/SkeletonCard';
import ResultModal from '../components/ResultModal';
import ClarificationPrompt from '../components/ClarificationPrompt';
import useSearchHistory from '../hooks/useSearchHistory';
import { useToast } from '../contexts/ToastContext';
import { search } from '../api/client';
import { useGeolocation } from '../hooks/useGeolocation';
import './Home.css';

const DEFAULT_FILTERS = { category: 'all', maxBudget: '', features: [], sortBy: 'relevance' };

export default function Home() {
    const [results, setResults] = useState([]);
    const [intent, setIntent] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [meta, setMeta] = useState(null);
    const [loadingMsg, setLoadingMsg] = useState('Parsing intent...');
    const [hasSearched, setHasSearched] = useState(false);
    const [filters, setFilters] = useState({});
    const [dynamicFilters, setDynamicFilters] = useState([]);
    const [selectedResult, setSelectedResult] = useState(null);
    const [scopeMessage, setScopeMessage] = useState(null);
    const [clarification, setClarification] = useState(null);

    const { addEntry, history } = useSearchHistory();
    const { addToast } = useToast();
    const searchParams = useSearchParams();
    const { location: userLocation, error: locationError, isLoading: locationLoading, requestLocation, clearLocation } = useGeolocation();

    useEffect(() => {
        const rerunQuery = searchParams.get('rerunQuery');
        if (rerunQuery) {
            handleSearch(rerunQuery);
            // In Next.js, updating the URL without reloading is done via router.replace
            // but for now, we'll just handle the search.
        }
    }, [searchParams]);

    const handleClarificationSubmit = (answer) => {
        if (clarification) {
            const context = {
                originalQuery: clarification.originalQuery,
                question: clarification.question,
                answer: answer
            };
            setClarification(null);
            handleSearch(clarification.originalQuery, context);
        }
    };

    const handleClarificationCancel = () => {
        setClarification(null);
    };

    async function handleSearch(query, clarificationContext = null) {
        setLoading(true);
        setLoadingMsg('Searching...');
        setError(null);
        setScopeMessage(null);
        setHasSearched(true);

        // Show auto-scraping message if backend takes longer than 3 seconds
        const timeoutId = setTimeout(() => {
            setLoadingMsg('Scraping fresh data from the web (this may take 10-15s)...');
        }, 3000);

        try {
            // Include `userLocation` dynamically if the user has requested it
            const data = await search(query, null, filters, userLocation, clarificationContext);
            clearTimeout(timeoutId);

            if (data.isOutOfScope) {
                setScopeMessage(data.scopeMessage);
                setResults([]);
                setIntent(data.intent || null);
                setMeta(null);
                setLoading(false);
                return;
            }

            if (data.needsClarification) {
                setClarification({ originalQuery: query, question: data.clarificationQuestion });
                setResults([]);
                setIntent(null);
                setMeta(null);
                setLoading(false);
                return;
            }

            setClarification(null);

            const res = data.results || [];
            setResults(res);
            setIntent(data.intent || null);
            setMeta(data.meta || null);
            setDynamicFilters(data.dynamicFilters || []);
            setFilters({});
            addEntry(query, data.intent, res.length);
        } catch (err) {
            clearTimeout(timeoutId);
            const errorMsg = err.data?.error || err.message || 'Something went wrong';
            setError(errorMsg);
            addToast(errorMsg, 'error');
            setResults([]);
            setIntent(null);
        } finally {
            setLoading(false);
        }
    }

    const filteredResults = useMemo(() => {
        let filtered = [...results];

        dynamicFilters.forEach(schema => {
            const val = filters[schema.id];
            if (!val) return;

            if (schema.type === 'range') {
                const max = parseInt(val, 10);
                filtered = filtered.filter(r => {
                    const match = r.priceRange?.match(/([₹$£€])(\d+)/);
                    return match ? parseInt(match[2], 10) <= max : true;
                });
            } else if (schema.type === 'select') {
                if (val.length > 0) {
                    filtered = filtered.filter(r =>
                        val.every(selectedOpt => {
                            const optL = selectedOpt.toLowerCase();
                            const inFeatures = (r.features || []).some(f => f.toLowerCase().includes(optL));
                            const inName = r.name?.toLowerCase().includes(optL);
                            const inSummary = r.reviewSummary?.toLowerCase().includes(optL);
                            const inCat = r.category?.toLowerCase().includes(optL);
                            return inFeatures || inName || inSummary || inCat;
                        })
                    );
                }
            } else if (schema.type === 'sort') {
                if (val === 'rating') {
                    filtered.sort((a, b) => (b.rating === 'N/A' ? 0 : parseFloat(b.rating)) - (a.rating === 'N/A' ? 0 : parseFloat(a.rating)));
                } else if (val === 'price_low') {
                    filtered.sort((a, b) => {
                        const pa = parseInt(a.priceRange?.match(/([₹$£€])(\d+)/)?.[2] || '0', 10);
                        const pb = parseInt(b.priceRange?.match(/([₹$£€])(\d+)/)?.[2] || '0', 10);
                        if (!pa) return 1; if (!pb) return -1;
                        return pa - pb;
                    });
                } else if (val === 'price_high') {
                    filtered.sort((a, b) => {
                        const pa = parseInt(a.priceRange?.match(/([₹$£€])(\d+)/)?.[2] || '0', 10);
                        const pb = parseInt(b.priceRange?.match(/([₹$£€])(\d+)/)?.[2] || '0', 10);
                        return pb - pa;
                    });
                }
            }
        });

        return filtered;
    }, [results, filters, dynamicFilters]);

    return (
        <main className="home">
            <section className="home-hero">
                <div className="home-hero-glow"></div>
                <h2 className="home-headline fade-in-up">
                    AI that <span className="home-headline-accent">thinks</span><br />
                    before it searches
                </h2>
                <p className="home-subline fade-in-up stagger-1">
                    Describe what you want naturally — RedThread interprets your intent,
                    adapts to context, and finds results that actually match.
                </p>
                <div className="fade-in-up stagger-2" style={{ position: 'relative', zIndex: 10 }}>
                    <SearchBar
                        onSearch={handleSearch}
                        userLocation={userLocation}
                        locationLoading={locationLoading}
                        locationError={locationError}
                        requestLocation={requestLocation}
                        clearLocation={clearLocation}
                        loading={loading}
                    />
                </div>
                <div className="fade-in-up stagger-3" style={{ position: 'relative', zIndex: 1, marginTop: '0.75rem' }}>
                    <SafetyBanner />
                </div>
                {!hasSearched && history.length > 0 && (
                    <div className="home-recent-searches fade-in-up stagger-4">
                        <span className="recent-label">Your Recent Searches:</span>
                        <div className="recent-links">
                            {history.slice(0, 3).map((entry) => (
                                <button
                                    key={entry.id}
                                    className="recent-link-btn"
                                    onClick={() => handleSearch(entry.query)}
                                >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                                    </svg>
                                    {entry.query}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                {clarification && !loading && (
                    <div className="home-clarification-wrapper fade-in-up stagger-2" style={{ position: 'relative', zIndex: 20 }}>
                        <ClarificationPrompt
                            question={clarification.question}
                            onSubmit={handleClarificationSubmit}
                            onCancel={handleClarificationCancel}
                        />
                    </div>
                )}
            </section>

            {scopeMessage && !loading && (
                <div className="home-scope-guidance fade-in-up">
                    <div className="scope-icon">💡</div>
                    <div className="scope-content">
                        <h4>Platform Guidance</h4>
                        <p>{scopeMessage}</p>
                    </div>
                </div>
            )}

            {error && (
                <div className="home-error fade-in-up">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="15" y1="9" x2="9" y2="15" />
                        <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                    <span style={{ flex: 1 }}>{error}</span>
                    {error.toLowerCase().includes('location') && !userLocation && (
                        <button
                            type="button"
                            className="error-action-btn"
                            onClick={requestLocation}
                        >
                            Use my location
                        </button>
                    )}
                </div>
            )}

            {intent && !error && (
                <section className="home-intent fade-in-up">
                    <h4 className="home-intent-title">Parsed Intent</h4>
                    <div className="home-intent-chips">
                        <span className="intent-chip reasoning">
                            <strong>AI Reasoning:</strong> {intent.reasoning}
                        </span>
                        <span className="intent-chip">
                            <strong>Category:</strong> {intent.category}
                        </span>
                        {intent.location && (
                            <span className="intent-chip">
                                <strong>Location:</strong> {intent.location}
                            </span>
                        )}
                        {intent.budget?.max && (
                            <span className="intent-chip">
                                <strong>Budget:</strong> up to {intent.budget.currency}{intent.budget.max}
                            </span>
                        )}
                        {intent.occasion && (
                            <span className="intent-chip">
                                <strong>Occasion:</strong> {intent.occasion}
                            </span>
                        )}
                    </div>
                </section>
            )}

            {loading && (
                <section className="home-results">
                    <div className="home-results-header">
                        <h3>{loadingMsg}</h3>
                    </div>
                    <div className="home-results-grid">
                        {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
                    </div>
                </section>
            )}

            {!loading && hasSearched && results.length > 0 && (
                <section className="home-results-layout">
                    <FilterPanel
                        filters={filters}
                        onChange={setFilters}
                        dynamicFilters={dynamicFilters}
                        resultCount={filteredResults.length}
                    />
                    <section className="home-results">
                        <div className="home-results-header">
                            <h3>Results</h3>
                            {meta && (
                                <span className="home-results-meta">
                                    {filteredResults.length} of {meta.total} · {meta.source}
                                </span>
                            )}
                        </div>
                        <div className="home-results-grid">
                            {filteredResults.map((r, i) => (
                                <ResultCard
                                    key={i}
                                    result={{ ...r, cached: meta?.cached }}
                                    index={i}
                                    onClick={() => setSelectedResult(r)}
                                />
                            ))}
                        </div>
                        {filteredResults.length === 0 && (
                            <div className="home-empty">
                                <p>No results match your filters. Try adjusting them.</p>
                            </div>
                        )}
                    </section>
                </section>
            )}

            {hasSearched && !loading && results.length === 0 && !error && (
                <div className="home-empty fade-in-up">
                    <p>No results found. Try a different query or location.</p>
                </div>
            )}

            {selectedResult && (
                <ResultModal result={selectedResult} onClose={() => setSelectedResult(null)} />
            )}
        </main>
    );
}
