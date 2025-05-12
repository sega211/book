import {MainView} from "./views/main/main.js";
import {FavoritesView} from "./views/favorites/favorites.js";
import onChange from 'on-change';

class App {
    routes = [
        {
        path: "", view: MainView
        },
        {
            path: "#favorites", view: FavoritesView
        }
    ]

    appState = {
        favorites: []
    }
    constructor() {

        this.appState = {
            favorites: this.loadFavorites()
        };


        this.appState = onChange(this.appState, (path) => {
            if(path === 'favorites') {
                this.persistFavorites(this.appState.favorites);
            }
        });

        window.addEventListener("hashchange", this.route.bind(this));
        this.route();
    }


    loadFavorites() {
        try {
            const raw = localStorage.getItem('favorites');
            if(!raw) return [];

            const data = JSON.parse(raw);
            // Валидация структуры данных
            return Array.isArray(data)
                ? data.filter(item => item?.key && item?.title)
                : [];
        } catch(e) {
            console.error('Ошибка загрузки избранного:', e);
            return [];
        }
    }


    persistFavorites(favorites) {
        try {
            localStorage.setItem('favorites', JSON.stringify(favorites));
        } catch(e) {
            console.error('Ошибка сохранения:', e);
        }
    }

    route() {
        if (this.currentView) {
            this.currentView.destroy()
        }
        const view = this.routes.find(r => r.path == location.hash).view
        this.currentView = new view(this.appState);
        this.currentView.render()
    }
}

new App();