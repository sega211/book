import { DivComponent } from '../../common/div-component.js';
import './header.css';

export class Header extends DivComponent {
    constructor(appState) {
        super();
        this.appState = appState;
        this.isMobileMenuOpen = false; // Локальное состояние для меню
    }

    // Метод для переключения мобильного меню
    toggleMobileMenu() {
        this.isMobileMenuOpen = !this.isMobileMenuOpen;
        this.el.querySelector('.mobile-nav').classList.toggle('open');
        this.el.querySelector('.mobile-nav-button').classList.toggle('open');
        document.body.classList.toggle('no-scroll'); // Запрещаем прокрутку страницы, когда меню открыто
    }

    render() {
        this.el.classList.add('header');
        const menuContent = this.appState.user
            ? this.renderUserMenu()
            : this.renderGuestMenu();

        this.el.innerHTML = `
            <div class="header__content container">
                <div class="header__logo">
                    <img src="static/fav.png" alt="Лого" />
                </div>
                
                <!-- Десктопное меню -->
                <div class="desktop-menu">
                    ${menuContent}
                </div>

                <!-- Кнопка "Бургер" для мобильных -->
                <button class="mobile-nav-button" aria-label="Открыть меню">
                    <span class="mobile-nav-button__line"></span>
                    <span class="mobile-nav-button__line"></span>
                    <span class="mobile-nav-button__line"></span>
                </button>
            </div>

            <!-- Мобильное меню (панель) -->
            <nav class="mobile-nav" aria-hidden="true">
                <div class="mobile-nav__content">
                    ${menuContent}
                </div>
            </nav>
        `;

        // --- Добавляем обработчики событий ---

        // Клик по логотипу
        this.el.querySelector('.header__logo').addEventListener('click', () => {
            if (this.isMobileMenuOpen) this.toggleMobileMenu();
            window.location.hash = '';
        });

        // Клик по кнопке "бургера"
        this.el
            .querySelector('.mobile-nav-button')
            .addEventListener('click', this.toggleMobileMenu.bind(this));

        // Клик по ссылке в мобильном меню должен закрывать его
        this.el.querySelectorAll('.mobile-nav a.menu__item').forEach((item) => {
            item.addEventListener('click', () => {
                if (this.isMobileMenuOpen) {
                    this.toggleMobileMenu();
                }
            });
        });

        // Обработчики для кнопок внутри меню (поиск, выход)
        if (this.appState.user) {
            const desktopMenu = this.el.querySelector('.desktop-menu');
            const mobileMenu = this.el.querySelector('.mobile-nav');

            // Поиск
            const searchHandler = () => {
                this.appState.toggleSearch && this.appState.toggleSearch();
                // Закрываем меню, если оно было открыто
                if (this.isMobileMenuOpen) this.toggleMobileMenu();
            };
            desktopMenu
                .querySelector('.search-toggle')
                ?.addEventListener('click', searchHandler);
            mobileMenu
                .querySelector('.search-toggle')
                ?.addEventListener('click', searchHandler);

            // Выход
            const logoutHandler = () => {
                // Закрываем меню, если оно было открыто
                if (this.isMobileMenuOpen) this.toggleMobileMenu();
                this.appState.user = null;
                this.appState.token = null;
                this.appState.favorites = [];
            };
            desktopMenu
                .querySelector('.logout-button')
                ?.addEventListener('click', logoutHandler);
            mobileMenu
                .querySelector('.logout-button')
                ?.addEventListener('click', logoutHandler);
        }

        return this.el;
    }

    renderUserMenu() {
        return `
            <div class="menu">
                <button type="button" class="menu__item search-toggle"><img src="static/search.svg" alt="Поиск" /><span>Поиск книг</span></button>
                <a class="menu__item" href="#profile"><span>Профиль</span></a>
                <a class="menu__item" href="#favorites"><img src="static/favorites.svg" alt="Избранное" /><span>Избранное</span><div class="menu__counter">${this.appState.favorites.length}</div></a>
                <button type="button" class="menu__item logout-button"><span>Выйти</span></button>
            </div>`;
    }

    renderGuestMenu() {
        return `
            <div class="menu">
                <a class="menu__item" href="#favorites"><img src="static/favorites.svg" alt="Избранное" /><span>Избранное</span><div class="menu__counter">${this.appState.favorites.length}</div></a>
                <a class="menu__item" href="#login"><span>Войти</span></a>
            </div>`;
    }
}
