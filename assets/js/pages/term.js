// term.js —— 术语详情页（?id=xxx）
// 详情页模板规范（后续角色/势力/地区详情页遵循同一结构）：
//   detail-hero（标题区）→ detail-section（信息分节）→ 关联区（rel-chips 优雅降级）→ 引用来源
// 外键解析原则：目标条目存在 → 可点击链接；不存在 → 灰态 chip 显示 id，绝不报错。
(function () {
  const UI = window.ZZZUI;

  // 外键目标数据集配置：字段 -> [数据逻辑名, 列表字段, 详情页逻辑名, 名称取值]
  const REL_SOURCES = {
    story:      ['story',      'story',      'chapter',   function (x) { return x.title; }],
    timeline:   ['timeline',   'events',     'timeline',  function (x) { return x.title; }],
    characters: ['characters', 'characters', 'character', function (x) { return x.name; }],
    factions:   ['factions',   'factions',   'faction',   function (x) { return x.name; }],
    locations:  ['locations',  'locations',  'location',  function (x) { return x.name; }],
    glossary:   ['glossary',   'terms',      'term',      function (x) { return x.name; }]
  };

  // 加载某数据集并建 id -> 条目 索引；加载失败返回空 Map（降级，不报错）
  async function loadIndex(key) {
    const cfg = REL_SOURCES[key];
    const d = await window.ZZZData.loadJSON(cfg[0]);
    const map = new Map();
    if (d && !d.__error) {
      (d[cfg[1]] || []).forEach(function (x) { if (x && x.id) map.set(x.id, x); });
    }
    return map;
  }

  // 渲染一组关联 chip：存在 → 链接；缺失 → 灰态降级
  function relChips(ids, key, index) {
    if (!ids || !ids.length) {
      return '<p class="rel-empty"><span class="unknown">' + UI.UNKNOWN + '</span></p>';
    }
    const cfg = REL_SOURCES[key];
    return '<div class="rel-chips">' + ids.map(function (id) {
      const item = index.get(id);
      const name = item ? (cfg[3](item) || id) : null;
      if (item && name) {
        return '<a class="rel-chip" href="' +
          window.ZZZRouter.buildLink(cfg[2], { id: id }) + '">' + UI.esc(name) + '</a>';
      }
      // 目标不存在或名称未录入：降级为不可点击 chip（保留 id 供追溯）
      return '<span class="rel-chip missing" title="目标条目暂未录入">' + UI.esc(id) + '</span>';
    }).join('') + '</div>';
  }

  // 单个外键（可能为 null）
  function relSingle(id, key, index) {
    return relChips(id ? [id] : [], key, index);
  }

  // 结构化 source 渲染：
  //   { type: "story", id } → 链接到章节
  //   { type: "official" | "game", title, url? } → 文本 + 可选外链
  function renderSource(source, storyIndex) {
    if (UI.isEmpty(source)) {
      return '<p class="rel-empty"><span class="unknown">' + UI.UNKNOWN + '</span></p>';
    }
    if (typeof source === 'string') {
      // 兼容旧字符串格式（向后兼容，不推荐新数据使用）
      return '<p class="source-text">' + UI.esc(source) + '</p>';
    }
    if (source.type === 'story' && source.id) {
      const chap = storyIndex.get(source.id);
      const label = chap && chap.title ? chap.title : source.id;
      return '<p class="source-text">剧情章节：<a class="rel-chip" href="' +
        window.ZZZRouter.buildLink('chapter', { id: source.id }) + '">' + UI.esc(label) + '</a></p>';
    }
    const typeLabel = { official: '官方资料', game: '游戏内文本', video: '官方视频' }[source.type] || '来源';
    let html = '<p class="source-text"><span class="badge badge-cyan">' + UI.esc(typeLabel) + '</span> ' +
      UI.esc(source.title || '');
    if (source.url) {
      html += ' <a class="source-link" href="' + UI.esc(source.url) +
        '" target="_blank" rel="noopener noreferrer">查看来源 ↗</a>';
    }
    return html + '</p>';
  }

  function section(title, body) {
    return '<section class="detail-section"><h2>' + UI.esc(title) + '</h2>' + body + '</section>';
  }

  async function init() {
    const c = document.getElementById('content');
    if (!c) return;
    const id = window.ZZZRouter.getParam('id');

    const d = await window.ZZZData.loadJSON('glossary');
    if (!d || d.__error) {
      UI.breadcrumb([{ label: '术语', href: window.ZZZ.pages.glossary }, { label: '详情' }]);
      c.innerHTML = UI.errorState(d && d.message);
      return;
    }

    const terms = d.terms || [];
    const meta = d.meta || {};
    const catLabel = {};
    const tagLabel = {};
    (meta.categories || []).forEach(function (x) { catLabel[x.id] = x.label; });
    (meta.tags || []).forEach(function (x) { tagLabel[x.id] = x.label; });

    const t = terms.find(function (x) { return x.id === id; });
    if (!t) {
      UI.breadcrumb([{ label: '术语', href: window.ZZZ.pages.glossary }, { label: '未找到' }]);
      c.innerHTML = UI.emptyState('未找到指定术语（id=' + (id || '空') + '），请从术语列表进入。');
      return;
    }

    UI.breadcrumb([
      { label: '术语', href: window.ZZZ.pages.glossary },
      { label: t.name || t.id }
    ]);
    document.title = (t.name || t.id) + ' | 术语 | 绝区零 Wiki';

    // 并行加载所有外键目标数据集索引（任一失败均降级为空索引）
    const keys = ['story', 'timeline', 'characters', 'factions', 'locations', 'glossary'];
    const indexes = {};
    const loaded = await Promise.all(keys.map(loadIndex));
    keys.forEach(function (k, i) { indexes[k] = loaded[i]; });

    // ---------- Hero ----------
    const subNames = [t.nameEn, t.nameJa].filter(Boolean).join(' / ');
    const tags = (t.tags || []).map(function (x) {
      return '<span class="tag">' + UI.esc(tagLabel[x] || x) + '</span>';
    }).join('');
    let html =
      '<section class="detail-hero term-hero"><div>' +
        '<h1>' + UI.esc(t.name || t.id) + '</h1>' +
        (subNames ? '<p class="term-hero-sub">' + UI.esc(subNames) + '</p>' : '') +
        '<div class="term-hero-meta">' +
          UI.badge(catLabel[t.category] || t.category, 'cyan') +
          (t.official === true ? UI.badge('官方设定', 'purple') : '') +
          (t.introducedVersion ? UI.badge('Ver ' + t.introducedVersion + ' 加入', 'magenta') : '') +
          tags +
        '</div>' +
      '</div></section>';

    // ---------- 基本信息 ----------
    html += section('基本信息',
      UI.field('中文名称', t.name) +
      UI.field('英文名称', t.nameEn) +
      UI.field('日文名称', t.nameJa) +
      UI.fieldList('别名', t.aliases) +
      UI.field('分类', catLabel[t.category] || t.category) +
      UI.field('首次出现版本', t.introducedVersion) +
      UI.field('资料更新时间', t.updatedAt)
    );

    // ---------- 官方定义 ----------
    html += section('官方定义',
      UI.isEmpty(t.description)
        ? '<p class="rel-empty"><span class="unknown">' + UI.UNKNOWN + '</span></p>'
        : '<p class="term-desc">' + UI.esc(t.description) + '</p>'
    );

    // ---------- 关联区 ----------
    html += section('关联剧情',
      '<div class="rel-row"><span class="rel-label">首次出现章节</span>' +
        relSingle(t.introducedStoryId, 'story', indexes.story) + '</div>' +
      '<div class="rel-row"><span class="rel-label">首次出现时间线</span>' +
        relSingle(t.introducedTimelineId, 'timeline', indexes.timeline) + '</div>');
    html += section('关联人物', relChips(t.relatedCharacterIds, 'characters', indexes.characters));
    html += section('关联势力', relChips(t.relatedFactionIds, 'factions', indexes.factions));
    html += section('关联地区', relChips(t.relatedLocationIds, 'locations', indexes.locations));
    html += section('关联术语', relChips(t.relatedTermIds, 'glossary', indexes.glossary));

    // ---------- 引用来源 ----------
    html += section('引用来源', renderSource(t.source, indexes.story));

    c.innerHTML = html;
  }

  document.addEventListener('DOMContentLoaded', init);
})();
