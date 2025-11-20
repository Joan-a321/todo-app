import { useEffect, useState, useMemo } from "react";

// 获取系统主题颜色（黑灰白适配）
function useSystemGray() {
  return useMemo(() => {
    const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    return dark ? "#bbb" : "#555";
  }, []);
}

export default function App() {
  const systemGray = useSystemGray();

  const [search, setSearch] = useState("");
  const [todos, setTodos] = useState([]);
  const [rawTodos, setRawTodos] = useState([]);

  const [input, setInput] = useState("");
  const [description, setDescription] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [newTags, setNewTags] = useState([]);
  const [dueDate, setDueDate] = useState("");

  const [selectedTags, setSelectedTags] = useState([]);
  const [statusFilter, setStatusFilter] = useState("全部");
  const [sort, setSort] = useState("createdAt");

  // 计算 deadline 颜色
  const getDeadlineColor = (due) => {
    if (!due) return systemGray;
    try {
      const [y, m, d] = due.split("-").map(Number);
      const deadline = new Date(y, m - 1, d);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const diff = (deadline - today) / (1000 * 60 * 60 * 24);
      if (diff < 1) return "#ff4e4e"; // 红
      if (diff < 3) return "#ffa726"; // 橙
      return systemGray;
    } catch {
      return systemGray;
    }
  };

  // 加载 todos
  const loadTodos = () => {
    let url = "http://localhost:3000/todos";
    const params = [];

    selectedTags.forEach((t) => params.push(`tag=${encodeURIComponent(t)}`));
    if (statusFilter === "已完成") params.push("completed=true");
    else if (statusFilter === "未完成") params.push("completed=false");
    if (sort === "dueDate") params.push("sort=dueDate");

    if (params.length) url += "?" + params.join("&");

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        let res = data;
        if (search.trim()) {
          const kw = search.toLowerCase();
          res = res.filter(
            (t) =>
              t.title?.toLowerCase().includes(kw) ||
              t.description?.toLowerCase().includes(kw)
          );
        }
        setTodos(res);
      });

    fetch("http://localhost:3000/todos")
      .then((r) => r.json())
      .then(setRawTodos);
  };

  useEffect(() => loadTodos(), [selectedTags, statusFilter, sort, search]);

  const addTodo = () => {
    if (!input.trim()) return;

    fetch("http://localhost:3000/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: input,
        description,
        tags: newTags,
        dueDate,
      }),
    }).then(() => {
      setInput("");
      setDescription("");
      setTagInput("");
      setNewTags([]);
      setDueDate("");
      loadTodos();
    });
  };

  const toggleTodo = (id) =>
    fetch(`http://localhost:3000/todos/${id}/toggle`, { method: "PUT" }).then(
      loadTodos
    );

  const deleteTodo = (id) =>
    fetch(`http://localhost:3000/todos/${id}`, { method: "DELETE" }).then(
      loadTodos
    );

  const allTags = Array.from(
    new Set(
      rawTodos.flatMap((t) => t.tags || []).filter((t) => t && t.trim() !== "")
    )
  );

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "20px 0",
        fontFamily: "Arial, sans-serif",
        color: "var(--text-color)",
      }}
    >
      {/* big title */}
      <h1
        style={{
          fontSize: 42,
          marginBottom: 25,
          textAlign: "center",
          fontWeight: "900",
        }}
      >
        TODO List
      </h1>

      {/* Add todo area */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          marginBottom: 40,
          width: 420,
          maxWidth: "90vw",
          alignItems: "stretch",
          padding: 20,
          background: "var(--card-bg)",
          border: "1px solid #333",
          borderRadius: 8,
        }}
      >
        {/* Title Label */}
        <div style={{ fontSize: 14, fontWeight: "bold", color: "var(--text-color)", marginBottom: 4 }}>
          新建任务：
        </div>

        {/* Row 1: Title */}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="任务标题"
          style={inputStyle()}
        />

        {/* Row 2: Description */}
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="任务描述（可选）"
          style={inputStyle()}
        />

        {/* Row 3: Date */}
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          style={inputStyle()}
        />

        {/* Row 4: Tags */}
        <div style={{ width: "100%" }}>
          {/* Tag display */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
            {newTags.map((t, i) => (
              <span
                key={i}
                style={{
                  background: "#555",
                  color: "white",
                  padding: "1px 6px",
                  borderRadius: 4,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 12,
                }}
              >
                {t}
                <button
                  onClick={() =>
                    setNewTags((tags) => tags.filter((_, idx) => idx !== i))
                  }
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "#ddd",
                    cursor: "pointer",
                    fontSize: 11,
                    padding: 0,
                    lineHeight: 1,
                  }}
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && tagInput.trim()) {
                if (!newTags.includes(tagInput.trim()))
                  setNewTags([...newTags, tagInput.trim()]);
                setTagInput("");
              }
            }}
            placeholder="输入后按 Enter 添加标签"
            style={inputStyle()}
          />
        </div>

        {/* Row 5: Add Button */}
        <button style={{ ...addBtnStyle(), width: 80, alignSelf: "center" }} onClick={addTodo}>
          新建
        </button>
      </div>

      {/* Search Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 35,
          width: 420,
          maxWidth: "90vw",
          justifyContent: "center",
        }}
      >
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索标题或描述..."
          style={{
            flex: 1,
            padding: 10,
            fontSize: 16,
            borderRadius: 8,
            border: "1px solid #666",
            background: "var(--input-bg)",
            color: "var(--text-color)",
          }}
        />
        {search ? (
          <button
            onClick={() => setSearch("")}
            style={{
              padding: "9px 16px",
              background: systemGray,
              color: "#000",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            取消
          </button>
        ) : (
          <div style={{ width: 0 }}></div>
        )}
      </div>

      {/* Tag filter */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          marginBottom: 20,
          width: 420,
          maxWidth: "90vw",
          alignItems: "stretch",
          padding: 16,
          background: "var(--card-bg)",
          border: "1px solid #333",
          borderRadius: 8,
        }}
      >
        {/* Filter Title Label */}
        <div style={{ fontSize: 14, fontWeight: "bold", color: "var(--text-color)", marginBottom: 4 }}>
          筛选：
        </div>

        {/* Filter label */}
        <div style={{ fontSize: 12, fontWeight: "bold", color: "var(--text-color)", marginBottom: 2 }}>
          按标签：
        </div>
        <div
          style={{
            display: "flex",
            gap: 6,
            overflowX: "auto",
            paddingBottom: 6,
          }}
        >
          <button
            onClick={() => setSelectedTags([])}
            style={{
              padding: "5px 12px",
              fontSize: 12,
              borderRadius: 4,
              border: "none",
              background: selectedTags.length ? "#444" : "#888",
              color: "white",
              whiteSpace: "nowrap",
              cursor: "pointer",
            }}
          >
            所有标签
          </button>

          {allTags.map((tag) => {
            const sel = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                onClick={() =>
                  setSelectedTags((prev) =>
                    sel ? prev.filter((t) => t !== tag) : [...prev, tag]
                  )
                }
                style={{
                  padding: "5px 12px",
                  fontSize: 12,
                  borderRadius: 4,
                  border: "none",
                  background: sel ? "#ff7043" : "#333",
                  color: sel ? "#fff" : systemGray,
                  fontWeight: sel ? "bold" : "normal",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {tag}
              </button>
            );
          })}
        </div>

        {/* Status filter */}
        <div style={{ fontSize: 12, fontWeight: "bold", color: "var(--text-color)", marginTop: 4, marginBottom: 2 }}>
          按完成状态：
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {["全部", "已完成", "未完成"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={{
                padding: "5px 12px",
                fontSize: 12,
                borderRadius: 4,
                border: "none",
                background: statusFilter === s ? "#4caf50" : "#888",
                color: statusFilter === s ? "#fff" : "white",
                cursor: "pointer",
                fontWeight: statusFilter === s ? "bold" : "normal",
                whiteSpace: "nowrap",
                flex: 1,
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Sort */}
      <div style={{ width: 420, maxWidth: "90vw", marginBottom: 20, display: "flex", justifyContent: "center" }}>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          style={{
            padding: 10,
            width: "100%",
            borderRadius: 6,
            border: "1px solid #666",
            background: "var(--input-bg)",
            color: "var(--text-color)",
          }}
        >
        <option value="createdAt">按创建时间排序</option>
        <option value="dueDate">按截止日期排序</option>
      </select>
      </div>

      {/* Todo List */}
      <div style={{ marginTop: 10, width: 600, maxWidth: "98vw", display: "flex", flexDirection: "column", alignItems: "center" }}>
        {todos.map((t) => {
          const due =
            typeof t.dueDate === "string"
              ? t.dueDate
              : t.dueDate
              ? `${t.dueDate.year}-${String(t.dueDate.month).padStart(
                  2,
                  "0"
                )}-${String(t.dueDate.day).padStart(2, "0")}`
              : null;

          const color = getDeadlineColor(due);

          return (
            <div
              key={t.id}
              style={{
                padding: "16px 16px",
                background: "var(--card-bg)",
                borderRadius: 8,
                marginBottom: 12,
                border: "1px solid #333",
                width: "90%",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <input
                  type="checkbox"
                  checked={t.completed}
                  onChange={() => toggleTodo(t.id)}
                />
                <span
                  style={{
                    textDecoration: t.completed ? "line-through" : "none",
                    fontSize: 18,
                    color,
                    fontWeight: "bold",
                    flex: 1,
                  }}
                >
                  {t.title}
                </span>

                <button
                  onClick={() => deleteTodo(t.id)}
                  style={{
                    background: "#ff4e4e",
                    color: "white",
                    border: "none",
                    padding: "5px 12px",
                    borderRadius: 6,
                    cursor: "pointer",
                  }}
                >
                  Delete
                </button>
              </div>

              {t.description && (
                <div style={{ marginTop: 6, color: "#aaa" }}>
                  {t.description}
                </div>
              )}

              {t.tags?.length > 0 && (
                <div
                  style={{
                    marginTop: 6,
                    display: "flex",
                    gap: 6,
                    flexWrap: "wrap",
                  }}
                >
                  {t.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        background: "#444",
                        padding: "2px 8px",
                        borderRadius: 6,
                        fontSize: 12,
                        color: "#eee",
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {due && (
                <div
                  style={{
                    marginTop: 6,
                    color,
                    fontWeight: "bold",
                    fontSize: 12,
                  }}
                >
                  截止日期：{due}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  // ---- styles ----
  function inputStyle(width = "100%") {
    return {
      width,
      padding: 10,
      borderRadius: 6,
      border: "1px solid #666",
      background: "var(--input-bg)",
      color: "var(--text-color)",
      boxSizing: "border-box",
    };
  }

  function addBtnStyle() {
    return {
      padding: "4px 7px",
      background: "#2196f3",
      color: "white",
      border: "none",
      borderRadius: 8,
      cursor: "pointer",
      whiteSpace: "nowrap",
    };
  }
}
