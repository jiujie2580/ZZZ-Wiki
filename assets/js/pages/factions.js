// factions.js —— 势力 / 组织列表页：搜索 / 分类筛选 / 排序 / 卡片网格
// 数据源：data/factions.json；分类受控词表来自 config.factionCategories（单一数据源，禁止硬编码）
(function () {
  const UI = window.ZZZUI;

  // 页面状态（仅本页内存态，不污染全局）
  const state = {
    q: '',            // 搜索关键词
    category: 'all',  // 当前分类（'all' = 全部）
    sort: 'alpha'     // alpha=名称序 | updated=最近更新
  };

  let factions = [];
  let catDefs = [];
  const catLabel = {};

  // 版本号/日期比较辅助
  const collator = new Intl.Collator('zh-Hans-CN', { sensitivity: 'base' });

  function matches(f) {
    // 分类
    if (state.category !== 'all' && f.category !== state.category) return false;
    // 关键词：中文名 / 英文名 / 别名 / 简介 / 细分类型
    if (state.q) {
      const q = state.q.toLowerCase();
      const hay = [
        f.name, f.nameEn, f.summary, f.type,
        (f.alias || []).join(' ')
      ].filter(Boolean).join(' ').toLowerCase();
      if (hay.indexOf(q) === -1) return false;
    }
    return true;
  }

  function sortList(list) {
    const arr = list.slice();
    if (state.sort === 'updated') {
      arr.sort(function (a, b) {
        return String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')) ||
          collator.compare(a.name || '', b.name || '');
      });
    } else {
      arr.sort(function (a, b) { return collator.compare(a.name || '', b.name || ''); });
    }
    return arr;
  }

  // ---------- 渲染 ----------
  function chipRow(defs, activeCheck, dataAttr) {
    return defs.map(function (d) {
      const on = activeCheck(d.id) ? ' active' : '';
      return '<button type="button" class="tag' + on + '" ' + dataAttr + '="' + UI.esc(d.id) + '">' +
        UI.esc(d.label) + '</button>';
    }).join('');
  }

  function factionCard(f) {
    const href = window.ZZZRouter.buildLink('faction', { id: f.id });
    const sub = [f.nameEn].filter(Boolean).join(' / ');
    const summary = UI.isEmpty(f.summary)
      ? '<span class="unknown">' + UI.UNKNOWN + '</span>'
      : UI.esc(f.summary);
    const memberCount = (f.memberIds || []).length;
    const aliases = (f.alias || []).map(function (x) { return UI.esc(x); }).join('、');
    return '<a class="faction-card" href="' + href + '">' +
      '<div class="faction-card-head">' +
        '<h3 class="faction-card-name">' + UI.esc(f.name || f.id) + '</h3>' +
        UI.badge(catLabel[f.category] || f.category, 'cyan') +
      '</div>' +
      (sub ? '<p class="faction-card-sub">' + UI.esc(sub) + '</p>' : '') +
      '<p class="faction-card-summary">' + summary + '</p>' +
      '<div class="faction-card-foot">' +
        (f.type ? '<span class="faction-card-type">' + UI.esc(f.type) + '</span>' : '') +
        (aliases ? '<span class="faction-card-alias">别名：' + aliases + '</span>' : '') +
        (memberCount ? '<span class="faction-card-count">成员 ' + memberCount + '</span>' : '') +
      '</div></a>';
  }

  function renderList() {
    const box = document.getElementById('faction-list');
    const count = document.getElementById('faction-count');
    if (!box) return;
    const list = sortList(factions.filter(matches));
    if (count) count.textContent = '共 ' + list.length + ' 个势力 / 组织';
    box.innerHTML = list.length
      ? list.map(factionCard).join('')
      : UI.emptyState('没有符合条件的势力，试试调整筛选条件');
  }

  function renderToolbar() {
    return '' +
      '<div class="glossary-toolbar" role="search">' +
        '<div class="glossary-search">' +
          '<input type="search" id="faction-q" placeholder="搜索势力（支持中/英文名、别名、简介、类型）" aria-label="搜索势力">' +
        '</div>' +
        '<div class="filter-group" aria-label="分类筛选">' +
          '<span class="filter-label">分类</span>' +
          '<div class="filter-bar" id="faction-cats">' +
            '<button type="button" class="tag active" data-cat="all">全部</button>' +
            chipRow(catDefs, function (id) { return state.category === id; }, 'data-cat') +
          '</div>' +
        '</div>' +
        '<div class="filter-group" aria-label="排序">' +
          '<span class="filter-label">排序</span>' +
          '<div class="filter-bar" id="faction-sort">' +
            '<button type="button" class="tag active" data-sort="alpha">名称序</button>' +
            '<button type="button" class="tag" data-sort="updated">最近更新</button>' +
          '</div>' +
        '</div>' +
        '<div class="glossary-count" id="faction-count" aria-live="polite"></div>' +
      '</div>';
  }

  function bindEvents() {
    const q = document.getElementById('faction-q');
    if (q) {
      q.addEventListener('input', function () {
        state.q = q.value.trim();
        renderList();
      });
    }
    bindChipGroup('faction-cats', 'data-cat', function (val, btn, group) {
      state.category = val;
      group.querySelectorAll('.tag').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
    });
    bindChipGroup('faction-sort', 'data-sort', function (val, btn, group) {
      state.sort = val;
      group.querySelectorAll('.tag').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
    });
  }

  function bindChipGroup(groupId, attr, handler) {
    const group = document.getElementById(groupId);
    if (!group) return;
    group.addEventListener('click', function (e) {
      const btn = e.target.closest('[' + attr + ']');
      if (!btn) return;
      handler(btn.getAttribute(attr), btn, group);
      renderList();
    });
  }

  // ---------- 入口 ----------
  async function init() {
    const c = document.getElementById('content');
    if (!c) return;
    UI.breadcrumb([{ label: '势力' }]);

    // 分类受控词表：来自 config.factionCategories（单一数据源）
    catDefs = (window.ZZZ && window.ZZZ.factionCategories) || [];
    catDefs.forEach(function (x) { catLabel[x.id] = x.label; });

    const d = await window.ZZZData.loadJSON('factions');
    if (!d || d.__error) { c.innerHTML = UI.errorState(d && d.message); return; }

    factions = d.factions || [];

    c.innerHTML =
      '<section class="page-hero"><h1>势力 / 组织</h1>' +
      '<p class="hero-sub">新艾利都的阵营、组织、机构与网络 · 缺失信息标注' + UI.UNKNOWN + '</p></section>' +
      renderToolbar() +
      '<div class="faction-grid" id="faction-list"></div>';

    bindEvents();
    renderList();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
