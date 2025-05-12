import {DivComponent} from "../../common/div-component.js";
import './card.css'

export class Card extends DivComponent {
    constructor(appState, cardState) {
        super();
        this.appState = appState;
        this.cardState= cardState;
    }
    #addToFavorites() {
        this.appState.favorites = [
            ...this.appState.favorites,
            {
                key: this.cardState.key, // Обязательное поле
                title: this.cardState.title,
                author_name: this.cardState.author_name,
                cover_edition_key: this.cardState.cover_edition_key,
                subject: this.cardState.subject?.[0] // Для тегов
            }
        ];
    }
    #deleteFromFavorites() {
        this.appState.favorites = this.appState.favorites.filter(b => b.key !== this.cardState.key);
        this.appState.favorites = [...this.appState.favorites];
    }

    render() {
        this.el.classList.add('card');
        const existsInFavorites = this.appState.favorites.find(b => b.key == this.cardState.key);

        const coverImageUrl = this.cardState.cover_edition_key
            ? `https://covers.openlibrary.org/b/olid/${this.cardState.cover_edition_key}-M.jpg`
            : '/static/book1.jpeg';
        this.el.innerHTML = `
            <div class="card__image">
                <img 
                    src="${coverImageUrl}" 
                    alt="Обложка"
                    onerror="this.src='/static/book1.jpeg';"
                />
            </div>
            <div class="card__info">
                <div class="card__tag">
                    ${this.cardState.subject ? this.cardState.subject[0] : 'Не задано'}
                </div>
                <div class="card__name">
                    ${this.cardState.title ? this.cardState.title : 'Наименование'}
                </div>
                <div class="card__author">
                    ${this.cardState.author_name ? this.cardState.author_name : 'Автор'}
                </div> 
                <div class="card__footer">
                    <button class="button__add ${existsInFavorites ? 'button__active' : ''}">
                        ${existsInFavorites 
                        ? '<img src="/static/favorites.svg" /> ' 
                        : '<img src="/static/favorites-white.svg" />'}
                    </button>
                </div>
            </div>
            `
        if(existsInFavorites) {
            this.el
            .querySelector('button')
            .addEventListener('click',
            this.#deleteFromFavorites.bind(this))
        } else {
            this.el
            .querySelector('button')
            .addEventListener('click',
            this.#addToFavorites.bind(this))
        }
        return this.el
    }
}