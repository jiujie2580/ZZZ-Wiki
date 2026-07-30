# 更新日志（CHANGELOG）

> 本仓库的**游戏版本更新记录以 `data/version.json` 为准**（供站点“更新日志”页 `changelog.html` 渲染）。
> 下方为**仓库自身的开发里程碑**，与游戏版本区分，便于回溯。

遵循提交规范（见 [`docs/development-guide.md`](docs/development-guide.md)）。

---

## v1.1.2
- 数据与门禁修复（Data & Gate Fixes）：修复错误图片引用 + 版本信息漂移 + 搜索索引预热 + 门禁强化
- Code Review Completed

## [仓库] 修复：数据正确性 + 门禁强化（v1.1.2，纯修复无新功能）
- `fix(data): correct nekomata/seth wrong image references (B1/B2)` — v1.1.1 录入时的复制粘贴错误：
  - `nekomata`（猫宫又奈）：`thumbnail`/`banner`/`gallery` 全部错误指向 `ellen` 的图片 → 回退为 `null` 并移除 `images` 块（官方图未获取 = null 规则）。
  - `seth`（赛斯·洛威尔）：`gallery` 错误指向 `qingyi` 的图片 → 移除 `images` 块。
- `fix(data): sync site version info (B4/B5)` — `site.json` version `1.0.0 → 1.1.2`、updatedAt 更新；`version.json` `siteVersions` 补录 v1.1.0 / v1.1.1 / v1.1.2 三条（此前缺失导致 About 页与更新日志显示过期版本）。
- `fix(search): prewarm index on first focus (B6)` — 此前索引仅在搜索结果页构建，未访问过 `search.html` 时顶栏搜索建议永远为空；改为共享 Promise + 搜索框首次 focus 预热，输入时索引未就绪则先构建再渲染（含过期输入丢弃保护）。
- `feat(test): add image & version-consistency gates (B3)` — `data-validator.js` 新增：
  - **图片字段校验**（characters/factions/locations 通用）：路径文件必须存在、扩展名必须 `.webp`、**路径目录名必须与条目 id 一致**（正是本次 B1/B2 类错误的针对性拦截）、`gallery.kind`/`source.type` 必须在受控词表内。
  - **版本三方一致校验**：CHANGELOG.md 顶部版本 ≡ `site.json.version` ≡ `siteVersions[0].version`，任何一方漂移即 FAIL。
  - **aliases/nicknames 类型预检**：为 v1.1.3 角色内容增强预埋（字段存在时必须为非空字符串数组，缺失合法）。
- `feat(scripts): add sync-version.js (D4)` — 新增 `scripts/sync-version.js`：Release 前人工执行的零依赖同步脚本，以 CHANGELOG 顶部版本为单一事实源回写 `site.json` 并补录 `version.json`；**不引入构建步骤**，保持纯静态项目。
- `test: update changelog assertions` — 站点版本条目断言 10 → 13（随数据补录更新）。

## v1.1.1
- Image Content Phase 1（图片内容录入 Phase 1）：7 名热门角色官方图片素材 + JSON 数据录入
- Code Review Completed

## [仓库] 内容：角色图片内容录入（Image Content，Phase 1）
- `feat(image): add character image content (Phase 1, 7 characters)` — 图片系统基础设施（v1.1.0）已完备，本版本为纯内容层建设：
  - **图片素材**：从 HoYoLAB 官方 Wiki API 获取 7 名试点角色的官方头像（icon 256×250）与立绘（header 1000×1000），经 Pillow 处理为规范 webp：
    - `thumb.webp`（200×200，≤30KB，列表圆头像）
    - `banner.webp`（1200×300，≤80KB，详情 Hero 横幅）
    - `gallery-01.webp`（600×600，≤80KB，图片画廊）
    - 共计 **21 张 webp**，全部来自 `act-webstatic.hoyoverse.com` 官方 CDN。
  - **数据录入**（仅修改 `data/characters.json`，零代码变更）：为以下 7 个角色填入 `thumbnail`/`banner` 路径 + 新增 `images.gallery` 数组：
    - `ellen`（艾莲·乔）、`zhu-yuan`（朱鸢）、`qingyi`（青衣）、`soldier-11`（11 号）、`anby`（安比·德玛拉）、`billy`（比利·奇德）、`nicole`（妮可·德玛拉）
    - 每项 gallery 含 `kind: "art"`（受控词表）+ `source.type: "official"` + `source.title`（来源标注完整）。
  - **验证**：`data-validator.js` PASS=114 FAIL=0；`self-test.js` PASS=152 FAIL=0；Code Review CLEAN；49 个非目标角色未受影响。
  - **范围**：Phase 1 仅 Characters 7 人试点；其余 49 角色留待 Phase 2（v1.1.2）；Factions / Locations 留待 v1.1.3。

## v1.1.0
- Image System（图片系统）：数据驱动图片能力首次接入（Characters 首批）
- Code Review Completed

## [仓库] 能力：图片系统（Image System，跨模块基础设施）
- `feat(image): add data-driven image system (D1-D7)` — 通用图片能力首次落地，按 Design Review 决策实施：
  - **核心组件 `assets/js/core/image.js`（新增，`window.ZZZImage`）**：`lazyImg()`（`loading=lazy` + `decoding=async` + `onerror` 玻璃拟态兜底，绝不破图，D6）、`gallery()`（响应式网格 + kind/source 徽标，空→【官方暂未说明】，D2）、`lightbox`（单例模态，原图按需加载，Esc/遮罩/关闭按钮退出）；`?no-images=true` 或 `localStorage zzz_disable_images=true` 全局关闭模式（D7）；所有输出经 `ZZZUI.esc()` 防 XSS。
  - **样式 `assets/css/images.css`（新增）**：沿用玻璃拟态 + 霓虹；列表圆头像、详情横幅、画廊网格、占位/失败态、灯箱、reduced-motion 与响应式断点。
  - **配置 `config.js`**：新增 `imageBase`（`assets/images/`）、`imageSourceTypes`（official/game，D2）、`imageKinds`（art/screenshot/promo/concept/scene/logo/banner）。
  - **数据 Schema（`json-schema.md` §2.4 / §2.12）**：保留 `thumbnail`/`banner`/`icon` 平铺快速访问字段（D1 不删除），新增 `images.gallery`（每项 `src`/`full`/`caption`/`kind`/`source`）。
  - **首批接入 Characters（D4）**：`character.js` 详情页 Hero 头像（`lazyImg`）+ 横幅（banner）+ 图片画廊分节；`characters.js` 列表卡片圆头像；空数据优雅降级为占位/【官方暂未说明】。
  - **版权强化（D5）**：关于页新增「图片版权说明」分节（非官方粉丝百科、版权归 miHoYo / HoYoverse、禁传泄露/付费内容、可关闭图片）。
  - **文档**：新增 `docs/image-guidelines.md`（目录/命名/webp 参数/来源标注/版权红线/关闭模式/缓存）；`architecture.md` 增补 §9（图片系统 D1-D7 + 组件 + 缓存 + 降级）；`json-schema.md` 增补 §2.12 通用图片字段。
  - **目录**：`assets/images/characters/.gitkeep` 建立按实体分目录约定（`assets/images/{module}/{id}/`，D3）。
  - **范围说明**：v1.1.0 仅接入 Characters；Factions / Locations 图片接入留待 v1.1.1（系统已通用，后续仅补 JSON + 页面分节即可）。

## v1.0.0
- First Public Release（首个正式公开版）
- 四大支撑页产品化收尾：更新日志 / 搜索 / 关于 / 404
- 数据健康门禁 data-validator + 无头自测双门禁
- Code Review Completed

## [仓库] v1.0.0 — First Public Release（产品化收尾）
- 收尾阶段对 4 个支撑页做产品化打磨（不做新内容，仅完善体验与一致性），并通过「数据健康门禁 + 无头自测」双门禁：
  - **`test/data-validator.js`（新增，零依赖静态门禁）**：上线前静态校验全仓 13 个数据文件——JSON 解析 + 顶层结构、`id` 模块内唯一 + kebab-case、外键完整性、受控词表合法性、`source` 结构、日期格式、`version.json`（`gameVersions`/`siteVersions` 双数组）与 `site.json` 一致性；FAIL 直接阻断。结果 **114/114 PASS**。
  - **`data/version.json` 结构重构**：`versions` 单数组 → `gameVersions`（18 条官方游戏版本大事记，1.0–3.0 标题均来自官方资料）+ `siteVersions`（10 条站点里程碑，v0.1.0–v1.0.0）双数组分离；`core/search.js` 索引同步适配，搜索结果统一深链 `changelog.html`。
  - **更新日志 `changelog.js` 真实渲染**：双区块（游戏版本大事记 + 站点更新日志），读取 `gameVersions`/`siteVersions`；官方未公布字段渲染【官方暂未说明】。
  - **关于页 `about.js` 增强（D2）**：并行加载 `site.json` + 各模块 JSON，计算 7 模块统计（共 160 条）；站点信息含版本 / 游戏版本 / 数据基线 / 开源协议（null → “暂未设置”，区别于官方内容未知）/ 代码仓库；新增「数据统计 / 数据来源与规范 / 免责声明」分节。
  - **首页 `home.js` 升级（D4）**：`Promise.all` 并行加载 9 文件；hero 展示当前游戏版本（数据驱动自 `version.json`）+ 站点版本（自 `site.json`）+ 模块数 / 内容量元信息条；不展示“最近更新”。
  - **搜索增强（D3）**：关键词命中 `<mark>` 高亮（零依赖）、`Ctrl/⌘K` 聚焦全局搜索框、`Esc` 收起建议、空结果给出模块导航引导；`recent searches` 顺延至 v1.1。
  - **势力成员反向关联修复（D8）**：`faction.js` 由 `characters.factionId` 反向扫描计算成员（单一事实源，零回填 `factions.memberIds`）。
  - **404 页完善（P1）**：返回首页按钮 + 站内搜索入口 + 热门栏目网格（复用 `module-card` 样式）。
  - **`config.js`**：`timelineCategories` 补登记 `event`（剧情事件），修复 v0.7.0 数据已使用但词表漏登记的 4 条主线节点事件导致的 FK 校验告警。
  - **`site.json`**：新增 `dataVersion: "3.0"`、`repository`（GitHub 链接）、`license: null`。
  - **文档同步**：README / roadmap / json-schema（§2.2 双数组结构 + `id` 改为「模块内唯一」）/ development-guide 全面对齐；新增 `docs/release-checklist.md`（D9 固定 Release 流程清单）。
  - **自测扩展**：`test/self-test.js` 新增首页 / 更新日志 / 关于 / 搜索 / 404 覆盖（含高亮、Ctrl+K、空结果引导、未知 id 降级），全仓 **151/151 PASS**（原 113 项 + 38 项新增），无控制台错误。

---

## v0.9.0
- Worldview Module
- Code Review Completed

## [仓库] 模块九：世界观（Worldview）
- `feat(worldview): implement worldview list & detail` — 第九个填充内容的模块（单页 `?id` 详情，对齐 Timeline 模板）：
  - **数据 Schema 定稿**（`data/worldview.json`）：Design Review D1–D7 决策落地；16 字段 lore 条目模型（含 `category` 6 类受控词表 + 5 路 `related*Ids` 外键 + 结构化 `source` + `updatedAt`），**不含 `parentId` / `importance`**（D1）；首批录入 8 个官方世界观条目，严格基于官方正式设定（基线官方 3.0），无编造：
    - 旧文明与旧都 / 空洞灾害 / 以太与以太产业 / 新艾利都 / 空洞治理与探索体系 / 绳匠与代理人体系 / 邦布体系 / 战斗装备技术。
    - **边界（D7）**：仅录入截至官方 3.0 的设定；不含 3.1「漫长的告别」及任何粉丝推测；未知字段一律 `null` → 渲染【官方暂未说明】。
  - **分类受控词表（单一数据源）**：`assets/js/config.js` 新增 `window.ZZZ.worldviewCategories`（world 世界格局 / disaster 空洞灾害 / ether 以太 / civilization 都市文明 / technology 科技体系 / society 社会与职业）；否决 `history`（与 Timeline 重叠）/ `mystery`（易引发编造）/ `organization`（与 Factions 重叠）。筛选/展示/排序共用，不在 JSON 或页面硬编码。
  - **列表页**（`worldview.html` + `assets/js/pages/worldview.js`）：搜索（title/titleEn/aliases/summary）、分类 chips（全部 + 6 类）、排序（分类顺序默认 / 名称 / 最近更新）、卡片网格（玻璃拟态，对齐 Locations）；分类徽标 `badge-wv-*` 由受控词表映射。
  - **详情页**：单页 `worldview.html?id=<entryId>`（D3 决策，不新增独立详情页），hero → 基本信息 → 设定详情（spoiler 折叠，复用 Story D5 模式）→ 关联时间线/势力/地区/术语/剧情（5 路 `relChips` 外键，目标缺失灰态降级）→ 引用来源 → 计算式上/下条目导航（按全量分类序 + 标题序，不存 prevId/nextId）；未知 id 优雅降级提示。
  - **外键策略（D2）**：Worldview 仅存正向 5 路 `related*Ids`；**零回填**已发布 JSON（story/timeline/locations/factions/glossary），反向关联（未来“被哪些世界观条目引用”）留待后续按索引扫描实现；不引入 Graph 结构（D6 知识图谱不在 v0.9.0）。
  - **搜索增强**：`core/search.js` 的 `MAP` 新增 `worldview`（标题 title/titleEn，文本 summary/aliases）、`TYPE_LABEL.worldview='世界观'`、`hasDetail.worldview=true`（结果深链至 `worldview.html?id=<entryId>`）。
  - **组件复用**：`core/components.js` 的 `REL_SOURCES` 新增 `worldview`（供未来反向关联渲染）；`pages/worldview.js` 复用 `relChips` / `loadRelIndex` / `renderSource` / `section` / `field` / `fieldList` / `badge` / `breadcrumb` / `emptyState` / `errorState`。
  - **首页集成**：`pages/home.js` 的模块卡片 `n` 由 `null` 改为读取 `counts.worldview`（8 条），与既有模块一致。
  - **未知内容**：所有未说明字段渲染为【官方暂未说明】，未编造。
  - **受控修改（仅新增不改动）**：`config.js`（注册 `worldviewCategories`）/`core/search.js`（worldview MAP）/`core/components.js`（REL_SOURCES.worldview）/`pages/home.js`（计数）/`assets/css/pages.css`（追加 Worldview 模块样式块）/`docs/json-schema.md`（§2.11）/`docs/roadmap.md`（状态标记 Released）/`README.md`（进度 + 数据表）。
  - **自测**：jsdom 无头自测新增 Worldview 覆盖（列表渲染/分类筛选/搜索/排序/详情 5 路关联/剧透折叠路径/计算式导航/未知 id 降级共 32 项），全仓 **113/113 PASS**（Story 34 + Timeline 18 + Locations 29 + Worldview 32），无控制台错误。

## v0.8.0
- Locations Module
- Code Review Completed

## [仓库] 模块八：地区（Locations）
- `feat(locations): implement locations list & detail` — 第六个填充内容的模块（对齐 Characters / Factions / Glossary / Story / Timeline 模板）：
  - **数据 Schema 定稿**（`data/locations.json`）：Design Review D1–D6 决策落地；采用 `parentId` 自引用层级（不存 `childIds`）+ `category` 6 类受控词表（city/district/building/facility/hollow/special，D4 决策不单列 street）；首批录入 7 个官方地区，严格基于官方正式设定，无编造：
    - 新艾利都（city）→ 六分街（district）→ 录像店 / 141便利店（building）；新艾利都直接辖光映广场（district）/ 斯科特哨站（facility）/ 空洞（hollow）。
    - **边界**：缺失字段（`description` / `banner` / `updatedAt` 等）一律 `null` → 渲染【官方暂未说明】，未编造。
  - **受控词表（单一数据源）**：`assets/js/config.js` 新增 `window.ZZZ.locationCategories`（城市 / 区域 / 建筑 / 设施 / 空洞 / 特殊地点）。筛选/展示/排序共用，不在 JSON 或页面硬编码。
  - **列表页**（`locations.html` + `assets/js/pages/locations.js`）：卡片网格（默认，与角色/势力一致，D3）+ 可切换层级树视图；搜索（name/nameEn/aliases/summary）、类型 chips（全部 + 6 类）、排序（名称序默认 / 按类型）。
  - **详情页**（`location.html` + `assets/js/pages/location.js`）：对齐详情页模板（hero → 基本信息 → 简介 → 子地区 → 关联剧情/事件/势力/术语 → 引用来源）；
    - **父子导航（D6）**：「基本信息」展示「所属上级」（→ 父地区），单列「子地区」分节（→ 直接子地区 `relChips`），为 Locations 核心价值。
    - **关联反向计算（D2 混合方案）**：不存储 `relatedFactionIds` / `relatedTermIds`；「关联剧情 / 事件 / 势力 / 术语」由渲染层扫描消费方索引（story.locationIds / timeline.locationIds / factions.relatedLocationIds / glossary.relatedLocationIds）反向得出；保留 `relationIndex` 方向以便扩展。
  - **外键回填（受控修改，仅追加）**：在 `story.json`（s1-prologue→[sixth-street,random-play]）、`timeline.json`（4 条事件补 locationIds）、`factions.json`（6 个势力补 relatedLocationIds）、`glossary.json`（4 个术语补 relatedLocationIds）回填地区外键，使本模块与既有模块双向互引；目标缺失时灰态 chip 显示 id，绝不报错。
  - **搜索增强**：`core/search.js` 的 `locations` MAP 文本字段增 `aliases`（已登记 `hasDetail.location=true`）。
  - **未知内容**：所有未说明字段渲染为【官方暂未说明】，未编造。
  - **受控修改**：`config.js`（注册 `locationCategories`）、`core/search.js`（locations MAP）、`assets/css/pages.css`（追加 Locations 模块样式块，仅新增不改动既有规则）、`docs/json-schema.md`（§2.6 落定最终 Schema + 6 类受控词表说明）、`docs/roadmap.md`（状态标记 Released）、`README.md`（进度 + 数据表）。
  - **自测**：jsdom 无头自测新增 Locations 覆盖（列表/筛选/排序/网格-树切换/详情父子导航/反向关联/未知 id 降级共 29 项），全仓 **81/81 PASS**（Story 34 + Timeline 18 + Locations 29），无控制台错误。

## v0.7.0
- Timeline Module
- Code Review Completed

## [仓库] 模块七：时间线（Timeline）
- `feat(timeline): implement timeline list & detail` — 第五个填充内容的模块（对齐 Characters / Factions / Glossary / Story 模板）：
  - **数据 Schema 定稿**（`data/timeline.json`）：落实 Design Review D2/D3 最终决策，删除原 `importance` 字段，新增 `titleEn` / `locationIds` / `source` / `updatedAt` / `dateText`；首批录入 16 个官方世界观时间节点，严格基于官方正式设定，无编造：
    - 宏观历史线：旧文明时代 → 旧都覆灭·空洞诞生 → 空洞灾害蔓延 → 新艾利都建立 → 新艾利都治安与探索体系确立 → 绳匠（Proxy）职业兴起（6 条）；
    - 势力/组织成立：Random Play 录像店 / 狡兔屋 / 白祇重工 / 维多利亚家政 / 对空六课（5 条）；
    - 剧情明确节点（与 `story.json` 双向互引）：序章·猫的失物招领 / 旧都陷落真相初现 / 第一季落幕 / 第二季开启·云岿山篇 / 第三季开启（5 条）。
    - **边界**：依据 D7，仅录入截至官方 3.0 已明确公开的世界观时间节点；不含粉丝推测、非官方理论、单纯版本发布日期；未知日期一律 `date:null` + `dateText` 描述。
  - **受控词表（单一数据源）**：`assets/js/config.js` 新增 `window.ZZZ.timelineEras`（旧文明时代 / 空洞灾害时期 / 新艾利都时期 / 当前时间线）与 `window.ZZZ.timelineCategories`（灾害 / 历史事件 / 组织事件 / 人物事件 / 战争 / 科技 / 探索，取代编辑判断式的 `importance`）。筛选/展示/排序共用，不在 JSON 或页面硬编码。
  - **列表页**（`timeline.html` + `assets/js/pages/timeline.js`）：纵向时间轴卡片；搜索（title/titleEn/description/dateText）、纪元 chips + 分类 chips（二者可组合）、排序（时间顺序默认 / 分类 / 名称）、卡片内联展开（点击「展开」显示事件描述 → 关联剧情/势力/术语/地区 → 引用来源）。
  - **详情页**：采用单页 `timeline.html?id=<eventId>`（D1 决策，不新增独立详情页），支持自动展开 + 高亮 + 计算式「上/下事件」导航（按全量时间顺序，不保存 prevId/nextId）；未知 id 优雅降级提示。
  - **外键关联与降级**：`relatedStoryIds` / `relatedFactionIds` / `relatedTermIds` / `locationIds` 复用 `components.js` 的 `relChips` / `loadRelIndex` 渲染；目标缺失时灰态 chip 显示 id，绝不报错（`Locations` 模块尚未建成，`locationIds` 暂为空数组，详情区优雅显示【官方暂未说明】）。
  - **搜索修复**：`core/search.js` 的 `hasDetail` 补登记 `timeline: true`，使站内搜索结果对时间线事件正确深链至 `timeline.html?id=<eventId>`（原仅链接列表页）。
  - **双向互引回填**：在 `data/story.json` 的 9 条相关剧情中补登记 `timelineIds`（仅追加，不改 Schema），使剧情详情页「时间线」关联区可正常渲染（外键优雅降级）。
  - **未知内容**：所有未说明字段渲染为【官方暂未说明】，未编造。
  - **自测**：jsdom 无头自测新增 9 项 Timeline 用例（列表渲染/纪元筛选/分类筛选/展开/关联 chip/详情渲染/高亮/上下事件导航/未知 id 降级），全仓 52/52 PASS；自测过程中发现并修复 1 个真实渲染缺陷（`timeline.js` 未知 id 分支误将 `placeholderPage()` 的返回值（undefined）赋给 `innerHTML`，导致内容显示字面量 "undefined"，已改为直接调用）。
  - 同步更新 `docs/json-schema.md`（§2.8 落定最终 Schema + 受控词表说明）、`docs/roadmap.md`（Timeline 标记 Released）、`README.md`（进度 + 数据表）。

## v0.6.0
- Story Module
- Code Review Completed

## [仓库] 模块六：剧情 / 章节（Story）
- `feat(story): implement story list & detail` — 第四个填充内容的模块（对齐 Characters / Factions / Glossary 模板）：
  - **数据 Schema 定稿**（`data/story.json`）：在既有 14 字段基础上新增 5 字段（`titleEn` / `locationIds` / `termIds` / `source` / `updatedAt`）；**不新增 `arcId`**（Design Review D1/D3 确认）。首批录入 43 条官方剧情，均严格基于官方正式剧情/设定，无编造：
    - 主线 20 条（序章「生意×诡异×道义」→ 第三季·第一章「某个梦游者的自白」，覆盖 1.0–3.0）；
    - 特别篇 3 条（卧底蓝调 / 虚拟杀机 / 闪耀的此刻）；
    - 代理人剧情 17 条（哲与铃 / 11号洞中谍 / 猫又贼猫御鼠 / 格莉丝钢铁的女巫 / 珂蕾妲满级小学生 / 莱卡恩而英雄总是归于幕后 / 丽娜直到您彻底遗忘 / 青衣失踪邦口 / 柏妮思幸运当头 / 莱特无人喝彩之冠 / 浅羽悠真此地长眠者 / 艾莲我是艾莲在忙有事留言 / 零号·安比白银的复苏 / 扳机目不可及 / 橘福福猛虎伏魔传 / 席德花之谷的苙罗拉 / 卢西娅失梦者奇谭）；
    - 活动剧情 3 条（仲夏游梦绮谭 / 滚烫寻鲜记 / 集结！模考逆袭计划）。
    - **边界**：依据 D7，仅录入截至官方 3.0 的全部官方剧情；官方 3.1 章节「漫长的告别」于 2026-07-29 当日上线，暂未录入，待后续版本补齐。
  - **Story Type 受控词表单一数据源**：`assets/js/config.js` 新增 `window.ZZZ.storyTypes`（`main` 主线 / `special` 特别篇 / `agent` 代理人剧情 / `event` 活动剧情），筛选/展示/搜索共用，不在 JSON 或页面硬编码。
  - **列表页**（`story.html` + `assets/js/pages/story.js`）：搜索（title/titleEn/chapter/season/summary/synopsis）、Story Type 受控词表 chips + 版本 chips（数据动态生成，按上线日期倒序）、排序（剧情顺序默认 / 上线版本倒序 / 名称排序）、卡片网格（类型徽标 + 版本/剧透徽标）。
  - **详情页**（`chapter.html` + `assets/js/pages/chapter.js`）：对齐详情页模板（hero → 基本信息 → 剧情简介（summary 始终可见）→ 详细剧情 → 关联角色/势力/地点/术语/时间线 → 引用来源）；
    - **剧透处理（D5 方案 A）**：`spoiler=true` 时详细剧情默认折叠并显示「显示剧透内容」按钮，用户主动展开；`summary` 始终可见（如 3.0 第一章「某个梦游者的自白」）。
    - **计算式导航（D4）**：上一章/下一章根据同 `type` 兄弟节点按 `order` 动态计算，不保存 `prevId`/`nextId`；导航在类型间隔离（主线/特别篇/代理人/活动各自成链）。
    - **外键降级**：`locationIds`/`termIds`/`timelineIds` 目标缺失时灰态 chip 显示 id，绝不报错（当前 locations/timeline 未建，关联区优雅显示）。
  - **搜索增强**：`core/search.js` 的 `story` MAP 标题字段增 `titleEn`、文本字段增 `chapter`，专名与章节名可搜。
  - **未知内容**：所有未说明字段渲染为【官方暂未说明】（如 `synopsis` 缺失的章节），未编造。
  - **受控修改**：`config.js`（注册 `storyTypes`）、`core/search.js`（story MAP）、`assets/css/pages.css`（追加 Story 模块样式块，仅新增不改动既有规则）、`docs/json-schema.md`（§2.3 新增 5 字段 + §3 storyTypes 说明）、`docs/roadmap.md`（状态标记 Released）、`README.md`（进度 + 数据表）。
  - **自测**：jsdom 无头自测 34/34 PASS（列表交互/类型筛选/版本筛选/搜索/空态/排序、详情渲染/剧透折叠展开/计算式导航隔离/外键降级/引用来源/全局搜索索引、无控制台错误）；自测过程中发现并修复 1 个真实渲染缺陷（`chapter.js` 未知 id 时 `UI.placeholderPage(...)` 误写 `"undefined"`，已改为直接调用）。
  - 同步更新 `docs/json-schema.md`、`docs/roadmap.md`（Story 标记 Released）、`README.md`（进度 + 数据表）。

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
