import { api } from './api.js';
import { renderNamespaces } from './components/Namespaces.js';
import { renderSchemas } from './components/Schemas.js';
import { renderConfigs } from './components/Configs.js';
import { renderDashboard } from './components/Dashboard.js';

const app = document.getElementById('app');
const navItems = document.querySelectorAll('.nav-item');

const routes = {
    'dashboard': renderDashboard,
    'namespaces': renderNamespaces,
    'schemas': renderSchemas,
    'configs': renderConfigs
};

async function navigate(page) {
    // Update nav
    navItems.forEach(item => {
        if (item.dataset.page === page) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // Render page
    app.innerHTML = '<div class="text-muted">Loading...</div>';
    try {
        const renderFn = routes[page];
        if (renderFn) {
            await renderFn(app);
        } else {
            app.innerHTML = 'Page not found';
        }
    } catch (error) {
        console.error(error);
        app.innerHTML = `<div class="text-danger">Error: ${error.message}</div>`;
    }
}

// Event listeners
navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const page = e.target.dataset.page;
        navigate(page);
    });
});

// Initial load
navigate('dashboard');
