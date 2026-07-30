# 图片录入与版权规范（v1.1.0）

本规范约束 ZZZ-Wiki 图片系统的日常维护：命名、格式、来源标注与版权红线。
设计决策依据见 `architecture.md` §9 与 `json-schema.md` §2.12（D1–D7）。

---

## 1. 目录与命名（D3）

图片自托管于仓库 `assets/images/`，**不使用外链**（避免脆弱性与版权连带）。
按实体分目录，目录名 = 模块名，子目录名 = 实体 id：

```
assets/images/
├── characters/
│   ├── ellen/
│   │   ├── thumb.webp      # 快速访问字段 thumbnail
│   │   ├── banner.webp     # 快速访问字段 banner
│   │   ├── gallery-01.webp # 画廊项
│   │   └── gallery-02.webp
│   └── <其他角色 id>/
├── factions/               # v1.1.1 启用
└── locations/             # v1.1.1 启用
```

命名约定：

- 头像固定 `thumb.webp`（对应 JSON `thumbnail`）。
- 横幅固定 `banner.webp`（对应 JSON `banner`）。
- 画廊项按 `gallery-01.webp`、`gallery-02.webp` … 递增，数字对齐两位。
- **禁止**在仓库根 `assets/images/` 直接放图；必须进对应模块/实体子目录。

---

## 2. 格式与体积（D6）

- 统一 **webp**（GitHub Pages 无图片处理，必须预优化）。
- 建议尺寸：
  - `thumb`：~200×200px，单图 ≤ 30KB。
  - `banner`：~1200×300px，单图 ≤ 80KB。
  - `gallery-*`：展示图 ~600×600px（≤ 80KB）；若需原图，在 JSON 用 `full` 字段指向更大的 webp（灯箱打开时才加载）。
- 压缩参考（命令行）：`cwebp -q 82 in.png -o out.webp`；有损质量 80–85 区间通常足够。
- 单文件 ≤ 100MB（GitHub 限制）；总量关注仓库软上限，避免一次性灌入数百张图。

---

## 3. JSON 字段（D1 / D2）

每个实体保留平铺快速访问字段 + 扩展画廊：

```jsonc
{
  "thumbnail": "assets/images/characters/ellen/thumb.webp",   // 快速访问
  "banner": "assets/images/characters/ellen/banner.webp",      // 快速访问
  "images": {
    "gallery": [
      {
        "src": "assets/images/characters/ellen/gallery-01.webp",
        "full": null,                  // 可选原图；缺省用 src
        "caption": "角色立绘",
        "kind": "art",                 // 见下方受控词表
        "source": { "type": "official", "title": "官方角色立绘" }
      }
    ]
  }
}
```

受控词表（单一数据源在 `assets/js/config.js`）：

- `kind`（`config.imageKinds`）：`art` 角色立绘 / `screenshot` 战斗截图 / `promo` 宣传图 / `concept` 概念图 / `scene` 场景图 / `logo` 标志 / `banner` 横幅。
- `source.type`（`config.imageSourceTypes`）：仅 `official` 官方素材 / `game` 游戏内截图。**不引入** `fan` / `derived`（社区投稿未来再扩展）。

---

## 4. 来源与版权红线（D5）

- 仅使用 **官方已公开** 的素材（官网、官方 PV、游戏内截图、官方公告配图）。
- **禁止上传**：
  - 未公开测试 / 内测素材；
  - 泄露剧情截图 / 未发布角色图；
  - 付费内容截图（如付费壁纸包的未授权再分发）。
- 每张图必须在 `source` 标注 `type` 与 `title`；若官方有明确页面，`source` 可加 `url`。
- 关于页已声明：本站为非官方粉丝百科，版权归 miHoYo / HoYoverse，仅用于资料整理与学习交流。
- 版权方要求下架时，经仓库 Issue 处理。

---

## 5. 关闭模式（D7）

- 网址加 `?no-images=true` → 关闭图片（写入 `localStorage`，可持久）。
- 关闭后：列表卡不显示头像、Hero 显示渐变占位、画廊显示提示；无图/加载失败均走玻璃拟态占位，绝不破图。
- 重新开启：`?no-images=false`。

---

## 6. 缓存

- 图片 URL 默认由 `image.js` 追加 `?v=<gameVersion>` 缓存破坏参数（与 JSON 策略一致）。
- 更新图片时，建议同步更新文件名或提升 `config.gameVersion`，以兑现缓存失效。
