import { AbstractView } from "../../common/view.js";
import { Header } from "../../components/header/header.js";
import { API_BASE_URL } from '../../config.js';
import './profile.css';



export class ProfileView extends AbstractView {
    constructor(appState) {
        super();
        this.appState = appState;
        this.setTitle('Профиль пользователя');
    }

    destroy() {}

    async changePassword(username, currentPassword, newPassword) {
        const res = await fetch(`${API_BASE_URL}/api/change_password.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.appState.token}`
            },
            body: JSON.stringify({
                username,
                current_password: currentPassword,
                new_password: newPassword
            })
        });
        return res.json();
    }

    render() {
        if (!this.appState.user) {
            window.location.hash = '#login';
            return;
        }

        const main = document.createElement('div');
        main.classList.add('profile-container');
        main.innerHTML = `
            <h1>Профиль: ${this.appState.user.username}</h1>
            <h2>Смена пароля</h2>
        `;

        const form = document.createElement('form');
        form.classList.add('profile-form');
        form.innerHTML = `
            <div class="form-group">
                <label for="current_password">Текущий пароль</label>
                <input type="password" id="current_password" name="current_password" required />
            </div>
            <div class="form-group">
                <label for="new_password">Новый пароль</label>
                <input type="password" id="new_password" name="new_password" required minlength="8" />
            </div>
            <div class="form-group">
                <label for="confirm_password">Подтвердите новый пароль</label>
                <input type="password" id="confirm_password" name="confirm_password" required minlength="8" />
            </div>
            <button type="submit">Сменить пароль</button>
            <div class="form-message"></div>
        `;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const messageEl = form.querySelector('.form-message');
            messageEl.textContent = '';
            messageEl.className = 'form-message';

            const currentPassword = e.target.current_password.value;
            const newPassword = e.target.new_password.value;
            const confirmPassword = e.target.confirm_password.value;

            if (newPassword !== confirmPassword) {
                messageEl.textContent = 'Новые пароли не совпадают.';
                messageEl.classList.add('error');
                return;
            }

            const result = await this.changePassword(this.appState.user.username, currentPassword, newPassword);

            if (result.success) {
                messageEl.textContent = 'Пароль успешно изменен!';
                messageEl.classList.add('success');
                form.reset();
            } else {
                messageEl.textContent = `Ошибка: ${result.error || 'Не удалось сменить пароль.'}`;
                messageEl.classList.add('error');
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