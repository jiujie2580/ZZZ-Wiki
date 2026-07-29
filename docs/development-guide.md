# 开发指南（Development Guide）

> 面向后续所有模块的标准流程与规范。架构见 [`architecture.md`](architecture.md)，数据结构见 [`json-schema.md`](json-schema.md)，计划见 [`roadmap.md`](roadmap.md)。
> 工作铁律：**忠于官方、不编造、数据驱动、模块化、复用优先**。

---

## 1. 新增模块流程

以“敌人 / 以骸”为例（其他模块同理）：

1. **定 Schema**：按 [`json-schema.md`](json-schema.md) 设计 `data/<module>.json` 的字段；未知字段先留 `null`。
2. **建数据文件**：`data/<module>.json` → `{ "<listProp>": [ { "id": "...", ... } ] }`（`listProp` 命名见 json-schema）。
3. **登记配置**：在 `assets/js/config.js` 的 `dataFiles` 增加 `逻辑名: "文件名(不含.json)"`。
   - 若需独立页面，同时在 `pages` 增加 `逻辑名: "<module>.html"`。
4. **建页面壳**（如需）：复制任一现有页面（如 `factions.html`）为 `<module>.html`，仅改：
   - `<body data-page="<module>">`
   - 底部 `<script src="assets/js/pages/<module>.js"></script>`
   - **保留所有布局挂载点不变**（Header/Footer 由 `layout.js` 注入）。
5. **写页面脚本**：`assets/js/pages/<module>.js`，在 `DOMContentLoaded` 调：
   - 列表：`window.ZZZUI.listPlaceholder({ dataKey, listProp, title, desc, breadcrumb })`
   - 详情：`window.ZZZUI.detailPlaceholder({ dataKey, listProp, id 查找, ... })`
   - 或自定义渲染（仍复用 `ZZZUI.field` / `card` / `breadcrumb` 等原语）。
6. **入导航**（如需）：在 `data/site.json` 的 `nav` 追加 `{ "label": "敌人", "href": "<module>.html", "icon": "<sprite-id>" }`（`icon` 必须在 `assets/icons/sprite.svg` 存在）。
7. **纳入搜索**（如需）：在 `core/search.js` 的 `MAP` 增加该数据文件映射 `[listProp, 页面逻辑名, [标题字段], [摘要字段]]`；若有详情页，在 `hasDetail` 登记。
8. **同步文档**：更新 `README.md`（如有必要）、`roadmap.md` 状态、`CHANGELOG.md`。
9. **提交**：一次模块 = 一次符合规范的 Git 提交。

> 复用已有模块（如势力/组织共用 `factions.json`）只需在列表页用 `category` 筛选，**无需新建模块**。

---

## 2. 新增游戏版本流程（仅改 JSON）

1. 在 `data/version.json` 的 `versions` 数组**头部**追加 `{ "version": "3.2", "name": "...", ... }`。
2. 在对应数据文件追加新条目（角色→`characters.json`、势力→`factions.json`、术语→`glossary.json` …）。
3. 更新 `data/site.json` 的 `site.gameVersion` 为 `"3.2"`（与 `config.gameVersion` 保持一致）。
4. （可选）在新增条目的 `relatedTermIds` 等外键字段维护交叉引用。
5. 刷新页面即生效（注意缓存，见 §4 质量门 / 缓存破坏）。

> 新增版本**不改动任何 HTML / JS**（除非要新增对应模块页面）。

---

## 3. Git 提交规范

### 3.1 提交信息格式

```
<type>: <subject>
```

| type | 含义 | 示例 |
|---|---|---|
| `docs` | 文档 | `docs: add project documentation` |
| `feat` | 新模块 / 新内容 | `feat(glossary): add term entries and rendering` |
| `fix` | 修复缺陷 | `fix(search): handle empty index gracefully` |
| `refactor` | 重构（谨慎，需评审） | `refactor(layout): extract header builder` |
| `style` | 样式调整（无逻辑变更） | `style: tune glass blur on sidebar` |
| `chore` | 杂项 / 配置 / 版本号 | `chore(version): bump to 3.2 and add entries` |
| `perf` | 性能优化 | `perf(data-loader): add cache-bust query` |

规范：
- `subject` 用祈使句、精简；中文或英文保持一致，不混用。
- 多行改动可在空一行后写正文要点，但保持每条聚焦。
- **一次只提交一个模块的改动**；不把不相关改动混在同一提交。
- 模块完成提交信息示例：
  - 骨架：`Initial project skeleton`
  - 文档：`docs: add project documentation`
  - 术语模块：`feat(glossary): add terms and list rendering`

### 3.2 提交前检查

- [ ] 本地服务器（`python -m http.server`）打开页面，确认可加载、控制台无报错。
- [ ] 所有新增/修改的 JSON 合法（`python -m json.tool` 或编辑器校验）。
- [ ] 未提交敏感信息、未提交 `.workbuddy/`、未提交 `node_modules/`、`.DS_Store`、`*.log`、IDE 目录（见 `.gitignore`）。
- [ ] 内容仅来自官方；无编造字段（未知为 `null`）。

### 3.3 分支策略（建议）

- 主干：`main` / `master`。
- 功能开发可在特性分支进行，完成后合并；小型文档/内容改动也可直接提交主干（视团队约定）。

---

## 4. 开发注意事项（铁律）

1. **忠于官方**：所有剧情、人物、势力、时间线、术语必须严格基于官方正式剧情 / 设定 / 资料。
2. **不编造**：官方未说明的字段留 `null` / `[]`，渲染层自动【官方暂未说明】；**禁止自行补全设定**。
3. **数据驱动**：内容只在 `data/*.json`；改内容 = 改 JSON，不碰 HTML/JS（新增模块除外）。
4. **模块化**：一次一个模块；不重构已完成模块（发现问题先记录于评审/roadmap，不随手重构）。
5. **统一布局**：禁止在页面中重复写 Header/Footer；只用挂载点。
6. **复用优先**：优先复用 `ZZZUI` 组件与 `core/*` 模块，不重复实现已有功能。
7. **命名 / 风格一致**：kebab-case 文件名与 `id`、camelCase JSON 键；与现有代码保持一致。
8. **安全**：所有数据 / 用户文本经 `ZZZUI.esc()` 转义（`field`/`card`/`breadcrumb` 已统一处理），新增渲染务必复用，避免 XSS。
9. **缓存破坏**：部署新数据后，若用户命中旧缓存，可给 JSON 请求 URL 追加 `?v=<gameVersion>` 之类参数（在 `data-loader.js` 实现时评估）。

---

## 5. 质量门（上线前检查）

| 门 | 时机 | 方式 |
|---|---|---|
| 本地自测 | 每次提交前 | `python -m http.server` + 浏览器检查 |
| 性能审计 | 内容模块上线前 | Web Performance Audit（Core Web Vitals，依赖 Chrome DevTools MCP） |
| 响应式检查 | 内容模块上线前 | Responsiveness Check（多视口截图） |
| 图片资源 | 需要背景图 / 立绘 / 图标时 | Image Well（12 个图库 API 并行获取） |

> 性能审计与响应式检查需浏览器 / Chrome DevTools 类连接器；本仓库迁入时尚未连接对应 MCP，故作为“内容模块上线前强制检查”写入流程，待环境就绪后补跑。纯文档类提交（如文档模块）不触发这两项。

---

## 6. 常见问题（Troubleshooting）

- **页面空白 / fetch 失败**：必须通过本地服务器访问（`python -m http.server`），不能直接双击以 `file://` 打开（浏览器对 `file://` 下的 `fetch` 有跨域限制）。
- **图标不显示**：检查 `assets/icons/sprite.svg` 是否定义了对应 `<symbol id>`；`layout.js` 用 `<use href="assets/icons/sprite.svg#id">` 引用。
- **改了 JSON 没生效**：可能是浏览器 / 代理缓存；部署时可给 JSON URL 加版本参数（见 §4.9）。
- **新页面不在导航出现**：确认已在 `data/site.json` 的 `nav` 追加项，且 `href` 与页面文件名一致、`icon` 存在于雪碧图。
- **搜索找不到新内容**：确认已在 `core/search.js` 的 `MAP` 登记该数据文件与字段。
