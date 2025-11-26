import { api } from '../api.js';
import { Toast } from './Toast.js';
import { Modal } from './Modal.js';

export async function renderSchemas(container) {
    const schemas = await api.get('/schemas/');

    container.innerHTML = `
        <div class="header">
            <h1>Schemas</h1>
            <button class="btn btn-primary" id="create-schema-btn">Define New Schema</button>
        </div>
        
        <div class="card" id="create-schema-form" style="display: none;">
            <h3>New Configuration Schema</h3>
            <p class="text-muted text-sm mb-4">Define the structure of your configuration using JSON Schema.</p>
            <form id="schema-form" class="mt-4">
                <div class="input-group">
                    <label>Schema Name</label>
                    <input type="text" name="name" required placeholder="e.g. FeatureFlag, DatabaseConfig">
                </div>
                <div class="input-group">
                    <label>JSON Schema Structure</label>
                    <div id="json-editor-container" style="height: 300px;"></div>
                </div>
                <div class="flex gap-2">
                    <button type="submit" class="btn btn-primary">Save Schema</button>
                    <button type="button" class="btn btn-secondary" id="cancel-schema-btn">Cancel</button>
                </div>
            </form>
        </div>

        <div class="card">
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Version</th>
                        <th>Created At</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${schemas.map(s => `
                        <tr>
                            <td>${s.id}</td>
                            <td><strong>${s.name}</strong></td>
                            <td>v${s.version}</td>
                            <td>${new Date(s.created_at).toLocaleString()}</td>
                            <td>
                                <button class="btn btn-secondary btn-sm view-schema-btn" data-schema='${JSON.stringify(s).replace(/'/g, "&#39;")}'>View JSON</button>
                                <button class="btn btn-primary btn-sm test-schema-btn" data-schema='${JSON.stringify(s).replace(/'/g, "&#39;")}'>Test / Playground</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;

    // Initialize Editor
    const editorContainer = container.querySelector('#json-editor-container');
    const editor = new JSONEditor(editorContainer, {
        mode: 'tree',
        modes: ['tree', 'code'],
        onChangeText: (jsonString) => {
            // Optional: validate JSON on change
        }
    }, {
        "type": "object",
        "properties": {
            "enabled": { "type": "boolean" }
        }
    });

    // Event Listeners
    const form = container.querySelector('#schema-form');
    const createBtn = container.querySelector('#create-schema-btn');
    const cancelBtn = container.querySelector('#cancel-schema-btn');
    const formCard = container.querySelector('#create-schema-form');

    createBtn.addEventListener('click', () => {
        formCard.style.display = 'block';
        createBtn.style.display = 'none';
    });

    cancelBtn.addEventListener('click', () => {
        formCard.style.display = 'none';
        createBtn.style.display = 'inline-flex';
        form.reset();
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        let structure;
        try {
            structure = editor.get();
        } catch (err) {
            Toast.error('Error', 'Invalid JSON in structure field');
            return;
        }

        const data = {
            name: formData.get('name'),
            structure: structure
        };

        try {
            await api.post('/schemas/', data);
            Toast.success('Success', 'Schema created successfully');
            await renderSchemas(container); // Re-render
        } catch (err) {
            Toast.error('Error', err.message);
        }
    });

    // View Schema
    container.querySelectorAll('.view-schema-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const schema = JSON.parse(btn.dataset.schema);
            const viewContainer = document.createElement('div');
            viewContainer.style.height = '400px';

            Modal.show(`Schema: ${schema.name}`, viewContainer, true);

            new JSONEditor(viewContainer, {
                mode: 'view',
                modes: ['view', 'code'],
                name: schema.name
            }, schema.structure);
        });
    });

    // Test / Playground
    container.querySelectorAll('.test-schema-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const schema = JSON.parse(btn.dataset.schema);
            openPlayground(schema);
        });
    });

    function openPlayground(schema) {
        const content = document.createElement('div');
        content.innerHTML = `
            <div class="flex gap-4" style="height: 500px;">
                <div class="flex-1 flex flex-col">
                    <h4 class="mb-4">Test Data (JSON)</h4>
                    <div id="playground-editor" style="flex: 1;"></div>
                </div>
                <div class="flex-1 flex flex-col">
                    <h4 class="mb-4">Validation Result</h4>
                    <div id="playground-result" class="card" style="flex: 1; overflow: auto;">
                        <div class="text-muted">Enter data to validate...</div>
                    </div>
                </div>
            </div>
            <div class="flex justify-between mt-4">
                <button class="btn btn-primary" id="playground-validate-btn">Validate</button>
            </div>
        `;

        Modal.show(`Playground: ${schema.name}`, content, true);

        const playgroundEditor = new JSONEditor(content.querySelector('#playground-editor'), {
            mode: 'code',
            modes: ['code', 'tree']
        }, {});

        const resultDiv = content.querySelector('#playground-result');
        const validateBtn = content.querySelector('#playground-validate-btn');

        validateBtn.addEventListener('click', async () => {
            try {
                const data = playgroundEditor.get();
                resultDiv.innerHTML = '<div class="text-muted">Validating...</div>';

                const response = await api.post('/schemas/validate', {
                    schema_structure: schema.structure,
                    data: data
                });

                if (response.valid) {
                    resultDiv.innerHTML = `
                        <div style="color: var(--success); display: flex; align-items: center; gap: 0.5rem;">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            <strong>Valid</strong>
                        </div>
                        <p class="mt-4">${response.message}</p>
                    `;
                } else {
                    resultDiv.innerHTML = `
                        <div style="color: var(--danger); display: flex; align-items: center; gap: 0.5rem;">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                            <strong>Invalid</strong>
                        </div>
                        <p class="mt-4" style="color: var(--danger);">${response.message}</p>
                    `;
                }

            } catch (err) {
                resultDiv.innerHTML = `<div style="color: var(--danger)">JSON Error: ${err.message}</div>`;
            }
        });
    }
}
