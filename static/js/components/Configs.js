import { api } from '../api.js';
import { Toast } from './Toast.js';
import { Modal } from './Modal.js';

export async function renderConfigs(container) {
    const [configs, namespaces, schemas] = await Promise.all([
        api.get('/configs/'),
        api.get('/namespaces/'),
        api.get('/schemas/')
    ]);

    // Helper to find names
    const getNsName = (id) => namespaces.find(n => n.id === id)?.name || id;
    const getSchemaName = (id) => schemas.find(s => s.id === id)?.name || id;

    container.innerHTML = `
        <div class="header">
            <h1>Configurations</h1>
            <button class="btn btn-primary" id="create-config-btn">Create Configuration</button>
        </div>
        
        <div class="card" id="create-config-form" style="display: none;">
            <h3>New Configuration</h3>
            <form id="config-form" class="mt-4">
                <div class="flex gap-4">
                    <div class="input-group flex-1">
                        <label>Namespace</label>
                        <select name="namespace_id" required>
                            <option value="">Select Namespace</option>
                            ${namespaces.map(ns => `<option value="${ns.id}">${ns.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="input-group flex-1">
                        <label>Schema (Type)</label>
                        <select name="schema_id" required id="schema-select">
                            <option value="">Select Schema</option>
                            ${schemas.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div class="input-group">
                    <label>Key (Name)</label>
                    <input type="text" name="key" required placeholder="e.g. max_users">
                </div>
                
                <div id="dynamic-form-container" style="display: none;">
                    <div class="flex justify-between items-center mb-4 mt-4">
                        <h3>Configuration Values</h3>
                        <button type="button" class="btn btn-secondary btn-sm" id="toggle-editor-mode">Switch to Advanced JSON Editor</button>
                    </div>
                    <div id="form-fields"></div>
                    <div id="advanced-editor-container" style="height: 400px; display: none;"></div>
                </div>

                <div class="flex gap-2 mt-4">
                    <button type="submit" class="btn btn-primary">Save Config</button>
                    <button type="button" class="btn btn-secondary" id="cancel-config-btn">Cancel</button>
                </div>
            </form>
        </div>

        <div class="card">
            <table>
                <thead>
                    <tr>
                        <th>Key</th>
                        <th>Namespace</th>
                        <th>Type (Schema)</th>
                        <th>Value</th>
                        <th>Version</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${configs.map(c => `
                        <tr>
                            <td><strong>${c.key}</strong></td>
                            <td><span style="background: rgba(255,255,255,0.1); padding: 2px 8px; border-radius: 4px; font-size: 0.8em;">${getNsName(c.namespace_id)}</span></td>
                            <td>${getSchemaName(c.schema_id)}</td>
                            <td><pre style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.8rem; opacity: 0.8;">${JSON.stringify(c.value)}</pre></td>
                            <td>v${c.version}</td>
                            <td>
                                <button class="btn btn-secondary btn-sm view-config-btn" data-config='${JSON.stringify(c).replace(/'/g, "&#39;")}'>View</button>
                                <button class="btn btn-danger btn-sm delete-config-btn" data-id="${c.id}" data-key="${c.key}">Delete</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;

    // Event Listeners
    const form = container.querySelector('#config-form');
    const createBtn = container.querySelector('#create-config-btn');
    const cancelBtn = container.querySelector('#cancel-config-btn');
    const formCard = container.querySelector('#create-config-form');
    const schemaSelect = container.querySelector('#schema-select');
    const dynamicContainer = container.querySelector('#dynamic-form-container');
    const formFields = container.querySelector('#form-fields');
    const toggleEditorBtn = container.querySelector('#toggle-editor-mode');
    const advancedEditorContainer = container.querySelector('#advanced-editor-container');

    let isAdvancedMode = false;
    let advancedEditor = null;

    // Toggle Editor Mode
    toggleEditorBtn.addEventListener('click', () => {
        isAdvancedMode = !isAdvancedMode;
        if (isAdvancedMode) {
            toggleEditorBtn.innerText = "Switch to Form Builder";
            formFields.style.display = 'none';
            advancedEditorContainer.style.display = 'block';

            // Initialize editor if needed
            if (!advancedEditor) {
                advancedEditor = new JSONEditor(advancedEditorContainer, {
                    mode: 'tree',
                    modes: ['tree', 'code']
                }, {});
            }

            // Try to sync value from form to editor
            try {
                if (formBuilder) {
                    // This is tricky without a full state. 
                    // For now, let's just start empty or with current schema structure hint
                    // Ideally we would extract current form value.
                    // Let's try:
                    const rootWrapper = formFields.firstElementChild;
                    if (rootWrapper) {
                        const rootInput = rootWrapper.lastElementChild;
                        const val = formBuilder._extractValueFromDom(currentSchema.structure, rootInput);
                        advancedEditor.set(val);
                    }
                }
            } catch (e) { console.log("Could not sync form to editor", e); }

        } else {
            toggleEditorBtn.innerText = "Switch to Advanced JSON Editor";
            formFields.style.display = 'block';
            advancedEditorContainer.style.display = 'none';

            // Sync back? Complex. For now, warn user or just reset form builder with editor value?
            // Re-rendering form builder with value is hard with current implementation.
            // Let's just keep them separate for now or re-render if possible.
            // Re-rendering form with values would require a `setValue` method on FormBuilder.
            // For this iteration, let's just assume switching back resets or keeps old form state.
            Toast.info("Info", "Switched back to Form Builder. Changes in JSON Editor may not be reflected here.");
        }
    });

    // View Config Handlers
    container.querySelectorAll('.view-config-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const config = JSON.parse(btn.dataset.config);
            const container = document.createElement('div');
            container.style.height = '400px';

            Modal.show(`Config: ${config.key}`, container, true);

            new JSONEditor(container, {
                mode: 'view',
                modes: ['view', 'code'],
                name: config.key
            }, config.value);
        });
    });

    // Delete Config Handlers
    container.querySelectorAll('.delete-config-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.dataset.id;
            const key = btn.dataset.key;

            if (confirm(`Are you sure you want to delete configuration "${key}"?`)) {
                try {
                    await api.delete(`/configs/${id}`);
                    Toast.success('Deleted', `Configuration "${key}" deleted successfully`);
                    await renderConfigs(container);
                } catch (err) {
                    Toast.error('Error', err.message);
                }
            }
        });
    });

    createBtn.addEventListener('click', () => {
        formCard.style.display = 'block';
        createBtn.style.display = 'none';
    });

    cancelBtn.addEventListener('click', () => {
        formCard.style.display = 'none';
        createBtn.style.display = 'inline-flex';
        form.reset();
        dynamicContainer.style.display = 'none';
        formFields.innerHTML = '';
    });

    // --- RECURSIVE FORM BUILDER ---

    class FormBuilder {
        constructor(container) {
            this.container = container;
            this.fieldCounter = 0;
        }

        render(schema) {
            this.container.innerHTML = '';
            const rootEl = this.createField(schema, 'root');
            this.container.appendChild(rootEl);
        }

        createField(schema, path, label = null) {
            const wrapper = document.createElement('div');
            wrapper.className = 'input-group';
            wrapper.dataset.path = path;
            wrapper.dataset.type = schema.type;

            // Label
            if (label) {
                const labelEl = document.createElement('label');
                labelEl.innerText = label;
                if (schema.type) {
                    const typeSpan = document.createElement('span');
                    typeSpan.className = 'text-muted text-sm';
                    typeSpan.style.marginLeft = '0.5rem';
                    typeSpan.innerText = `(${schema.type})`;
                    labelEl.appendChild(typeSpan);
                }
                wrapper.appendChild(labelEl);
            }

            // Enum Support
            if (schema.enum) {
                const select = document.createElement('select');
                select.name = path;
                // Add empty option if not required? Let's assume required for now or just first option.
                schema.enum.forEach(opt => {
                    const option = document.createElement('option');
                    option.value = opt;
                    option.innerText = opt;
                    select.appendChild(option);
                });
                wrapper.appendChild(select);
                return wrapper;
            }

            // Input based on type
            if (schema.type === 'string') {
                const input = document.createElement('input');
                input.type = 'text';
                input.name = path;
                wrapper.appendChild(input);
            } else if (schema.type === 'integer' || schema.type === 'number') {
                const input = document.createElement('input');
                input.type = 'number';
                input.name = path;
                if (schema.type === 'number') input.step = 'any';
                wrapper.appendChild(input);
            } else if (schema.type === 'boolean') {
                const select = document.createElement('select');
                select.name = path;
                select.innerHTML = '<option value="true">True</option><option value="false">False</option>';
                wrapper.appendChild(select);
            } else if (schema.type === 'object') {
                const fieldset = document.createElement('div');
                fieldset.className = 'form-object-fieldset';

                if (schema.properties) {
                    for (const [key, prop] of Object.entries(schema.properties)) {
                        const childPath = path === 'root' ? key : `${path}.${key}`;
                        const childEl = this.createField(prop, childPath, key);
                        fieldset.appendChild(childEl);
                    }
                }
                wrapper.appendChild(fieldset);
            } else if (schema.type === 'array') {
                const listContainer = document.createElement('div');
                listContainer.className = 'form-array-container';

                const itemsContainer = document.createElement('div');
                itemsContainer.className = 'items-container';
                listContainer.appendChild(itemsContainer);

                const addBtn = document.createElement('button');
                addBtn.type = 'button';
                addBtn.className = 'btn btn-secondary btn-sm mt-2';
                addBtn.innerText = '+ Add Item';
                addBtn.onclick = () => {
                    const index = itemsContainer.children.length;
                    const itemPath = `${path}[${index}]`;
                    const itemWrapper = document.createElement('div');
                    itemWrapper.className = 'form-array-item flex gap-2 items-center';

                    const itemContent = document.createElement('div');
                    itemContent.className = 'flex-1';
                    itemContent.appendChild(this.createField(schema.items, itemPath)); // No label for array items

                    const removeBtn = document.createElement('button');
                    removeBtn.type = 'button';
                    removeBtn.className = 'btn btn-danger btn-sm';
                    removeBtn.innerHTML = '&times;';
                    removeBtn.onclick = () => itemWrapper.remove();

                    itemWrapper.appendChild(itemContent);
                    itemWrapper.appendChild(removeBtn);
                    itemsContainer.appendChild(itemWrapper);
                };
                listContainer.appendChild(addBtn);
                wrapper.appendChild(listContainer);
            } else {
                // Fallback
                const textarea = document.createElement('textarea');
                textarea.name = path;
                textarea.placeholder = 'Raw JSON';
                wrapper.appendChild(textarea);
            }

            return wrapper;
        }

        getValue(schema, rootElement) {
            // This is a simplified value extractor. 
            // A robust one would traverse the schema and DOM recursively.
            // For now, we will rely on the FormData and manual parsing for arrays/objects
            // BUT, since we generated inputs with specific names/paths, we can try to reconstruct.

            // Actually, a better approach for this complexity is to traverse the DOM structure we built.
            return this._extractValueFromDom(schema, rootElement.lastElementChild); // lastChild is the input/fieldset/container
        }

        _extractValueFromDom(schema, element) {
            if (schema.enum) {
                // It's a select
                const val = element.value;
                // Try to convert type if needed (e.g. enum of numbers)
                if (schema.type === 'integer') return parseInt(val);
                if (schema.type === 'number') return parseFloat(val);
                if (schema.type === 'boolean') return val === 'true';
                return val;
            }

            if (schema.type === 'string') {
                return element.value;
            } else if (schema.type === 'integer') {
                return parseInt(element.value);
            } else if (schema.type === 'number') {
                return parseFloat(element.value);
            } else if (schema.type === 'boolean') {
                return element.value === 'true';
            } else if (schema.type === 'object') {
                const obj = {};
                if (schema.properties) {
                    // The element is the fieldset
                    const children = Array.from(element.children);
                    // Each child is a wrapper div with dataset.path
                    // We need to find the matching child for each property
                    // This is getting tricky because of the wrapper structure.
                    // Let's look at the wrapper's last child (the input)

                    for (const [key, prop] of Object.entries(schema.properties)) {
                        // Find the wrapper that corresponds to this key
                        // In createField, we appended children in order.
                        // So we can just iterate.
                        // BUT, to be safe, let's re-select based on name? No, names are complex.
                        // Let's assume order is preserved.
                    }

                    // Alternative: Select all inputs within this scope?
                    // Let's use a simpler approach:
                    // We will traverse the DOM tree we created.

                    let childIndex = 0;
                    for (const [key, prop] of Object.entries(schema.properties)) {
                        const wrapper = element.children[childIndex];
                        // The input/container is the last child of the wrapper
                        const inputEl = wrapper.lastElementChild;
                        obj[key] = this._extractValueFromDom(prop, inputEl);
                        childIndex++;
                    }
                }
                return obj;
            } else if (schema.type === 'array') {
                const arr = [];
                const itemsContainer = element.querySelector('.items-container');
                for (const itemWrapper of itemsContainer.children) {
                    const itemContent = itemWrapper.firstElementChild; // div.flex-1
                    // Inside itemContent is the wrapper from createField
                    const fieldWrapper = itemContent.firstElementChild;
                    const inputEl = fieldWrapper.lastElementChild;
                    arr.push(this._extractValueFromDom(schema.items, inputEl));
                }
                return arr;
            }
            return null;
        }
    }

    let currentSchema = null;
    let formBuilder = null;

    schemaSelect.addEventListener('change', (e) => {
        const schemaId = parseInt(e.target.value);
        currentSchema = schemas.find(s => s.id === schemaId);

        if (!currentSchema) {
            dynamicContainer.style.display = 'none';
            return;
        }

        dynamicContainer.style.display = 'block';
        formBuilder = new FormBuilder(formFields);
        formBuilder.render(currentSchema.structure);
    });

    form.addEventListener('submit', async (e) => {
        const data = {
            namespace_id: parseInt(formData.get('namespace_id')),
            schema_id: parseInt(formData.get('schema_id')),
            key: formData.get('key'),
            value: value
        };

        try {
            await api.post('/configs/', data);
            Toast.success('Success', 'Configuration created successfully');
            await renderConfigs(container); // Re-render
        } catch (err) {
            Toast.error('Error', err.message);
        }
    });
}
