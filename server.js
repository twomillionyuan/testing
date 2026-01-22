import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import fetch from "node-fetch";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;
const COUCH_BASE_URL =
  process.env.COUCH_URL ||
  "https://ebba-focusplannercouch.apache-couchdb.auto.prod.osaas.io";
const COUCH_USER = process.env.COUCH_USER || "admin";
const COUCH_PASSWORD =
  process.env.COUCH_PASSWORD || "cce25d40263a451e77a3b419b01429f2";
const DB_NAME = process.env.COUCH_DB || "focusplanner";

const couchRequest = async (path, options = {}) => {
  const auth = Buffer.from(`${COUCH_USER}:${COUCH_PASSWORD}`).toString("base64");
  const response = await fetch(`${COUCH_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${auth}`,
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "CouchDB request failed");
  }

  if (response.status === 204) return null;
  return response.json();
};

const ensureDb = async () => {
  try {
    await couchRequest(`/${DB_NAME}`, { method: "PUT" });
  } catch (error) {
    if (!String(error.message).includes("file_exists")) {
      throw error;
    }
  }
};

app.use(express.json());
app.use(express.static(__dirname));

app.get("/api/lists", async (req, res) => {
  try {
    const data = await couchRequest(`/${DB_NAME}/_all_docs?include_docs=true`);
    const docs = data.rows.map((row) => row.doc).filter(Boolean);
    const lists = docs
      .filter((doc) => doc.type === "list")
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map((doc) => ({ id: doc._id, name: doc.name, tasks: [] }));
    const tasks = docs
      .filter((doc) => doc.type === "task")
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const listMap = new Map(lists.map((list) => [list.id, list]));
    tasks.forEach((task) => {
      const list = listMap.get(task.listId);
      if (!list) return;
      list.tasks.push({
        id: task._id,
        text: task.text,
        done: task.done,
        dueDate: task.dueDate || null,
        dueTime: task.dueTime || null
      });
    });
    res.json({ lists });
  } catch (error) {
    res.status(500).send("Failed to load lists");
  }
});

app.post("/api/lists", async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    if (!name) return res.status(400).send("Name is required");
    const id = crypto.randomUUID();
    const payload = {
      _id: id,
      type: "list",
      name,
      createdAt: new Date().toISOString()
    };
    await couchRequest(`/${DB_NAME}/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    });
    res.status(201).json({ id, name, tasks: [] });
  } catch (error) {
    res.status(500).send("Failed to create list");
  }
});

app.delete("/api/lists/:listId", async (req, res) => {
  try {
    const listId = req.params.listId;
    const listDoc = await couchRequest(`/${DB_NAME}/${listId}`);
    await couchRequest(`/${DB_NAME}/${listId}?rev=${listDoc._rev}`, {
      method: "DELETE"
    });
    const data = await couchRequest(`/${DB_NAME}/_all_docs?include_docs=true`);
    const taskDocs = data.rows
      .map((row) => row.doc)
      .filter((doc) => doc && doc.type === "task" && doc.listId === listId)
      .map((doc) => ({ ...doc, _deleted: true }));
    if (taskDocs.length) {
      await couchRequest(`/${DB_NAME}/_bulk_docs`, {
        method: "POST",
        body: JSON.stringify({ docs: taskDocs })
      });
    }
    res.status(204).end();
  } catch (error) {
    res.status(500).send("Failed to delete list");
  }
});

app.post("/api/lists/:listId/tasks", async (req, res) => {
  try {
    const listId = req.params.listId;
    const text = String(req.body.text || "").trim();
    if (!text) return res.status(400).send("Text is required");
    const dueDate = req.body.dueDate || null;
    const dueTime = req.body.dueTime || null;
    const id = crypto.randomUUID();
    const payload = {
      _id: id,
      type: "task",
      listId,
      text,
      done: false,
      dueDate,
      dueTime,
      createdAt: new Date().toISOString()
    };
    await couchRequest(`/${DB_NAME}/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    });
    res.status(201).json({
      id,
      listId,
      text,
      done: false,
      dueDate,
      dueTime
    });
  } catch (error) {
    res.status(500).send("Failed to create task");
  }
});

app.post("/api/lists/:listId/tasks/:taskId/toggle", async (req, res) => {
  try {
    const { listId, taskId } = req.params;
    const taskDoc = await couchRequest(`/${DB_NAME}/${taskId}`);
    if (taskDoc.listId !== listId) return res.status(404).send("Not found");
    const updated = {
      ...taskDoc,
      done: !taskDoc.done
    };
    await couchRequest(`/${DB_NAME}/${taskId}`, {
      method: "PUT",
      body: JSON.stringify(updated)
    });
    res.json({
      id: updated._id,
      listId: updated.listId,
      text: updated.text,
      done: updated.done,
      dueDate: updated.dueDate || null,
      dueTime: updated.dueTime || null
    });
  } catch (error) {
    res.status(500).send("Failed to toggle task");
  }
});

app.delete("/api/lists/:listId/tasks/:taskId", async (req, res) => {
  try {
    const { listId, taskId } = req.params;
    const taskDoc = await couchRequest(`/${DB_NAME}/${taskId}`);
    if (taskDoc.listId !== listId) return res.status(404).send("Not found");
    await couchRequest(`/${DB_NAME}/${taskId}?rev=${taskDoc._rev}`, {
      method: "DELETE"
    });
    res.status(204).end();
  } catch (error) {
    res.status(500).send("Failed to delete task");
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

ensureDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`Focus planner running on ${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start", error);
    process.exit(1);
  });
