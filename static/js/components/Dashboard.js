import { api } from '../api.js';

export async function renderDashboard(container) {
    const [namespaces, schemas, configs] = await Promise.all([
        api.get('/namespaces/'),
        api.get('/schemas/'),
        api.get('/configs/')
    ]);

    container.innerHTML = `
        <div class="header">
            <h1>Dashboard</h1>
        </div>
        <div class="flex gap-4">
            <div class="card flex-1">
                <h3 class="text-muted text-sm">Total Namespaces</h3>
                <div style="font-size: 2rem; font-weight: 700;">${namespaces.length}</div>
            </div>
            <div class="card flex-1">
                <h3 class="text-muted text-sm">Total Schemas</h3>
                <div style="font-size: 2rem; font-weight: 700;">${schemas.length}</div>
            </div>
            <div class="card flex-1">
                <h3 class="text-muted text-sm">Total Configs</h3>
                <div style="font-size: 2rem; font-weight: 700;">${configs.length}</div>
            </div>
        </div>
        
        <div class="card">
            <h2>Quick Actions</h2>
            <div class="flex gap-4 mt-4">
                <button class="btn btn-primary" onclick="document.querySelector('[data-page=namespaces]').click()">Manage Namespaces</button>
                <button class="btn btn-primary" onclick="document.querySelector('[data-page=schemas]').click()">Define Schemas</button>
                <button class="btn btn-primary" onclick="document.querySelector('[data-page=configs]').click()">Create Config</button>
            </div>
        </div>
    `;
}
