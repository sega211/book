import { AbstractView } from "../../common/view.js";
import onChange from "on-change";
import { Header } from "../../components/header/header.js";
import './login.css';
import { API_BASE_URL } from '../../config.js';


export class LoginView extends AbstractView {
    constructor(appState) {
        super();
        this.appState = appState;
        this.setTitle('Вход в аккаунт');
    }

    destroy() {}

    async login(username, password) {
        const res = await fetch(`${API_BASE_URL}/api/login.php`, {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        return res.json();
    }

    async fetchFavorites(token, userId) {
        const res = await fetch(`${API_BASE_URL}/api/favorites.php?user_id=${userId}`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await res.json();
        if (data.success) {
            this.appState.favorites = data.data;
        }
    }

    render() {
        const main = document.createElement('div');
        main.innerHTML = `<h1>Вход в аккаунт</h1>`;
        main.classList.add('login-container');

        const form = document.createElement('form');
        form.classList.add('login-form');
        form.innerHTML = `
            <div class="form-group">
                <label for="username">Имя пользователя</label>
                <input type="text" id="username" name="username" required />
            </div>
            <div class="form-group">
                <label for="password">Пароль</label>
                <input type="password" id="password" name="password" required />
            </div>
            <button type="submit">Войти</button>
        `;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = e.target.username.value;
            const password = e.target.password.value;
            const result = await this.login(username, password);
            if (result.success) {
                this.appState.user = result.user;
                this.appState.token = result.token;
                await this.fetchFavorites(result.token, result.user.id);
                window.location.hash = '';
            } else {
                alert('Неверный логин или пароль');
            }
        });

        main.append(form);
        this.app.innerHTML = '';
        this.app.append(main);
        this.renderHeader();
    }

    renderHeader() {
        const header = new Header(this.appState).render();
        this.app.prepend(header);
    }
}