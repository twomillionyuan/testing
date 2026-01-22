const handleResponse = async (response) => {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Request failed");
  }
  return response.json();
};

const api = {
  async fetchLists() {
    const response = await fetch("/api/lists");
    return handleResponse(response);
  },
  async createList(name) {
    const response = await fetch("/api/lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name })
    });
    return handleResponse(response);
  },
  async deleteList(listId) {
    const response = await fetch(`/api/lists/${listId}`, {
      method: "DELETE"
    });
    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || "Request failed");
    }
  },
  async createTask(listId, payload) {
    const response = await fetch(`/api/lists/${listId}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return handleResponse(response);
  },
  async toggleTask(listId, taskId) {
    const response = await fetch(`/api/lists/${listId}/tasks/${taskId}/toggle`, {
      method: "POST"
    });
    return handleResponse(response);
  },
  async deleteTask(listId, taskId) {
    const response = await fetch(`/api/lists/${listId}/tasks/${taskId}`, {
      method: "DELETE"
    });
    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || "Request failed");
    }
  }
};

export const todoModel = {
  async getData() {
    return api.fetchLists();
  },
  async addList(name) {
    const trimmed = name.trim();
    if (!trimmed) return;
    await api.createList(trimmed);
  },
  async removeList(listId) {
    await api.deleteList(listId);
  },
  async addTask(listId, text, dueDate, dueTime) {
    const trimmed = text.trim();
    if (!trimmed) return;
    await api.createTask(listId, {
      text: trimmed,
      dueDate: dueDate || null,
      dueTime: dueTime || null
    });
  },
  async toggleTask(listId, taskId) {
    await api.toggleTask(listId, taskId);
  },
  async removeTask(listId, taskId) {
    await api.deleteTask(listId, taskId);
  }
};
