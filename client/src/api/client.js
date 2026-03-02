const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

async function request(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const config = {
        headers: { 'Content-Type': 'application/json' },
        ...options,
    };

    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
        const error = new Error(data.error || 'Request failed');
        error.status = response.status;
        error.data = data;
        throw error;
    }

    return data;
}

export function getHealth() {
    return request('/health');
}

export function search(query, location, filters, userLocation, clarificationContext) {
    return request('/search', {
        method: 'POST',
        body: JSON.stringify({ query, location, filters, userLocation, clarificationContext }),
    });
}

export function getCategories() {
    return request('/categories');
}

export function getSuggestions(q) {
    return request(`/suggestions?q=${encodeURIComponent(q)}`);
}

export function getPlaceById(id) {
    return request(`/suggestions/${id}`);
}
