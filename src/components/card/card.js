import {DivComponent} from "../../common/div-component.js";
import { API_BASE_URL } from '../../config.js';
import './card.css';

export class Card extends DivComponent {
    constructor(appState, cardState, events) {
        super();
        this.appState = appState;
        this.cardState = cardState;
        this.events = events;
        this.cardId = cardState.id;
    }

    async #toggleFavorite() {
        const book = this.cardState;
        const isDummy = !this.cardId;

        // Гости могут добавлять/удалять "пустышки" только в текущей сессии
        if (!this.appState.user) {
            const isFavorite = this.appState.favorites.some(
                (b) => b.title === book.title
            );
            if (isFavorite) {
                this.appState.favorites = this.appState.favorites.filter(
                    (b) => b.title !== book.title
                );
            } else {
                this.appState.favorites = [
                    ...this.appState.favorites,
                    { ...this.cardState },
                ];
            }
            return;
        }

        // Логика для авторизованных пользователей (работа с API)
        const isFavorite = this.appState.favorites.some(
            (b) => b.id === this.cardId
        );
        const endpoint = `${API_BASE_URL}/api/favorites.php`;
        const headers = {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.appState.token}`,
        };

        if (isFavorite) {
            // На странице "Избранное" вызываем модальное окно через событие
            if (this.events?.onRemoveFavorite) {
                this.events.onRemoveFavorite(book);
            } else {
                // На других страницах удаляем сразу
                try {
                    await fetch(endpoint, {
                        method: 'DELETE',
                        headers,
                        body: JSON.stringify({
                            user_id: this.appState.user.id,
                            book_id: this.cardId,
                        }),
                    });
                    this.appState.favorites = this.appState.favorites.filter(
                        (b) => b.id !== this.cardId
                    );
                } catch (e) {
                    console.error('Ошибка удаления из избранного:', e);
                }
            }
        } else {
            // Добавляем в избранное через API
            try {
                await fetch(endpoint, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        user_id: this.appState.user.id,
                        book_id: this.cardId,
                    }),
                });
                this.appState.favorites = [
                    ...this.appState.favorites,
                    { ...this.cardState },
                ];
            } catch (e) {
                console.error('Ошибка добавления в избранное:', e);
            }
        }
    }

    render() {
        this.el.classList.add('card');
        const isDummy = !this.cardId;

        const existsInFavorites = this.appState.favorites.some((b) =>
            isDummy ? b.title === this.cardState.title : b.id === this.cardId
        );

        // Формируем правильный, абсолютный URL к обложке через API.
        // Это будет работать как для реальных книг, так и для заглушек (id=null).
        const coverImageUrl = `${API_BASE_URL}/get_poster.php?id=${this.cardId}`;

        // Опции для статуса
        const statusOptions = `
            <option value="unread" ${
                this.cardState.status === 'unread' ? 'selected' : ''
            }>Не прочитано</option>
            <option value="reading" ${
                this.cardState.status === 'reading' ? 'selected' : ''
            }>Читаю</option>
            <option value="read" ${
                this.cardState.status === 'read' ? 'selected' : ''
            }>Прочитано</option>
        `;

        this.el.innerHTML = `
            <div class="card__image">
                <img
                    src="${coverImageUrl}"
                    alt="Обложка книги: ${
                        this.cardState.title || 'без названия'
                    }"
                    onerror="this.onerror=null;this.src='static/book1.jpeg';"
                />
            </div>
            <div class="card__info">
                <div class="card__tag">
                    ${this.cardState.category || 'Без категории'}
                </div>
                <div class="card__name" title="${this.cardState.title || ''}">
                    ${this.cardState.title || 'Книга без названия'}
                </div>
                <div class="card__footer">
                    ${
                        this.appState.user?.isAdmin
                            ? `
                        <div class="card__status">
                            ${
                                this.cardId
                                    ? `
                                        <select class="status-select" data-id="${this.cardId}">
                                            ${statusOptions}
                                        </select>
                                        `
                                    : ''
                            }
                        </div>
                    `
                            : ''
                    }
                    <button class="button__add ${
                        existsInFavorites ? 'button__active' : ''
                    }">
                        ${
                            existsInFavorites
                                ? '<img src="static/favorites.svg" alt="Удалить из избранного" />'
                                : '<img src="static/favorites-white.svg" alt="Добавить в избранное" />'
                        }
                    </button>
                    <button class="button__read"
                        data-id="${this.cardId}"
                        ${!this.cardId ? 'disabled' : ''}>
                        Читать
                    </button>
                </div>
            </div>
        `;

        // Обработчики событий
        if (this.cardId) {
            // Статус
            this.el
                .querySelector('.status-select')
                ?.addEventListener('change', (e) => {
                    if (this.events?.onStatusChange) {
                        this.events.onStatusChange(
                            e.target.dataset.id,
                            e.target.value
                        );
                    }
                });

            // Чтение
            this.el
                .querySelector('.button__read')
                ?.addEventListener('click', (e) => {
                    if (this.events?.onRead) {
                        this.events.onRead(e.target.dataset.id);
                    }
                });
        }

        // Избранное
        this.el
            .querySelector('.button__add')
            ?.addEventListener('click', this.#toggleFavorite.bind(this));

        return this.el;
    }
}