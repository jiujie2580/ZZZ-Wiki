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
| 势力 / 组织 Factions | `factions.html` / `faction.html` | `factions.json` | ⬜ 待开发 | 用 `category` 区分阵营/组织/机构/网络，不拆模块 |
| 角色 Characters | `characters.html` / `character.html` | `characters.json` | ⬜ 待开发 | 字段最多，作复杂度标杆 |
| 剧情 Story | `story.html` / `chapter.html` | `story.json` | ⬜ 待开发 | 含 `participantIds` / `factionIds` / `timelineIds` 交叉引用 |
| 时间线 Timeline | `timeline.html` | `timeline.json` | ⬜ 待开发 | 事件与剧情/势力/术语互引 |
| 地区 Locations | `locations.html` / `location.html` | `locations.json` | ⬜ 待开发 | `parentId` 自引用层级 |
| 世界观 Worldview | `worldview.html` | `worldview.json`（**待补**） | ⬜ 待开发 | 壳与脚本已存在，但缺数据文件与 `config` 登记 |
| 更新日志 Changelog | `changelog.html` | `version.json` | ⬜ 待开发 | 渲染 `version.json` 的 `versions` |
| 搜索 Search | `search.html` | 聚合各模块 | ⬜ 待开发 | 随内容模块逐步丰富索引 |
| 关于 About | `about.html` | — | ⬜ 待开发 | 站点说明 / 免责声明 |
| 404 | `404.html` | — | ✅ 壳完成 | 兜底页 |

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
| 无头自测 | 内容模块上线前 | jsdom 模拟浏览器加载真实页面脚本（自测脚本覆盖列表页/详情页/降级/搜索索引） | ✅ 模块三已跑通（23/23 PASS） |
| 性能审计 | 内容模块上线前 | Web Performance Audit（Core Web Vitals，依赖 Chrome DevTools MCP） | ⏳ 待补跑（环境未配置 chrome-devtools MCP，已确认不可用） |
| 响应式检查 | 内容模块上线前 | Responsiveness Check（多视口截图，依赖浏览器自动化） | ⏳ 待补跑（环境未配置浏览器连接器） |
| 图片资源 | 需要背景图/角色立绘/图标时 | Image Well（12 个图库 API） | ✅ 按需调用 |
| Git 规范 | 每次提交 | 见 [`development-guide.md`](development-guide.md) 提交规范 | ✅ 执行中 |

> 性能审计与响应式检查需要浏览器/Chrome DevTools 类连接器。本环境已确认未配置 `chrome-devtools` MCP（Web Performance Audit 技能启动即要求该连接器，不可用即停止）及浏览器自动化连接器，故作为“内容模块上线前强制检查”写入流程，**待环境就绪后补跑**。模块三已通过 jsdom 无头自测（列表页交互、详情页渲染、外键降级、全局搜索索引共 23 项全部 PASS）替代验证渲染正确性。纯文档类提交（如模块二）不触发这两项。
