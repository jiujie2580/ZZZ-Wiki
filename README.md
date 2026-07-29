# 绝区零 Wiki（Zenless Zone Zero 剧情百科）

基于官方正式剧情、官方设定与官方资料整理的《绝区零》剧情百科。纯静态站点（HTML + CSS + 原生 JavaScript + JSON），无后端、无构建步骤、无前端框架。

> 设计原则：所有内容集中在 `data/*.json`，页面只负责展示；缺失信息统一标注【官方暂未说明】，绝不自行编造。

---

## 1. 技术栈

- 纯静态：**HTML + CSS + 原生 JS + JSON**
- 无框架（不使用 Vue / React 等）
- 无后端、无构建工具
- 可部署到 GitHub Pages / Netlify / Vercel 等任意静态平台

---

## 2. 目录说明

```
zzz-wiki/
├── index.html / worldview.html / story.html / chapter.html
├── characters.html / character.html / factions.html / faction.html
├── locations.html / location.html / timeline.html / glossary.html
├── changelog.html / search.html / about.html / 404.html
│     └─ 每个页面仅含统一布局挂载点（#app-header / #app-sidebar / #app-main / #breadcrumb / #content / #app-footer），
│         Header / Sidebar / Footer 由 layout.js 注入，不在页面中重复书写。
├── assets/
│   ├── css/        variables(设计变量) / base / layout / components / pages / responsive
│   ├── js/
│   │   ├── config.js            全局配置 window.ZZZ（标题/路径/数据清单/页面路由）
│   │   ├── core/                data-loader / router / layout / components / search
│   │   └── pages/               每个页面一个脚本（home / story / characters / glossary …）
│   ├── images/    内容图片（角色/势力/地区/剧情/背景等，按需建子目录）
│   ├── icons/     sprite.svg（UI 图标雪碧图）+ logo.svg
│   └── fonts/     自托管字体（默认用系统字体栈，可留空）
├── data/         所有结构化数据（见下）
└── README.md
```

### data/ 数据文件

| 文件 | 内容 | 列表字段 | 详情页 |
|---|---|---|---|
| `site.json` | 站点元信息 + 导航配置（真实可用） | — | — |
| `version.json` | 版本更新日志 | `versions` | changelog.html |
| `story.json` | 剧情章节/委托 | `story` | chapter.html |
| `characters.json` | 角色（代理人） | `characters` | character.html |
| `factions.json` | 势力 + 组织/机构/网络（`category` 区分） | `factions` | faction.html |
| `locations.json` | 地区（都市/空洞/地带） | `locations` | location.html |
| `glossary.json` | 专有名词/术语 | `terms` | （列表内展开） |
| `timeline.json` | 时间线事件 | `events` | （列表内展开） |
| `enemies.json` | 敌人/以骸（预留） | `enemies` | 暂无 |
| `bangboo.json` | 邦布（预留） | `bangboos` | 暂无 |
| `w-engines.json` | 音擎（预留） | `wEngines` | 暂无 |
| `drive-discs.json` | 驱动盘（预留） | `driveDiscs` | 暂无 |

---

## 3. 开发规范

1. **忠于官方**：所有剧情、人物、势力、时间线、术语必须严格基于官方正式剧情、官方设定与官方资料。
2. **不编造**：官方未说明的字段一律留 `null` 或省略；渲染层（`components.js` 的 `field()`）遇 `null` 自动显示【官方暂未说明】。
3. **数据驱动**：内容只写在 `data/*.json`；新增内容 = 改 JSON，不碰 HTML/JS。
4. **模块化**：每个功能模块 = 一组页面 `.html` + 一个 `pages/*.js` + 对应 `data/*.json`；一次只做一个模块，不重构已完成内容。
5. **统一布局**：禁止在页面中重复写 Header/Footer；统一由 `core/layout.js` 注入。新增页面只需复制页面骨架并改 `data-page` 与脚本引用。
6. **外键关联**：跨模块引用用 `*Id` / `*Ids`（如 `factionId`、`memberIds`、`relatedTermIds`），保持 id 唯一且小写下划线。

---

## 4. 本地运行

由于浏览器对 `file://` 下的 `fetch` 有跨域限制，**必须通过本地服务器访问**（不能直接双击打开 HTML）：

```bash
cd zzz-wiki
python -m http.server 8080
# 浏览器打开 http://localhost:8080/
```

或使用 Node：

```bash
npx serve zzz-wiki
```

---

## 5. 新增一个模块（如“敌人/以骸”）

1. 在 `data/` 建 `enemies.json`：`{ "enemies": [ { "id": "...", ... } ] }`（字段参考上方对应预留文件）。
2. 在 `assets/js/config.js` 的 `dataFiles` 与 `pages` 登记逻辑名。
3. 复制一个页面骨架（如 `factions.html`）为 `enemies.html`，改 `data-page` 与脚本引用为 `pages/enemies.js`。
4. 在 `data/site.json` 的 `nav` 追加一项（如 `{ "label": "敌人", "href": "enemies.html", "icon": "..." }`），侧栏自动出现。
5. 写 `assets/js/pages/enemies.js`：调用 `ZZZUI.listPlaceholder(...)` 渲染列表，按需再写详情页。

> 若使用已有模块（如势力/组织共用 `factions.json`），只需在列表页用 `category` 做筛选，**无需新建模块**。

---

## 6. 新增游戏版本（如 3.1 → 3.2）

仅改 JSON，无需改动页面与脚本：

1. 在 `data/version.json` 的 `versions` 数组**头部**追加一条 `{ "version": "3.2", "name": "...", ... }`。
2. 在对应数据文件追加新条目（新角色进 `characters.json`、新势力进 `factions.json`、新术语进 `glossary.json` …）。
3. 更新 `data/site.json` 的 `site.gameVersion` 为 `"3.2"`。
4. （可选）在新增条目的 `relatedTermIds` 等字段中维护交叉引用。

刷新页面即可看到更新。

---

## 7. 部署

- **GitHub Pages**：将 `zzz-wiki/` 内容推到仓库，在仓库 Settings → Pages 选择分支与 `/`（根）目录。
- **Netlify / Vercel**：直接拖入 `zzz-wiki` 目录或连接仓库，无需额外构建命令（Build Command 留空，Publish Directory 设为 `zzz-wiki`）。

---

## 8. 当前进度

- [x] 模块一：项目初始化（目录 / 布局 / 核心 JS / 占位页 / 数据骨架 / README）
- [ ] 术语表（Glossary）— 第一个填充内容的模块
- [ ] 势力/组织 → 角色 → 剧情 → 时间线 → 地区 → 世界观 → 更新日志 → 搜索 → 关于/404
