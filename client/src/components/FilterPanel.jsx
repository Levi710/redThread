import { useState } from 'react';
import './FilterPanel.css';

export default function FilterPanel({ filters, onChange, dynamicFilters = [], resultCount }) {
    const [expanded, setExpanded] = useState(true);

    if (!dynamicFilters || dynamicFilters.length === 0) return null;

    function updateFilter(key, value) {
        onChange({ ...filters, [key]: value });
    }

    function toggleSelectVal(id, option) {
        const current = filters[id] || [];
        const next = current.includes(option)
            ? current.filter(f => f !== option)
            : [...current, option];
        updateFilter(id, next);
    }

    function resetFilters() {
        onChange({});
    }

    const hasActiveFilters = Object.values(filters).some(val =>
        (Array.isArray(val) && val.length > 0) ||
        (typeof val === 'string' && val !== '' && val !== 'relevance')
    );

    return (
        <aside className={`filter-panel ${expanded ? 'expanded' : 'collapsed'}`}>
            <button className="filter-toggle" onClick={() => setExpanded(!expanded)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="14" y2="12" /><line x1="4" y1="18" x2="8" y2="18" />
                </svg>
                AI Filters
                {hasActiveFilters && <span className="filter-active-dot"></span>}
                <svg className={`filter-chevron ${expanded ? 'open' : ''}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9" />
                </svg>
            </button>

            {expanded && (
                <div className="filter-body">
                    {dynamicFilters.map((schema, index) => {
                        if (schema.type === 'range') {
                            return (
                                <div key={index} className="filter-group">
                                    <label className="filter-label">{schema.label}</label>
                                    <div className="filter-budget-row">
                                        <input
                                            type="range"
                                            min={schema.min || 0}
                                            max={schema.max || 5000}
                                            step={schema.step || 100}
                                            value={filters[schema.id] || 0}
                                            onChange={e => updateFilter(schema.id, e.target.value === '0' ? '' : e.target.value)}
                                            className="filter-slider"
                                        />
                                        <span className="filter-budget-val">
                                            {filters[schema.id] ? `₹${filters[schema.id]}` : 'Any'}
                                        </span>
                                    </div>
                                </div>
                            );
                        }

                        if (schema.type === 'select') {
                            const activeSet = filters[schema.id] || [];
                            return (
                                <div key={index} className="filter-group">
                                    <label className="filter-label">{schema.label}</label>
                                    <div className="filter-chips">
                                        {(schema.options || []).map(opt => (
                                            <button
                                                key={opt}
                                                className={`filter-chip ${activeSet.includes(opt) ? 'active' : ''}`}
                                                onClick={() => toggleSelectVal(schema.id, opt)}
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            );
                        }

                        if (schema.type === 'sort') {
                            return (
                                <div key={index} className="filter-group">
                                    <label className="filter-label">{schema.label}</label>
                                    <select
                                        className="filter-select"
                                        value={filters[schema.id] || 'relevance'}
                                        onChange={e => updateFilter(schema.id, e.target.value)}
                                    >
                                        {(schema.options || []).map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                            );
                        }

                        return null;
                    })}

                    <div className="filter-footer">
                        {resultCount !== undefined && (
                            <span className="filter-count">{resultCount} result{resultCount !== 1 ? 's' : ''}</span>
                        )}
                        {hasActiveFilters && (
                            <button className="filter-reset" onClick={resetFilters}>Reset Custom AI Filters</button>
                        )}
                    </div>
                </div>
            )}
        </aside>
    );
}
