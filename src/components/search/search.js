import {DivComponent} from "../../common/div-component.js";
import './search.css'

export class Search extends DivComponent {
    constructor(state) {
        super();
        this.state = state;
    }

    search() {
        const value = this.el.querySelector('input').value;
        if (this.state.onSearch) {
            this.state.onSearch(value);
        }
    }

    closeSearch() {
        if (this.state.onClose) {
            this.state.onClose();
        }
    }

    render() {
        console.log('Search component render called');

        this.el.classList.add('search');
        this.el.innerHTML = `
            <div class="search__wrapper">
                <input type="text" placeholder="Найти книгу или автора...."
                class="search__input"
                value="${this.state.searchQuery || ''}">
                <button class="search__button" aria-label="Искать">
                    <img src="/static/search-white.svg" alt="Иконка поиска"/>
                </button>
                <button class="search__close" aria-label="Закрыть поиск">
                    &times;
                </button>
            </div>
        `;

        console.log('Search HTML created');

        // Обработчики событий
        this.el
            .querySelector('.search__button')
            .addEventListener('click', this.search.bind(this));

        this.el
            .querySelector('.search__close')
            .addEventListener('click', this.closeSearch.bind(this));

        this.el
            .querySelector('.search__input')
            .addEventListener('keydown', (event) => {
                if (event.code === 'Enter') {
                    this.search();
                }
            });

        console.log('Search event listeners added');
        return this.el;
    }
}