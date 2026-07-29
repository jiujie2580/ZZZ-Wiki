# JSON Schema 规范（JSON Schema）

> 本文档定义 `data/` 下所有 JSON 文件的字段、类型、外键与命名规范。
> 所有内容必须严格基于官方正式剧情 / 设定 / 资料；**官方未说明的字段一律 `null` 或空数组**，渲染层（详见 `architecture.md` §3.2）会自动显示【官方暂未说明】，**禁止自行编造**。
> 文中“示例”均为占位模板（值为 `null`），仅用于说明结构，不代表任何官方数据。

---

## 1. 通用约定

- **文件结构**：除 `site.json` 外，每个数据文件顶层为对象，数据置于“列表字段”中，如 `{ "characters": [ ... ] }`。
- **唯一标识**：每个条目必须有全局唯一 `id`（小写连字符 kebab-case，如 `example-character`）。
- **字段缺失**：未说明 → `null`；未说明的数组 → `[]`。
- **命名**：
  - 文件名：小写连字符（kebab-case），如 `w-engines.json`、`drive-discs.json`。
  - JSON 键：驼峰（camelCase），如 `memberIds`、`releaseVersion`。
  - `id` 值：小写连字符且唯一。
- **日期**：`"YYYY-MM-DD"`（如 `"2026-07-29"`）或版本号字符串（如 `"3.0"`）。
- **布尔**：`true` / `false`（如 `spoiler`）。
- **外键**：`*Id`（单值，指向某条目的 `id`）/ `*Ids`（数组）。

---

## 2. 各文件 Schema

### 2.1 `site.json`（配置型，唯一被 layout.js 实时读取）
无列表字段，顶层含 `site` 与 `nav`：

```jsonc
{
  "site": {
    "title": "绝区零 Wiki",
    "subtitle": "Zenless Zone Zero 剧情百科",
    "version": "1.0.0",        // 站点版本（仓库里程碑）
    "gameVersion": "3.0",      // 当前游戏版本（= config.gameVersion，更新版本时同步）
    "description": "基于官方正式剧情与设定的《绝区零》百科",
    "updatedAt": "2026-07-29"  // 资料更新日期 YYYY-MM-DD
  },
  "nav": [
    { "label": "首页", "href": "index.html", "icon": "home" }  // icon = sprite.svg 的 symbol id
  ]
}
```

### 2.2 `version.json` — 列表字段 `versions`
```jsonc
{
  "versions": [
    {
      "version": "3.0",          // 游戏版本号（字符串）
      "name": null,              // 版本名称
      "releaseDate": null,       // YYYY-MM-DD
      "highlights": [],          // 亮点摘要（字符串数组）
      "newCharacterIds": [],     // → characters.id
      "newFactionIds": [],       // → factions.id
      "newTermIds": []           // → glossary(terms).id
    }
  ]
}
```

### 2.3 `story.json` — 列表字段 `story`
```jsonc
{
  "story": [
    {
      "id": "example-chapter",
      "title": null,
      "titleEn": null,           // 英文标题（可选）
      "type": null,              // 受控词表 id，词表见 config.storyTypes（main/special/agent/event）
      "version": null,           // 所属游戏版本
      "season": null,
      "chapter": null,
      "order": null,             // 排序用整数（同 type 内按 order 计算上/下章）
      "releaseDate": null,
      "summary": null,           // 一句话简介（始终可见，不含剧透）
      "synopsis": null,          // 详细剧情概要（spoiler=true 时默认折叠）
      "participantIds": [],      // → characters.id
      "factionIds": [],          // → factions.id
      "locationIds": [],         // → locations.id（新增，可选）
      "termIds": [],             // → glossary(terms).id（新增，可选）
      "timelineIds": [],         // → timeline(events).id
      "spoiler": false,          // 是否含剧透（true 时详细剧情默认折叠）
      "source": {                // 结构化引用来源（§2.10，新增）
        "type": "official",
        "title": null,
        "url": null
      },
      "updatedAt": null          // 本条资料更新日期 YYYY-MM-DD（新增）
    }
  ]
}
```

> **Story Type 受控词表（单一数据源）**：`type` 的取值（`main` 主线 / `special` 特别篇 / `agent` 代理人剧情 / `event` 活动剧情）统一维护在 `assets/js/config.js` 的 `window.ZZZ.storyTypes`（含 `id` 与展示 `label`）。列表页筛选 chips、详情徽标、搜索均读取同一份词表；新增类型只需改 `config.js`，**不在 JSON 或页面硬编码**。展示时 `label` 由该词表映射得到。

> **列表页筛选**：`story.html` 的筛选 chips = Story Type 受控词表（来自 `config.storyTypes`）+ 版本 chips（按数据中 `releaseDate` 动态生成、倒序）；搜索匹配 `title` / `titleEn` / `chapter` / `season` / `summary` / `synopsis`；排序支持「剧情顺序（默认，按 releaseDate + type + order）」「上线版本倒序」「名称排序」。

> **计算式导航（不存储 prevId/nextId）**：详情页「上一章 / 下一章」由同 `type` 兄弟节点按 `order` 动态计算（Design Review D4 确认），在主线 / 特别篇 / 代理人剧情 / 活动剧情之间彼此隔离。

> **剧透处理（Design Review D5 方案 A）**：`spoiler=true` 时，`synopsis` 默认折叠并显示「显示剧透内容」按钮，用户主动展开；`summary` 始终可见。

> **新增字段（模块六）**：在既有 14 字段基础上新增 `titleEn` / `locationIds` / `termIds` / `source` / `updatedAt`；**不新增 `arcId`**（D1/D3 确认，章节只靠 `type` + `order` 串联，跨季分章由 `season` / `chapter` 文本字段表达）。完整字段（19 个）：`id, title, titleEn, type, version, season, chapter, order, releaseDate, summary, synopsis, participantIds, factionIds, locationIds, termIds, timelineIds, spoiler, source, updatedAt`。

### 2.4 `characters.json` — 列表字段 `characters`
```jsonc
{
  "characters": [
    {
      "id": "example-character",
      "name": null,
      "nameEn": null,
      "codename": null,          // 代号
      "factionId": null,         // → factions.id
      "rarity": null,            // 如 A/B/S
      "attribute": null,         // 属性（如 火/冰/电…）
      "specialty": null,         // 定位/职业
      "species": null,           // 种族
      "birthday": null,
      "voiceActors": { "zh": null, "ja": null, "en": null, "ko": null },
      "releaseVersion": null,
      "thumbnail": null,         // 头像图路径（assets/images/...）
      "banner": null,            // 横幅图路径
      "summary": null,
      "description": null,
      "storyIds": [],            // → story.id（关联剧情章节）
      "termIds": [],             // → glossary(terms).id（关联术语）
      "timelineIds": [],         // → timeline(events).id（关联时间线事件）
      "source": null             // 资料出处（官方页面/公告）
    }
  ]
}
```

> **属性 / 稀有度受控词表（单一数据源）**：`attribute` 的取值（`physical` / `fire` / `ice` / `electric` / `ether` / `wind` / `auric-ink` / `honed-edge`）与 `rarity` 的取值（`S` / `A`）统一维护在 `assets/js/config.js` 的 `window.ZZZ.characterAttributes` / `window.ZZZ.characterRarities`（各含 `id` 与展示 `label`）。列表页筛选 chips、详情徽标、搜索均读取同一份词表；新增属性 / 稀有度只需改 `config.js`，**不在 JSON 或页面硬编码**。展示时 `label` 由该词表映射得到。

> **列表页筛选**：`characters.html` 的筛选 chips 来自 `window.ZZZ.characterAttributes`（属性）与 `window.ZZZ.characterRarities`（稀有度），两组**可组合**；搜索匹配 `name` / `nameEn` / `codename` / `summary` / `specialty` / 属性名；排序支持「名称序」与「上线版本倒序」（`releaseVersion`）。

> **关联字段（Design Review 确认）**：在既有 `factionId`（→ `factions.id`）之外，新增三项可选关联 `storyIds` / `termIds` / `timelineIds`，均为空数组时详情页关联区显示【官方暂未说明】；目标条目不存在时优雅降级为灰态 chip（显示 id），不报错。

### 2.5 `factions.json` — 列表字段 `factions`
```jsonc
{
  "factions": [
    {
      "id": "example-faction",
      "name": null,
      "nameEn": null,
      "category": "organization", // 受控词表 id（阵营/组织/机构/网络），词表见 config.factionCategories
      "alias": [],                // 别名数组
      "type": null,               // 细分类型（如 委托商社 / 治安机构 / 工业集团）
      "leader": null,
      "headquarters": null,
      "established": null,
      "icon": null,               // 图标路径
      "banner": null,
      "summary": null,            // 一句话简介（列表卡片展示）
      "description": null,        // 官方描述（详情「简介」分节）
      "memberIds": [],            // → characters.id（双向引用）
      "relatedFactionIds": [],    // → factions.id（自引用）
      "relatedLocationIds": [],   // → locations.id
      "relatedTermIds": [],       // → glossary(terms).id
      "source": { "type": "official", "title": null, "url": null }, // 结构化引用来源（见 §2.10）
      "updatedAt": null           // 本条资料更新日期 YYYY-MM-DD
    }
  ]
}
```

> **分类受控词表（单一数据源）**：`category` 的取值（`faction` / `organization` / `institution` / `network`）统一维护在 `assets/js/config.js` 的 `window.ZZZ.factionCategories`（含 `id` 与展示 `label`）。筛选 chips、详情徽标、搜索均读取同一份词表；新增分类只需改 `config.js`，**不在 JSON 或页面硬编码**。展示时 `label` 由该词表映射得到。

> **列表页筛选**：`factions.html` 的分类筛选 chips 来自 `window.ZZZ.factionCategories`；搜索匹配 `name` / `nameEn` / `alias` / `summary` / `type`；排序支持「名称序」与「最近更新」（`updatedAt`）。

### 2.6 `locations.json` — 列表字段 `locations`
```jsonc
{
  "locations": [
    {
      "id": "example-location",
      "name": null,
      "nameEn": null,
      "category": null,          // 都市 / 空洞 / 地带…
      "parentId": null,          // → locations.id（自引用层级）
      "summary": null,
      "description": null,
      "banner": null,
      "relatedFactionIds": [],   // → factions.id
      "relatedTermIds": []       // → glossary(terms).id
    }
  ]
}
```

### 2.7 `glossary.json` — 列表字段 `terms`

术语表采用“受控词表 + 结构化字段”设计。顶层除 `terms` 外新增 `meta`（分类/标签受控词表、Schema 版本与数据更新时间），所有下拉/筛选选项均数据驱动，禁止在 JS 中硬编码。

```jsonc
{
  "meta": {
    "schemaVersion": "1.0",           // Schema 版本（向后兼容：优先新增字段，不删改既有字段）
    "updatedAt": "2026-07-29",        // 数据整体更新日期 YYYY-MM-DD
    "categories": [                   // 受控分类词表（id 用于数据，label 用于展示）
      { "id": "concept",   "label": "核心概念" },
      { "id": "being",     "label": "存在与生物" },
      { "id": "identity",  "label": "身份与职业" },
      { "id": "equipment", "label": "装备与道具" },
      { "id": "place",     "label": "地点" }
    ],
    "tags": [                         // 受控标签词表（多选，列表页 AND 逻辑筛选）
      { "id": "core",   "label": "核心设定" },
      { "id": "hollow", "label": "空洞相关" },
      { "id": "ether",  "label": "以太相关" },
      { "id": "combat", "label": "战斗相关" },
      { "id": "daily",  "label": "都市生活" }
    ]
  },
  "terms": [
    {
      "id": "example-term",
      "name": null,                   // 中文名（必填，列表/详情标题）
      "nameEn": null,                 // 英文名
      "nameJa": null,                 // 日文名（官方未公布则 null）
      "aliases": [],                  // 别名数组
      "category": null,               // → meta.categories[].id
      "summary": null,                // 一句话简介（列表卡片展示）
      "description": null,            // 官方定义（详情“官方定义”分节）
      "introducedVersion": null,      // 首次出现版本号（如 "1.0"）
      "introducedStoryId": null,      // → story.id（首次出现章节，可选）
      "introducedTimelineId": null,   // → timeline(events).id（首次出现时间线，可选）
      "relatedTermIds": [],           // → terms.id（自引用，网状关联）
      "relatedCharacterIds": [],      // → characters.id
      "relatedFactionIds": [],        // → factions.id
      "relatedLocationIds": [],       // → locations.id
      "source": {                     // 结构化引用来源（见 §2.10）
        "type": "official",           // official | game | video | story
        "title": null,                // 来源标题/名称
        "url": null                   // 可选外链
      },
      "official": false,              // 是否官方设定（true/false）
      "updatedAt": null,              // 本条更新日期 YYYY-MM-DD
      "tags": []                      // → meta.tags[].id（多选）
    }
  ]
}
```

> ⚠️ Schema 一经确定尽量保持**向后兼容**：优先采用“新增字段”而非删改既有字段；旧数据缺字段时渲染层按 `null` 处理，不会报错。
>
> 完整字段（19 个）：`id, name, nameEn, nameJa, aliases, category, summary, description, introducedVersion, introducedStoryId, introducedTimelineId, relatedTermIds, relatedCharacterIds, relatedFactionIds, relatedLocationIds, source, official, updatedAt, tags`；外加顶层 `meta`（含 `schemaVersion / updatedAt / categories / tags`）。

### 2.8 `timeline.json` — 列表字段 `events`
```jsonc
{
  "events": [
    {
      "id": "example-event",
      "title": null,
      "date": null,              // 可精确日期或年代描述
      "era": null,               // 纪元/时期
      "importance": null,        // 重要度
      "description": null,
      "relatedStoryIds": [],     // → story.id
      "relatedFactionIds": [],   // → factions.id
      "relatedTermIds": []       // → glossary(terms).id
    }
  ]
}
```

### 2.9 预留文件（空数组，开发对应模块时细化字段）
| 文件 | 列表字段 | 建议字段（待定，开发时确认） |
|---|---|---|
| `enemies.json` | `enemies` | `id, name, nameEn, category, type, weakness, description, relatedFactionIds` |
| `bangboo.json` | `bangboos` | `id, name, nameEn, model, rarity, description, relatedFactionIds` |
| `w-engines.json` | `wEngines` | `id, name, nameEn, type, attribute, rarity, description` |
| `drive-discs.json` | `driveDiscs` | `id, name, nameEn, slot, set, rarity, description` |

> 预留文件的具体字段在对应模块开发时定稿，并保持与本文“通用约定”一致。

### 2.10 通用：`source` 结构化引用来源格式

`glossary.json`（以及后续 characters/factions 等模块）统一使用**结构化** `source`，便于渲染层区分类型并支持外链；同时**向后兼容**旧版字符串格式（渲染层遇到字符串直接按纯文本展示）。

| `type` | 含义 | 渲染行为 |
|---|---|---|
| `official` | 官方资料（世界观介绍/设定集/官网） | 显示“官方资料”徽标 + `title`；有 `url` 则附加外链 |
| `game` | 游戏内正式文本 | 显示“游戏内文本”徽标 + `title` |
| `video` | 官方视频/PV | 显示“官方视频”徽标 + `title` |
| `story` | 某剧情章节 | 渲染为指向该章节详情页的链接（`id` → `story.id`） |

```jsonc
// 结构化（推荐）
"source": { "type": "official", "title": "《绝区零》官方世界观介绍", "url": null }
// 字符串（旧版兼容，不推荐新数据使用）
"source": "《绝区零》官方世界观介绍"
```

---

## 3. 外键关系图（Cross-References）

```
characters.factionId      ──▶  factions.id
characters.storyIds        ──▶  story.id
characters.termIds         ──▶  glossary.terms.id
characters.timelineIds     ──▶  timeline.events.id
factions.memberIds        ──▶  characters.id          （与 factionId 双向）
factions.relatedFactionIds──▶  factions.id            （自引用）
factions.relatedLocationIds─▶  locations.id
factions.relatedTermIds  ──▶  glossary.terms.id
factions.source          ──▶  结构化引用来源（§2.10：official/game/video/story）
locations.parentId        ──▶  locations.id           （自引用层级）
locations.relatedFactionIds─▶  factions.id
locations.relatedTermIds  ──▶  glossary.terms.id
story.participantIds      ──▶  characters.id
story.factionIds          ──▶  factions.id
story.locationIds         ──▶  locations.id
story.termIds             ──▶  glossary.terms.id
story.timelineIds         ──▶  timeline.events.id
story.source              ──▶  结构化引用来源（§2.10：official/game/video/story）
timeline.relatedStoryIds  ──▶  story.id
timeline.relatedFactionIds──▶  factions.id
timeline.relatedTermIds   ──▶  glossary.terms.id
glossary.introducedStoryId   ──▶  story.id
glossary.introducedTimelineId─▶  timeline.events.id
glossary.relatedTermIds      ──▶  glossary.terms.id    （自引用，网状关联）
glossary.relatedCharacterIds─▶  characters.id
glossary.relatedFactionIds  ──▶  factions.id
glossary.relatedLocationIds ──▶  locations.id
version.newCharacterIds   ──▶  characters.id
version.newFactionIds     ──▶  factions.id
version.newTermIds        ──▶  glossary.terms.id
```

规则：
- 外键指向的 `id` 必须在目标数据文件中存在（开发/校验时核对）。
- 自引用（如 `parentId`、`relatedFactionIds`、`relatedTermIds`）用于表达层级与网状关系。
- 渲染层只负责按 `id` 查表；若外键指向缺失，应优雅降级（显示 id 或【官方暂未说明】），不报错。

---

## 4. 命名规范

| 对象 | 风格 | 示例 |
|---|---|---|
| 文件名 | kebab-case | `w-engines.json`、`drive-discs.json` |
| JSON 键 | camelCase | `memberIds`、`releaseVersion`、`relatedTermIds` |
| `id` 值 | kebab-case，唯一 | `example-character`、`example-term` |
| 日期 | `YYYY-MM-DD` | `"2026-07-29"` |
| 版本号 | 字符串 | `"3.0"` |
| 布尔 | `true`/`false` | `"spoiler": false` |

---

## 5. 示例数据（占位模板，**非官方内容**）

以 `glossary.json` 为例，新建模块时直接复制此模板并替换 `id`、补 `null` 为官方数据（注意 `meta` 受控词表随分类/标签增减维护）：

```json
{
  "meta": {
    "schemaVersion": "1.0",
    "updatedAt": null,
    "categories": [ { "id": "concept", "label": "核心概念" } ],
    "tags": [ { "id": "core", "label": "核心设定" } ]
  },
  "terms": [
    {
      "id": "example-term",
      "name": null,
      "nameEn": null,
      "nameJa": null,
      "aliases": [],
      "category": null,
      "summary": null,
      "description": null,
      "introducedVersion": null,
      "introducedStoryId": null,
      "introducedTimelineId": null,
      "relatedTermIds": [],
      "relatedCharacterIds": [],
      "relatedFactionIds": [],
      "relatedLocationIds": [],
      "source": { "type": "official", "title": null, "url": null },
      "official": false,
      "updatedAt": null,
      "tags": []
    }
  ]
}
```

> ⚠️ 示例中的 `null` / `[]` 表示“官方暂未说明”，**请勿臆测填入**。真实录入时只填官方已公布的信息。
