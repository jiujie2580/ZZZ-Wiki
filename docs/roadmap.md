# 开发路线图（Roadmap）

> 本文记录《绝区零》Wiki 的长期开发计划、模块状态与质量门。
> 工作原则见 [`development-guide.md`](development-guide.md)；数据结构见 [`json-schema.md`](json-schema.md)；架构见 [`architecture.md`](architecture.md)。

---

## 1. 总览

- **目标**：长期维护的《绝区零》剧情百科，纯静态、数据驱动、严格基于官方正式剧情/设定，缺失信息统一标注【官方暂未说明】。
- **阶段**：`骨架` → `文档` → `内容模块` → `优化 / 部署`。
- **节奏**：一次一个模块，不重构已完成内容；每个模块完成必须更新 README / roadmap / CHANGELOG 并提交。

---

## 2. 模块清单与状态

| 模块 | 页面 | 数据文件 | 状态 | 备注 |
|---|---|---|---|---|
| 项目初始化（骨架） | 全部占位页 | 空 JSON 骨架 | ✅ 完成（模块一） | 目录 / 布局 / 核心 JS / 占位页 / README |
| 项目文档（Docs） | `docs/*` | — | ✅ 完成（模块二） | architecture / roadmap / json-schema / development-guide |
| 术语表 Glossary | `glossary.html` / `term.html` | `glossary.json` | ✅ Released（模块三 · v0.3.0） | 首个填充内容的模块；`term.html` 确立全站详情页模板规范 |
| 势力 / 组织 Factions | `factions.html` / `faction.html` | `factions.json` | ✅ Released（模块四 · v0.4.0） | 用 `category` 区分阵营/组织/机构/网络，不拆模块；分类词表在 `config.factionCategories` |
| 角色 Characters | `characters.html` / `character.html` | `characters.json` | ✅ Released（模块五 · v0.5.0） | 56 名官方代理人（至 3.0）；属性/稀有度受控词表在 `config.js`；关联 storyIds/termIds/timelineIds |
| 剧情 Story | `story.html` / `chapter.html` | `story.json` | ✅ Released（模块六 · v0.6.0） | 43 条官方剧情（至 3.0）；Story Type 受控词表在 `config.storyTypes`；关联 participantIds/factionIds/locationIds/termIds/timelineIds；剧透折叠 + 计算式导航 |
| 时间线 Timeline | `timeline.html` | `timeline.json` | ✅ Released（模块七 · v0.7.0） | 单页 `?id` 详情（自动展开/高亮 + 上/下事件导航）；era/category 受控词表在 `config.timelineEras`/`config.timelineCategories`；关联 story/factions/glossary/locations 外键降级 |
| 地区 Locations | `locations.html` / `location.html` | `locations.json` | ✅ Released（模块八 · v0.8.0） | `parentId` 自引用层级（城市→区域→建筑…）；6 类受控词表 `config.locationCategories`（city/district/building/facility/hollow/special）；详情父子导航 + 反向关联（扫描 story/timeline/factions/glossary 的外键）；列表卡片网格（默认）+ 层级树视图切换 |
| 世界观 Worldview | `worldview.html` | `worldview.json` | ✅ Released（模块九 · v0.9.0） | 单页 `?id` 详情（对齐 Timeline）；6 类受控词表 `config.worldviewCategories`（world/disaster/ether/civilization/technology/society）；5 路 `related*Ids` 外键（零回填已发布模块）；列表搜索/分类/排序 + 详情设定正文（spoiler 折叠）+ 计算式上/下条目导航 |
| 更新日志 Changelog | `changelog.html` | `version.json` | ✅ Released（v1.0.0） | 双区块渲染 `gameVersions`（18 条游戏版本大事记）+ `siteVersions`（10 条站点里程碑）；数据驱动，新增版本只改 JSON |
| 搜索 Search | `search.html` | 聚合各模块 + `version.json` | ✅ Released（v1.0.0） | 聚合各模块索引 + 版本；关键词高亮 + Ctrl/⌘K 聚焦 + 空结果模块引导 |
| 关于 About | `about.html` | `site.json` + 各模块 | ✅ Released（v1.0.0） | 站点信息（版本 / 游戏版本 / 数据基线 / 开源协议 / 仓库）+ 数据统计（7 模块共 160 条）+ 来源规范 + 免责声明 |
| 404 | `404.html` | — | ✅ 完成（v1.0.0） | 返回首页 + 站内搜索 + 热门栏目网格 |
| 图片系统 Image System | `character.html` / `characters.html`（v1.1.0 接入） | `assets/images/*` | 🟡 跨模块能力（v1.1.0 接入 Characters；Factions / Locations 待 v1.1.1） | 数据驱动图片：`image.js`（`ZZZImage`）+ `images.css` + `config.imageBase`；D1-D7 决策；按实体分目录自托管 |

预留数据文件（已建空数组，暂无页面）：`enemies.json` / `bangboo.json` / `w-engines.json` / `drive-discs.json`。

---

## 3. 推荐开发顺序

首个真正填充内容的模块 = **术语表（Glossary）**（数据结构最简单，可先跑通 JSON→渲染→【官方暂未说明】链路）。

```
术语表 → 势力/组织 → 角色 → 剧情 → 时间线 → 地区 → 世界观 → 更新日志 → 搜索 → 关于
```

说明：
- 术语表先行：验证整条数据链路与占位机制，成本最低。
- 势力/角色/剧情为核心三件套，交叉引用最密集，放在前期打牢基础。
- 世界观依赖前述模块的术语与设定沉淀，靠后。
- 搜索是“聚合层”，随内容增多逐步增强，不单独占用早期工期。

---

## 3.1 详情页模板规范（由模块三确立）

`term.html` + `assets/js/pages/term.js` 作为**全站详情页的统一模板**，后续 角色 / 势力 / 地区 / 剧情章节 等详情页均遵循同一结构，便于复用与一致性维护：

```
detail-hero（标题区：名称 / 外文名 / 分类徽标 / 标签）
  → detail-section（信息分节，使用 components.js 的 field / fieldList）
  → 关联区（rel-chips：目标存在→可点击链接；不存在→灰态降级显示 id，绝不报错）
  → 引用来源（结构化 source 渲染）
```

关键约定：
- 外键解析原则：目标条目存在 → 可点击链接；不存在 → 灰态 chip 显示 id（优雅降级，不报错、不崩溃）。
- 受控修改点仍集中在 `config.js`（页面注册）与 `core/search.js`（`MAP` / `hasDetail`），新增详情页时同步登记即可（见 `architecture.md` §8）。
- 详情页关联渲染原语（`relChips` / `loadRelIndex` / `renderSource` / `section`）已抽取为 `components.js` 的 `window.ZZZUI` 共享方法（模块四完成）；`term.js`、`faction.js` 均复用，后续角色/地区/剧情章节详情页直接调用，避免重复实现。
- 未知/缺失内容统一渲染为【官方暂未说明】（由 `components.js` 的 `field` / `isEmpty` / `UNKNOWN` 保证）。

---

## 4. 模块完成标准（Definition of Done）

一个模块视为完成，需同时满足：

1. **Schema 定稿**：`data/<module>.json` 字段与 [`json-schema.md`](json-schema.md) 一致；缺失字段为 `null`/空数组。
2. **内容录入**：仅录入官方正式内容；未知项留 `null`（自动【官方暂未说明】），不编造。
3. **渲染实现**：`pages/<module>.js` 渲染真实列表/详情；列表↔详情 `?id` 跳转可用。
4. **导航可达**：若需入导航，已在 `site.json` 的 `nav` 登记且图标存在于 `sprite.svg`。
5. **可被搜索**（若适用）：已在 `core/search.js` 的 `MAP` 登记。
6. **文档同步**：更新 `README.md`（如有必要）、本 `roadmap.md` 状态、`CHANGELOG.md`。
7. **提交**：完成一次符合规范的 Git 提交。

---

## 5. 质量门（Quality Gates）

| 门 | 触发时机 | 工具 / 方式 | 当前可用性 |
|---|---|---|---|
| 本地自测 | 每次提交前 | `python -m http.server` 打开页面，确认无控制台报错、JSON 合法 | ✅ 可用 |
| 数据健康门禁 | 每次提交前（静态，零依赖） | `node test/data-validator.js`：JSON 解析 + 顶层结构 + `id` 规范（模块内唯一 / kebab-case）+ 外键完整性 + 受控词表 + `source` 结构 + 日期格式 + `version.json`/`site.json` 一致性 | ✅ 已接入（114 项 PASS：13 个数据文件全量校验） |
| 无头自测 | 内容模块上线前 | jsdom 模拟浏览器加载真实页面脚本（覆盖列表页/详情页/降级/搜索索引 + 首页 / 更新日志 / 关于 / 搜索 / 404） | ✅ 已跑通（151/151 PASS） |
| 性能审计 | 内容模块上线前 | Web Performance Audit（Core Web Vitals，依赖 Chrome DevTools MCP） | ⏳ 待补跑（环境未配置 chrome-devtools MCP，已确认不可用） |
| 响应式检查 | 内容模块上线前 | Responsiveness Check（多视口截图，依赖浏览器自动化） | ⏳ 待补跑（环境未配置浏览器连接器） |
| 图片资源 | 需要背景图/角色立绘/图标时 | Image Well（12 个图库 API） | ✅ 按需调用 |
| Git 规范 | 每次提交 | 见 [`development-guide.md`](development-guide.md) 提交规范 | ✅ 执行中 |

> 性能审计与响应式检查需要浏览器/Chrome DevTools 类连接器。本环境已确认未配置 `chrome-devtools` MCP 及浏览器自动化连接器，故作为“内容模块上线前强制检查”写入流程，**待环境就绪后补跑**。当前已通过双门禁替代验证：① 数据健康门禁（`test/data-validator.js`，零依赖静态校验全仓 13 个数据文件，114 项 PASS）；② jsdom 无头自测（151/151 PASS，覆盖 Story / Timeline / Locations / Worldview 列表页交互、详情页渲染、父子导航、外键反向关联降级、全局搜索索引，以及首页 / 更新日志 / 关于 / 搜索 / 404 产品化页）。纯文档类提交不触发这两项。

---

## 版本管理（Version Management）

> 自 2026-07-29 起，**版本号由 AI 全权维护，无需每次向用户确认**（除非重大产品规划变化）。
> 采用 Semantic Versioning，结合本项目的“一次一个模块”节奏。

### 版本号规则
- **Major**：重大重构 / 架构升级 / 首个正式公开版（`v1.0.0` First Public Release）。
- **Minor**：完成一个完整模块 → Minor +1（如 `v0.3.0 → v0.4.0`）。
- **Patch**：Bug 修复 / Code Review 修正 / 文档修正 / 样式修复 / 性能优化 / 小功能补充 → Patch +1（如 `v0.4.0 → v0.4.1`）。
- 模块开发过程中的修复自动递增 Patch：`v0.4.0 → v0.4.1 → v0.4.2 …`。

### 自动判定（不询问用户）
- 新模块完成 → Minor +1
- 仅修复 / 文档 / Review → Patch +1
- 架构调整 / 正式发布 → Major +1

### 固定 Release 流程（每完成一个模块自动执行，结束再进下一模块）
1. 开发完成　2. 自测　3. Code Review　4. 修复 Review 问题　5. Git Commit
6. 更新 `CHANGELOG.md`　7. 更新本 `roadmap.md`　8. 创建 Annotated Git Tag　9. Push 到 GitHub
10. 创建 GitHub Release　11. 标记该模块 Released

每次 Release 必做：更新 CHANGELOG、更新 roadmap、创建 Annotated Tag、Push Tag、创建 GitHub Release、验证本地≡GitHub、输出 Release Summary。

### 权威版本里程碑（用户给定）
| 版本 | 模块 / 里程碑 |
|---|---|
| v0.1.0 | 项目骨架（Skeleton） |
| v0.2.0 | 项目文档（Documentation） |
| v0.3.0 | 术语表 Glossary |
| v0.4.0 | 势力 / 组织 Factions（已 Released） |
| v0.5.0 | 角色 Characters（已 Released） |
| v0.6.0 | 剧情 Story（已 Released） |
| v0.7.0 | 时间线 Timeline（已 Released） |
| v0.8.0 | 地区 Locations（已 Released） |
| v0.9.0 | 世界观 Worldview（已 Released） |
| v1.0.0 | 首个正式公开版 First Public Release |
| v1.1.0 | 图片系统 Image System（Characters 首批接入；Factions / Locations 待 v1.1.1） |

> 更新日志 / 搜索 / 关于 为支撑页，归入 `v1.0.0` 前的收尾阶段。

### ⚠️ GitHub Release 环境限制
本环境当前无 `gh` CLI、无 `GITHUB_TOKEN`、GitHub connector 断开，**无法程序化创建 GitHub Release（网页端）**。Tag 与 commit 可正常 push；「创建 GitHub Release」一步须用户手动补建（命令与链接见各次 Release Summary）。一旦环境具备 token / connector，该步骤将自动执行。`v0.4.0` 即因此待手动 Release。
