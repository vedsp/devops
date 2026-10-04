(() => {
  'use strict';

  // ---- DOM Elements ----
  // Sidebar elements
  const sidebar = document.getElementById('sidebar');
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const sidebarBackdrop = document.getElementById('sidebar-backdrop');
  const navItems = document.querySelectorAll('.sidebar-nav .nav-item[data-nav]');
  const navCountToday = document.getElementById('nav-count-today');
  const navCountActive = document.getElementById('nav-count-active');
  const navCountCompleted = document.getElementById('nav-count-completed');
  const navCountAll = document.getElementById('nav-count-all');
  const sidebarStatusDot = document.getElementById('sidebar-status-dot');
  const sidebarStatusText = document.getElementById('sidebar-status-text');

  // Top Nav Elements
  const searchInput = document.getElementById('search-input');
  const searchClearBtn = document.getElementById('search-clear');
  const navDateStr = document.getElementById('nav-date-str');
  const btnFocusAdd = document.getElementById('btn-focus-add');
  const systemStatusPill = document.getElementById('system-status-pill');
  const systemStatusLabel = document.getElementById('system-status-label');

  // Banner & Greeting
  const bannerDayDate = document.getElementById('banner-day-date');
  const greetingTitle = document.getElementById('greeting-title');

  // Filter Buttons
  const filterPills = document.querySelectorAll('.filter-pill[data-filter]');
  const filterBadgeAll = document.getElementById('filter-badge-all');
  const filterBadgeActive = document.getElementById('filter-badge-active');
  const filterBadgeCompleted = document.getElementById('filter-badge-completed');
  const clearCompletedBtn = document.getElementById('clear-completed-btn');

  // Metric Elements
  const metricRate = document.getElementById('metric-rate');
  const metricRateDesc = document.getElementById('metric-rate-desc');
  const radialProgressCircle = document.getElementById('radial-progress-circle');
  const metricActive = document.getElementById('metric-active');
  const metricActiveFill = document.getElementById('metric-active-fill');
  const metricActiveRatio = document.getElementById('metric-active-ratio');
  const breakdownTotal = document.getElementById('breakdown-total');
  const breakdownActive = document.getElementById('breakdown-active');
  const breakdownDone = document.getElementById('breakdown-done');
  const breakdownSummary = document.getElementById('breakdown-summary');

  // Task Creation Elements
  const addForm = document.getElementById('add-form');
  const newTitleInput = document.getElementById('new-title');
  const charCounter = document.getElementById('char-counter');
  const addBtn = document.getElementById('add-btn');
  const formError = document.getElementById('form-error');

  // Task Lists & Sections
  const sectionTaskCount = document.getElementById('section-task-count');
  const sectionSubInfo = document.getElementById('section-sub-info');
  const activeList = document.getElementById('active-list');
  const completedSection = document.getElementById('completed-section');
  const completedList = document.getElementById('completed-list');
  const completedPillCount = document.getElementById('completed-pill-count');
  const emptyState = document.getElementById('empty-state');
  const emptyTitle = document.getElementById('empty-title');
  const emptyDesc = document.getElementById('empty-desc');

  // Inspector Elements
  const taskInspector = document.getElementById('task-inspector');
  const inspectorContent = document.getElementById('inspector-content');
  const inspectorEmpty = document.getElementById('inspector-empty');
  const inspectorCloseBtn = document.getElementById('inspector-close-btn');
  const inspectorStatusBadge = document.getElementById('inspector-status-badge');
  const inspectorIdBadge = document.getElementById('inspector-id-badge');
  const inspectorTitle = document.getElementById('inspector-title');
  const inspectorCreatedAt = document.getElementById('inspector-created-at');
  const inspectorStatusText = document.getElementById('inspector-status-text');
  const inspectorEditInput = document.getElementById('inspector-edit-input');
  const inspectorSaveTitleBtn = document.getElementById('inspector-save-title-btn');
  const inspectorToggleBtn = document.getElementById('inspector-toggle-btn');
  const inspectorToggleIcon = document.getElementById('inspector-toggle-icon');
  const inspectorToggleText = document.getElementById('inspector-toggle-text');
  const inspectorDeleteBtn = document.getElementById('inspector-delete-btn');

  // Daily Progress Elements
  const dailyProgressPercent = document.getElementById('daily-progress-percent');
  const dailyProgressRatio = document.getElementById('daily-progress-ratio');
  const dailyProgressBar = document.getElementById('daily-progress-bar');

  // Confirmation Modal
  const confirmModal = document.getElementById('confirm-modal');
  const modalCancelBtn = document.getElementById('modal-cancel-btn');
  const modalConfirmBtn = document.getElementById('modal-confirm-btn');
  const modalDesc = document.getElementById('modal-desc');

  // Toast Container
  const toastContainer = document.getElementById('toast-container');

  // ---- State ----
  let todos = [];
  let filter = 'all'; // 'all' | 'active' | 'done'
  let searchQuery = '';
  let selectedTodoId = null;
  let isSubmitting = false;

  // ---- Dynamic Date & Greeting Initializer ----
  function initDateTimeAndGreeting() {
    const now = new Date();
    const hours = now.getHours();

    // Time-of-day greeting
    let greeting = 'Good morning';
    if (hours >= 12 && hours < 17) {
      greeting = 'Good afternoon';
    } else if (hours >= 17) {
      greeting = 'Good evening';
    }
    if (greetingTitle) greetingTitle.textContent = greeting;

    // Date strings
    const dayName = now.toLocaleDateString(undefined, { weekday: 'long' });
    const monthDay = now.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

    if (bannerDayDate) bannerDayDate.textContent = `${dayName}, ${monthDay}`;
    if (navDateStr) navDateStr.textContent = `Today, ${monthDay}`;
  }

  // ---- Toast Notification System ----
  function showToast(title, message, type = 'info') {
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'status');

    let iconName = 'info';
    if (type === 'success') iconName = 'check_circle';
    if (type === 'error') iconName = 'error';

    toast.innerHTML = `
      <span class="material-symbols-outlined toast-icon text-lg">${iconName}</span>
      <div class="toast-body">
        <h4 class="toast-title">${escapeHtml(title)}</h4>
        ${message ? `<p class="toast-msg">${escapeHtml(message)}</p>` : ''}
      </div>
      <button type="button" class="toast-close" aria-label="Close notification">&times;</button>
    `;

    const closeBtn = toast.querySelector('.toast-close');
    let timer;

    const removeToast = () => {
      clearTimeout(timer);
      toast.classList.add('toast-hiding');
      setTimeout(() => toast.remove(), 200);
    };

    closeBtn.addEventListener('click', removeToast);
    timer = setTimeout(removeToast, 3500);

    toastContainer.appendChild(toast);
  }

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ---- Formatting Helpers ----
  function formatTaskDate(isoString) {
    if (!isoString) return 'Recent';
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return 'Recent';

      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;

      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Recent';
    }
  }

  // ---- Server Connection & Health ----
  function setOnlineStatus(online) {
    if (online) {
      if (systemStatusPill) systemStatusPill.className = 'status-pill online';
      if (systemStatusLabel) systemStatusLabel.textContent = 'Online';
      if (sidebarStatusDot) sidebarStatusDot.style.backgroundColor = '#2e7d32';
      if (sidebarStatusText) sidebarStatusText.textContent = 'System Online';
    } else {
      if (systemStatusPill) systemStatusPill.className = 'status-pill offline';
      if (systemStatusLabel) systemStatusLabel.textContent = 'Offline';
      if (sidebarStatusDot) sidebarStatusDot.style.backgroundColor = 'var(--error)';
      if (sidebarStatusText) sidebarStatusText.textContent = 'Server Offline';
    }
  }

  async function checkHealth() {
    try {
      const res = await fetch('/health', { cache: 'no-store' });
      setOnlineStatus(res.ok);
    } catch {
      setOnlineStatus(false);
    }
  }

  // ---- API Client ----
  async function api(path, options = {}) {
    try {
      const res = await fetch(path, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
      });

      setOnlineStatus(true);

      if (res.status === 204) return null;

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `Request failed (${res.status})`);
      }
      return data;
    } catch (err) {
      if (err.name === 'TypeError' || err.message.includes('fetch')) {
        setOnlineStatus(false);
      }
      throw err;
    }
  }

  function showFormError(msg) {
    if (!formError) return;
    formError.textContent = msg || '';
    formError.hidden = !msg;
  }

  // ---- Dynamic Calculations & UI Metrics ----
  function updateDashboardMetrics() {
    const total = todos.length;
    const completed = todos.filter((t) => t.completed).length;
    const active = total - completed;
    const rate = total === 0 ? 0 : Math.round((completed / total) * 100);

    // 1. Metric 1: Rate & Radial Progress
    if (metricRate) metricRate.textContent = `${rate}%`;
    if (radialProgressCircle) {
      const circumference = 119.38; // 2 * PI * 19
      const offset = circumference - (rate / 100) * circumference;
      radialProgressCircle.style.strokeDashoffset = String(offset);
    }
    if (metricRateDesc) {
      if (total === 0) {
        metricRateDesc.textContent = 'No tasks registered yet.';
      } else if (active === 0) {
        metricRateDesc.textContent = 'All tasks completed! Fantastic job.';
      } else {
        metricRateDesc.textContent = `${active} ${active === 1 ? 'task' : 'tasks'} left for today. Keep the calm momentum.`;
      }
    }

    // 2. Metric 2: Active Tasks & fill bar
    if (metricActive) metricActive.textContent = String(active);
    const activeRatioPercent = total === 0 ? 0 : Math.round((active / total) * 100);
    if (metricActiveFill) metricActiveFill.style.width = `${activeRatioPercent}%`;
    if (metricActiveRatio) metricActiveRatio.textContent = `${active} active`;

    // 3. Metric 3: Priority & Status Breakdown
    if (breakdownTotal) breakdownTotal.textContent = String(total);
    if (breakdownActive) breakdownActive.textContent = String(active);
    if (breakdownDone) breakdownDone.textContent = String(completed);
    if (breakdownSummary) breakdownSummary.textContent = `${total} Tasks (${active} active)`;

    // 4. Daily Progress Widget (Right Column)
    if (dailyProgressPercent) dailyProgressPercent.textContent = `${rate}%`;
    if (dailyProgressRatio) dailyProgressRatio.textContent = `${completed} of ${total} tasks completed`;
    if (dailyProgressBar) dailyProgressBar.style.width = `${rate}%`;

    // 5. Sidebar Counts
    if (navCountToday) navCountToday.textContent = String(active);
    if (navCountActive) navCountActive.textContent = String(active);
    if (navCountCompleted) navCountCompleted.textContent = String(completed);
    if (navCountAll) navCountAll.textContent = String(total);

    // 6. Filter Bar Badges
    if (filterBadgeAll) filterBadgeAll.textContent = String(total);
    if (filterBadgeActive) filterBadgeActive.textContent = String(active);
    if (filterBadgeCompleted) filterBadgeCompleted.textContent = String(completed);

    // 7. Clear Completed Button state
    if (clearCompletedBtn) clearCompletedBtn.disabled = completed === 0;

    return { total, active, completed, rate };
  }

  // ---- Task Inspector Update ----
  function updateInspector() {
    if (!taskInspector) return;

    const selectedTodo = todos.find((t) => t.id === selectedTodoId);

    if (!selectedTodo) {
      if (inspectorContent) inspectorContent.hidden = true;
      if (inspectorEmpty) inspectorEmpty.hidden = false;
      return;
    }

    if (inspectorContent) inspectorContent.hidden = false;
    if (inspectorEmpty) inspectorEmpty.hidden = true;

    if (inspectorTitle) inspectorTitle.textContent = selectedTodo.title;
    if (inspectorIdBadge) inspectorIdBadge.textContent = `#${selectedTodo.id}`;

    if (selectedTodo.completed) {
      if (inspectorStatusBadge) {
        inspectorStatusBadge.textContent = 'Completed';
        inspectorStatusBadge.style.backgroundColor = 'var(--secondary)';
      }
      if (inspectorStatusText) inspectorStatusText.textContent = 'Completed';
      if (inspectorToggleIcon) inspectorToggleIcon.textContent = 'undo';
      if (inspectorToggleText) inspectorToggleText.textContent = 'Mark Incomplete';
    } else {
      if (inspectorStatusBadge) {
        inspectorStatusBadge.textContent = 'Active Task';
        inspectorStatusBadge.style.backgroundColor = 'var(--primary)';
      }
      if (inspectorStatusText) inspectorStatusText.textContent = 'In Progress';
      if (inspectorToggleIcon) inspectorToggleIcon.textContent = 'check_circle';
      if (inspectorToggleText) inspectorToggleText.textContent = 'Mark Completed';
    }

    if (inspectorCreatedAt) {
      inspectorCreatedAt.textContent = formatTaskDate(selectedTodo.createdAt);
    }

    if (inspectorEditInput) {
      inspectorEditInput.value = selectedTodo.title;
    }
  }

  // ---- Main Render Function ----
  function render() {
    updateDashboardMetrics();

    // Ensure selected todo is still valid, or fallback
    if (selectedTodoId && !todos.some((t) => t.id === selectedTodoId)) {
      selectedTodoId = todos.length > 0 ? todos[0].id : null;
    } else if (!selectedTodoId && todos.length > 0) {
      selectedTodoId = todos[0].id;
    }

    updateInspector();

    // Filter list
    let visible = todos.filter((t) => {
      if (filter === 'active') return !t.completed;
      if (filter === 'done') return t.completed;
      return true;
    });

    const query = searchQuery.trim().toLowerCase();
    if (query) {
      visible = visible.filter((t) => t.title.toLowerCase().includes(query));
    }

    // Split into active and completed for clean FocusDo two-tier list
    const activeTasks = visible.filter((t) => !t.completed);
    const completedTasks = visible.filter((t) => t.completed);

    if (sectionTaskCount) sectionTaskCount.textContent = String(activeTasks.length);
    if (completedPillCount) completedPillCount.textContent = String(completedTasks.length);

    // Update section sub info
    if (sectionSubInfo) {
      if (query) {
        sectionSubInfo.textContent = `Matching "${searchQuery}"`;
      } else {
        sectionSubInfo.textContent = `${activeTasks.length} active scheduled`;
      }
    }

    // Empty state logic
    if (visible.length === 0) {
      if (activeList) activeList.replaceChildren();
      if (completedList) completedList.replaceChildren();
      if (completedSection) completedSection.hidden = true;

      if (emptyState) {
        emptyState.hidden = false;
        if (todos.length === 0) {
          emptyTitle.textContent = "You're all caught up!";
          emptyDesc.textContent = 'No tasks in your list yet. Add a new task above to get started.';
        } else if (query) {
          emptyTitle.textContent = 'No matching tasks';
          emptyDesc.textContent = `No tasks matched "${searchQuery}". Try another search term.`;
        } else if (filter === 'active') {
          emptyTitle.textContent = 'No active tasks';
          emptyDesc.textContent = 'All tasks are completed. You can relax or add a new goal.';
        } else if (filter === 'done') {
          emptyTitle.textContent = 'No completed tasks';
          emptyDesc.textContent = 'Completed tasks will show up here as you check them off.';
        }
      }
      return;
    }

    if (emptyState) emptyState.hidden = true;

    // Render Active Task Cards
    if (activeList) {
      activeList.replaceChildren(
        ...activeTasks.map((todo) => {
          const li = document.createElement('li');
          const isSelected = todo.id === selectedTodoId;
          li.className = `task-card ${isSelected ? 'selected' : ''}`;
          li.setAttribute('data-id', String(todo.id));

          // Checkbox Button
          const checkBtn = document.createElement('button');
          checkBtn.type = 'button';
          checkBtn.className = 'task-checkbox-btn';
          checkBtn.setAttribute('aria-label', `Mark "${todo.title}" as completed`);
          checkBtn.innerHTML = '<span class="material-symbols-outlined text-sm">check</span>';
          checkBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleTaskCompleted(todo.id, true);
          });

          // Info Container (Title + Meta)
          const infoDiv = document.createElement('div');
          infoDiv.className = 'task-card-info';

          const titleSpan = document.createElement('span');
          titleSpan.className = 'task-card-title';
          titleSpan.textContent = todo.title;

          const metaDiv = document.createElement('div');
          metaDiv.className = 'task-card-meta';

          const statusPill = document.createElement('span');
          statusPill.className = 'meta-pill pill-active-tag';
          statusPill.innerHTML = '<span class="dot-active"></span> Active';

          const timeSpan = document.createElement('span');
          timeSpan.className = 'meta-time';
          timeSpan.innerHTML = `
            <span class="material-symbols-outlined text-xs">schedule</span>
            <span>${formatTaskDate(todo.createdAt)}</span>
          `;

          metaDiv.append(statusPill, timeSpan);
          infoDiv.append(titleSpan, metaDiv);

          // Left block
          const leftBlock = document.createElement('div');
          leftBlock.className = 'task-card-left';
          leftBlock.append(checkBtn, infoDiv);

          // Actions
          const actionsDiv = document.createElement('div');
          actionsDiv.className = 'task-card-actions';

          const deleteBtn = document.createElement('button');
          deleteBtn.type = 'button';
          deleteBtn.className = 'btn-card-action delete';
          deleteBtn.title = 'Delete task';
          deleteBtn.setAttribute('aria-label', `Delete "${todo.title}"`);
          deleteBtn.innerHTML = '<span class="material-symbols-outlined text-base">delete</span>';
          deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            removeTodo(todo.id, todo.title);
          });

          actionsDiv.appendChild(deleteBtn);

          li.append(leftBlock, actionsDiv);

          // Card selection for Inspector
          li.addEventListener('click', () => {
            selectedTodoId = todo.id;
            render();
          });

          return li;
        })
      );
    }

    // Render Completed Section
    if (completedSection) {
      if (completedTasks.length > 0) {
        completedSection.hidden = false;
        if (completedList) {
          completedList.replaceChildren(
            ...completedTasks.map((todo) => {
              const div = document.createElement('div');
              div.className = 'completed-item';
              div.setAttribute('data-id', String(todo.id));

              const left = document.createElement('div');
              left.className = 'completed-item-left';

              const iconBadge = document.createElement('div');
              iconBadge.className = 'completed-badge-icon';
              iconBadge.title = 'Click to mark as active';
              iconBadge.innerHTML = '<span class="material-symbols-outlined text-sm">check</span>';
              iconBadge.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleTaskCompleted(todo.id, false);
              });

              const titleSpan = document.createElement('span');
              titleSpan.className = 'completed-item-title';
              titleSpan.textContent = todo.title;

              left.append(iconBadge, titleSpan);

              const timeSpan = document.createElement('span');
              timeSpan.className = 'completed-item-time';
              timeSpan.textContent = formatTaskDate(todo.createdAt);

              const deleteBtn = document.createElement('button');
              deleteBtn.type = 'button';
              deleteBtn.className = 'btn-card-action delete';
              deleteBtn.title = 'Delete task';
              deleteBtn.innerHTML = '<span class="material-symbols-outlined text-sm">delete</span>';
              deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                removeTodo(todo.id, todo.title);
              });

              div.append(left, timeSpan, deleteBtn);

              div.addEventListener('click', () => {
                selectedTodoId = todo.id;
                render();
              });

              return div;
            })
          );
        }
      } else {
        completedSection.hidden = true;
      }
    }
  }

  // ---- CRUD Operations ----
  async function loadTodos() {
    try {
      todos = await api('/api/todos');
      showFormError('');
    } catch (err) {
      showFormError('Could not load tasks: ' + err.message);
      showToast('Error', 'Failed to load tasks from server', 'error');
    }
    render();
  }

  async function toggleTaskCompleted(id, completed) {
    try {
      const updated = await api(`/api/todos/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ completed }),
      });
      todos = todos.map((t) => (t.id === id ? updated : t));
      showToast(
        completed ? 'Task Completed' : 'Task Active',
        `"${updated.title}" marked as ${completed ? 'completed' : 'active'}.`,
        'success'
      );
    } catch (err) {
      showToast('Update Failed', err.message, 'error');
    }
    render();
  }

  async function renameTodo(id, newTitle) {
    if (!newTitle.trim()) {
      showToast('Validation Error', 'Task title cannot be empty', 'error');
      return;
    }
    try {
      const updated = await api(`/api/todos/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ title: newTitle.trim() }),
      });
      todos = todos.map((t) => (t.id === id ? updated : t));
      showToast('Task Renamed', `Updated to "${updated.title}"`, 'success');
    } catch (err) {
      showToast('Rename Failed', err.message, 'error');
    }
    render();
  }

  async function removeTodo(id, title) {
    try {
      await api(`/api/todos/${id}`, { method: 'DELETE' });
      todos = todos.filter((t) => t.id !== id);
      if (selectedTodoId === id) {
        selectedTodoId = todos.length > 0 ? todos[0].id : null;
      }
      showToast('Task Removed', `"${title || 'Task'}" has been deleted.`, 'info');
    } catch (err) {
      showToast('Delete Failed', err.message, 'error');
    }
    render();
  }

  async function clearCompletedTasks() {
    try {
      const res = await api('/api/todos/completed', { method: 'DELETE' });
      const removedCount = res && res.removed !== undefined ? res.removed : 0;
      todos = todos.filter((t) => !t.completed);
      showToast('Cleared', `Removed ${removedCount} completed ${removedCount === 1 ? 'task' : 'tasks'}.`, 'info');
    } catch (err) {
      showToast('Error', err.message, 'error');
    }
    render();
  }

  // ---- Form Submission (Add Task) ----
  if (addForm) {
    addForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const rawVal = newTitleInput.value.trim();

      if (!rawVal) {
        showFormError('Please enter a task title');
        newTitleInput.focus();
        return;
      }

      if (rawVal.length > 200) {
        showFormError('Task title must be 200 characters or fewer');
        return;
      }

      isSubmitting = true;
      if (addBtn) addBtn.disabled = true;

      try {
        const created = await api('/api/todos', {
          method: 'POST',
          body: JSON.stringify({ title: rawVal }),
        });
        todos.push(created);
        selectedTodoId = created.id;
        newTitleInput.value = '';
        if (charCounter) charCounter.textContent = '0/200';
        showFormError('');
        showToast('Task Created', `"${created.title}" added to your list.`, 'success');
      } catch (err) {
        showFormError(err.message);
        showToast('Failed to Add', err.message, 'error');
      } finally {
        isSubmitting = false;
        if (addBtn) addBtn.disabled = false;
        render();
        newTitleInput.focus();
      }
    });

    // Character counter
    newTitleInput.addEventListener('input', () => {
      const len = newTitleInput.value.length;
      if (charCounter) {
        charCounter.textContent = `${len}/200`;
        charCounter.style.color = len >= 190 ? 'var(--error)' : 'var(--outline)';
      }
      if (formError && !formError.hidden) showFormError('');
    });
  }

  // ---- Inspector Event Listeners ----
  if (inspectorCloseBtn) {
    inspectorCloseBtn.addEventListener('click', () => {
      selectedTodoId = null;
      render();
    });
  }

  if (inspectorSaveTitleBtn && inspectorEditInput) {
    inspectorSaveTitleBtn.addEventListener('click', () => {
      if (selectedTodoId) {
        renameTodo(selectedTodoId, inspectorEditInput.value);
      }
    });

    inspectorEditInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedTodoId) renameTodo(selectedTodoId, inspectorEditInput.value);
      }
    });
  }

  if (inspectorToggleBtn) {
    inspectorToggleBtn.addEventListener('click', () => {
      const selectedTodo = todos.find((t) => t.id === selectedTodoId);
      if (selectedTodo) {
        toggleTaskCompleted(selectedTodo.id, !selectedTodo.completed);
      }
    });
  }

  if (inspectorDeleteBtn) {
    inspectorDeleteBtn.addEventListener('click', () => {
      const selectedTodo = todos.find((t) => t.id === selectedTodoId);
      if (selectedTodo) {
        removeTodo(selectedTodo.id, selectedTodo.title);
      }
    });
  }

  // ---- Search Handling ----
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      searchQuery = searchInput.value;
      if (searchClearBtn) searchClearBtn.hidden = !searchQuery;
      render();
    });

    if (searchClearBtn) {
      searchClearBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        searchClearBtn.hidden = true;
        render();
        searchInput.focus();
      });
    }

    // Keyboard shortcut: '/' to focus search
    window.addEventListener('keydown', (e) => {
      if (e.key === '/' && document.activeElement !== newTitleInput && document.activeElement !== searchInput) {
        e.preventDefault();
        searchInput.focus();
      } else if (
        (e.key === 'n' || e.key === 'N') &&
        document.activeElement !== newTitleInput &&
        document.activeElement !== searchInput &&
        document.activeElement.tagName !== 'INPUT'
      ) {
        e.preventDefault();
        newTitleInput.focus();
      }
    });
  }

  // + New Task Button in Header
  if (btnFocusAdd) {
    btnFocusAdd.addEventListener('click', () => {
      newTitleInput.focus();
      newTitleInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  // ---- Filter Pills (All / Active / Completed) ----
  filterPills.forEach((pill) => {
    pill.addEventListener('click', () => {
      filter = pill.dataset.filter;
      filterPills.forEach((p) => {
        const isActive = p === pill;
        p.classList.toggle('active', isActive);
        p.setAttribute('aria-selected', String(isActive));
      });
      // Sync sidebar navigation highlight
      navItems.forEach((item) => {
        const isNavMatch = item.dataset.nav === filter;
        item.classList.toggle('active', isNavMatch);
      });
      render();
    });
  });

  // ---- Sidebar Navigation Links ----
  navItems.forEach((navBtn) => {
    navBtn.addEventListener('click', () => {
      const targetNav = navBtn.dataset.nav;
      if (targetNav === 'today' || targetNav === 'active') {
        filter = 'active';
      } else if (targetNav === 'completed') {
        filter = 'done';
      } else {
        filter = 'all';
      }

      navItems.forEach((b) => b.classList.toggle('active', b === navBtn));

      // Sync filter pills
      filterPills.forEach((p) => {
        const isMatch = p.dataset.filter === filter;
        p.classList.toggle('active', isMatch);
        p.setAttribute('aria-selected', String(isMatch));
      });

      // Close mobile drawer if open
      closeMobileSidebar();

      render();
    });
  });

  // ---- Mobile Drawer Toggle ----
  function openMobileSidebar() {
    if (sidebar) sidebar.classList.add('open');
    if (sidebarBackdrop) sidebarBackdrop.hidden = false;
  }

  function closeMobileSidebar() {
    if (sidebar) sidebar.classList.remove('open');
    if (sidebarBackdrop) sidebarBackdrop.hidden = true;
  }

  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', openMobileSidebar);
  }

  if (sidebarBackdrop) {
    sidebarBackdrop.addEventListener('click', closeMobileSidebar);
  }

  // ---- Clear Completed Modal ----
  if (clearCompletedBtn) {
    clearCompletedBtn.addEventListener('click', () => {
      const completedCount = todos.filter((t) => t.completed).length;
      if (completedCount === 0) return;

      if (modalDesc) {
        modalDesc.textContent = `Are you sure you want to permanently delete ${completedCount} completed ${
          completedCount === 1 ? 'task' : 'tasks'
        }?`;
      }
      if (confirmModal) confirmModal.hidden = false;
    });
  }

  if (modalCancelBtn) {
    modalCancelBtn.addEventListener('click', () => {
      if (confirmModal) confirmModal.hidden = true;
    });
  }

  if (modalConfirmBtn) {
    modalConfirmBtn.addEventListener('click', async () => {
      if (confirmModal) confirmModal.hidden = true;
      await clearCompletedTasks();
    });
  }

  if (confirmModal) {
    confirmModal.addEventListener('click', (e) => {
      if (e.target === confirmModal) {
        confirmModal.hidden = true;
      }
    });
  }

  // Periodic health check every 30 seconds
  setInterval(checkHealth, 30000);

  // ---- Initial Load ----
  initDateTimeAndGreeting();
  checkHealth();
  loadTodos();
})();
