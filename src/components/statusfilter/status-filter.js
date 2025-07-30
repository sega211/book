import './status-filter.css';

/**
 * Компонент для фильтрации книг по статусу чтения.
 */
export class StatusFilter {
  /**
   * @param {HTMLElement} element - DOM-элемент для рендеринга.
   * @param {function({status?: string|null, hideRead?: boolean}): void} onFilterChange - Callback при изменении фильтра.
   */
  constructor(element, onFilterChange) {
    this.element = element;
    this.onFilterChange = onFilterChange;

    this.statuses = [
      { value: null, text: 'Все' },
      { value: 'reading', text: 'Читаю' },
      { value: 'unread', text: 'Не прочитано' },
      { value: 'read', text: 'Прочитано' }
    ];
  }

  /**
   * @param {string|null} activeStatus - Текущий активный статус.
   * @param {boolean} hideRead - Состояние флага "Скрыть прочитанные".
   */
  render(activeStatus, hideRead) {
    this.element.innerHTML = '';
    const statusButtonsContainer = document.createElement('div');
    statusButtonsContainer.className = 'status-buttons';

    this.statuses.forEach(status => {
      const button = document.createElement('button');
      button.textContent = status.text;
      button.className = 'filter-button';
      if (status.value === activeStatus) {
        button.classList.add('active');
      }
      // Отключаем кнопку "Прочитано", если активен чекбокс "Скрыть прочитанные"
      if (status.value === 'read' && hideRead) {
        button.disabled = true;
      }
      button.addEventListener('click', () => this.onFilterChange({ status: status.value }));
      statusButtonsContainer.appendChild(button);
    });

    const toggleLabel = document.createElement('label');
    toggleLabel.className = 'toggle-label';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = 'hide-read-toggle';
    checkbox.checked = hideRead;
    // Отключаем чекбокс, если активен фильтр "Прочитано"
    if (activeStatus === 'read') {
        checkbox.disabled = true;
        toggleLabel.classList.add('disabled');
    }
    checkbox.addEventListener('change', e => this.onFilterChange({ hideRead: e.target.checked }));

    toggleLabel.append(checkbox, 'Скрыть прочитанные');
    this.element.appendChild(statusButtonsContainer);
    this.element.appendChild(toggleLabel);
  }
}