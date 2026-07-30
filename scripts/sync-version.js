// sync-version.js —— 站点版本信息同步脚本（v1.1.2 D4 决策）
// 定位：Release 流程第 6.5 步的「人工执行」脚本，不是构建步骤，不引入任何依赖。
// 职责：以 CHANGELOG.md 顶部版本为单一事实源，同步：
//   1. data/site.json        → site.version / site.updatedAt
//   2. data/version.json     → siteVersions 若缺失该版本则在数组头部补录占位条目
// 之后由 test/data-validator.js 校验三方一致（CHANGELOG ≡ site.json ≡ siteVersions[0]）。
// 运行：node scripts/sync-version.js
// 退出码：0 = 同步完成（或已一致）；1 = CHANGELOG 无法解析
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function readJSON(p) { return JSON.parse(fs.readFileSync(p, 'utf-8')); }
function writeJSON(p, obj) { fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n', 'utf-8'); }
function today() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return d.getFullYear() + '-' + mm + '-' + dd;
}

(function main() {
  console.log('=== ZZZ-Wiki 版本同步（sync-version）===\n');

  // 1. 解析 CHANGELOG 顶部版本（第一个 "## vX.Y.Z" 标题 + 其下第一条列表项作为标题）
  const changelog = fs.readFileSync(path.join(ROOT, 'CHANGELOG.md'), 'utf-8');
  const m = changelog.match(/^## v(\d+\.\d+\.\d+)\s*$/m);
  if (!m) {
    console.error('FAIL 无法从 CHANGELOG.md 解析顶部版本号（期望形如 "## v1.2.3" 的标题）');
    process.exit(1);
  }
  const version = m[1];
  const after = changelog.slice(m.index + m[0].length);
  const titleMatch = after.match(/^\s*-\s*(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : null;
  console.log('CHANGELOG 顶部版本：v' + version + (title ? '（' + title + '）' : ''));

  // 2. 同步 site.json
  const sitePath = path.join(ROOT, 'data', 'site.json');
  const site = readJSON(sitePath);
  let siteChanged = false;
  if (site.site.version !== version) {
    console.log('site.json version: ' + site.site.version + ' → ' + version);
    site.site.version = version;
    siteChanged = true;
  }
  if (site.site.updatedAt !== today()) {
    console.log('site.json updatedAt: ' + site.site.updatedAt + ' → ' + today());
    site.site.updatedAt = today();
    siteChanged = true;
  }
  if (siteChanged) {
    // 保留原始缩进风格（site.json 使用 2 空格，nav 数组为紧凑单行对象），
    // 为避免破坏手工排版，这里做最小替换而非整体重写。
    let raw = fs.readFileSync(sitePath, 'utf-8');
    raw = raw.replace(/("version":\s*")[^"]*(")/, '$1' + version + '$2');
    raw = raw.replace(/("updatedAt":\s*")[^"]*(")/, '$1' + today() + '$2');
    fs.writeFileSync(sitePath, raw, 'utf-8');
    console.log('OK   site.json 已更新');
  } else {
    console.log('OK   site.json 已一致，无需修改');
  }

  // 3. version.json：siteVersions 缺失则补录占位条目（title 取自 CHANGELOG，highlights 留待人工完善）
  const verPath = path.join(ROOT, 'data', 'version.json');
  const ver = readJSON(verPath);
  const exists = (ver.siteVersions || []).some(function (v) { return v.version === version; });
  if (!exists) {
    ver.siteVersions.unshift({
      id: 'site-v' + version,
      version: version,
      title: title || null,
      date: today(),
      highlights: []
    });
    writeJSON(verPath, ver);
    console.log('OK   version.json siteVersions 已补录 site-v' + version + '（highlights 请人工完善）');
  } else {
    console.log('OK   version.json 已含 v' + version + '，无需补录');
  }

  console.log('\n=== 同步完成。请运行 node test/data-validator.js 验证三方一致 ===');
  process.exit(0);
})();
