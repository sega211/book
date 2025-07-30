export  class AbstractView {
    constructor() {
        this.app = document.getElementById('root');
    }

    setTitle(title) {
        document.title = title;
    }

    render () {
        throw new Error('Method render() must be implemented in the child class');
    }

    destroy()  {
            
}
}