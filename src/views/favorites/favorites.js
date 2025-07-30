import {AbstractView} from "../../common/view.js";
import onChange from "on-change";
import { Header } from '../../components/header/header.js';
import { CardList } from '../../components/card-list/card-list.js';
import { Modal } from '../../components/modal/modal.js';
import { Footer } from '../../components/footer/footer.js';
import { Search } from '../../components/search/search.js';
import { API_BASE_URL } from '../../config.js';

export class FavoritesView extends AbstractView {
    constructor(appState) {
        super();
        this.appState = appState;

        this.setTitle('Избранное');

        // Локальное состояние только для избранного
        this.localState = onChange(
            {
                searchQuery: '',
                filteredFavorites: [...this.appState.favorites],
            },
            () => {
                this.render();
            }
        );
    }

    onAppStateChange(path) {
        if (path === 'favorites') {
            this.updateFilteredFavorites();
        }
        if (path === 'searchOpen') {
            this.render();
        }
    }

    async updateBookStatus(bookId, status) {
        try {
            const response = await fetch(
                `${API_BASE_URL}/api/update_status.php`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${this.appState.token}`,
                    },
                    body: JSON.stringify({ id: bookId, status }),
                }
            );

            const result = await response.json();
            if (result.success) {
                // Обновляем книгу в глобальном состоянии избранного
                this.appState.favorites = this.appState.favorites.map((book) =>
                    book.id == bookId ? { ...book, status } : book
                );
            } else {
                console.error(
                    'Ошибка обновления статуса в избранном:',
                    result.error
                );
            }
        } catch (error) {
            console.error('Сетевая ошибка при обновлении статуса:', error);
        }
    }

    handleRemoveFavorite(bookToRemove) {
        const isDummy = !bookToRemove.id;
        const modal = new Modal({
            title: 'Удалить книгу?',
            content: `Вы уверены, что хотите удалить книгу <strong>"${bookToRemove.title}"</strong> из избранного?`,
            onConfirm: () => {
                this.appState.favorites = this.appState.favorites.filter((b) =>
                    isDummy
                        ? b.title !== bookToRemove.title
                        : b.id !== bookToRemove.id
                );
            },
        });
        this.app.append(modal.render());
    }

    // Обновление отфильтрованного списка
    updateFilteredFavorites() {
        const { searchQuery } = this.localState;

        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            this.localState.filteredFavorites = this.appState.favorites.filter(
                (book) =>
                    book.title.toLowerCase().includes(lowerQuery) ||
                    (book.author &&
                        book.author.toLowerCase().includes(lowerQuery))
            );
        } else {
            this.localState.filteredFavorites = [...this.appState.favorites];
        }
    }

    // Поиск только в избранном
    searchFavorites(query) {
        this.localState.searchQuery = query;
        this.updateFilteredFavorites();
    }

    render() {
        // Очищаем контейнер приложения
        this.app.innerHTML = '';

        const main = document.createElement('div');
        main.classList.add('favorites-container', 'container');

        // Заголовок с кнопкой очистки поиска
        main.innerHTML = `
            <div class="favorites-header">
                <h1>Избранное 
                    <span class="favorites-count">(${
                        this.localState.filteredFavorites.length
                    })</span>
                </h1>
                ${
                    this.localState.searchQuery
                        ? `
                    <button class="clear-search">
                        Очистить поиск
                    </button>
                `
                        : ''
                }
            </div>
        `;

        // Обработчик очистки поиска
        if (this.localState.searchQuery) {
            const clearButton = main.querySelector('.clear-search');
            if (clearButton) {
                clearButton.addEventListener('click', () => {
                    this.localState.searchQuery = '';
                    this.updateFilteredFavorites();
                });
            }
        }

        // Добавляем компонент поиска, если он открыт
        if (this.appState.searchOpen) {
            const searchContainer = document.createElement('div');
            searchContainer.classList.add('search-container');
            const search = new Search({
                searchQuery: this.localState.searchQuery,
                onSearch: (query) => this.searchFavorites(query),
                onClose: () => this.appState.toggleSearch(),
            });
            searchContainer.appendChild(search.render());
            main.appendChild(searchContainer);
        }

        // Отображаем список избранных книг или сообщение
        if (this.localState.filteredFavorites.length > 0) {
            const events = {
                onStatusChange: this.updateBookStatus.bind(this),
                onRemoveFavorite: this.handleRemoveFavorite.bind(this),
                onRead: (bookId) =>
                    bookId &&
                    window.open(
                        `${API_BASE_URL}/get_pdf.php?id=${bookId}`,
                        '_blank'
                    ),
            };
            const cardList = new CardList(
                this.appState,
                {
                    list: this.localState.filteredFavorites,
                    numFound: this.localState.filteredFavorites.length,
                    loading: false,
                },
                events
            );
            main.appendChild(cardList.render());
        } else {
            // Сообщение при отсутствии книг
            const message = document.createElement('div');
            message.classList.add('empty-message');
            message.innerHTML = this.localState.searchQuery
                ? `По запросу <strong>"${this.localState.searchQuery}"</strong> в избранном ничего не найдено`
                : 'В избранном пока нет книг';
            main.appendChild(message);
        }

        // Добавляем хедер
        const header = new Header(this.appState).render();
        this.app.appendChild(header);
        this.app.appendChild(main);
        this.app.appendChild(new Footer(this.appState).render());
    }

    destroy() {
        // Отписываемся от изменений локального состояния
        onChange.unsubscribe(this.localState);
    }
}