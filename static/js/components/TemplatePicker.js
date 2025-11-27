import { Modal } from './Modal.js';

export class TemplatePicker {
    static async show(onSelect) {
        // Fetch templates
        const response = await fetch('/static/data/templates.json');
        const data = await response.json();
        const templates = data.templates;

        // Group by category
        const categories = [...new Set(templates.map(t => t.category))];

        const content = document.createElement('div');
        content.innerHTML = `
            <div class="template-picker">
                <div class="category-tabs">
                    ${categories.map((cat, i) => `
                        <button class="tab-btn ${i === 0 ? 'active  ' : ''}" data-category="${cat}">
                            ${cat}
                        </button>
                    `).join('')}
                </div>
                
                <div class="template-grid" id="template-grid">
                    <!-- Templates will be rendered here -->
                </div>
            </div>
        `;

        Modal.show('Choose a Template', content, true);

        const grid = content.querySelector('#template-grid');
        const tabs = content.querySelectorAll('.tab-btn');

        const renderTemplates = (category) => {
            const filtered = templates.filter(t => t.category === category);
            grid.innerHTML = filtered.map(t => `
                <div class="template-card" data-template='${JSON.stringify(t).replace(/'/g, "&#39;")}'>
                    <div class="template-icon">${getIcon(t.purpose)}</div>
                    <h4>${t.name}</h4>
                    <p class="text-sm text-muted">${t.description}</p>
                    <div class="template-badges">
                        ${t.purpose === 'reference_data' ? '<span class="badge badge-reference">Reference Data</span>' : ''}
                        ${t.purpose === 'ui_config' ? '<span class="badge badge-ui">UI Config</span>' : ''}
                        ${t.sensitive ? '<span class="badge badge-warning">Sensitive</span>' : ''}
                        ${t.purpose === 'config' ? '<span class="badge badge-config">Configuration</span>' : ''}
                    </div>
                </div>
            `).join('');

            // Add click handlers
            grid.querySelectorAll('.template-card').forEach(card => {
                card.addEventListener('click', () => {
                    const template = JSON.parse(card.dataset.template);
                    onSelect(template);
                    Modal.close();
                });
            });
        };

        // Tab switching
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                renderTemplates(tab.dataset.category);
            });
        });

        // Render first category by default
        renderTemplates(categories[0]);
    }
}

function getIcon(purpose) {
    const icons = {
        'reference_data': '📊',
        'ui_config': '🎨',
        'config': '⚙️',
        'secrets': '🔐'
    };
    return icons[purpose] || '📄';
}
