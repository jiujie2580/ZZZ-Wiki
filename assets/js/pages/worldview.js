// worldview.js —— 世界观（列表 + ?id 单页详情，D3 决策：不新增独立详情页）
// 数据源：data/worldview.json（entries）；category 受控词表来自 config.worldviewCategories（单一数据源，禁止硬编码）
// 列表：搜索（title/titleEn/aliases/summary）+ 分类 chips + 排序（分类顺序默认 / 名称 / 最近更新）+ 卡片网格
// 详情：hero → 基本信息 → 设定正文（spoiler 折叠，复用 Story D5 模式）→ 关联时间线/势力/地区/术语/剧情 → 来源 → 计算式上/下条目导航
// 复用 components.js 共享原语：relChips / loadRelIndex / renderSource / section / field / fieldList / badge / breadcrumb / emptyState / errorState
(function () {
  var UI = window.ZZZUI;

  var state = { q: '', category: 'all', sort: 'category' };

  var entries = [];
  var catDefs = [], catLabel = {}, catOrder = {};

  function esc(s) { return UI.esc(s == null ? '' : s); }
  function isEmpty(v) { return UI.isEmpty(v); }

  function buildVocab() {
    catDefs = (window.ZZZ && window.ZZZ.worldviewCategories) || [];
    catDefs.forEach(function (x, i) { catLabel[x.id] = x.label; catOrder[x.id] = i; });
  }

  // ---------- 筛选 / 排序 ----------
  function matches(e) {
    if (state.category !== 'all' && e.category !== state.category) return false;
    if (state.q) {
      var q = state.q.toLowerCase();
      var hay = [e.title, e.titleEn, (e.aliases || []).join(' '), e.summary].filter(Boolean).join(' ').toLowerCase();
      if (hay.indexOf(q) === -1) return false;
    }
    return true;
  }

  // 分类顺序（默认）：受控词表序 → 标题序（稳定，供上/下条目导航共用）
  function categoryCmp(a, b) {
    var oa = catOrder[a.category] == null ? 99 : catOrder[a.category];
    var ob = catOrder[b.category] == null ? 99 : catOrder[b.category];
    if (oa !== ob) return oa - ob;
    return (a.title || a.id).localeCompare(b.title || b.id, 'zh-Hans-CN');
  }

  function sortList(list) {
    var arr = list.slice();
    if (state.sort === 'name') {
      arr.sort(function (a, b) { return (a.title || a.id).localeCompare(b.title || b.id, 'zh-Hans-CN'); });
    } else if (state.sort === 'updated') {
      arr.sort(function (a, b) { return (b.updatedAt || '').localeCompare(a.updatedAt || ''); });
    } else {
      arr.sort(categoryCmp);
    }
    return arr;
  }

  // ---------- 列表 ----------
  function cardHTML(e) {
    var href = window.ZZZRouter.buildLink('worldview', { id: e.id });
    var badge = e.category
      ? '<span class="badge badge-wv-' + esc(e.category) + '">' + esc(catLabel[e.category] || e.category) + '</span>'
      : '';
    var spoiler = e.spoiler ? '<span class="badge badge-spoiler">剧透</span>' : '';
    var summary = isEmpty(e.summary) ? '<span class="unknown">' + UI.UNKNOWN + '</span>' : esc(e.summary);
    return '<a class="worldview-card" href="' + href + '">' +
      '<div class="worldview-card-head">' +
        '<h3 class="worldview-card-title">' + esc(e.title || e.id) + '</h3>' +
        '<div class="worldview-card-badges">' + badge + spoiler + '</div>' +
      '</div>' +
      (e.titleEn ? '<p class="worldview-card-sub">' + esc(e.titleEn) + '</p>' : '') +
      '<p class="worldview-card-summary">' + summary + '</p>' +
    '</a>';
  }

  function renderList() {
    var box = document.getElementById('worldview-grid');
    if (!box) return;
    var list = sortList(entries.filter(matches));
    var count = document.getElementById('worldview-count');
    if (count) count.textContent = '共 ' + list.length + ' 个条目';
    box.innerHTML = list.length
      ? '<div class="worldview-grid">' + list.map(cardHTML).join('') + '</div>'
      : UI.emptyState('没有符合条件的世界观条目，试试调整筛选条件');
  }

  function renderToolbar() {
    var catChips = catDefs.map(function (d) {
      return '<button type="button" class="tag" data-cat="' + esc(d.id) + '">' + esc(d.label) + '</button>';
    }).join('');
    return '<div class="glossary-toolbar" role="search">' +
      '<div class="glossary-search"><input type="search" id="worldview-q" placeholder="搜索世界观（标题、别名、简介）" aria-label="搜索世界观"></div>' +
      '<div class="filter-group" aria-label="分类筛选"><span class="filter-label">分类</span><div class="filter-bar" id="worldview-cats">' +
        '<button type="button" class="tag active" data-cat="all">全部</button>' + catChips + '</div></div>' +
      '<div class="filter-group" aria-label="排序"><span class="filter-label">排序</span><div class="filter-bar" id="worldview-sort">' +
        '<button type="button" class="tag active" data-sort="category">分类顺序</button>' +
        '<button type="button" class="tag" data-sort="name">名称排序</button>' +
        '<button type="button" class="tag" data-sort="updated">最近更新</button>' +
      '</div></div>' +
      '<div class="glossary-count" id="worldview-count" aria-live="polite"></div>' +
    '</div>';
  }

  function bindChipGroup(groupId, attr, handler) {
    var group = document.getElementById(groupId);
    if (!group) return;
    group.addEventListener('click', function (e) {
      var btn = e.target.closest('[' + attr + ']');
      if (!btn) return;
      handler(btn.getAttribute(attr));
      group.querySelectorAll('.tag').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      renderList();
    });
  }

  function bindListEvents() {
    var q = document.getElementById('worldview-q');
    if (q) q.addEventListener('input', function () { state.q = q.value.trim(); renderList(); });
    bindChipGroup('worldview-cats', 'data-cat', function (v) { state.category = v; });
    bindChipGroup('worldview-sort', 'data-sort', function (v) { state.sort = v; });
  }

  // ---------- 详情 ----------
  // 上/下条目：按「分类词表序 → 标题序」全量计算（不存 prevId/nextId）
  function renderNav(prev, next) {
    if (!prev && !next) return '';
    var html = '<div class="chapter-nav">';
    if (prev) {
      html += '<a class="chapter-nav-link prev" href="' + window.ZZZRouter.buildLink('worldview', { id: prev.id }) + '">' +
        '<span class="chapter-nav-dir">← 上一个条目</span><span class="chapter-nav-title">' + esc(prev.title || prev.id) + '</span></a>';
    }
    if (next) {
      html += '<a class="chapter-nav-link next" href="' + window.ZZZRouter.buildLink('worldview', { id: next.id }) + '">' +
        '<span class="chapter-nav-dir">下一个条目 →</span><span class="chapter-nav-title">' + esc(next.title || next.id) + '</span></a>';
    }
    return html + '</div>';
  }

  function descriptionHTML(e) {
    if (isEmpty(e.description)) {
      return isEmpty(e.summary)
        ? '<p class="rel-empty"><span class="unknown">' + UI.UNKNOWN + '</span></p>'
        : '<p class="term-desc">' + esc(e.summary) + '</p>';
    }
    var body = '<p class="term-desc">' + esc(e.description) + '</p>';
    if (e.spoiler) {
      // 剧透折叠（Story D5 方案 A）：默认折叠，用户主动展开
      return '<div class="worldview-spoiler">' +
        '<button type="button" class="spoiler-toggle" id="worldview-spoiler-toggle">显示剧透内容 ▾</button>' +
        '<div class="spoiler-body" id="worldview-spoiler-body" hidden>' + body + '</div>' +
      '</div>';
    }
    return body;
  }

  function bindSpoiler() {
    var btn = document.getElementById('worldview-spoiler-toggle');
    var body = document.getElementById('worldview-spoiler-body');
    if (!btn || !body) return;
    btn.addEventListener('click', function () {
      var hidden = body.hasAttribute('hidden');
      if (hidden) { body.removeAttribute('hidden'); btn.textContent = '收起剧透内容 ▴'; }
      else { body.setAttribute('hidden', ''); btn.textContent = '显示剧透内容 ▾'; }
    });
  }

  async function renderDetail(id) {
    var c = document.getElementById('content');
    var e = entries.find(function (x) { return x.id === id; });
    if (!e) {
      UI.breadcrumb([{ label: '世界观', href: window.ZZZ.pages.worldview }, { label: '未找到' }]);
      c.innerHTML = UI.emptyState('未找到指定世界观条目（id=' + esc(id || '空') + '），请从世界观列表进入。');
      return;
    }
    UI.breadcrumb([{ label: '世界观', href: window.ZZZ.pages.worldview }, { label: e.title || e.id }]);
    document.title = (e.title || e.id) + ' | 世界观 | 绝区零 Wiki';

    // 关联索引（目标缺失优雅降级）
    var keys = ['timeline', 'factions', 'locations', 'glossary', 'story'];
    var loaded = await Promise.all(keys.map(UI.loadRelIndex));
    var idx = {};
    keys.forEach(function (k, i) { idx[k] = loaded[i]; });

    var ordered = entries.slice().sort(categoryCmp);
    var i = ordered.findIndex(function (x) { return x.id === id; });
    var prev = i > 0 ? ordered[i - 1] : null;
    var next = (i >= 0 && i < ordered.length - 1) ? ordered[i + 1] : null;

    var catBadge = e.category
      ? '<span class="badge badge-wv-' + esc(e.category) + '">' + esc(catLabel[e.category] || e.category) + '</span>'
      : '';
    var spoilerBadge = e.spoiler ? '<span class="badge badge-spoiler">剧透</span>' : '';

    var html =
      '<a class="back-link" href="' + window.ZZZ.pages.worldview + '">← 返回世界观</a>' +
      '<section class="detail-hero worldview-hero"><div>' +
        '<h1>' + esc(e.title || e.id) + '</h1>' +
        (e.titleEn ? '<p class="term-hero-sub">' + esc(e.titleEn) + '</p>' : '') +
        '<div class="term-hero-meta">' + catBadge + spoilerBadge + '</div>' +
      '</div></section>';

    // 基本信息
    html += UI.section('基本信息',
      UI.field('标题', e.title) +
      UI.field('英文标题', e.titleEn) +
      UI.fieldList('别名', e.aliases) +
      UI.field('分类', catLabel[e.category] || e.category) +
      UI.field('首次披露版本', e.introducedVersion) +
      UI.field('资料更新时间', e.updatedAt)
    );

    // 设定正文（spoiler 折叠）
    html += UI.section('设定详情', descriptionHTML(e));

    // 关联区（5 路外键，relChips 降级）
    html += UI.section('关联时间线', UI.relChips(e.relatedTimelineIds, 'timeline', idx.timeline));
    html += UI.section('关联势力', UI.relChips(e.relatedFactionIds, 'factions', idx.factions));
    html += UI.section('关联地区', UI.relChips(e.relatedLocationIds, 'locations', idx.locations));
    html += UI.section('关联术语', UI.relChips(e.relatedTermIds, 'glossary', idx.glossary));
    html += UI.section('关联剧情', UI.relChips(e.relatedStoryIds, 'story', idx.story));

    // 来源 + 上/下条目导航
    html += UI.section('引用来源', UI.renderSource(e.source, idx.story));
    html += renderNav(prev, next);

    c.innerHTML = html;
    bindSpoiler();
  }

  // ---------- 入口 ----------
  async function init() {
    var c = document.getElementById('content');
    if (!c) return;
    buildVocab();
    var id = window.ZZZRouter.getParam('id');

    var d = await window.ZZZData.loadJSON('worldview');
    if (!d || d.__error) { c.innerHTML = UI.errorState(d && d.message); return; }
    entries = d.entries || [];

    if (id) { await renderDetail(id); return; }

    UI.breadcrumb([{ label: '世界观' }]);
    c.innerHTML =
      '<section class="page-hero"><h1>世界观</h1>' +
      '<p class="hero-sub">旧文明、空洞、以太与新艾利都的官方设定汇编 · 缺失信息标注' + UI.UNKNOWN + '</p></section>' +
      renderToolbar() +
      '<div id="worldview-grid"></div>';
    bindListEvents();
    renderList();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
