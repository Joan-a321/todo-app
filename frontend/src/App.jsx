import { useEffect, useState } from "react";
function getDeadlineColor(dueDate) {
  if (!dueDate) return "#999";

  const today = new Date();
  const due = new Date(dueDate);

  if (isNaN(due)) return "#999";

  // 只比较日期，不要受时间影响
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  const diff = due - today;
  const daysLeft = Math.round(diff / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) return "red";      // 已过期
  if (daysLeft === 0) return "red";    // 今天到期
  if (daysLeft <= 3) return "orange";  // 三天内到期
  return "#999";                       // 其他情况灰色
}


function App() {
  const [todos, setTodos] = useState([]);       // 当前筛选结果
  const [rawTodos, setRawTodos] = useState([]); // 所有任务（用于 tag 列表）

  // 添加任务的输入
  const [input, setInput] = useState("");
  const [description, setDescription] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [newTags, setNewTags] = useState([]);
  const [dueDate, setDueDate] = useState("");

  // 筛选条件
  const [selectedTags, setSelectedTags] = useState([]); // 多 tag 筛选
  const [statusFilter, setStatusFilter] = useState("全部");
  const [sort, setSort] = useState("createdAt");

  // 根据筛选条件加载 todos
  const loadTodos = () => {
    let url = "http://localhost:3000/todos";
    const params = [];

    // 多 tag：tag=xx & tag=yy & ...（AND 关系，需要同时包含所有选中的 tags）
    if (selectedTags.length > 0) {
      selectedTags.forEach((tag) =>
        params.push(`tag=${encodeURIComponent(tag)}`)
      );
    }

    // 已完成 / 未完成
    if (statusFilter === "已完成") params.push("completed=true");
    else if (statusFilter === "未完成") params.push("completed=false");

    // 排序
    if (sort === "dueDate") params.push("sort=dueDate");

    if (params.length > 0) url += "?" + params.join("&");

    console.log("Loading todos with URL:", url);
    console.log("Selected tags:", selectedTags);

    // 当前筛选结果
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        console.log("Filtered results:", data);
        setTodos(data);
      });

    // 全部任务（用于生成 tag 按钮）
    fetch("http://localhost:3000/todos")
      .then((res) => res.json())
      .then((all) => setRawTodos(all));
  };

  // 自动根据筛选条件刷新列表
  useEffect(() => {
    loadTodos();
  }, [selectedTags, statusFilter, sort]);

  // 添加任务
  const addTodo = () => {
    if (!input.trim()) return;

    fetch("http://localhost:3000/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: input,
        description: description || "",
        tags: newTags,
        dueDate: dueDate || null,
      }),
    })
      .then((res) => res.json())
      .then(() => {
        setInput("");
        setDescription("");
        setTagInput("");
        setNewTags([]);
        setDueDate("");
        loadTodos();
      });
  };

  // 切换完成状态
  const toggleTodo = (id) => {
    fetch(`http://localhost:3000/todos/${id}/toggle`, {
      method: "PUT",
    }).then(() => loadTodos());
  };

  // 删除任务
  const deleteTodo = (id) => {
    fetch(`http://localhost:3000/todos/${id}`, {
      method: "DELETE",
    }).then(() => loadTodos());
  };

  // 从 rawTodos（不是 filtered todos）生成 tag 列表
  const allTags = Array.from(
    new Set(
      rawTodos
        .flatMap((t) => t.tags || [])
        .filter((tag) => tag && tag.trim() !== "")
    )
  );

  // 根据deadline计算文字颜色
  const getDeadlineColor = (dueDate) => {
    if (!dueDate) return "black"; // 默认黑色
    
    try {
      // 解析 YYYY-MM-DD 格式的日期字符串
      const [year, month, day] = dueDate.split("-").map(Number);
      const deadline = new Date(year, month - 1, day); // month是0-based
      
      // 获取今天的日期（本地时区）
      const today = new Date();
      const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      // 计算天数差
      const daysLeft = Math.ceil((deadline - todayDate) / (1000 * 60 * 60 * 24));
      
      if (daysLeft < 1) {
        return "#d32f2f"; // 深红色：少于1天
      } else if (daysLeft < 3) {
        return "#f57c00"; // 橙色：少于3天
      }
      return "black"; // 其他：黑色
    } catch (e) {
      console.error("Error parsing deadline:", dueDate, e);
      return "black";
    }
  };

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h1>TODO List</h1>

      {/* Tag 多选筛选 */}
      <div style={{ marginBottom: 20, display: "flex", gap: 10, alignItems: "center" }}>
        <button
          onClick={() => setSelectedTags([])}
          style={{
            padding: "6px 12px",
            backgroundColor: selectedTags.length === 0 ? "#333" : "#eee",
            color: selectedTags.length === 0 ? "white" : "black",
            border: "none",
            borderRadius: 4,
            fontWeight: "bold",
          }}
        >
          全部
        </button>

        {allTags.map((tag) => {
          const isSelected = selectedTags.includes(tag);
          return (
            <button
              key={tag}
              onClick={() => {
                if (isSelected) {
                  setSelectedTags((prev) => prev.filter((t) => t !== tag));
                } else {
                  setSelectedTags((prev) => [...prev, tag]);
                }
              }}
              style={{
                padding: "6px 12px",
                backgroundColor: isSelected ? "#333" : "#eee",
                color: isSelected ? "white" : "black",
                border: "none",
                borderRadius: 4,
              }}
            >
              {tag}
            </button>
          );
        })}

      </div>

      {/* 状态筛选 */}
      <div style={{ marginBottom: 20, display: "flex", gap: 10 }}>
        {["全部", "已完成", "未完成"].map((state) => (
          <button
            key={state}
            onClick={() => setStatusFilter(state)}
            style={{
              padding: "6px 12px",
              backgroundColor: statusFilter === state ? "#333" : "#eee",
              color: statusFilter === state ? "white" : "black",
              border: "none",
              borderRadius: 4,
            }}
          >
            {state}
          </button>
        ))}
      </div>

      {/* 排序 */}
      <div style={{ marginBottom: 20 }}>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          style={{ padding: 6 }}
        >
          <option value="createdAt">按创建时间</option>
          <option value="dueDate">按截止日期</option>
        </select>
      </div>

      {/* 添加 TODO */}
      <div style={{ marginBottom: 20, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", gap: 10 }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Task title"
            style={{ padding: 8, width: 200 }}
          />

          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            style={{ padding: 8, width: 300 }}
          />

          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            style={{ padding: 8 }}
          />

          <button onClick={addTodo} style={{ padding: "8px 12px" }}>
            Add
          </button>
        </div>

        {/* tag chips 输入 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {newTags.map((tag, index) => (
              <span
                key={index}
                style={{
                  backgroundColor: "#eee",
                  padding: "2px 8px",
                  borderRadius: 4,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                {tag}
                <button
                  onClick={() =>
                    setNewTags(newTags.filter((_, i) => i !== index))
                  }
                  style={{
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    color: "#999",
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
              if (e.key === "Enter" && tagInput.trim() !== "") {
                if (!newTags.includes(tagInput.trim())) {
                  setNewTags([...newTags, tagInput.trim()]);
                }
                setTagInput("");
              }
            }}
            placeholder="输入 tag 后按 Enter"
            style={{ padding: 8, width: 160 }}
          />
        </div>
      </div>

      {/* TODO 列表 */}
      {todos.map((t) => {
        const due =
          typeof t.dueDate === "string"
            ? t.dueDate
            : t.dueDate && t.dueDate.year
            ? `${t.dueDate.year}-${String(t.dueDate.month).padStart(2, "0")}-${String(t.dueDate.day).padStart(2, "0")}`
            : null;

        const deadlineColor = getDeadlineColor(due);

        return (
          <div
            key={t.id}
            style={{
              padding: "10px 0",
              display: "flex",
              flexDirection: "column",
              borderBottom: "1px solid #ddd",
              marginBottom: 10,
            }}
          >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input
              type="checkbox"
              checked={t.completed}
              onChange={() => toggleTodo(t.id)}
            />
            <span
              style={{
                textDecoration: t.completed ? "line-through" : "none",
                fontSize: 16,
                color: deadlineColor,
              }}
            >
              {t.title}
            </span>

            <button
              onClick={() => deleteTodo(t.id)}
              style={{
                marginLeft: "auto",
                color: "white",
                backgroundColor: "red",
                border: "none",
                padding: "5px 10px",
                borderRadius: 4,
              }}
            >
              Delete
            </button>
          </div>

          {/* description */}
          {t.description && (
            <div style={{ fontSize: 14, color: "#666", marginTop: 5 }}>
              {t.description}
            </div>
          )}

          {/* tags */}
          {t.tags && t.tags.length > 0 && (
            <div style={{ display: "flex", gap: 5, marginTop: 5 }}>
              {t.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    backgroundColor: "#eee",
                    padding: "2px 6px",
                    borderRadius: 4,
                    fontSize: 12,
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* due date */}
          {t.dueDate && (
            <div
              style={{
                fontSize: 12,
                color: deadlineColor,
                marginTop: 4,
                fontWeight: "bold"
              }}
            >
              截止日期：{due}
            </div>
          )}

        </div>
        );
      })}
    </div>
  );
}

export default App;
