import './category-filter.css';

/**
 * Компонент для отображения и управления фильтром категорий.
 * Является "глупым" компонентом, который только рендерит переданные данные.
 */
export class CategoryFilter {
  /**
   * @param {HTMLElement} element - DOM-элемент, в который будет встроен компонент.
   * @param {string[]} categories - Массив с названиями категорий.
   * @param {function(string|null): void} onFilterChange - Callback-функция, вызываемая при смене категории.
   */
  constructor(element, categories, onFilterChange) {
    if (!element) {
      throw new Error('Не указан элемент для рендеринга фильтра.');
    }
    this.element = element;
    this.categories = categories;
    this.onFilterChange = onFilterChange;
  }

  /**
   * Рендерит кнопки фильтра.
   * @param {string|null} activeCategory - Текущая активная категория.
   */
  render(activeCategory) {
    this.element.innerHTML = ''; // Очищаем контейнер

    // Создаем и добавляем кнопку "Все"
    const allButton = this.createButton('Все', null, activeCategory);
    this.element.appendChild(allButton);

    // Создаем кнопки для каждой категории
    this.categories.forEach(category => {
      const categoryButton = this.createButton(category, category, activeCategory);
      this.element.appendChild(categoryButton);
    });
  }

  createButton(text, categoryValue, activeCategory) {
    const button = document.createElement('button');
    button.textContent = text;
    button.className = 'filter-button';
    if (categoryValue === activeCategory) {
      button.classList.add('active');
    }

    button.addEventListener('click', () => this.onFilterChange(categoryValue));
    return button;
  }
}