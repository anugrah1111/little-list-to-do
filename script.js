    (() => {
      const TASKS_KEY = 'little-list.tasks.v1';
      const IDEAS_KEY = 'little-list.ideas.v1';
      const list = document.querySelector('#task-list');
      const form = document.querySelector('#add-form');
      const input = document.querySelector('#task-input');
      const filters = [...document.querySelectorAll('.filter')];
      let currentFilter = 'all';
      let tasks = loadTasks();

      document.querySelector('#today-label').textContent = new Intl.DateTimeFormat(undefined, {
        weekday: 'long', month: 'long', day: 'numeric'
      }).format(new Date());
      const ideasInput = document.querySelector('#ideas-input');
      try { ideasInput.value = localStorage.getItem(IDEAS_KEY) || ''; } catch (_) { /* storage may be disabled */ }
      ideasInput.addEventListener('input', () => {
        try {
          localStorage.setItem(IDEAS_KEY, ideasInput.value);
          document.querySelector('#ideas-status').textContent = 'Saved just now';
        } catch (_) {
          document.querySelector('#ideas-status').textContent = 'Could not save in this browser';
        }
      });

      form.addEventListener('submit', (event) => {
        event.preventDefault();
        const text = input.value.trim();
        if (!text) { input.focus(); return; }
        tasks.unshift({ id: makeId(), text, done: false });
        saveAndRender();
        input.value = '';
        input.focus();
      });

      filters.forEach((button) => button.addEventListener('click', () => {
        currentFilter = button.dataset.filter;
        filters.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
        render();
      }));

      document.querySelector('#clear-completed').addEventListener('click', () => {
        tasks = tasks.filter((task) => !task.done);
        saveAndRender();
      });

      function loadTasks() {
        try {
          const stored = JSON.parse(localStorage.getItem(TASKS_KEY) || 'null');
          if (Array.isArray(stored)) return stored.filter((task) => task && typeof task.id === 'string' && typeof task.text === 'string').map((task) => ({ id: task.id, text: task.text, done: Boolean(task.done) }));
        } catch (_) { /* use starter tasks when storage is empty or invalid */ }
        return [
          { id: makeId(), text: 'Take a proper lunch break', done: false },
          { id: makeId(), text: 'Send the project update', done: false },
          { id: makeId(), text: 'Tidy up my workspace', done: true }
        ];
      }

      function makeId() {
        return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      }

      function saveAndRender() {
        try { localStorage.setItem(TASKS_KEY, JSON.stringify(tasks)); } catch (_) { /* app remains usable for this session */ }
        render();
      }

      function render() {
        const visibleTasks = tasks.filter((task) => currentFilter === 'all' || (currentFilter === 'active' ? !task.done : task.done));
        list.replaceChildren();
        if (visibleTasks.length === 0) {
          const empty = document.createElement('li');
          empty.className = 'empty-state';
          empty.innerHTML = '<div class="empty-icon" aria-hidden="true">☀</div><strong>Nothing on this list</strong><span>Add a task and make a little progress.</span>';
          list.append(empty);
        } else {
          visibleTasks.forEach((task) => {
            const row = document.createElement('li');
            row.className = `task-row${task.done ? ' done' : ''}`;
            const label = document.createElement('label');
            label.className = 'check-wrap';
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = task.done;
            checkbox.setAttribute('aria-label', `${task.done ? 'Mark incomplete' : 'Complete'}: ${task.text}`);
            checkbox.addEventListener('change', () => {
              tasks = tasks.map((item) => item.id === task.id ? { ...item, done: checkbox.checked } : item);
              saveAndRender();
            });
            label.append(checkbox);
            const text = document.createElement('span');
            text.className = 'task-text';
            text.textContent = task.text;
            row.append(label, text);
            if (task.done) {
              const tag = document.createElement('span');
              tag.className = 'task-tag';
              tag.textContent = 'Done';
              row.append(tag);
            }
            const remove = document.createElement('button');
            remove.className = 'delete-button';
            remove.type = 'button';
            remove.textContent = '×';
            remove.setAttribute('aria-label', `Delete: ${task.text}`);
            remove.addEventListener('click', () => {
              tasks = tasks.filter((item) => item.id !== task.id);
              saveAndRender();
            });
            row.append(remove);
            list.append(row);
          });
        }
        const completed = tasks.filter((task) => task.done).length;
        const remaining = tasks.length - completed;
        document.querySelector('#task-count').textContent = `${tasks.length} ${tasks.length === 1 ? 'task' : 'tasks'}`;
        document.querySelector('#progress-value').textContent = `${completed} / ${tasks.length}`;
        document.querySelector('#remaining-label').textContent = `${remaining} left to do`;
        document.querySelector('#clear-completed').disabled = completed === 0;
        document.querySelector('#clear-completed').style.opacity = completed === 0 ? '.45' : '1';
      }

      render();
    })();
