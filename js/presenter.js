import { todoModel } from "./model.js";
import { renderTodoApp } from "./view.js";

const mount = document.getElementById("app");
let activeListId = null;
let isRendering = false;

const formatNow = () =>
  new Date().toLocaleString([], { dateStyle: "full", timeStyle: "short" });

const refreshTimeAndOverdue = () => {
  const timeEl = document.getElementById("today-time");
  if (timeEl) {
    timeEl.textContent = formatNow();
  }

  const now = Date.now();
  document.querySelectorAll(".task-item[data-due-ms]").forEach((item) => {
    const dueMs = Number(item.dataset.dueMs);
    if (!dueMs) {
      item.classList.remove("overdue");
      return;
    }
    const isDone = Boolean(item.querySelector(".task-text.done"));
    item.classList.toggle("overdue", !isDone && dueMs < now);
  });
};

const render = async () => {
  if (!mount || isRendering) return;
  isRendering = true;
  try {
    const data = await todoModel.getData();
    if (activeListId && !data.lists.some((list) => list.id === activeListId)) {
      activeListId = null;
    }
    mount.innerHTML = "";
    mount.appendChild(renderTodoApp(data, activeListId));
    refreshTimeAndOverdue();
  } catch (error) {
    mount.innerHTML = "<p>Could not load tasks. Please refresh.</p>";
  } finally {
    isRendering = false;
  }
};

const buildDue = (form) => {
  const dateInput = form.querySelector("input[name=\"dueDate\"]");
  const timeInput = form.querySelector("input[name=\"dueTime\"]");
  const dateValue = dateInput ? dateInput.value : "";
  const timeValue = timeInput ? timeInput.value : "";
  if (!dateValue) return { dueDate: null, dueTime: null };
  return {
    dueDate: dateValue,
    dueTime: timeValue || null
  };
};

const handleSubmit = async (event) => {
  const form = event.target.closest("form");
  if (!form) return;

  const action = form.dataset.action;
  if (action === "add-list") {
    event.preventDefault();
    const input = form.querySelector("input[name=\"list\"]");
    await todoModel.addList(input.value);
    input.value = "";
    render();
    return;
  }

  if (action === "add-task") {
    event.preventDefault();
    const input = form.querySelector("input[name=\"task\"]");
    const listId = form.dataset.listId;
    const { dueDate, dueTime } = buildDue(form);
    await todoModel.addTask(listId, input.value, dueDate, dueTime);
    input.value = "";
    const dateInput = form.querySelector("input[name=\"dueDate\"]");
    const timeInput = form.querySelector("input[name=\"dueTime\"]");
    if (dateInput) dateInput.value = "";
    if (timeInput) timeInput.value = "";
    render();
  }
};

const handleClick = async (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  const action = button.dataset.action;
  const listId = button.dataset.listId;
  const taskId = button.dataset.taskId;

  if (action === "remove-list") {
    await todoModel.removeList(listId);
    render();
  }

  if (action === "remove-task") {
    await todoModel.removeTask(listId, taskId);
    render();
  }

  if (action === "filter") {
    activeListId = button.dataset.listId || null;
    render();
  }
};

const handleChange = async (event) => {
  const checkbox = event.target;
  if (!checkbox.matches(".task-toggle")) return;
  const listId = checkbox.dataset.listId;
  const taskId = checkbox.dataset.taskId;
  await todoModel.toggleTask(listId, taskId);
  render();
};

if (mount) {
  mount.addEventListener("submit", handleSubmit);
  mount.addEventListener("click", handleClick);
  mount.addEventListener("change", handleChange);
  render();
  setInterval(refreshTimeAndOverdue, 60000);
}
