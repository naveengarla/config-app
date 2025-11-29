const BASE_URL = 'http://localhost:8001';

export const api = {
    get: async (endpoint: string) => {
        const response = await fetch(`${BASE_URL}${endpoint}`);
        if (!response.ok) throw new Error(await response.text());
        return response.json();
    },
    post: async (endpoint: string, data: any) => {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error(await response.text());
        return response.json();
    },
    put: async (endpoint: string, data: any) => {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error(await response.text());
        return response.json();
    },
    delete: async (endpoint: string) => {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error(await response.text());
        return response.json();
    },
};
