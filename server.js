import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { Pool } from "pg";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

const fallbackConnectionString =
  "REDACTED";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || fallbackConnectionString,
  host: process.env.PGHOST,
  port: process.env.PGPORT ? Number(process.env.PGPORT) : undefined,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  ssl: process.env.PGSSLMODE === "require" ? { rejectUnauthorized: false } : undefined
});

const initDb = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS lists (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      list_id TEXT NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
      text TEXT NOT NULL,
      done BOOLEAN DEFAULT FALSE,
      due_date DATE,
      due_time TIME,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
};

app.use(express.json());
app.use(express.static(__dirname));

app.get("/api/lists", async (req, res) => {
  try {
    const listResult = await pool.query(
      "SELECT id, name FROM lists ORDER BY created_at ASC"
    );
    const lists = listResult.rows.map((list) => ({ ...list, tasks: [] }));
    if (lists.length === 0) {
      return res.json({ lists: [] });
    }
    const listIds = lists.map((list) => list.id);
    const taskResult = await pool.query(
      `SELECT id, list_id, text, done, due_date, due_time
       FROM tasks
       WHERE list_id = ANY($1)
       ORDER BY created_at ASC`,
      [listIds]
    );
    const listMap = new Map(lists.map((list) => [list.id, list]));
    taskResult.rows.forEach((task) => {
      const list = listMap.get(task.list_id);
      if (!list) return;
      list.tasks.push({
        id: task.id,
        text: task.text,
        done: task.done,
        dueDate: task.due_date ? task.due_date.toISOString().slice(0, 10) : null,
        dueTime: task.due_time ? task.due_time.slice(0, 5) : null
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
    await pool.query("INSERT INTO lists (id, name) VALUES ($1, $2)", [id, name]);
    res.status(201).json({ id, name, tasks: [] });
  } catch (error) {
    res.status(500).send("Failed to create list");
  }
});

app.delete("/api/lists/:listId", async (req, res) => {
  try {
    await pool.query("DELETE FROM lists WHERE id = $1", [req.params.listId]);
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
    await pool.query(
      `INSERT INTO tasks (id, list_id, text, done, due_date, due_time)
       VALUES ($1, $2, $3, FALSE, $4, $5)`,
      [id, listId, text, dueDate, dueTime]
    );
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
    const result = await pool.query(
      `UPDATE tasks
       SET done = NOT done
       WHERE id = $1 AND list_id = $2
       RETURNING id, list_id, text, done, due_date, due_time`,
      [taskId, listId]
    );
    if (result.rows.length === 0) return res.status(404).send("Not found");
    const task = result.rows[0];
    res.json({
      id: task.id,
      listId: task.list_id,
      text: task.text,
      done: task.done,
      dueDate: task.due_date ? task.due_date.toISOString().slice(0, 10) : null,
      dueTime: task.due_time ? task.due_time.slice(0, 5) : null
    });
  } catch (error) {
    res.status(500).send("Failed to toggle task");
  }
});

app.delete("/api/lists/:listId/tasks/:taskId", async (req, res) => {
  try {
    const { listId, taskId } = req.params;
    await pool.query("DELETE FROM tasks WHERE id = $1 AND list_id = $2", [
      taskId,
      listId
    ]);
    res.status(204).end();
  } catch (error) {
    res.status(500).send("Failed to delete task");
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

initDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`Focus planner running on ${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start", error);
    process.exit(1);
  });
