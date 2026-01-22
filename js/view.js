const escapeHtml = (value) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const getDueDateInfo = (task) => {
  if (task.dueDate) {
    const timeValue = task.dueTime || "23:59";
    const dueDate = new Date(`${task.dueDate}T${timeValue}`);
    if (!Number.isNaN(dueDate.getTime())) {
      return {
        date: dueDate,
        hasTime: Boolean(task.dueTime)
      };
    }
  }
  if (task.dueAt) {
    const dueDate = new Date(task.dueAt);
    if (!Number.isNaN(dueDate.getTime())) {
      return {
        date: dueDate,
        hasTime: Boolean(task.dueHasTime)
      };
    }
  }
  return null;
};

const formatDue = (task) => {
  const dueInfo = getDueDateInfo(task);
  if (!dueInfo) return "No due date";
  if (dueInfo.hasTime) {
    return `Due ${dueInfo.date.toLocaleString([], {
      dateStyle: "medium",
      timeStyle: "short"
    })}`;
  }
  return `Due ${dueInfo.date.toLocaleDateString([], { dateStyle: "medium" })}`;
};

const isOverdue = (task, now) => {
  const dueInfo = getDueDateInfo(task);
  if (!dueInfo || task.done) return false;
  return dueInfo.date.getTime() < now.getTime();
};

const renderTaskItem = (listId, task, now) => {
  const dueInfo = getDueDateInfo(task);
  const dueMs = dueInfo ? dueInfo.date.getTime() : "";
  return `
  <li class="task-item ${isOverdue(task, now) ? "overdue" : ""}" data-due-ms="${dueMs}">
    <label class="task-label">
      <input
        class="task-toggle"
        type="checkbox"
        data-action="toggle"
        data-list-id="${listId}"
        data-task-id="${task.id}"
        ${task.done ? "checked" : ""}
      />
      <span class="task-content">
        <span class="task-text ${task.done ? "done" : ""}">
          ${escapeHtml(task.text)}
        </span>
        <span class="task-meta">${formatDue(task)}</span>
      </span>
    </label>
    <button
      class="icon-button"
      type="button"
      data-action="remove-task"
      data-list-id="${listId}"
      data-task-id="${task.id}"
      aria-label="Remove task"
    >
      ✕
    </button>
  </li>
`;
};

const renderList = (list, now) => {
  const tasks = list.tasks.length
    ? list.tasks.map((task) => renderTaskItem(list.id, task, now)).join("")
    : "<li class=\"task-empty\">No tasks yet.</li>";

  return `
    <article class="list-card">
      <header class="list-header">
        <div>
          <p class="list-kicker">Section</p>
          <h2 class="list-title">${escapeHtml(list.name)}</h2>
        </div>
        <button
          class="ghost-button"
          type="button"
          data-action="remove-list"
          data-list-id="${list.id}"
        >
          Remove
        </button>
      </header>
      <form class="task-form" data-action="add-task" data-list-id="${list.id}">
        <input
          type="text"
          name="task"
          class="task-input"
          placeholder="Add a task"
          autocomplete="off"
          required
        />
        <input
          type="date"
          name="dueDate"
          class="task-date"
          aria-label="Due date"
        />
        <input
          type="time"
          name="dueTime"
          class="task-time"
          aria-label="Due time"
        />
        <button class="pill-button" type="submit">Add</button>
      </form>
      <ul class="task-list">${tasks}</ul>
    </article>
  `;
};

const renderSectionTabs = (lists, activeListId) => {
  const allActive = !activeListId ? "active" : "";
  const allPressed = activeListId ? "false" : "true";
  const listTabs = lists
    .map((list) => {
      const isActive = list.id === activeListId ? "active" : "";
      const pressed = list.id === activeListId ? "true" : "false";
      return `
        <button
          class="tab-button ${isActive}"
          type="button"
          data-action="filter"
          data-list-id="${list.id}"
          aria-pressed="${pressed}"
        >
          ${escapeHtml(list.name)}
        </button>
      `;
    })
    .join("");

  return `
    <div class="section-tabs" role="tablist" aria-label="Sections">
      <button
        class="tab-button ${allActive}"
        type="button"
        data-action="filter"
        data-list-id=""
        aria-pressed="${allPressed}"
      >
        Overview
      </button>
      ${listTabs}
    </div>
  `;
};

export const renderTodoApp = (model, activeListId = null) => {
  const container = document.createElement("div");
  container.className = "page";

  const now = new Date();
  const listsToRender = activeListId
    ? model.lists.filter((list) => list.id === activeListId)
    : model.lists;
  const listsMarkup = listsToRender.map((list) => renderList(list, now)).join("");
  const tabsMarkup = renderSectionTabs(model.lists, activeListId);

  container.innerHTML = `
    <header class="hero">
      <div>
        <p class="eyebrow">Focus planner</p>
        <h1>Focus planner</h1>
        <p class="hero-copy">
          Organize work, school, and personal tasks with simple sections and a calm layout.
        </p>
      </div>
      <div class="hero-card">
        <p class="hero-label">Today</p>
        <h2 class="hero-title">Plan the day</h2>
        <p class="hero-subtitle">Add tasks, check them off, and keep your day on track.</p>
        <p class="hero-time">
          <span>Now</span>
          <span id="today-time" class="hero-time-value"></span>
        </p>
      </div>
    </header>

    <section class="list-section">
      <div class="section-header">
        <div>
          <h2>Sections</h2>
          <p>Create a new section to group your tasks.</p>
        </div>
        <form class="list-form" data-action="add-list">
          <input
            type="text"
            name="list"
            class="list-input"
            placeholder="New section"
            autocomplete="off"
            required
          />
          <button class="pill-button" type="submit">Create</button>
        </form>
      </div>
      ${tabsMarkup}
      <div class="list-grid">
        ${listsMarkup}
      </div>
    </section>

    <footer class="footer">
      <span>Saved locally on this device</span>
      <span>Simple, focused planning</span>
    </footer>
  `;

  return container;
};
