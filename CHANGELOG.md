# 更新日志（CHANGELOG）

> 本仓库的**游戏版本更新记录以 `data/version.json` 为准**（供站点“更新日志”页 `changelog.html` 渲染）。
> 下方为**仓库自身的开发里程碑**，与游戏版本区分，便于回溯。

遵循提交规范（见 [`docs/development-guide.md`](docs/development-guide.md)）。

---

## v0.5.0
- Characters Module
- Code Review Completed

## [仓库] 模块五：角色 / 代理人（Characters）
- `feat(characters): implement characters list & detail` — 第三个填充内容的模块（对齐 Glossary/Factions 模板）：
  - **数据 Schema 定稿**（`data/characters.json`）：56 名官方代理人（至 3.0）；字段对齐 §2.4，新增三项可选关联 `storyIds` / `termIds` / `timelineIds`（Design Review 确认，保留既有 `factionId`）；`source` 采用结构化格式（§2.10）。
  - **属性 / 稀有度受控词表单一数据源**：`assets/js/config.js` 新增 `window.ZZZ.characterAttributes`（8 项：物理/火/冰/电/以太/风/玄墨/凛刃）与 `window.ZZZ.characterRarities`（S/A）；筛选/展示/搜索共用，不在 JSON 或页面硬编码。
  - **列表页**（`characters.html` + `assets/js/pages/characters.js`）：搜索（name/nameEn/codename/summary/specialty/属性名）、双维度筛选 chips（属性 + 稀有度，来自受控词表，可组合）、排序（名称序/上线版本倒序）、卡片网格（卡片显示阵营名，读取 factions.json 建索引，缺失优雅降级），全部数据驱动。
  - **详情页**（`character.html` + `assets/js/pages/character.js`）：对齐详情页模板（hero → 基本信息 → 简介 → 关联剧情/术语/时间线 → 引用来源）；阵营以可点击外键呈现；外键缺失灰态降级，绝不报错。
  - **搜索增强**：`core/search.js` 的 `characters` MAP 标题字段增 `codename`、文本字段增 `specialty`/`attribute`/`rarity`，职业可搜。
  - **未知内容**：所有未说明字段渲染为【官方暂未说明】（简介/摘要/声优/生日等留 `null`，未编造）。
  - **受控修改**：`config.js`（注册 `characterAttributes`/`characterRarities`）、`core/search.js`（characters MAP）、`docs/json-schema.md`（§2.4 新增三项 + 受控词表说明 + §3 外键）、`docs/roadmap.md`（状态标记 Released）。
  - **首批录入**：56 条官方代理人（猫宫又奈/比利/妮可/安比/法厄同 等，覆盖狡兔屋/维多利亚家政/白祇重工/卡吕冬之子/奥波勒斯小队/对空六课/刑侦特勤组/天琴座/反舌鸟/云岿山/怪啖屋/坎卜斯黑枝/妄想天使/空域巡戍局/外务筹策局/都市秩序部 等 21 个势力），`factionId` 全部有效，未知字段留 `null`，未编造。
  - **自测**：jsdom 无头自测 28/28 PASS（列表交互/属性筛选/稀有度筛选/组合筛选/搜索/空态/排序、详情渲染/外键降级/面包屑、全局搜索索引、无控制台错误）。
  - 同步更新 `docs/json-schema.md`、`docs/roadmap.md`（Characters 标记 Released）。

## v0.4.0
- Factions Module
- Shared Relation Primitives Extracted
- Code Review Completed

## [仓库] 模块四：势力 / 组织（Factions）
- `feat(factions): implement factions list & detail` — 第二个填充内容的模块（对齐 Glossary 模板）：
  - **数据 Schema 定稿**（`data/factions.json`）：21 个官方势力/组织/机构/网络；字段对齐 §2.5 并新增 `relatedLocationIds`、`relatedTermIds`、`source`（结构化，§2.10）、`updatedAt`；`category` 改为受控词表 id（`faction`/`organization`/`institution`/`network`）。
  - **分类受控词表单一数据源**：`assets/js/config.js` 新增 `window.ZZZ.factionCategories`（id + label），筛选/展示/搜索共用，不在 JSON 或页面硬编码。
  - **列表页**（`factions.html` + `assets/js/pages/factions.js`）：搜索（name/nameEn/alias/summary/type）、分类筛选 chips（来自 `factionCategories`）、排序（名称序/最近更新）、卡片网格，全部数据驱动。
  - **详情页**（`faction.html` + `assets/js/pages/faction.js`）：对齐 `term.html` 详情页模板（hero → 基本信息 → 简介 → 关联角色/势力/地区/术语 → 引用来源）；外键缺失灰态降级，绝不报错。
  - **共享关联原语抽取**：将 `relChips` / `loadRelIndex` / `renderSource` / `section` 从 `term.js` 抽取至 `core/components.js` 的 `window.ZZZUI`（受控、文档化改动）；`term.js` 改用共享版（输出不变），后续角色/地区/章节详情页统一复用，避免重复约 50 行。
  - **搜索增强**：`core/search.js` 的 `MAP` 文本字段构造改为遍历数组（通用），`factions` 的摘要字段扩为 `['summary','alias']`，别名可搜。
  - **未知内容**：所有未说明字段渲染为【官方暂未说明】。
  - **受控修改**：`config.js`（注册 `factionCategories`）、`core/search.js`（`MAP` 文本通用化 + factions 别名可搜）；`site.json` 导航与 `config` 页面注册在模块一已就位，无需改动。
  - **首批录入**：21 条官方势力（狡兔屋/维多利亚家政/白祇重工/卡吕冬之子/法厄同/对空六课/刑侦特勤组/云岿山/反舌鸟/怪啖屋/天琴座/妄想天使/空域巡戍局/外务筹策局/都市秩序部/坎卜斯黑枝/防卫军·白银小队/奥波勒斯小队/绳网/叛军 等），未知字段留 `null`，未编造。
  - **自测**：jsdom 无头自测 20/20 PASS（列表交互/分类筛选/搜索/空态/排序、详情渲染/外键降级/面包屑、term 回归、全局搜索索引、无控制台错误）。
  - 同步更新 `docs/json-schema.md`（§2.5 category→id + 新增字段 + §3 外键）、`docs/roadmap.md`（状态 + 详情页模板规范 + 共享原语）、`README.md`（进度 + 数据表）。

## v0.3.0
- Project Skeleton
- Project Documentation
- Glossary Module
- Code Review Completed

## [仓库] 模块三：术语表（Glossary）
- `feat: implement glossary module` — 首个填充内容的模块：
  - **数据 Schema 定稿**（`data/glossary.json`）：19 字段 + 顶层 `meta`（受控分类词表 `categories`、受控标签词表 `tags`、`schemaVersion`、`updatedAt`）；`source` 采用结构化格式（官方设定/游戏内文本/官方视频/剧情章节），向后兼容旧字符串格式。
  - **列表页**（`glossary.html` + `assets/js/pages/glossary.js`）：搜索（中/英/日文名、别名、标签、摘要）、分类筛选、标签多选 AND 筛选、字母序/最新加入/最近更新排序、卡片网格，全部数据驱动。
  - **详情页**（`term.html` + `assets/js/pages/term.js`）：确立全站详情页模板规范（detail-hero → detail-section → 关联区 rel-chips 优雅降级 → 引用来源）；8 个分节（基本信息 / 官方定义 / 关联剧情 / 关联人物 / 关联势力 / 关联地区 / 关联术语 / 引用来源）；外键目标缺失时灰态降级显示 id，绝不报错。
  - **未知内容**：所有未说明字段渲染为【官方暂未说明】。
  - **受控修改**：`config.js`（注册 `term` 页面）、`core/search.js`（`MAP` 增加 glossary、`hasDetail` 增加 term）。
  - **首批录入**：9 条官方明确术语（空洞 / 以太 / 以骸 / 绳匠 / 邦布 / 音擎 / 驱动盘 / 新艾利都 / 空洞灾害），每条至少一种关联，`source` 必填。
  - **自测**：jsdom 无头自测 23/23 PASS（列表交互 / 详情渲染 / 降级 / 全局搜索索引）。
  - 同步更新 `docs/json-schema.md`（Glossary Schema + meta + `source` 格式）、`docs/roadmap.md`（状态 + 详情页模板规范 + 质量门）、`README.md`（进度 + 数据表）。

## [仓库] 模块二：项目文档（Docs）
- `docs: add project documentation` — 新增 `docs/`：
  - `architecture.md`：整体架构 / 页面关系 / 数据流 / JS 模块关系
  - `roadmap.md`：模块清单与状态 / 推荐开发顺序 / 完成标准 / 质量门
  - `json-schema.md`：12 个 JSON 字段 / 外键关系 / 命名规范 / 示例
  - `development-guide.md`：新增模块 / 新增版本 / Git 规范 / 注意事项
- 同步：README 增加文档链接、修正 `id` 命名表述、更新进度。

## [仓库] 模块一：项目初始化（Skeleton）
- `Initial project skeleton` — 目录结构 / 统一布局 / 核心 JS（config·data-loader·router·layout·components·search）/ 16 个占位页 / 12 个数据骨架 / README / .gitignore。
