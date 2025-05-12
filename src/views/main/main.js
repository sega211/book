import {AbstractView} from "../../common/view.js";
import onChange from "on-change";
import {Header} from "../../components/header/header.js";
import {Search} from "../../components/search/search.js";
import {CardList} from "../../components/card-list/card-list.js";

export  class MainView extends AbstractView {
    state = {
        list:[],
        numFound: 0,
        loading: false,
        searchQuery: undefined,
        offset: 0,
        limit: 6
    }
    constructor(appState) {
        super();
        this.appState = appState;
        this.appState = onChange(this.appState, this.appStateHook.bind(this));
        this.state = onChange(this.state, this.stateHook.bind(this));
        this.setTitle('Поиск книг')
        this.loadDefaultBooks();
    }
    async loadDefaultBooks() {
        this.state.loading = true;
        const data = await this.loadList(
            'subject:fiction', // Убираем сортировку из запроса
            this.state.offset,
            this.state.limit // Добавляем лимит
        );
        this.state.numFound = data.numFound;
        this.state.list = data.docs; // Убираем .slice()
        this.state.loading = false;
    }


    destroy() {
        onChange.unsubscribe(this.appState)
        onChange.unsubscribe(this.state)
    }

    appStateHook(path) {

        if (path === 'favorites') {
            this.render()
        }
    }
    async stateHook(path) {
        if (path === 'searchQuery' || path === 'offset') {
            this.state.loading = true;
            const query = this.state.searchQuery || 'subject:fiction';
            const data = await this.loadList(
                query,
                this.state.offset,
                this.state.limit // Добавляем лимит
            );
            this.state.numFound = data.numFound;
            this.state.list = data.docs; // Убираем обрезку
            this.state.loading = false;
        }

        if(path === 'list' || path ==='loading') {
            this.render()
        }
    }

    async loadList(q, offset, limit) {
        const res = await fetch(
            `https://openlibrary.org/search.json?q=${q}&offset=${offset}&limit=${limit}`
        );
        return res.json();
    }


    render() {
        const main = document.createElement('div')
        main.innerHTML = `
            <h1>Найдено книг - ${this.state.numFound}</h1>`
        // Добавляем пагинацию
        const pagination = document.createElement('div');
        pagination.classList.add('pagination');

        const prevButton = document.createElement('button');
        prevButton.innerHTML = '&lt; Назад';
        prevButton.disabled = this.state.offset === 0;
        prevButton.addEventListener('click', () => {
            this.state.offset = Math.max(0, this.state.offset - this.state.limit);
        });

        const nextButton = document.createElement('button');
        nextButton.innerHTML = 'Вперед &gt;';
        nextButton.disabled = this.state.offset + this.state.limit >= this.state.numFound;
        nextButton.addEventListener('click', () => {
            this.state.offset += this.state.limit;
        });

        pagination.append(prevButton, nextButton);
        main.append(pagination);

        main.append(new Search(this.state).render())
        main.append(new CardList(this.appState, this.state).render())
        this.app.innerHTML = ""
        this.app.append(main)
        this.renderHeader()

    }

    renderHeader() {
        const header = new Header(this.appState).render();
        this.app.prepend(header)
    }
}