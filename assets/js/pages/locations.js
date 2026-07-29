// locations.js —— 地区列表（卡片网格 + 类型筛选 + 排序 + 层级树视图）
// 数据源：data/locations.json；category 受控词表来自 config.locationCategories（单一数据源，禁止硬编码）
// 复用 components.js 共享原语：card/badge/field/fieldList/breadcrumb/emptyState/errorState/section + relChips/relSingle
// 层级由 parentId 计算（不存 childIds），树视图为单页内 toggle，无需新路由
(function () {
  var UI = window.ZZZUI;
  var state = { q: '', category: 'all', sort: 'name', view: 'grid' };

  var locations = [];
  var catDefs = [], catLabel = {}, catOrder = {};
  var childrenMap = {}; // parentId -> [loc]

  function esc(s) { return UI.esc(s == null ? '' : s); }
  function isEmpty(v) { return UI.isEmpty(v); }

  function buildVocab() {
    catDefs = (window.ZZZ && window.ZZZ.locationCategories) || [];
    catDefs.forEach(function (x, i) { catLabel[x.id] = x.label; catOrder[x.id] = i; });
  }

  function buildTree() {
    childrenMap = {};
    locations.forEach(function (l) {
      var p = l.parentId || '__root__';
      (childrenMap[p] = childrenMap[p] || []).push(l);
    });
    Object.keys(childrenMap).forEach(function (k) {
      childrenMap[k].sort(function (a, b) { return (a.name || a.id).localeCompare(b.name || b.id, 'zh-Hans-CN'); });
    });
  }

  function matches(l) {
    if (state.category !== 'all' && l.category !== state.category) return false;
    if (state.q) {
      var q = state.q.toLowerCase();
      var hay = [l.name, l.nameEn, (l.aliases || []).join(' '), l.summary].filter(Boolean).join(' ').toLowerCase();
      if (hay.indexOf(q) === -1) return false;
    }
    return true;
  }

  function sortList(list) {
    var arr = list.slice();
    if (state.sort === 'category') {
      arr.sort(function (a, b) {
        var ca = catLabel[a.category] || (a.category || '￿');
        var cb = catLabel[b.category] || (b.category || '￿');
        if (ca !== cb) return ca.localeCompare(cb, 'zh-Hans-CN');
        return (a.name || a.id).localeCompare(b.name || b.id, 'zh-Hans-CN');
      });
    } else {
      arr.sort(function (a, b) { return (a.name || a.id).localeCompare(b.name || b.id, 'zh-Hans-CN'); });
    }
    return arr;
  }

  function cardHTML(l) {
    var href = window.ZZZRouter.buildLink('location', { id: l.id });
    var badge = l.category ? '<span class="badge badge-cat-' + esc(l.category) + '">' + esc(catLabel[l.category] || l.category) + '</span>' : '';
    var parent = l.parentId ? '<span class="location-card-parent">↑ ' + esc((locations.find(function (x) { return x.id === l.parentId; }) || {}).name || l.parentId) + '</span>' : '';
    var summary = isEmpty(l.summary) ? '<span class="unknown">' + UI.UNKNOWN + '</span>' : esc(l.summary);
    return '<a class="location-card" href="' + href + '">' +
      '<div class="location-card-head">' +
        '<h3 class="location-card-name">' + esc(l.name || l.id) + '</h3>' + badge +
      '</div>' +
      (l.nameEn ? '<p class="location-card-sub">' + esc(l.nameEn) + '</p>' : '') +
      '<p class="location-card-summary">' + summary + '</p>' +
      '<div class="location-card-foot">' + parent + '</div>' +
    '</a>';
  }

  function treeNodeHTML(l, depth) {
    var childIds = childrenMap[l.id] || [];
    var href = window.ZZZRouter.buildLink('location', { id: l.id });
    var badge = l.category ? '<span class="badge badge-cat-' + esc(l.category) + '">' + esc(catLabel[l.category] || l.category) + '</span>' : '';
    var kids = childIds.length
      ? '<div class="location-tree-children">' + childIds.map(function (c) { return treeNodeHTML(c, depth + 1); }).join('') + '</div>'
      : '';
    return '<div class="location-tree-node" style="margin-left:' + (depth * 18) + 'px">' +
      '<a class="location-tree-link" href="' + href + '">' + esc(l.name || l.id) + '</a> ' + badge + kids + '</div>';
  }

  function renderGrid() {
    var box = document.getElementById('location-grid');
    if (!box) return;
    var list = sortList(locations.filter(matches));
    var count = document.getElementById('location-count');
    if (count) count.textContent = '共 ' + list.length + ' 个地区';
    box.innerHTML = list.length
      ? '<div class="location-grid">' + list.map(cardHTML).join('') + '</div>'
      : UI.emptyState('没有符合条件的地区，试试调整筛选条件');
  }

  function renderTree() {
    var box = document.getElementById('location-grid');
    if (!box) return;
    var roots = (childrenMap['__root__'] || []).filter(matches);
    var count = document.getElementById('location-count');
    if (count) count.textContent = '共 ' + locations.length + ' 个地区';
    box.innerHTML = roots.length
      ? '<div class="location-tree">' + roots.map(function (l) { return treeNodeHTML(l, 0); }).join('') + '</div>'
      : UI.emptyState('暂无根地区');
  }

  function render() {
    if (state.view === 'tree') renderTree(); else renderGrid();
  }

  function renderToolbar() {
    var catChips = catDefs.map(function (d) {
      return '<button type="button" class="tag" data-cat="' + esc(d.id) + '">' + esc(d.label) + '</button>';
    }).join('');
    return '<div class="glossary-toolbar" role="search">' +
      '<div class="glossary-search"><input type="search" id="location-q" placeholder="搜索地区（名称、别名、简介）" aria-label="搜索地区"></div>' +
      '<div class="filter-group" aria-label="类型筛选"><span class="filter-label">类型</span><div class="filter-bar" id="location-cats">' +
        '<button type="button" class="tag active" data-cat="all">全部</button>' + catChips + '</div></div>' +
      '<div class="filter-group" aria-label="排序"><span class="filter-label">排序</span><div class="filter-bar" id="location-sort">' +
        '<button type="button" class="tag active" data-sort="name">名称排序</button>' +
        '<button type="button" class="tag" data-sort="category">按类型</button>' +
      '</div></div>' +
      '<div class="filter-group" aria-label="视图"><span class="filter-label">视图</span><div class="filter-bar" id="location-view">' +
        '<button type="button" class="tag active" data-view="grid">▦ 卡片</button>' +
        '<button type="button" class="tag" data-view="tree">☷ 层级</button>' +
      '</div></div>' +
      '<div class="glossary-count" id="location-count" aria-live="polite"></div>' +
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
      render();
    });
  }

  function bindEvents() {
    var q = document.getElementById('location-q');
    if (q) q.addEventListener('input', function () { state.q = q.value.trim(); render(); });
    bindChipGroup('location-cats', 'data-cat', function (v) { state.category = v; });
    bindChipGroup('location-sort', 'data-sort', function (v) { state.sort = v; });
    bindChipGroup('location-view', 'data-view', function (v) { state.view = v; });
  }

  async function init() {
    var c = document.getElementById('content');
    if (!c) return;
    buildVocab();
    var d = await window.ZZZData.loadJSON('locations');
    if (!d || d.__error) { c.innerHTML = UI.errorState(d && d.message); return; }
    locations = d.locations || [];
    buildTree();

    UI.breadcrumb([{ label: '地区' }]);
    c.innerHTML =
      '<section class="page-hero"><h1>地区</h1>' +
      '<p class="hero-sub">新艾利都、空洞与各地带的空间结构 · 缺失信息标注' + UI.UNKNOWN + '</p></section>' +
      renderToolbar() +
      '<div id="location-grid"></div>';
    bindEvents();
    render();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
