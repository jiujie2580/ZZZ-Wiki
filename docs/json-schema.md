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
      "type": null,              // 如 主线/支线/委托/活动
      "version": null,           // 所属游戏版本
      "season": null,
      "chapter": null,
      "order": null,             // 排序用整数
      "releaseDate": null,
      "summary": null,
      "synopsis": null,          // 详细剧情概要
      "participantIds": [],      // → characters.id
      "factionIds": [],          // → factions.id
      "timelineIds": [],         // → timeline(events).id
      "spoiler": false           // 是否含剧透
    }
  ]
}
```

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
      "source": null             // 资料出处（官方页面/公告）
    }
  ]
}
```

### 2.5 `factions.json` — 列表字段 `factions`
```jsonc
{
  "factions": [
    {
      "id": "example-faction",
      "name": null,
      "nameEn": null,
      "category": "阵营",        // 阵营 / 组织 / 机构 / 网络（合并设计，不拆模块）
      "alias": [],               // 别名数组
      "type": null,              // 细分类型
      "leader": null,
      "headquarters": null,
      "established": null,
      "icon": null,              // 图标路径
      "banner": null,
      "summary": null,
      "description": null,
      "memberIds": [],           // → characters.id（双向引用）
      "relatedFactionIds": []    // → factions.id（自引用）
    }
  ]
}
```

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
```jsonc
{
  "terms": [
    {
      "id": "example-term",
      "term": null,
      "termEn": null,
      "category": null,          // 分类（如 概念/组织/地点名词…）
      "aliases": [],             // 别名
      "definition": null,        // 释义
      "source": null,            // 出处
      "relatedTermIds": []       // → terms.id（自引用）
    }
  ]
}
```

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

---

## 3. 外键关系图（Cross-References）

```
characters.factionId      ──▶  factions.id
factions.memberIds        ──▶  characters.id          （与 factionId 双向）
factions.relatedFactionIds──▶  factions.id            （自引用）
locations.parentId        ──▶  locations.id           （自引用层级）
locations.relatedFactionIds─▶  factions.id
locations.relatedTermIds  ──▶  glossary.terms.id
story.participantIds      ──▶  characters.id
story.factionIds          ──▶  factions.id
story.timelineIds         ──▶  timeline.events.id
timeline.relatedStoryIds  ──▶  story.id
timeline.relatedFactionIds──▶  factions.id
timeline.relatedTermIds   ──▶  glossary.terms.id
glossary.relatedTermIds   ──▶  glossary.terms.id       （自引用）
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

以 `glossary.json` 为例，新建模块时直接复制此模板并替换 `id`、补 `null` 为官方数据：

```json
{
  "terms": [
    {
      "id": "example-term",
      "term": null,
      "termEn": null,
      "category": null,
      "aliases": [],
      "definition": null,
      "source": null,
      "relatedTermIds": []
    }
  ]
}
```

> ⚠️ 示例中的 `null` / `[]` 表示“官方暂未说明”，**请勿臆测填入**。真实录入时只填官方已公布的信息。
