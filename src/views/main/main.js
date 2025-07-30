import {AbstractView} from "../../common/view.js";
import './main.css';
import onChange from 'on-change';
import { Header } from '../../components/header/header.js';
import { CardList } from '../../components/card-list/card-list.js';
import { StatusFilter } from '../../components/statusfilter/status-filter.js';
import { CategoryFilter } from '../../components/categoryfilter/category-filter.js';
import { Search } from '../../components/search/search.js';
import { Footer } from '../../components/footer/footer.js';
import { Pagination } from '../../components/pagination/pagination.js';
import '../../components/pagination/pagination.css';
import { API_BASE_URL } from '../../config.js';
// Базовый URL API
// Укажите здесь ваш порт Apache

// В реальном приложении этот ключ не должен храниться в коде в открытом виде.
// const API_KEY = 'YOUR_SECRET_TOKEN'; // Больше не нужен здесь

export class MainView extends AbstractView {
    state = {
        pagination: {
            page: 1,
            limit: 12,
            total: 0,
            totalPages: 1,
        },
        categories: [],
        categoriesLoading: false,
        isScanning: false,
    };

    constructor(appState) {
        super();
        this.appState = appState;

        // Инициализируем searchOpen в appState, если его еще нет
        // Эти свойства уже инициализируются в app.js, проверки здесь избыточны
        // this.appState.searchOpen = this.appState.searchOpen ?? false;
        // this.appState.currentStatus = this.appState.currentStatus ?? null;
        // this.appState.hideRead = this.appState.hideRead ?? false;

        // Добавляем методы поиска в appState
        this.appState.onSearch = this.searchBooks.bind(this);
        this.appState.toggleSearch = this.toggleSearch.bind(this);

        // Подписываемся на изменения локального состояния
        this.state = onChange(this.state, this.stateHook.bind(this));

        this.setTitle('Моя библиотека');
        this.loadCategories();
        this.loadBooks();
    }

    // Метод для переключения видимости поиска
    toggleSearch() {
        this.appState.searchOpen = !this.appState.searchOpen;

        // После изменения состояния явно вызываем render
        this.render();

        // Фокусировка на поле ввода
        if (this.appState.searchOpen) {
            setTimeout(() => {
                const input = document.querySelector('.search__input');
                if (input) {
                    input.focus();
                    // Помещаем курсор в конец текста
                    input.setSelectionRange(
                        input.value.length,
                        input.value.length
                    );
                }
            }, 100);
        }
    }

    // Очистка поиска
    clearSearch() {
        this.appState.searchQuery = '';
        this.appState.searchOpen = false;
        // Загружаем книги с учетом текущей категории
        this.loadBooks(1);
    }

    searchBooks(query) {
        // Обновляем состояние поиска
        this.appState.searchQuery = query;

        // Скрываем поиск после выполнения
        this.appState.searchOpen = false;

        // Сбрасываем страницу и загружаем результаты
        // Категория сохраняется
        this.loadBooks(1);
    }

    handleCategoryChange(category) {
        this.appState.currentCategory = category;
        this.appState.searchQuery = ''; // Сбрасываем поиск при смене категории для лучшего UX
        this.loadBooks(1); // Загружаем книги для новой категории с первой страницы
    }

    handleStatusChange({ status, hideRead }) {
        if (status !== undefined) {
            // Если пользователь выбрал "Прочитано", сбрасываем "Скрыть прочитанные"
            if (status === 'read') {
                this.appState.hideRead = false;
            }
            this.appState.currentStatus = status;
        }
        if (hideRead !== undefined) {
            // Если пользователь выбрал "Скрыть прочитанные", сбрасываем фильтр по статусу
            if (hideRead) {
                this.appState.currentStatus = null;
            }
            this.appState.hideRead = hideRead;
        }
        // Сбрасываем страницу при любом изменении фильтра
        this.loadBooks(1);
    }

    async handleScan() {
        this.state.isScanning = true;
        try {
            const response = await fetch(`${API_BASE_URL}/scan_books.php`, {
                headers: {
                    Authorization: `Bearer ${this.appState.token}`,
                },
            });
            const result = await response.json();
            if (result.status === 'success') {
                alert('Сканирование завершено успешно!');
                // Обновляем данные на странице
                this.loadCategories();
                this.loadBooks(1);
            } else {
                alert(
                    `Ошибка сканирования: ${
                        result.message || 'Неизвестная ошибка'
                    }`
                );
            }
        } catch (error) {
            console.error('Ошибка при запуске сканирования:', error);
            alert(
                'Произошла критическая ошибка при запуске сканирования. Подробности в консоли.'
            );
        } finally {
            // Убеждаемся, что состояние обновляется в любом случае
            this.state.isScanning = false;
        }
    }

    async loadBooks(page = 1) {
        this.appState.loading = true;

        // Формируем URL с параметрами
        const params = new URLSearchParams({
            page: page,
            limit: 12,
        });

        // Добавляем параметр поиска только если он не пустой
        if (this.appState.searchQuery && this.appState.searchQuery.trim()) {
            params.append('search', this.appState.searchQuery.trim());
        }

        // Добавляем параметр категории, если он выбран
        if (this.appState.currentCategory) {
            params.append('category', this.appState.currentCategory);
        }

        // Добавляем параметры статуса
        if (this.appState.currentStatus) {
            // Если выбран статус, то hideRead игнорируется на бэке, но для чистоты можно его не отправлять
            params.append('status', this.appState.currentStatus);
        } else if (this.appState.hideRead) {
            // hideRead работает только когда не выбран конкретный статус
            params.append('hide_read', 'true');
        }

        const apiUrl = `${API_BASE_URL}/api/books.php?${params}`;

        try {
            const headers = {};
            if (this.appState.token) {
                headers['Authorization'] = `Bearer ${this.appState.token}`;
            }
            const response = await fetch(apiUrl, {
                headers: headers,
            });

            // Проверка статуса ответа и получение JSON
            if (!response.ok) {
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                } catch (e) {
                    /* ignore json parsing error */
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();

            if (data.success) {
                this.appState.list = data.data;
                this.appState.numFound = data.pagination.total;
                this.state.pagination = {
                    page: data.pagination.page,
                    limit: data.pagination.limit,
                    total: data.pagination.total,
                    totalPages: data.pagination.totalPages,
                };
            } else {
                console.error(
                    'Ошибка API:',
                    data.error || 'Неизвестная ошибка'
                );
            }
        } catch (error) {
            console.error('Ошибка загрузки книг:', error);
            this.displayError(
                `Не удалось загрузить книги. Ошибка: ${error.message}`
            );
        }

        this.appState.loading = false;
    }

    async loadCategories() {
        this.state.categoriesLoading = true;
        try {
            const headers = {};
            if (this.appState.token) {
                headers['Authorization'] = `Bearer ${this.appState.token}`;
            }
            const response = await fetch(`${API_BASE_URL}/api/categories.php`, {
                headers: headers,
            });
            if (!response.ok) {
                let errorMessage = `HTTP ошибка! Статус: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                } catch (e) {
                    /* ignore json parsing error */
                }
                throw new Error(errorMessage);
            }
            const result = await response.json();
            if (result.success) {
                this.state.categories = result.data;
            } else {
                console.error('Не удалось загрузить категории:', result.error);
            }
        } catch (error) {
            console.error('Ошибка при запросе категорий:', error);
            // Можно также отобразить ошибку пользователю, если это критично
            this.displayError(
                `Не удалось загрузить категории. Ошибка: ${error.message}`
            );
        }
        this.state.categoriesLoading = false;
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
                // Статус успешно обновлен на сервере.
                // Перезагружаем список книг, чтобы отобразить изменения
                // и учесть текущие фильтры (например, книга может исчезнуть из вида "непрочитанные").
                this.loadBooks(this.state.pagination.page);
            } else {
                console.error(
                    'Ошибка обновления статуса:',
                    result.error || 'Неизвестная ошибка'
                );
            }
        } catch (error) {
            console.error('Ошибка сети:', error);
        }
    }

    destroy() {
        onChange.unsubscribe(this.state);
    }

    displayError(message) {
        const errorEl = document.createElement('div');
        errorEl.className = 'error-message';
        errorEl.textContent = message;

        // Ищем место для вставки ошибки
        const mainHeader = document.querySelector('.main-header');
        const existingError = document.querySelector('.error-message');

        if (existingError) {
            existingError.remove();
        }

        if (mainHeader) {
            mainHeader.insertAdjacentElement('afterend', errorEl);
        }
    }

    onAppStateChange(path) {
        const rootPath = path.split('.')[0];

        // При любой смене пользователя (вход или выход)
        // немедленно очищаем список, чтобы не показывать старые данные,
        // а затем запускаем загрузку актуальных книг (для гостя или для пользователя).
        if (rootPath === 'user') {
            this.appState.list = [];
            this.appState.numFound = 0;
            // Загрузку данных необходимо отложить на следующий тик,
            // чтобы дать возможность другим изменениям состояния (например, обнулению токена)
            // завершиться. Это решает race condition при выходе из системы.
            setTimeout(() => {
                this.loadCategories();
                this.loadBooks();
            }, 0);
        }

        // Перерисовываем компонент при изменении любых данных, от которых он зависит
        if (
            [
                'list', // Список книг изменился
                'loading', // Статус загрузки изменился
                'searchQuery', // Изменился поисковый запрос
                'favorites',
                'searchOpen',
                'currentCategory',
                'currentStatus',
                'hideRead',
                'user', // Также перерисовываем при смене пользователя (для guest-message и т.д.)
            ].includes(rootPath)
        ) {
            this.render();
        }
    }

    stateHook(path) {
        if (['categories', 'isScanning', 'pagination'].includes(path)) {
            this.render();
        }
    }

    render() {
        const main = document.createElement('div');
        main.classList.add('main-container', 'container');

        // Заголовок с информацией о поиске и категории
        if (this.appState.searchQuery) {
            main.innerHTML = `
                <div class="main-header">
                    <h1>
                        Результаты поиска: "${this.appState.searchQuery}" 
                        <span class="book-count">(${this.appState.numFound})</span>
                    </h1>
                    <button class="clear-search">Очистить поиск</button>
                </div>
            `;

            // Добавляем обработчик для кнопки очистки поиска
            const clearButton = main.querySelector('.clear-search');
            if (clearButton) {
                clearButton.addEventListener('click', () => {
                    this.clearSearch();
                });
            }
        } else {
            const categoryName =
                this.appState.currentCategory || 'Моя библиотека';
            main.innerHTML = /*html*/ `
                <div class="main-header">
                    <h1>${categoryName} <span class="book-count">(${this.appState.numFound})</span></h1>
                </div>
            `;
        }

        // Добавляем сообщение для гостей В НАЧАЛО main
        if (!this.appState.user) {
            const guestMessage = document.createElement('div');
            guestMessage.className = 'guest-message';
            guestMessage.innerHTML = /*html*/ `
                <p>Вы просматриваете демонстрационную версию. Для доступа к полной библиотеке и всем функциям, пожалуйста, <a href="#login">войдите</a>.</p>
            `;
            main.prepend(guestMessage); // Используем prepend, чтобы добавить в начало
        }

        // Добавляем кнопку сканирования для администратора
        if (this.appState.user?.isAdmin) {
            const scanButton = document.createElement('button');
            scanButton.className = 'scan-button';
            if (this.state.isScanning) {
                scanButton.disabled = true;
                scanButton.textContent = 'Сканирование...';
            } else {
                scanButton.textContent = 'Сканировать книги';
            }
            scanButton.addEventListener('click', this.handleScan.bind(this));
            // Добавляем кнопку в заголовок
            main.querySelector('.main-header').append(scanButton);
        }

        // Добавляем контейнер для фильтра статусов
        const statusFilterContainer = document.createElement('div');
        statusFilterContainer.classList.add('status-filter-container');
        main.querySelector('.main-header').after(statusFilterContainer);

        // Показываем фильтр статусов только администраторам
        if (this.appState.user?.isAdmin) {
            new StatusFilter(
                statusFilterContainer,
                this.handleStatusChange.bind(this)
            ).render(this.appState.currentStatus, this.appState.hideRead);
        }

        // Добавляем контейнер для фильтра категорий после заголовка
        const filterContainer = document.createElement('div');
        filterContainer.classList.add('category-filter');
        // Вставляем после заголовка, который мы только что создали
        statusFilterContainer.after(filterContainer);

        if (this.state.categories.length === 0 || !this.appState.user) {
            filterContainer.style.display = 'none';
        }
        new CategoryFilter(
            filterContainer,
            this.state.categories,
            this.handleCategoryChange.bind(this)
        ).render(this.appState.currentCategory);

        // Добавляем компонент поиска, если он должен быть видим
        if (this.appState.searchOpen) {
            const searchContainer = document.createElement('div');
            searchContainer.classList.add('search-container');
            const search = new Search({
                searchQuery: this.appState.searchQuery,
                onSearch: (query) => this.searchBooks(query),
                onClose: () => this.toggleSearch(),
            });
            searchContainer.appendChild(search.render());
            main.appendChild(searchContainer);
        }

        // Передаем обработчики событий в CardList
        const events = {
            onStatusChange: (bookId, status) =>
                this.updateBookStatus(bookId, status),
            onRead: (bookId) =>
                window.open(
                    `${API_BASE_URL}/get_pdf.php?id=${bookId}`,
                    '_blank'
                ),
        };

        main.append(
            new CardList(
                this.appState,
                {
                    list: this.appState.list,
                    numFound: this.appState.numFound,
                    loading: this.appState.loading,
                },
                events
            ).render()
        );

        // Добавляем компонент пагинации
        const paginationContainer = document.createElement('div');
        const pagination = new Pagination({
            page: this.state.pagination.page,
            totalPages: this.state.pagination.totalPages,
            onPageChange: (newPage) => this.loadBooks(newPage),
        });
        paginationContainer.append(pagination.render());
        main.append(paginationContainer);

        this.app.innerHTML = '';
        this.app.appendChild(main);
        this.renderHeader();
        this.app.appendChild(new Footer(this.appState).render());
    }

    renderHeader() {
        const header = new Header(this.appState).render();
        this.app.prepend(header);
    }
}