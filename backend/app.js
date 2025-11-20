const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// JSON file path
const DATA_PATH = path.join(__dirname, "data", "todos.json");

// Helper: load from JSON file
function loadTodos() {
  const data = fs.readFileSync(DATA_PATH, "utf8");
  return JSON.parse(data);
}

// Helper: save to JSON file
function saveTodos(todos) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(todos, null, 2));
}

// Load when backend starts
let todos = loadTodos();

// ---------------- GET ----------------
app.get("/todos", (req, res) => {
  todos = loadTodos(); // reload

  let result = [...todos];

  // ------ 多 tag 交集过滤 ------
  // tag=学习&tag=工作 → req.query.tag = ["学习","工作"]
  // 逻辑：todo 需要同时包含所有选中的 tags（AND 关系）
  const tags = req.query.tag;
  if (tags) {
    const tagList = Array.isArray(tags) ? tags : [tags];
    result = result.filter((t) => {
      // 检查这个 todo 是否包含所有选中的 tags
      return tagList.every((tag) => t.tags && t.tags.includes(tag));
    });
  }

  // ------ 已完成 / 未完成 过滤 ------
  if (req.query.completed === "true") {
    result = result.filter((t) => t.completed === true);
  } else if (req.query.completed === "false") {
    result = result.filter((t) => t.completed === false);
  }

  // ------ 排序 ------
  if (req.query.sort === "dueDate") {
    result.sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    });
  }

  res.json(result);
});


// ---------------- ADD ----------------
app.post("/todos", (req, res) => {
  const { title, description, tags, dueDate } = req.body;

  if (!title || title.trim() === "") {
    return res.status(400).json({ error: "Title is required" });
  }

  const newTodo = {
    id: Date.now(),
    title,
    description: description || "",
    tags: Array.isArray(tags) ? tags : [],
    dueDate: dueDate || null,
    completed: false,
    createdAt: new Date().toISOString()
  };

  todos.push(newTodo);
  saveTodos(todos);

  res.json(newTodo);
});


// ---------------- DELETE ----------------
app.delete("/todos/:id", (req, res) => {
  const id = Number(req.params.id);

  todos = todos.filter((t) => t.id !== id);

  saveTodos(todos);

  res.json({ success: true });
});

// ---------------- TOGGLE COMPLETE ----------------
app.put("/todos/:id/toggle", (req, res) => {
  const id = Number(req.params.id);
  const todo = todos.find((t) => t.id === id);

  if (!todo) return res.status(404).json({ error: "Todo not found" });

  todo.completed = !todo.completed;

  saveTodos(todos);

  res.json(todo);
});

// ---------------- START SERVER ----------------
app.listen(3000, () => {
  console.log("Backend running on http://localhost:3000");
});
