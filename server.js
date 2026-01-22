import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import fs from "fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;
const dataPath = path.join(__dirname, "data.json");

const state = {
  lists: []
};

const normalizeData = (data) => {
  if (!data || !Array.isArray(data.lists)) {
    return { lists: [] };
  }
  return {
    lists: data.lists.map((list) => ({
      id: String(list.id),
      name: String(list.name || ""),
      createdAt: list.createdAt || new Date().toISOString(),
      tasks: Array.isArray(list.tasks)
        ? list.tasks.map((task) => ({
            id: String(task.id),
            text: String(task.text || ""),
            done: Boolean(task.done),
            dueDate: task.dueDate || null,
            dueTime: task.dueTime || null,
            createdAt: task.createdAt || new Date().toISOString()
          }))
        : []
    }))
  };
};

const loadData = async () => {
  try {
    const raw = await fs.readFile(dataPath, "utf-8");
    const parsed = JSON.parse(raw);
    const normalized = normalizeData(parsed);
    state.lists = normalized.lists;
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
    await saveData();
  }
};

const saveData = async () => {
  const tmpPath = `${dataPath}.tmp`;
  const payload = JSON.stringify(state, null, 2);
  await fs.writeFile(tmpPath, payload, "utf-8");
  await fs.rename(tmpPath, dataPath);
};

const getListById = (listId) =>
  state.lists.find((list) => list.id === listId);

app.use(express.json());
app.use(express.static(__dirname));

app.get("/api/lists", (req, res) => {
  res.json({ lists: state.lists });
});

app.post("/api/lists", async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    if (!name) return res.status(400).send("Name is required");
    const id = crypto.randomUUID();
    const list = {
      id,
      name,
      createdAt: new Date().toISOString(),
      tasks: []
    };
    state.lists.push(list);
    await saveData();
    res.status(201).json(list);
  } catch (error) {
    res.status(500).send("Failed to create list");
  }
});

app.delete("/api/lists/:listId", async (req, res) => {
  try {
    const listId = req.params.listId;
    const originalCount = state.lists.length;
    state.lists = state.lists.filter((list) => list.id !== listId);
    if (state.lists.length === originalCount) {
      return res.status(404).send("Not found");
    }
    await saveData();
    res.status(204).end();
  } catch (error) {
    res.status(500).send("Failed to delete list");
  }
});

app.post("/api/lists/:listId/tasks", async (req, res) => {
  try {
    const listId = req.params.listId;
    const list = getListById(listId);
    if (!list) return res.status(404).send("Not found");
    const text = String(req.body.text || "").trim();
    if (!text) return res.status(400).send("Text is required");
    const task = {
      id: crypto.randomUUID(),
      text,
      done: false,
      dueDate: req.body.dueDate || null,
      dueTime: req.body.dueTime || null,
      createdAt: new Date().toISOString()
    };
    list.tasks.push(task);
    await saveData();
    res.status(201).json({ ...task, listId });
  } catch (error) {
    res.status(500).send("Failed to create task");
  }
});

app.post("/api/lists/:listId/tasks/:taskId/toggle", async (req, res) => {
  try {
    const { listId, taskId } = req.params;
    const list = getListById(listId);
    if (!list) return res.status(404).send("Not found");
    const task = list.tasks.find((item) => item.id === taskId);
    if (!task) return res.status(404).send("Not found");
    task.done = !task.done;
    await saveData();
    res.json({ ...task, listId });
  } catch (error) {
    res.status(500).send("Failed to toggle task");
  }
});

app.delete("/api/lists/:listId/tasks/:taskId", async (req, res) => {
  try {
    const { listId, taskId } = req.params;
    const list = getListById(listId);
    if (!list) return res.status(404).send("Not found");
    const originalCount = list.tasks.length;
    list.tasks = list.tasks.filter((task) => task.id !== taskId);
    if (list.tasks.length === originalCount) {
      return res.status(404).send("Not found");
    }
    await saveData();
    res.status(204).end();
  } catch (error) {
    res.status(500).send("Failed to delete task");
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

loadData()
  .then(() => {
    app.listen(port, () => {
      console.log(`Focus planner running on ${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start", error);
    process.exit(1);
  });
