# 架构说明（Architecture）

> 适用范围：当前《绝区零》Wiki 全部代码（以 `Desktop/ZZZ-Wiki` 为准）。
> 本文所有描述均与 `assets/js/**`、`data/**`、`index.html` 等实际实现一致；如与代码冲突，以代码为准，并在评审中记录。

---

## 1. 总体架构

纯静态多页站点（MPA），无后端、无构建步骤、无前端框架。

| 层 | 技术 | 职责 |
|---|---|---|
| 表现层（Presentation） | HTML5 + CSS3 | 结构与样式；页面只含布局挂载点 |
| 逻辑层（Logic） | 原生 ES（IIFE 模块化） | 取数、路由、布局注入、渲染、搜索 |
| 数据层（Data） | JSON | 全部结构化内容，集中存放于 `data/` |

**设计原则**
- 内容集中：`data/*.json` 是唯一内容来源；页面只负责展示。
- 缺失即标注：字段未知一律 `null` 或空数组，渲染层 `components.js` 的 `field()` 自动显示【官方暂未说明】，从机制上杜绝编造。
- 模块化：一次只做一个模块，不重构已完成内容。
- 可部署：相对路径，可托管到 GitHub Pages / Netlify / Vercel 等任意静态平台。

---

## 2. 页面关系（Page Graph）

```
                         ┌──────────────┐
                         │  index.html  │ (首页：模块卡片 + 全局导航)
                         └──────┬───────┘
        ┌──────────────┬───────┼───────────┬──────────────┬──────────────┐
        ▼              ▼       ▼           ▼              ▼              ▼
  worldview.html  story.html characters.html factions.html locations.html timeline.html
   (世界观·占位)   │        │            │            │            │
                 ▼        ▼            ▼            ▼            │
            chapter.html character.html faction.html  location.html   glossary.html
            (章节详情)   (角色详情)    (势力详情)   (地区详情)    (术语·列表内展开)

  任意页面 Header 搜索框 ──▶ search.html?q=xxx (聚合各模块结果，按类型分组)
  详情页面包屑 ──▶ 列表页 ──▶ 首页
  404.html ── 兜底页（未知路径 / 资源缺失）
```

**跳转规则**
- 列表页 → 详情页：通过 `character.html?id=xxx` / `faction.html?id=xxx` / `location.html?id=xxx` / `chapter.html?id=xxx`（查询参数 `id`）。
- 详情页 → 列表页 / 首页：由 `ZZZUI.breadcrumb()` 自动生成面包屑。
- 搜索：Header 搜索框（见 `layout.js`）提交到 `search.html?q=关键词`；建议下拉在 Header 内即时显示。
- 导航：Header（logo / 搜索 / 版本号）+ Sidebar（来自 `site.json` 的 `nav`），所有链接均引用 `config.pages` 的逻辑名，不直接写死路径。

---

## 3. 数据流（Data Flow）

### 3.1 脚本加载顺序（每个 HTML 底部，顺序固定）

```
config.js → data-loader.js → router.js → components.js → layout.js → search.js → pages/<page>.js
```

### 3.2 各模块职责与依赖

| 模块 | 全局对象 | 依赖 | 职责 |
|---|---|---|---|
| `config.js` | `window.ZZZ` | 无 | 站点标题、资源/数据基路径、图标、游戏版本、`dataFiles`（逻辑名→文件）、`pages`（逻辑名→html） |
| `core/data-loader.js` | `window.ZZZData.loadJSON(name)` | `config` | `fetch` JSON，带 `Map` 缓存（按名缓存 Promise），错误兜底返回 `{ __error:true, message, url }` |
| `core/router.js` | `window.ZZZRouter` | `config` | `getParam(key)` 读查询参数；`buildLink(page, params)` 构造链接；`currentPageKey()` 识别当前页 |
| `core/components.js` | `window.ZZZUI` | `data-loader`, `router`（仅 `listPlaceholder`/`detailPlaceholder` 内部使用） | 通用 UI：`field`（空→【官方暂未说明】）、`fieldList`、`badge`、`card`、`breadcrumb`、`emptyState`、`errorState`、`placeholderPage`、`listPlaceholder`、`detailPlaceholder`、`esc` |
| `core/layout.js` | `window.ZZZLayout.render` | `config`, `data-loader`, `components`, `search` | DOMContentLoaded 自动注入 Header / Sidebar / Footer；构建移动端遮罩；绑定 `menu-toggle`；调用 `ZZZSearch.init()` |
| `core/search.js` | `window.ZZZSearch` | `data-loader`, `router`, `components`, `config` | 构建搜索索引（`MAP` 配置）、Header 即时建议、结果页渲染 |
| `pages/<page>.js` | （IIFE 内 `init`） | `components`（及间接 `data-loader`/`router`/`search`） | DOMContentLoaded 调 `ZZZUI.listPlaceholder` / `detailPlaceholder` / `ZZZSearch.renderResults`，把数据渲染进 `#content` |

### 3.3 运行时数据流

```
浏览器解析 HTML
  → 按顺序执行脚本，注册全局对象（ZZZ / ZZZData / ZZZRouter / ZZZUI / ZZZLayout / ZZZSearch）
  → DOMContentLoaded 触发两条互不冲突的渲染线：
      ① layout.render()  [异步] 读 site.json → 注入 Header / Sidebar / Footer
      ② pages/X.js init() [异步] 读 data/<module>.json → 渲染 #content
  → 用户交互（搜索 / 侧栏切换）由对应监听器处理
```

- `data-loader` 通过 `dataFiles` 逻辑名解析为 `data/<file>.json` 后 `fetch`；同一名字仅请求一次（Promise 缓存）。
- 跨模块跳转/引用：列表与详情通过 `?id` 关联；交叉引用通过 JSON 中的 `*Id` / `*Ids` 外键（见 `json-schema.md`）。

---

## 4. JS 模块关系图

```
                 ┌─────────────┐
                 │  config.js  │  window.ZZZ
                 └──────┬──────┘
        ┌──────────────┼───────────────────┐
        ▼              ▼                   ▼
  data-loader.js   router.js        (被 layout/search 引用)
  ZZZData          ZZZRouter
        │              │
        └──────┬───────┘
               ▼
        components.js (ZZZUI)  ── 依赖 ZZZData + ZZZRouter（仅占位渲染内部）
               ▲
   ┌───────────┼────────────┐
   │           │            │
 layout.js   search.js   pages/X.js
 (ZZZLayout) (ZZZSearch)  (各页面 init)
   │           │
   └─────┬─────┘
         ▼
   DOMContentLoaded 自动执行 layout.render + 各页面 init
```

要点：
- `config.js` 是全局基座，几乎所有模块都读 `window.ZZZ`。
- `data-loader` 与 `router` 是纯工具，无副作用。
- `components` 提供可复用 UI 原语；其占位渲染内部才依赖 `data-loader`/`router`。
- `layout` 与 `search` 是“外壳层”，分别负责布局注入与搜索；`pages/*` 是“内容层”，只管 `#content`。

---

## 5. 统一布局机制

页面 HTML **只含挂载点**，不在页面内重复书写 Header / Footer：

```html
<body data-page="home">
  <div id="app">
    <header id="app-header"></header>
    <div class="layout">
      <aside id="app-sidebar"></aside>
      <main id="app-main">
        <nav id="breadcrumb" class="breadcrumb"></nav>
        <div id="content"></div>
      </main>
    </div>
    <footer id="app-footer"></footer>
  </div>
  <!-- 脚本按固定顺序加载 -->
</body>
```

- `layout.js` 在 DOMContentLoaded 读取 `site.json` 的 `site`（标题 / 版本 / 更新时间）与 `nav`，注入：
  - **Header**：logo（→ `index.html`）+ 全局搜索框 + 版本号（`Ver <gameVersion>`）。
  - **Sidebar**：`nav` 列表，当前页高亮（对比 `location.pathname`）。
  - **Footer**：站点声明 + 资料更新时间 + “非官方粉丝百科 / 缺失信息标注【官方暂未说明】”声明。
- **移动端**：`menu-toggle` 切换 `body.sidebar-open`；点击 `sidebar-overlay` 关闭；侧栏在窄屏以抽屉形式呈现（样式见 `responsive.css`）。

> 新增页面 = 复制任一页面骨架，仅改 `<body data-page>` 与底部 `<script src="assets/js/pages/<page>.js">`，挂载点保持不变。

---

## 6. 设计令牌（Design Tokens）

全部集中在 `assets/css/variables.css`，换肤只需改此文件：

| 分组 | 变量 |
|---|---|
| 背景层 | `--bg-0` `--bg-1` `--bg-2` `--surface` |
| 玻璃拟态 | `--glass-bg` `--glass-border` `--glass-blur` |
| 霓虹强调色 | `--neon-cyan` `--neon-magenta` `--neon-purple` |
| 文本 | `--text-1` `--text-2` `--text-3` |
| 辉光 | `--glow-cyan` `--glow-magenta` |
| 圆角 | `--radius` `--radius-sm` |
| 间距尺度 | `--space-1`(8px) … `--space-6`(48px) |
| 字体 | `--font-head`(Orbitron/Rajdhani) `--font-body`(系统字体栈) |
| 布局尺寸 | `--header-h`(60px) `--sidebar-w`(240px) `--maxw`(1200px) |
| 渐变 | `--c-gradient` |

风格：赛博朋克 + 玻璃拟态 + 深色主题。

---

## 7. 关键约定速查

- **外键**：跨模块用 `*Id`（单值）/ `*Ids`（数组），指向目标模块条目的 `id`。
- **命名**：文件名小写连字符（kebab-case，如 `w-engines.json`）；JSON 键驼峰（camelCase，如 `memberIds`）；`id` 值小写连字符且唯一（如 `example-character`）。
- **日期**：`"YYYY-MM-DD"`（如 `"2026-07-29"`）或版本号字符串（如 `"3.0"`）。
- **安全**：所有数据/用户文本经 `ZZZUI.esc()` 转义（已在 `field`/`card`/`breadcrumb` 等内统一处理），新增渲染务必复用，避免 XSS。
- **图标**：UI 图标来自 `assets/icons/sprite.svg` 的 `<symbol>`；`layout.js` 与 `site.json` 引用的 id 必须在该文件中存在（当前已一致）。

---

## 8. 已知缺口（记录，待对应模块开发时处理）

- **世界观（Worldview）模块缺数据文件**：`worldview.html` 与 `pages/worldview.js` 已存在，但 `data/` 下尚无 `worldview.json`，且 `config.dataFiles` 未登记 `worldview`。开发该模块时需补齐 `data/worldview.json` 并在 `config.dataFiles` 登记。
- **搜索索引与核心耦合**：`core/search.js` 的 `MAP` 写死了纳入索引的数据文件与字段；新增“有内容且需被搜索”的模块时，需同步更新 `MAP`（以及 `hasDetail`）。属受控、文档化的改动。
- **JSON 缓存失效**：`data-loader` 的 `fetch` 未带版本/哈希参数，部署新数据后用户可能命中浏览器/代理缓存。大规模更新时可考虑给 JSON URL 追加 `?v=<gameVersion>` 之类的缓存破坏参数（见 `development-guide.md`）。
