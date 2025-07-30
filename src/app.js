import {MainView} from "./views/main/main.js";
import { LoginView } from './views/login/login.js';
import { ProfileView } from './views/profile/profile.js';
import { FavoritesView } from './views/favorites/favorites.js';
import onChange from 'on-change';
import { API_BASE_URL } from './config.js';

class App {
    routes = [
        {
            path: '',
            view: MainView,
        },
        {
            path: '#favorites',
            view: FavoritesView,
        },
        {
            path: '#login',
            view: LoginView,
        },
        {
            path: '#profile',
            view: ProfileView,
        },
    ];

    constructor() {
        const user = this.loadUser();
        const token = this.loadToken();

        this.appState = {
            // Состояние для главной страницы (поиск книг)
            list: [],
            numFound: 0,
            loading: false,
            searchQuery: '',
            offset: 0,
            // ---
            favorites: user
                ? [] // Будет загружено для авторизованного пользователя
                : this.loadFavoritesFromGuestStorage(), // Гости используют localStorage
            searchOpen: false,
            currentCategory: null, // Состояние для текущей категории
            currentStatus: null, // Состояние для фильтра по статусу
            hideRead: false, // Состояние для скрытия прочитанных
            user: user, // Данные о пользователе
            token: token, // Токен доступа
            // Добавляем общие методы управления поиском
            toggleSearch: this.toggleSearch.bind(this),
            onSearch: this.globalOnSearch.bind(this),
        };

        // Текущее представление
        this.currentView = null;

        this.syncingFavorites = false; // Флаг для предотвращения гонки запросов

        // Отслеживание изменений состояния
        this.appState = onChange(
            this.appState,
            (path, value, previousValue) => {
                // Обработка изменений состояния пользователя (вход/выход)
                if (path === 'user' || path === 'token') {
                    this.persistUser(this.appState.user);
                    this.persistToken(this.appState.token);

                    if (this.appState.user && this.appState.token) {
                        // Пользователь вошел в систему, загружаем его избранное
                        this.fetchUserFavorites(
                            this.appState.token,
                            this.appState.user.id
                        );
                    } else if (!this.appState.user) {
                        // Пользователь вышел из системы
                        // 1. Загружаем гостевое избранное
                        this.appState.favorites =
                            this.loadFavoritesFromGuestStorage();
                    }
                } else if (path === 'favorites') {
                    if (this.appState.user) {
                        // Пользователь авторизован, синхронизируем с БД
                        this.syncFavorites(value, previousValue);
                    } else {
                        // Гость, сохраняем в localStorage
                        this.persistFavoritesForGuest(value);
                    }
                }

                // Уведомляем текущее представление об изменении глобального состояния
                if (
                    this.currentView &&
                    typeof this.currentView.onAppStateChange === 'function'
                ) {
                    this.currentView.onAppStateChange(path);
                }
                if (
                    [
                        'searchOpen',
                        'currentCategory',
                        'currentStatus',
                        'hideRead',
                    ].includes(path.split('.')[0]) ||
                    path === 'user'
                ) {
                    console.log(
                        `${path.split('.')[0]} changed to:`,
                        this.appState[path.split('.')[0]]
                    );
                }
            }
        );

        // Загружаем "Избранное" для авторизованного пользователя при старте
        if (this.appState.user && this.appState.token) {
            this.fetchUserFavorites(this.appState.token, this.appState.user.id);
        }

        window.addEventListener('hashchange', this.route.bind(this));
        this.route();
    }

    // Глобальный метод для переключения поиска
    toggleSearch() {
        this.appState.searchOpen = !this.appState.searchOpen;
        console.log(
            'Global toggleSearch called. New state:',
            this.appState.searchOpen
        );

        // Уведомляем текущее представление о необходимости обновить UI
        if (this.currentView && this.currentView.render) {
            this.currentView.render();
        }
    }

    // Глобальный обработчик поиска
    globalOnSearch(query) {
        console.log('Global onSearch called with query:', query);

        // Перенаправляем запрос в текущее представление
        if (this.currentView && this.currentView.handleSearch) {
            this.currentView.handleSearch(query);
        }
    }

    async fetchUserFavorites(token, userId) {
        try {
            const res = await fetch(
                `${API_BASE_URL}/api/favorites.php?user_id=${userId}`,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            const data = await res.json();
            if (data.success) {
                this.appState.favorites = data.data;
            } else {
                console.error(
                    'Не удалось загрузить избранное пользователя:',
                    data.error
                );
                // Если токен невалидный, разлогиниваем пользователя
                if (data.error === 'Invalid token') {
                    this.appState.user = null;
                    this.appState.token = null;
                    this.appState.favorites =
                        this.loadFavoritesFromGuestStorage();
                }
            }
        } catch (error) {
            console.error('Сетевая ошибка при загрузке избранного:', error);
        }
    }

    /**
     * Сравнивает текущий и предыдущий списки избранного и отправляет
     * запросы на добавление/удаление на сервер.
     * @param {object[]} currentFavorites - Текущий массив избранного.
     * @param {object[]} previousFavorites - Предыдущий массив избранного.
     */
    async syncFavorites(currentFavorites, previousFavorites) {
        if (
            !this.appState.user ||
            !this.appState.token ||
            this.syncingFavorites
        ) {
            return;
        }

        const currentIds = new Set(currentFavorites.map((fav) => fav.id));
        const previousIds = new Set(previousFavorites.map((fav) => fav.id));

        // Ищем удаленные книги
        for (const book of previousFavorites) {
            if (!currentIds.has(book.id)) {
                await this.sendFavoriteAction(book.id, 'delete');
            }
        }

        // Ищем добавленные книги
        for (const book of currentFavorites) {
            if (!previousIds.has(book.id)) {
                await this.sendFavoriteAction(book.id, 'add');
            }
        }
    }

    /**
     * Отправляет запрос на сервер для добавления или удаления книги из избранного.
     * @param {number} bookId - ID книги.
     * @param {'add' | 'delete'} action - Действие.
     */
    async sendFavoriteAction(bookId, action) {
        this.syncingFavorites = true;
        try {
            const res = await fetch(`${API_BASE_URL}/api/favorites.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.appState.token}`,
                },
                body: JSON.stringify({
                    user_id: this.appState.user.id,
                    book_id: bookId,
                    action: action,
                }),
            });
            const data = await res.json();
            if (!data.success) {
                console.error(
                    `Ошибка при ${
                        action === 'add' ? 'добавлении' : 'удалении'
                    } избранного:`,
                    data.error
                );
            }
        } catch (error) {
            console.error(
                `Сетевая ошибка при синхронизации избранного:`,
                error
            );
        } finally {
            this.syncingFavorites = false;
        }
    }

    loadUser() {
        const raw = localStorage.getItem('user');
        return raw ? JSON.parse(raw) : null;
    }

    persistUser(user) {
        localStorage.setItem('user', JSON.stringify(user));
    }

    loadToken() {
        return localStorage.getItem('token');
    }

    persistToken(token) {
        if (token) {
            localStorage.setItem('token', token);
        } else {
            localStorage.removeItem('token');
        }
    }

    loadFavoritesFromGuestStorage() {
        const raw = localStorage.getItem('guest_favorites');
        return raw ? JSON.parse(raw) : [];
    }

    persistFavoritesForGuest(favorites) {
        localStorage.setItem('guest_favorites', JSON.stringify(favorites));
    }

    route() {
        if (this.currentView) {
            this.currentView.destroy();
            this.currentView = null;
        }

        const route =
            this.routes.find((r) => r.path === location.hash) || this.routes[0];

        // Проверка доступа к роутам
        const isProtectedRoute = ['#profile'].includes(route.path);
        const isAuthRoute = ['#login'].includes(route.path);

        if (isProtectedRoute && !this.appState.user) {
            // Гостя не пускаем в профиль, отправляем на логин
            location.hash = '#login';
            return;
        }

        if (isAuthRoute && this.appState.user) {
            // Авторизованного пользователя не пускаем на страницу входа
            location.hash = '';
            return;
        }

        this.currentView = new route.view(this.appState);

        // Добавляем метод для обработки поиска
        this.currentView.handleSearch = (query) => {
            if (route.path === '#favorites') {
                this.currentView.searchFavorites(query);
            } else {
                this.currentView.searchBooks(query);
            }
        };

        this.currentView.render();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new App();
});
