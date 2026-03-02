import { useState, useEffect, useRef, useMemo } from 'react';
import useSearchHistory from '../hooks/useSearchHistory';
import './SearchBar.css';

export default function SearchBar({
    onSearch,
    loading,
    userLocation,
    locationLoading,
    locationError,
    requestLocation,
    clearLocation
}) {
    const [query, setQuery] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [activeIdx, setActiveIdx] = useState(-1);
    const { history } = useSearchHistory();
    const debounceRef = useRef(null);
    const wrapperRef = useRef(null);

    // Filter local history based on query
    const historySuggestions = useMemo(() => {
        if (!query.trim()) {
            return history.slice(0, 5).map(h => ({ ...h, type: 'history', text: h.query }));
        }
        const lowerQuery = query.toLowerCase();
        return history
            .filter(h => h.query.toLowerCase().includes(lowerQuery))
            .slice(0, 5)
            .map(h => ({ ...h, type: 'history', text: h.query }));
    }, [history, query]);

    // Only show private history suggestions
    const allSuggestions = useMemo(() => {
        return historySuggestions;
    }, [historySuggestions]);

    useEffect(() => {
        function handleClickOutside(e) {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    function handleInputChange(value) {
        setQuery(value);
        setActiveIdx(-1);

        if (debounceRef.current) clearTimeout(debounceRef.current);

        setShowSuggestions(true);

        // We stop fetching global suggestions to respect "no global searches"
        // and only rely on the filtered local historySuggestions.
    }


    function handleSelect(text) {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        setQuery(text);
        setShowSuggestions(false);
        onSearch(text);
    }


    function handleSubmit(e) {
        e.preventDefault();
        if (query.trim().length < 3) return;
        if (debounceRef.current) clearTimeout(debounceRef.current);
        setShowSuggestions(false);
        onSearch(query.trim());
    }

    function handleKeyDown(e) {
        if (!showSuggestions || allSuggestions.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIdx(prev => (prev < allSuggestions.length - 1 ? prev + 1 : 0));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIdx(prev => (prev > 0 ? prev - 1 : allSuggestions.length - 1));
        } else if (e.key === 'Enter' && activeIdx >= 0) {
            e.preventDefault();
            handleSelect(allSuggestions[activeIdx].text);
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
        } else if (e.key === 'Tab') {
            setShowSuggestions(false);
        }
    }

    return (
        <div className="searchbar-container" ref={wrapperRef}>
            <form className="searchbar" onSubmit={handleSubmit}>
                <div className={`searchbar-input-wrap ${userLocation ? 'has-location' : ''}`}>
                    <button
                        type="button"
                        className={`location-btn ${userLocation ? 'active' : ''} ${locationError ? 'error' : ''}`}
                        onClick={userLocation ? clearLocation : requestLocation}
                        disabled={locationLoading || loading}
                        title={userLocation ? "Clear Location" : locationError ? locationError : "Use My Location"}
                    >
                        {locationLoading ? (
                            <span className="location-spinner"></span>
                        ) : (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="3 11 22 2 13 21 11 13 3 11" />
                            </svg>
                        )}
                    </button>
                    <input
                        id="search-input"
                        type="text"
                        className="searchbar-input"
                        placeholder='Search anything — add your city or use your location'
                        value={query}
                        onChange={e => handleInputChange(e.target.value)}
                        onFocus={() => { setShowSuggestions(true); }}
                        onKeyDown={handleKeyDown}
                        disabled={loading}
                        autoComplete="off"
                    />

                    {showSuggestions && allSuggestions.length > 0 && !loading && (
                        <ul className="searchbar-suggestions" role="listbox">
                            {allSuggestions.map((s, i) => (
                                <li
                                    key={`${s.type}-${i}`}
                                    className={`searchbar-suggestion ${i === activeIdx ? 'active' : ''} ${s.type === 'history' ? 'is-history' : ''}`}
                                    onClick={() => handleSelect(s.text)}
                                    role="option"
                                    aria-selected={i === activeIdx}
                                >
                                    <span className="suggestion-type-icon">
                                        {s.type === 'history' ? (
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                                            </svg>
                                        ) : s.type === 'place' ? '📍' : s.type === 'category' ? '📂' : '💡'}
                                    </span>
                                    <span className="suggestion-text">{s.text}</span>
                                    {s.type === 'history' && (
                                        <span className="suggestion-tag">Recent</span>
                                    )}
                                    {s.category && (
                                        <span className="suggestion-cat">{s.category}</span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <button
                    id="search-button"
                    type="submit"
                    className="searchbar-btn"
                    disabled={loading || query.trim().length < 3}
                >
                    {loading ? (
                        <span className="searchbar-spinner"></span>
                    ) : (
                        <>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 2L11 13" /><path d="M22 2L15 22L11 13L2 9L22 2Z" />
                            </svg>
                            Search
                        </>
                    )}
                </button>
            </form>

            {userLocation ? (
                <div className="location-active-plate">
                    <span className="active-dot"></span>
                    Using precise GPS location
                    <button type="button" className="clear-location-text" onClick={clearLocation}>
                        Clear
                    </button>
                </div>
            ) : (
                <div className="location-hint">
                    Tip: include your city in the search or use your location
                </div>
            )}
        </div>
    );
}

