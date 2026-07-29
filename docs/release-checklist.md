# 发布检查清单（Release Checklist）

> 配套 [`roadmap.md`](roadmap.md) 的「固定 Release 流程」，每次发布（模块完成 / 正式发布 / 重要补丁）前逐项勾选。
> 自 v1.0.0 起，发布前**强制双门禁**：数据健康门禁（静态）+ 无头自测（jsdom）。

## 0. 前置条件
- [ ] 当前分支为 `main`（或发布目标分支），工作区干净（无未提交调试代码）
- [ ] 已 `git pull` 最新（如有远程）

## 1. 开发完成
- [ ] 功能 / 模块实现完毕，代码完整（无伪代码、无 TODO 占位）
- [ ] 仅新增不改动已完成模块（模块化原则）

## 2. 自测（双门禁，必须全绿）
- [ ] 数据健康门禁：`node test/data-validator.js` → `PASS=114 FAIL=0`
- [ ] 无头自测：`node test/self-test.js` → `PASS=151 FAIL=0`
- [ ] 无控制台错误 / 无未捕获异常

## 3. Code Review
- [ ] 通读本次改动：命名 / 外键 / 受控词表 / 降级逻辑 / 性能
- [ ] 确认无编造（官方未说明字段一律 `null` → 【官方暂未说明】）
- [ ] 确认不破坏既有模块（自检回归）

## 4. 修复 Review 问题
- [ ] Review 发现的缺陷已修复并重新跑通双门禁

## 5. Git Commit
- [ ] 提交信息符合 [`development-guide.md`](development-guide.md) 规范（如 `feat(module): ...` / `fix: ...`）
- [ ] 仅提交本次发布相关文件

## 6. 更新 CHANGELOG.md
- [ ] 新增版本小节（含日期、模块 / 里程碑、要点）
- [ ] 区分「游戏版本更新」（`data/version.json`）与「仓库里程碑」

## 7. 更新 docs/roadmap.md
- [ ] 模块清单状态标记为 ✅ Released（含版本号）
- [ ] 质量门计数同步（自测 PASS 数）

## 8. 创建 Annotated Git Tag
- [ ] `git tag -a vX.Y.Z -m "..."`（annotated，含版本要点）
- [ ] 版本号遵循 SemVer（见 roadmap.md 「版本管理」）

## 9. Push 到 GitHub
- [ ] `git push origin main`
- [ ] `git push origin vX.Y.Z`（推送 tag）

## 10. 创建 GitHub Release
- [ ] ⚠️ 本环境无 `gh` CLI / `GITHUB_TOKEN`，**须用户手动在 GitHub 网页端创建 Release**（关联对应 tag）
- [ ] Release 说明可复用 CHANGELOG 对应小节

## 11. 标记 Released & 验证
- [ ] 本地 `git log` / `git tag` ≡ GitHub（tag 可见、commit 一致）
- [ ] 输出 Release Summary（版本 / tag / commit / 门禁结果 / 手动 Release 链接）

## 附录：常见遗漏
- 新增游戏版本：仅改 `data/version.json` 的 `gameVersions` 头部 + 对应数据文件 + `site.json.gameVersion`
- 新增站点里程碑：仅改 `data/version.json` 的 `siteVersions` 头部
- `id` 仅要求**模块内唯一**（不同模块可重名），跨模块关联走条目内 `*Id(s)`
- 数据文件变更后务必重跑 `test/data-validator.js`（外键 / 受控词表 / 命名 / 日期 / 版本一致性）
