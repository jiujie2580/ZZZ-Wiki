# 更新日志（CHANGELOG）

> 本仓库的**游戏版本更新记录以 `data/version.json` 为准**（供站点“更新日志”页 `changelog.html` 渲染）。
> 下方为**仓库自身的开发里程碑**，与游戏版本区分，便于回溯。

遵循提交规范（见 [`docs/development-guide.md`](docs/development-guide.md)）。

---

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
