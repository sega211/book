import { DivComponent } from '../../common/div-component.js';
import './modal.css';

export class Modal extends DivComponent {
    constructor(options) {
        super();
        this.title = options.title;
        this.content = options.content;
        this.onConfirm = options.onConfirm;
        this.onCancel = options.onCancel;
    }

    render() {
        this.el.classList.add('modal-overlay');
        this.el.innerHTML = `
            <div class="modal-content">
                <h2 class="modal-title">${this.title}</h2>
                <div class="modal-body">
                    ${this.content}
                </div>
                <div class="modal-actions">
                    <button class="modal-button confirm">Да, удалить</button>
                    <button class="modal-button cancel">Отмена</button>
                </div>
            </div>
        `;
        this.el.querySelector('.confirm').addEventListener('click', () => {
            this.onConfirm();
            this.destroy();
        });
        this.el.querySelector('.cancel').addEventListener('click', () => {
            this.onCancel && this.onCancel();
            this.destroy();
        });
        this.el.addEventListener('click', (e) => {
            if (e.target === this.el) { // Закрытие по клику на оверлей
                this.onCancel && this.onCancel();
                this.destroy();
            }
        });
        return this.el;
    }

    destroy() {
        this.el.remove();
    }
}