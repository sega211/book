import { DivComponent } from '../../common/div-component.js';
import './pagination.css';

export class Pagination extends DivComponent {
    constructor(state) {
        super();
        // state: { page, totalPages, onPageChange }
        this.state = state;
    }

    render() {
        this.el.classList.add('pagination');
        this.el.innerHTML = ''; // Clear previous content

        if (this.state.totalPages <= 1) {
            return this.el; // Don't render if only one page or less
        }

        // "Previous" button
        const prevButton = document.createElement('button');
        prevButton.textContent = 'Назад';
        prevButton.classList.add('pagination__button', 'pagination__button--prev');
        if (this.state.page === 1) {
            prevButton.disabled = true;
        }
        prevButton.addEventListener('click', () => {
            this.state.onPageChange(this.state.page - 1);
        });
        this.el.appendChild(prevButton);

        // Page info
        const pageInfo = document.createElement('span');
        pageInfo.classList.add('pagination__info');
        pageInfo.textContent = `Страница ${this.state.page} из ${this.state.totalPages}`;
        this.el.appendChild(pageInfo);

        // "Next" button
        const nextButton = document.createElement('button');
        nextButton.textContent = 'Вперед';
        nextButton.classList.add('pagination__button', 'pagination__button--next');
        if (this.state.page >= this.state.totalPages) {
            nextButton.disabled = true;
        }
        nextButton.addEventListener('click', () => {
            this.state.onPageChange(this.state.page + 1);
        });
        this.el.appendChild(nextButton);

        return this.el;
    }
}