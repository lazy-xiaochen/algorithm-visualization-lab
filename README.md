# Algorithm Visualization Lab · 算法可视化实验室

在同一张交互式网格上观察并比较 BFS、DFS、Dijkstra 和 A*。项目使用 React、TypeScript 和 Vite，搜索与渲染均在浏览器中运行。

## 本地启动

需要 Node.js 20.19+（20.x）或 22.12+，以及 npm。

```sh
npm install
npm run dev
```

打开 Vite 终端输出的地址，通常是 `http://localhost:5173`。

## 操作指南

- 首次打开时是 20×32 示例地图，默认选择 A*。选择 **Draw** 或 **Erase** 后，点击或拖过单元格来编辑墙。拖动绿色起点和红色终点可更换位置。
- **Random walls** 随机替换墙。**Maze** 使用随机化 DFS 生成连通的迷宫，保留起终点的位置。**Reset map** 清空当前尺寸下的地图，并将起终点放回该尺寸的默认位置。
- **Grid size** 支持 20–36 行、30–60 列。缩放后保留范围内的墙，必要时把端点移入网格。
- 用 **Start search** 播放搜索，使用 **Pause** 和 **Resume** 控制进度。**Step** 每次探索一个单元格。**Clear trace** 清除搜索记录并保留地图。修改地图或切换算法会取消当前搜索。
- **Compare algorithms** 用当前地图独立运行四种搜索。路径长度按移动步数计。探索数包含起点和实际到达的终点。计算耗时使用 `performance.now()`，与播放等待时间分开，浏览器计时精度和运行环境会影响小数结果。
- 键盘操作时用 Tab 聚焦网格，再用方向键移动、空格或 Enter 编辑墙、S/G 放置起点或终点。

## 搜索规则

每一步只能上下左右移动，代价为 1。邻居按上、右、下、左的顺序处理。BFS 使用队列，DFS 使用栈，Dijkstra 与 A* 使用实现于项目内的最小堆。A* 按 `g + h` 排序，其中 `h` 为曼哈顿距离。优先级相同时先比较 `h`，仍相同时按入队顺序处理。BFS、Dijkstra 和 A* 在本实验室的单位代价规则下返回最短路径，DFS 的结果取决于遍历顺序。

## 工程结构

```text
src/
  core/                   网格、迷宫、优先队列和纯搜索算法
  components/             网格编辑与对话框
  useSearchPlayback.ts    动画进度、单步执行与取消
  App.tsx                 工作区、工具栏与实时指标
  styles.css              响应式界面与搜索状态样式
tests/                    固定地图和可复现迷宫测试
```

## 检查与构建

```sh
npm test
npm run typecheck
npm run build
npm run preview
```

`npm test` 运行 Vitest 测试。生产文件输出到 `dist/`，预览命令需要先完成构建。
