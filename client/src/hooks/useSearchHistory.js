import { useState, useEffect } from 'react';

const STORAGE_KEY = 'redthread_history';
const MAX_ENTRIES = 50;

export default function useSearchHistory() {
    const [history, setHistory] = useState([]);
    const [mounted, setMounted] = useState(false);

    // Load initial history on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                setHistory(JSON.parse(stored));
            }
        } catch (e) {
            console.warn('Could not load history from localStorage', e);
        }
        setMounted(true);
    }, []);

    // Save history when it changes (but only after initial mount)
    useEffect(() => {
        if (!mounted) return;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
        } catch (e) {
            /* quota exceeded — silently fail */
        }
    }, [history, mounted]);

    function addEntry(query, intent, resultCount) {
        setHistory(prev => {
            const entry = {
                id: Date.now(),
                query,
                intent,
                resultCount,
                timestamp: new Date().toISOString(),
            };
            return [entry, ...prev].slice(0, MAX_ENTRIES);
        });
    }

    function clearHistory() {
        setHistory([]);
    }

    function removeEntry(id) {
        setHistory(prev => prev.filter(e => e.id !== id));
    }

    return { history, addEntry, clearHistory, removeEntry };
}
