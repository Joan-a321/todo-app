TODO List 项目说明文档
---
1. 技术选型
- 编程语言：JavaScript（Node.js + React）
选择原因：生态成熟、开发效率高、跨平台，适合作为前后端一体的项目。
- 后端框架：Node.js + Express
简单、语法直观、快速构建 RESTful API
- 前端框架：React
组件化结构清晰
- 数据存储方式：JSON 文件作为简单数据库。项目中通过 fs.readFileSync 和 fs.writeFileSync 存储数据到todos.json文件中。
易实现，无需设置数据库服务，对于小项目足够且透明（数据结构单一）
  - 替代方案
    - 1. SQLite：更专业，但部署略复杂
    - 2. localStorage：前端可用，但无法展示后端 API 的专业性
---
2. 项目结构
- 前端调用后端 API，后端负责数据存储和操作逻辑。
```
frontend/
  App.jsx
  ...
backend/
  app.js
  data/todos.json
  ...
```
---
3. 需求细节与模块
- 功能
  - 必须功能
    - 添加待办事项：仅标题必填，描述可选，空标题无法创建；可添加多个tag
    - 删除待办事项：根据id删除，删除后自动保存到JSON
    - 标记完成/未完成：切换boolean完成状态
    - 查看待办列表：默认按创建时间降序，前端会区分完成/未完成的样式
  - 扩展功能
    - 筛选：按自定义单/多tag或按完成情况
    - 排序：任务可按创建时间和截止日期两种方式排序
  - 进阶挑战
    - highlight即将到ddl的任务
    - 搜索：关键词筛选，支持title + description
- 模块
  - 前端
    - 页面展示（添加/搜索/筛选/排序+任务列表）
    - 根据用户操作调用API
    - 前端本地过滤逻辑，如关键词搜索、多tag筛选
  - 后端
    - 处理 HTTP 请求（GET/POST/DELETE/PUT）
    - 多标签过滤逻辑：every(tag => todo.tags.includes(tag))
    - 截止日期排序逻辑
    - 文件数据库读写
  - 数据存储（JSON File）
    - 保存字段：{ id, title, description, tags, dueDate, completed, createdAt }
---
4. AI工具：
- 使用的工具：
  ChatGPT、copilot：检查结构设计，补全部分代码,UI样式优化（定位与响应式）
---
5. 运行与测试方式
- 运行
  - 运行后端
  ```
  cd backend
  npm install
  node app.js
  ```
  - 运行前端
  ```
  cd frontend
  npm install
  npm run dev
  ```
- 测试方式：macOS，Node.js v20+，Chrome / Safari / Edge 最新版。日常任务 100 条以内读写无性能压力。
- 已知不足：
  - JSON 文件并发写入不安全（但单用户足够）：
    1. 并发写入会导致数据竞争
    2. JSON 文件没有 ACID，无法保证强一致性
    3. Node.js 是单线程模型，而同步 I/O 会阻塞 event loop
    4. 文件越来越大，读取成本变高，现在在全量读取/写回
  - 若未来扩展用户系统需要换成数据库
    1. JSON无index，只能靠遍历搜索，如果有大量“用户id”无法高效查询
    2. 多个用户同时写入会导致更严重的数据冲突
    3. JSON 无法安全实现不同id权限隔离
    4. 如果未来扩展Web/多端同步，必须数据库
---
6. 总结与反思
- 如果有更多时间，我会：
  - 把前端的layout改的更accessible和user friendly，比如说左边是操作的区域，右边是整个todo list，然后窄屏模式下是现在这种layout。
  - 加入用户系统+登录态存储
  - 改 JSON 为 SQLite 或 MongoDB
- 项目亮点：极简易部署的前后端架构；清晰的模块化设计，便于扩展和维护；轻量但功能完整的任务管理系统
