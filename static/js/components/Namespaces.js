import { api } from '../api.js';

export async function renderNamespaces(container) {
    const namespaces = await api.get('/namespaces/');

    container.innerHTML = `
        <div class="header">
            <h1>Namespaces</h1>
            <button class="btn btn-primary" id="create-ns-btn">Create Namespace</button>
        </div>
        
        <div class="card" id="create-ns-form" style="display: none;">
            <h3>New Namespace</h3>
            <form id="ns-form" class="mt-4">
                <div class="input-group">
                    <label>Name</label>
                    <input type="text" name="name" required placeholder="e.g. Global, PaymentService">
                </div>
                <div class="input-group">
                    <label>Description</label>
                    <input type="text" name="description" placeholder="Optional description">
                </div>
                <div class="flex gap-2">
                    <button type="submit" class="btn btn-primary">Save</button>
                    <button type="button" class="btn btn-secondary" id="cancel-ns-btn">Cancel</button>
                </div>
            </form>
        </div>

        <div class="card">
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Description</th>
                        <th>Created At</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${namespaces.map(ns => `
                        <tr>
                            <td>${ns.id}</td>
                            <td><strong>${ns.name}</strong></td>
                            <td>${ns.description || '-'}</td>
                            <td>${new Date(ns.created_at).toLocaleString()}</td>
                            <td>
                                <button class="btn btn-sm btn-danger delete-namespace-btn" data-id="${ns.id}" data-name="${ns.name}">Delete</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;

    // Event Listeners
    const form = container.querySelector('#ns-form');
    const createBtn = container.querySelector('#create-ns-btn');
    const cancelBtn = container.querySelector('#cancel-ns-btn');
    const formCard = container.querySelector('#create-ns-form');

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
        const data = {
            name: formData.get('name'),
            description: formData.get('description')
        };

        try {
            await api.post('/namespaces/', data);
            await renderNamespaces(container); // Re-render
        } catch (err) {
            alert(err.message);
        }
    });

    // Delete button handlers
    container.querySelectorAll('.delete-namespace-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.dataset.id;
            const name = btn.dataset.name;

            if (confirm(`Are you sure you want to delete namespace "${name}"?`)) {
                try {
                    await api.delete(`/namespaces/${id}`);
                    Toast.success('Deleted', `Namespace "${name}" deleted successfully`);
                    await renderNamespaces(container);
                } catch (err) {
                    Toast.error('Error', err.message);
                }
            }
        });
    });
}
