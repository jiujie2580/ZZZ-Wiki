// data-validator.js —— 数据健康静态门禁（v1.0.0 D5 决策）
// 零依赖（仅 Node 内置模块），不渲染页面，只做数据层静态校验：
//   1. JSON 可解析 + 顶层结构（列表字段存在且为数组）
//   2. id 规范（模块内唯一 + kebab-case；version.json 的 id 允许含「.」以表达版本号）
//   3. 外键完整性（docs/json-schema.md §3 全部关系，指向的 id 必须存在）
//   4. 受控词表合法性（type/category/era/attribute/rarity/tags 必须在 config.js 词表内）
//   5. source 结构（结构化对象 type ∈ official/game/video/story，或旧版字符串，或 null）
//   6. 日期格式（date/releaseDate/updatedAt 非 null 时必须为 YYYY-MM-DD）
//   7. version.json 新结构（gameVersions/siteVersions，见 §2.2）与 site.json 一致性
// 运行：node test/data-validator.js
// 退出码：0 = 全部通过；1 = 存在 FAIL（Release 流程中作为固定门禁，FAIL 即阻断）
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');

let pass = 0, fail = 0, warn = 0;
function ok(msg) { pass++; console.log('  PASS ' + msg); }
function bad(msg) { fail++; console.log('  FAIL ' + msg); }
function note(msg) { warn++; console.log('  WARN ' + msg); }
function check(cond, msg) { cond ? ok(msg) : bad(msg); }

// ---------- 载入 config.js（浏览器脚本，用假 window 执行取 window.ZZZ） ----------
function loadConfig() {
  const src = fs.readFileSync(path.join(ROOT, 'assets', 'js', 'config.js'), 'utf-8');
  const fakeWindow = {};
  new Function('window', src)(fakeWindow);
  return fakeWindow.ZZZ;
}

// ---------- 通用工具 ----------
const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;            // 常规内容 id
const KEBAB_VER = /^[a-z0-9]+([.-][a-z0-9]+)*$/;     // version.json 专用（允许 . 表达版本号）
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const SOURCE_TYPES = ['official', 'game', 'video', 'story'];

function loadJSON(name) {
  const p = path.join(DATA_DIR, name + '.json');
  const text = fs.readFileSync(p, 'utf-8');
  return JSON.parse(text);
}

function vocabIds(list) { return (list || []).map(function (v) { return v.id; }); }

function checkIds(entries, label, idRe) {
  const re = idRe || KEBAB;
  const seen = new Set();
  let dup = 0, badFmt = 0, missing = 0;
  entries.forEach(function (e) {
    if (!e.id || typeof e.id !== 'string') { missing++; return; }
    if (!re.test(e.id)) badFmt++;
    if (seen.has(e.id)) dup++;
    seen.add(e.id);
  });
  check(missing === 0, label + '：所有条目均有字符串 id（缺失 ' + missing + '）');
  check(badFmt === 0, label + '：id 全部符合命名规范（违规 ' + badFmt + '）');
  check(dup === 0, label + '：id 模块内唯一（重复 ' + dup + '）');
  return seen;
}

function checkVocab(entries, field, allowed, label, allowNull) {
  const set = new Set(allowed);
  const badVals = [];
  entries.forEach(function (e) {
    const v = e[field];
    if (v == null) { if (!allowNull) badVals.push(e.id + ':null'); return; }
    if (!set.has(v)) badVals.push(e.id + ':' + v);
  });
  check(badVals.length === 0, label + '.' + field + ' 全部在受控词表内' +
    (badVals.length ? '（违规：' + badVals.join(', ') + '）' : ''));
}

function checkFK(entries, field, targetSet, label, single) {
  let dangling = [];
  entries.forEach(function (e) {
    if (single) {
      const v = e[field];
      if (v != null && !targetSet.has(v)) dangling.push(e.id + '→' + v);
    } else {
      (e[field] || []).forEach(function (v) {
        if (v != null && !targetSet.has(v)) dangling.push(e.id + '→' + v);
      });
    }
  });
  check(dangling.length === 0, label + '.' + field + ' 外键完整' +
    (dangling.length ? '（悬空：' + dangling.join(', ') + '）' : ''));
}

function checkSource(entries, label) {
  const badSrc = [];
  entries.forEach(function (e) {
    const s = e.source;
    if (s == null) return;                       // null 合法 → 渲染【官方暂未说明】
    if (typeof s === 'string') return;           // 旧版字符串兼容
    if (typeof s === 'object') {
      if (!SOURCE_TYPES.includes(s.type)) badSrc.push(e.id + ':type=' + s.type);
      return;
    }
    badSrc.push(e.id + ':' + typeof s);
  });
  check(badSrc.length === 0, label + '.source 结构合法' +
    (badSrc.length ? '（违规：' + badSrc.join(', ') + '）' : ''));
}

function checkDates(entries, fields, label) {
  const badDates = [];
  entries.forEach(function (e) {
    fields.forEach(function (f) {
      const v = e[f];
      if (v != null && (typeof v !== 'string' || !DATE_RE.test(v))) {
        badDates.push(e.id + '.' + f + '=' + v);
      }
    });
  });
  check(badDates.length === 0, label + ' 日期字段格式合法（YYYY-MM-DD 或 null）' +
    (badDates.length ? '（违规：' + badDates.join(', ') + '）' : ''));
}

// ---------- 主流程 ----------
(function main() {
  console.log('=== ZZZ-Wiki 数据健康门禁（data-validator）===\n');

  // 0. config.js 可加载
  console.log('--- 0. 配置加载 ---');
  let ZZZ;
  try {
    ZZZ = loadConfig();
    check(!!(ZZZ && ZZZ.dataFiles && ZZZ.storyTypes), 'config.js 可加载且含受控词表');
  } catch (e) {
    bad('config.js 加载失败：' + e.message);
    console.log('\n=== 结果：PASS=' + pass + ' FAIL=' + fail + ' WARN=' + warn + ' ===');
    process.exit(1);
  }

  // 1. JSON 可解析 + 顶层结构
  console.log('\n--- 1. JSON 解析与顶层结构 ---');
  const FILES = {
    site: null, version: null, story: 'story', characters: 'characters',
    factions: 'factions', locations: 'locations', glossary: 'terms',
    timeline: 'events', worldview: 'entries',
    enemies: 'enemies', bangboo: 'bangboos', 'w-engines': 'wEngines', 'drive-discs': 'driveDiscs'
  };
  const data = {};
  let parseFailed = false;
  Object.keys(FILES).forEach(function (name) {
    try {
      data[name] = loadJSON(name);
      ok('data/' + name + '.json 解析成功');
    } catch (e) {
      bad('data/' + name + '.json 解析失败：' + e.message);
      parseFailed = true;
    }
  });
  if (parseFailed) {
    console.log('\n=== 结果：PASS=' + pass + ' FAIL=' + fail + ' WARN=' + warn + ' ===');
    process.exit(1);
  }
  // 列表字段存在且为数组
  Object.keys(FILES).forEach(function (name) {
    const listField = FILES[name];
    if (!listField) return;
    check(Array.isArray(data[name][listField]),
      'data/' + name + '.json 列表字段 `' + listField + '` 为数组');
  });
  // site.json 结构
  check(data.site && typeof data.site.site === 'object' && Array.isArray(data.site.nav),
    'data/site.json 含 site 对象与 nav 数组');
  // version.json 新结构（§2.2 v1.0.0）
  check(Array.isArray(data.version.gameVersions), 'data/version.json 含 gameVersions 数组');
  check(Array.isArray(data.version.siteVersions), 'data/version.json 含 siteVersions 数组');

  const story = data.story.story || [];
  const characters = data.characters.characters || [];
  const factions = data.factions.factions || [];
  const locations = data.locations.locations || [];
  const terms = data.glossary.terms || [];
  const events = data.timeline.events || [];
  const entries = data.worldview.entries || [];
  const gameVersions = data.version.gameVersions || [];
  const siteVersions = data.version.siteVersions || [];

  // 2. id 规范（模块内唯一 + kebab-case）
  console.log('\n--- 2. id 规范（模块内唯一 + kebab-case）---');
  const ids = {
    story: checkIds(story, 'story'),
    characters: checkIds(characters, 'characters'),
    factions: checkIds(factions, 'factions'),
    locations: checkIds(locations, 'locations'),
    terms: checkIds(terms, 'glossary.terms'),
    events: checkIds(events, 'timeline.events'),
    entries: checkIds(entries, 'worldview.entries'),
    gameVersions: checkIds(gameVersions, 'version.gameVersions', KEBAB_VER),
    siteVersions: checkIds(siteVersions, 'version.siteVersions', KEBAB_VER)
  };

  // 3. 外键完整性（json-schema.md §3 全部关系）
  console.log('\n--- 3. 外键完整性 ---');
  checkFK(characters, 'factionId', ids.factions, 'characters', true);
  checkFK(characters, 'storyIds', ids.story, 'characters');
  checkFK(characters, 'termIds', ids.terms, 'characters');
  checkFK(characters, 'timelineIds', ids.events, 'characters');
  checkFK(factions, 'memberIds', ids.characters, 'factions');
  checkFK(factions, 'relatedFactionIds', ids.factions, 'factions');
  checkFK(factions, 'relatedLocationIds', ids.locations, 'factions');
  checkFK(factions, 'relatedTermIds', ids.terms, 'factions');
  checkFK(locations, 'parentId', ids.locations, 'locations', true);
  checkFK(story, 'participantIds', ids.characters, 'story');
  checkFK(story, 'factionIds', ids.factions, 'story');
  checkFK(story, 'locationIds', ids.locations, 'story');
  checkFK(story, 'termIds', ids.terms, 'story');
  checkFK(story, 'timelineIds', ids.events, 'story');
  checkFK(events, 'relatedStoryIds', ids.story, 'timeline');
  checkFK(events, 'relatedFactionIds', ids.factions, 'timeline');
  checkFK(events, 'relatedTermIds', ids.terms, 'timeline');
  checkFK(events, 'locationIds', ids.locations, 'timeline');
  checkFK(terms, 'introducedStoryId', ids.story, 'glossary', true);
  checkFK(terms, 'introducedTimelineId', ids.events, 'glossary', true);
  checkFK(terms, 'relatedTermIds', ids.terms, 'glossary');
  checkFK(terms, 'relatedCharacterIds', ids.characters, 'glossary');
  checkFK(terms, 'relatedFactionIds', ids.factions, 'glossary');
  checkFK(terms, 'relatedLocationIds', ids.locations, 'glossary');
  checkFK(entries, 'relatedTimelineIds', ids.events, 'worldview');
  checkFK(entries, 'relatedFactionIds', ids.factions, 'worldview');
  checkFK(entries, 'relatedLocationIds', ids.locations, 'worldview');
  checkFK(entries, 'relatedTermIds', ids.terms, 'worldview');
  checkFK(entries, 'relatedStoryIds', ids.story, 'worldview');

  // 4. 受控词表合法性
  console.log('\n--- 4. 受控词表合法性 ---');
  checkVocab(story, 'type', vocabIds(ZZZ.storyTypes), 'story');
  checkVocab(characters, 'attribute', vocabIds(ZZZ.characterAttributes), 'characters', true);
  checkVocab(characters, 'rarity', vocabIds(ZZZ.characterRarities), 'characters', true);
  checkVocab(factions, 'category', vocabIds(ZZZ.factionCategories), 'factions');
  checkVocab(locations, 'category', vocabIds(ZZZ.locationCategories), 'locations');
  checkVocab(events, 'era', vocabIds(ZZZ.timelineEras), 'timeline');
  checkVocab(events, 'category', vocabIds(ZZZ.timelineCategories), 'timeline');
  checkVocab(entries, 'category', vocabIds(ZZZ.worldviewCategories), 'worldview');
  // glossary 词表在其自身 meta 内
  const gMeta = data.glossary.meta || {};
  checkVocab(terms, 'category', vocabIds(gMeta.categories), 'glossary');
  (function () {
    const tagSet = new Set(vocabIds(gMeta.tags));
    const badTags = [];
    terms.forEach(function (t) {
      (t.tags || []).forEach(function (tag) { if (!tagSet.has(tag)) badTags.push(t.id + ':' + tag); });
    });
    check(badTags.length === 0, 'glossary.tags 全部在 meta.tags 词表内' +
      (badTags.length ? '（违规：' + badTags.join(', ') + '）' : ''));
  })();

  // 5. source 结构
  console.log('\n--- 5. source 结构 ---');
  checkSource(story, 'story');
  checkSource(factions, 'factions');
  checkSource(locations, 'locations');
  checkSource(terms, 'glossary');
  checkSource(events, 'timeline');
  checkSource(entries, 'worldview');

  // 6. 日期格式
  console.log('\n--- 6. 日期格式 ---');
  checkDates(story, ['releaseDate', 'updatedAt'], 'story');
  checkDates(factions, ['updatedAt'], 'factions');
  checkDates(locations, ['updatedAt'], 'locations');
  checkDates(terms, ['updatedAt'], 'glossary');
  checkDates(events, ['date', 'updatedAt'], 'timeline');
  checkDates(entries, ['updatedAt'], 'worldview');
  checkDates(gameVersions, ['date'], 'version.gameVersions');
  checkDates(siteVersions, ['date'], 'version.siteVersions');

  // 7. version.json 内容规则 + site.json 一致性
  console.log('\n--- 7. version.json / site.json 一致性 ---');
  (function () {
    const badV = [];
    gameVersions.forEach(function (v) {
      if (typeof v.version !== 'string' || !v.version) badV.push(v.id + ':version');
      if (v.title !== null && typeof v.title !== 'string') badV.push(v.id + ':title');
    });
    check(badV.length === 0, 'gameVersions 条目字段类型合法（version 必填字符串，title 字符串或 null）' +
      (badV.length ? '（违规：' + badV.join(', ') + '）' : ''));
    const verSet = new Set();
    let dupV = 0;
    gameVersions.forEach(function (v) { if (verSet.has(v.version)) dupV++; verSet.add(v.version); });
    check(dupV === 0, 'gameVersions.version 无重复（重复 ' + dupV + '）');

    const badS = [];
    siteVersions.forEach(function (v) {
      if (typeof v.version !== 'string' || !v.version) badS.push(v.id + ':version');
      if (v.title !== null && typeof v.title !== 'string') badS.push(v.id + ':title');
    });
    check(badS.length === 0, 'siteVersions 条目字段类型合法' +
      (badS.length ? '（违规：' + badS.join(', ') + '）' : ''));

    // 当前游戏版本必须已收录
    check(verSet.has(ZZZ.gameVersion),
      '当前游戏版本 ' + ZZZ.gameVersion + '（config.gameVersion）已收录于 gameVersions');
    // site.json 与 config.js 的 gameVersion 一致
    check(data.site.site.gameVersion === ZZZ.gameVersion,
      'site.json gameVersion(' + data.site.site.gameVersion + ') 与 config.gameVersion(' + ZZZ.gameVersion + ') 一致');
    // site.json 站点版本必须已收录于 siteVersions
    const siteVerSet = new Set(siteVersions.map(function (v) { return v.version; }));
    check(siteVerSet.has(data.site.site.version),
      'site.json version(' + data.site.site.version + ') 已收录于 siteVersions');
  })();

  // 8. 数据规模概览（信息性输出，不计 PASS/FAIL）
  console.log('\n--- 8. 数据规模概览 ---');
  console.log('  INFO story=' + story.length + ' characters=' + characters.length +
    ' factions=' + factions.length + ' locations=' + locations.length +
    ' terms=' + terms.length + ' events=' + events.length + ' worldview=' + entries.length +
    ' gameVersions=' + gameVersions.length + ' siteVersions=' + siteVersions.length);

  console.log('\n=== 结果：PASS=' + pass + '  FAIL=' + fail + '  WARN=' + warn + ' ===');
  process.exit(fail === 0 ? 0 : 1);
})();
