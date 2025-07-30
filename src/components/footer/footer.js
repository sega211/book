import {DivComponent} from "../../common/div-component.js";
import './footer.css';

export class Footer extends DivComponent {
    constructor(appState) {
        super();
        this.appState = appState;
    }

    render() {
        this.el.classList.add('footer');
        this.el.innerHTML = `
            <div class="container">
                <div class="footer__content">
                    <p>&copy; 2025 Моя Библиотека. Все права защищены.</p>
                    <p><a href="https://www.mnogodeto4ka.ru">mnogodeto4ka.ru</a></p>   
                    <p>Разработано с ❤️ для любителей книг.</p>
                </div>
            </div>
        `;
        return this.el;
    }

}