// timeline.js —— 时间线（列表 + ?id 详情）
// 数据源：data/timeline.json；era/category 受控词表来自 config.timelineEras / timelineCategories（单一数据源，禁止硬编码）
// 交互：搜索 + 纪元筛选 + 分类筛选 + 排序（时间顺序默认 / 分类 / 名称）+ 纵向时间轴卡片展开 + ?id 详情（自动展开高亮 + 上/下事件导航）
// 复用 components.js 共享原语：relChips / loadRelIndex / renderSource / section / badge / breadcrumb / emptyState / errorState / placeholderPage
(function () {
  var UI = window.ZZZUI;
  var UNKNOWN = '【官方暂未说明】';

  // 页面状态（仅本页内存态，不污染全局）
  var state = { q: '', era: 'all', category: 'all', sort: 'chrono' };

  var events = [];
  var eraDefs = [], catDefs = [];
  var eraLabel = {}, catLabel = {}, eraOrder = {};
  var idxStory, idxFaction, idxTerm, idxLocation;

  function esc(s) { return UI.esc(s == null ? '' : s); }
  function isEmpty(v) { return UI.isEmpty(v); }

  function buildVocab() {
    eraDefs = (window.ZZZ && window.ZZZ.timelineEras) || [];
    catDefs = (window.ZZZ && window.ZZZ.timelineCategories) || [];
    eraDefs.forEach(function (x, i) { eraLabel[x.id] = x.label; eraOrder[x.id] = i; });
    catDefs.forEach(function (x) { catLabel[x.id] = x.label; });
  }

  function dateText(e) {
    if (e.date) return e.date;
    if (e.dateText) return e.dateText;
    return null;
  }

  // ---------- 筛选 / 排序 ----------
  function matches(e) {
    if (state.era !== 'all' && e.era !== state.era) return false;
    if (state.category !== 'all' && e.category !== state.category) return false;
    if (state.q) {
      var q = state.q.toLowerCase();
      var hay = [e.title, e.titleEn, e.description, e.dateText].filter(Boolean).join(' ').toLowerCase();
      if (hay.indexOf(q) === -1) return false;
    }
    return true;
  }

  // 时间顺序：纪元序号 → 精确日期 → 原始录入顺序（保证稳定）
  function chronoCmp(a, b) {
    var oa = eraOrder[a.era] == null ? 99 : eraOrder[a.era];
    var ob = eraOrder[b.era] == null ? 99 : eraOrder[b.era];
    if (oa !== ob) return oa - ob;
    var da = a.date || '', db = b.date || '';
    if (da !== db) return da < db ? -1 : 1;
    return (a.__idx || 0) - (b.__idx || 0);
  }

  function sortList(list) {
    var arr = list.slice();
    if (state.sort === 'name') {
      arr.sort(function (a, b) { return new Intl.Collator('zh-Hans-CN', { sensitivity: 'base' }).compare(a.title || '', b.title || ''); });
    } else if (state.sort === 'category') {
      arr.sort(function (a, b) {
        var ca = catLabel[a.category] || (a.category || '￿');
        var cb = catLabel[b.category] || (b.category || '￿');
        if (ca !== cb) return ca.localeCompare(cb, 'zh-Hans-CN');
        return chronoCmp(a, b);
      });
    } else {
      arr.sort(chronoCmp);
    }
    return arr;
  }

  // ---------- 渲染：关联区 / 来源 ----------
  function relSection(ids, key, label) {
    var idx = key === 'story' ? idxStory
      : key === 'factions' ? idxFaction
      : key === 'glossary' ? idxTerm
      : idxLocation;
    return UI.section(label, UI.relChips(ids, key, idx));
  }

  function eventDetailHTML(e) {
    var desc = isEmpty(e.description)
      ? '<p class="rel-empty"><span class="unknown">' + UNKNOWN + '</span></p>'
      : '<p class="timeline-detail-desc">' + esc(e.description) + '</p>';
    var html = UI.section('事件描述', desc);
    html += relSection(e.relatedStoryIds, 'story', '关联剧情');
    html += relSection(e.relatedFactionIds, 'factions', '关联势力');
    html += relSection(e.relatedTermIds, 'glossary', '关联术语');
    html += relSection(e.locationIds, 'locations', '关联地区');
    html += UI.section('引用来源', UI.renderSource(e.source, idxStory));
    return html;
  }

  function badgesHTML(e) {
    var era = e.era ? '<span class="badge badge-era">' + esc(eraLabel[e.era] || e.era) + '</span>' : '';
    var cat = e.category ? '<span class="badge badge-cat">' + esc(catLabel[e.category] || e.category) + '</span>' : '';
    return era + cat;
  }

  function headHTML(e) {
    var d = dateText(e);
    var date = d ? '<span class="timeline-date">' + esc(d) + '</span>' : '<span class="timeline-date unknown">' + UNKNOWN + '</span>';
    return '<div class="timeline-card-head">' + date + '<div class="timeline-badges">' + badgesHTML(e) + '</div></div>';
  }

  // 列表卡片（可展开）
  function eventCardHTML(e, expanded) {
    var cls = 'timeline-item' + (expanded ? ' expanded' : '');
    var detailAttr = expanded ? '' : ' hidden';
    var toggleLabel = expanded ? '收起 ▴' : '展开 ▾';
    var desc = isEmpty(e.description)
      ? '<p class="timeline-desc"><span class="unknown">' + UNKNOWN + '</span></p>'
      : '<p class="timeline-desc">' + esc(e.description) + '</p>';
    return '<div class="' + cls + '" data-id="' + esc(e.id) + '">' +
      '<div class="timeline-card">' +
        headHTML(e) +
        '<h3 class="timeline-title">' + esc(e.title || e.id) + '</h3>' +
        (e.titleEn ? '<p class="timeline-title-en">' + esc(e.titleEn) + '</p>' : '') +
        desc +
        '<button type="button" class="timeline-toggle" data-id="' + esc(e.id) + '">' + toggleLabel + '</button>' +
        '<div class="timeline-detail"' + detailAttr + '>' + eventDetailHTML(e) + '</div>' +
      '</div></div>';
  }

  function renderList() {
    var box = document.getElementById('timeline-track');
    var count = document.getElementById('timeline-count');
    if (!box) return;
    var list = sortList(events.filter(matches));
    if (count) count.textContent = '共 ' + list.length + ' 个事件';
    box.innerHTML = list.length
      ? list.map(function (e) { return eventCardHTML(e, false); }).join('')
      : UI.emptyState('没有符合条件的时间线事件，试试调整筛选条件');
  }

  // 上/下事件计算式导航（按全量时间顺序，不保存 prevId/nextId）
  function renderNav(prev, next) {
    if (!prev && !next) return '';
    var html = '<div class="chapter-nav">';
    if (prev) {
      html += '<a class="chapter-nav-link prev" href="' + window.ZZZRouter.buildLink('timeline', { id: prev.id }) + '">' +
        '<span class="chapter-nav-dir">← 上一个事件</span><span class="chapter-nav-title">' + esc(prev.title || prev.id) + '</span></a>';
    }
    if (next) {
      html += '<a class="chapter-nav-link next" href="' + window.ZZZRouter.buildLink('timeline', { id: next.id }) + '">' +
        '<span class="chapter-nav-dir">下一个事件 →</span><span class="chapter-nav-title">' + esc(next.title || next.id) + '</span></a>';
    }
    return html + '</div>';
  }

  function renderDetail(id) {
    var c = document.getElementById('content');
    var e = events.find(function (x) { return x.id === id; });
    if (!e) {
      UI.breadcrumb([{ label: '时间线', href: window.ZZZ.pages.timeline }, { label: '未找到' }]);
      UI.placeholderPage({ title: '时间线', desc: '未找到指定事件（id=' + esc(id || '') + '）。' });
      return;
    }
    UI.breadcrumb([{ label: '时间线', href: window.ZZZ.pages.timeline }, { label: e.title || e.id }]);
    var ordered = events.slice().sort(chronoCmp);
    var i = ordered.findIndex(function (x) { return x.id === id; });
    var prev = i > 0 ? ordered[i - 1] : null;
    var next = (i >= 0 && i < ordered.length - 1) ? ordered[i + 1] : null;
    var html = '<section class="page-hero"><h1>' + esc(e.title || e.id) + '</h1>' +
      '<p class="hero-sub">时间线事件 · 关联剧情 / 势力 / 术语</p></section>' +
      '<a class="back-link" href="' + window.ZZZ.pages.timeline + '">← 返回时间线</a>' +
      '<div class="timeline-track single">' +
        '<div class="timeline-item expanded highlight" data-id="' + esc(e.id) + '">' +
          '<div class="timeline-card">' + headHTML(e) +
            '<h3 class="timeline-title">' + esc(e.title || e.id) + '</h3>' +
            (e.titleEn ? '<p class="timeline-title-en">' + esc(e.titleEn) + '</p>' : '') +
            '<div class="timeline-detail">' + eventDetailHTML(e) + '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      renderNav(prev, next);
    c.innerHTML = html;
  }

  function renderToolbar() {
    var eraChips = eraDefs.map(function (d) {
      return '<button type="button" class="tag" data-era="' + esc(d.id) + '">' + esc(d.label) + '</button>';
    }).join('');
    var catChips = catDefs.map(function (d) {
      return '<button type="button" class="tag" data-cat="' + esc(d.id) + '">' + esc(d.label) + '</button>';
    }).join('');
    return '<div class="glossary-toolbar" role="search">' +
      '<div class="glossary-search"><input type="search" id="timeline-q" placeholder="搜索事件（标题、描述、年代）" aria-label="搜索时间线"></div>' +
      '<div class="filter-group" aria-label="纪元筛选"><span class="filter-label">纪元</span><div class="filter-bar" id="timeline-eras">' +
        '<button type="button" class="tag active" data-era="all">全部</button>' + eraChips + '</div></div>' +
      '<div class="filter-group" aria-label="分类筛选"><span class="filter-label">分类</span><div class="filter-bar" id="timeline-cats">' +
        '<button type="button" class="tag active" data-cat="all">全部</button>' + catChips + '</div></div>' +
      '<div class="filter-group" aria-label="排序"><span class="filter-label">排序</span><div class="filter-bar" id="timeline-sort">' +
        '<button type="button" class="tag active" data-sort="chrono">时间顺序</button>' +
        '<button type="button" class="tag" data-sort="category">分类</button>' +
        '<button type="button" class="tag" data-sort="name">名称排序</button>' +
      '</div></div>' +
      '<div class="glossary-count" id="timeline-count" aria-live="polite"></div>' +
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

  function bindEvents() {
    var q = document.getElementById('timeline-q');
    if (q) q.addEventListener('input', function () { state.q = q.value.trim(); renderList(); });
    bindChipGroup('timeline-eras', 'data-era', function (v) { state.era = v; });
    bindChipGroup('timeline-cats', 'data-cat', function (v) { state.category = v; });
    bindChipGroup('timeline-sort', 'data-sort', function (v) { state.sort = v; });
    var track = document.getElementById('timeline-track');
    if (track) {
      track.addEventListener('click', function (ev) {
        var btn = ev.target.closest('.timeline-toggle');
        if (!btn) return;
        var id = btn.getAttribute('data-id');
        var item = track.querySelector('.timeline-item[data-id="' + esc(id) + '"]');
        if (!item) return;
        var detail = item.querySelector('.timeline-detail');
        var expanded = item.classList.toggle('expanded');
        if (detail) { if (expanded) detail.removeAttribute('hidden'); else detail.setAttribute('hidden', ''); }
        btn.textContent = expanded ? '收起 ▴' : '展开 ▾';
      });
    }
  }

  async function init() {
    var c = document.getElementById('content');
    if (!c) return;
    buildVocab();
    var id = window.ZZZRouter.getParam('id');

    var d = await window.ZZZData.loadJSON('timeline');
    if (!d || d.__error) { c.innerHTML = UI.errorState(d && d.message); return; }
    events = d.events || [];
    events.forEach(function (e, i) { e.__idx = i; });

    // 关联索引（详情/列表展开共用的外键解析，目标缺失时优雅降级）
    var loaded = await Promise.all([
      UI.loadRelIndex('story'),
      UI.loadRelIndex('factions'),
      UI.loadRelIndex('glossary'),
      UI.loadRelIndex('locations')
    ]);
    idxStory = loaded[0]; idxFaction = loaded[1]; idxTerm = loaded[2]; idxLocation = loaded[3];

    if (id) { renderDetail(id); return; }

    UI.breadcrumb([{ label: '时间线' }]);
    c.innerHTML =
      '<section class="page-hero"><h1>时间线</h1>' +
      '<p class="hero-sub">按纪元与分类梳理《绝区零》世界观重大节点 · 缺失信息标注' + UNKNOWN + '</p></section>' +
      renderToolbar() +
      '<div class="timeline-track" id="timeline-track"></div>';
    bindEvents();
    renderList();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
