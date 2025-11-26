export const Modal = {
    overlay: null,
    modal: null,
    titleEl: null,
    bodyEl: null,

    init() {
        if (this.overlay) return;

        this.overlay = document.createElement('div');
        this.overlay.className = 'modal-overlay';

        this.overlay.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <div class="modal-title"></div>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body"></div>
            </div>
        `;

        document.body.appendChild(this.overlay);

        this.modal = this.overlay.querySelector('.modal');
        this.titleEl = this.overlay.querySelector('.modal-title');
        this.bodyEl = this.overlay.querySelector('.modal-body');
        const closeBtn = this.overlay.querySelector('.modal-close');

        closeBtn.addEventListener('click', () => this.close());
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) this.close();
        });
    },

    show(title, content, isHtml = false) {
        this.init();
        this.titleEl.textContent = title;

        if (isHtml) {
            this.bodyEl.innerHTML = '';
            if (typeof content === 'string') {
                this.bodyEl.innerHTML = content;
            } else {
                this.bodyEl.appendChild(content);
            }
        } else {
            this.bodyEl.textContent = content;
        }

        this.overlay.classList.add('open');
    },

    close() {
        if (this.overlay) {
            this.overlay.classList.remove('open');
            // Clear content after transition
            setTimeout(() => {
                this.bodyEl.innerHTML = '';
            }, 300);
        }
    }
};
