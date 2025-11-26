const API_BASE = '';

export const api = {
    async get(endpoint) {
        const response = await fetch(`${API_BASE}${endpoint}`);
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'API Error');
        }
        return response.json();
    },

    async post(endpoint, data) {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'API Error');
        }
        return response.json();
    },

    async put(endpoint, data) {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'API Error');
        }
        return response.json();
    }
};
