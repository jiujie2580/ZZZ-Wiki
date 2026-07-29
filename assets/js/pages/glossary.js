// glossary.js —— 术语表列表页：搜索 / 分类筛选 / 标签筛选 / 排序
// 数据源：data/glossary.json（meta.categories / meta.tags 为受控词表，UI 完全数据驱动）
(function () {
  const UI = window.ZZZUI;

  // 页面状态（仅本页内存态，不污染全局）
  const state = {
    q: '',            // 搜索关键词
    category: 'all',  // 当前分类（'all' = 全部）
    tags: [],         // 已选标签（多选，AND 逻辑）
    sort: 'alpha'     // alpha=字母 | newest=最新加入 | updated=最近更新
  };

  let terms = [];
  let categories = [];
  let tagDefs = [];
  const catLabel = {};
  const tagLabel = {};

  // ---------- 工具 ----------
  const collator = new Intl.Collator('zh-Hans-CN', { sensitivity: 'base' });

  // 版本号比较（"1.0" < "1.1" < "2.0"…），null 视为最小
  function compareVersion(a, b) {
    if (a == null && b == null) return 0;
    if (a == null) return -1;
    if (b == null) return 1;
    const pa = String(a).split('.').map(Number);
    const pb = String(b).split('.').map(Number);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
      const d = (pa[i] || 0) - (pb[i] || 0);
      if (d !== 0) return d;
    }
    return 0;
  }

  function matches(t) {
    // 分类
    if (state.category !== 'all' && t.category !== state.category) return false;
    // 标签（AND：所有已选标签都需命中）
    for (const tag of state.tags) {
      if (!(t.tags || []).includes(tag)) return false;
    }
    // 关键词：中文名 / 英文名 / 日文名 / 别名 / 标签词 / 摘要
    if (state.q) {
      const q = state.q.toLowerCase();
      const hay = [
        t.name, t.nameEn, t.nameJa, t.summary,
        (t.aliases || []).join(' '),
        (t.tags || []).map(function (x) { return tagLabel[x] || x; }).join(' ')
      ].filter(Boolean).join(' ').toLowerCase();
      if (hay.indexOf(q) === -1) return false;
    }
    return true;
  }

  function sortList(list) {
    const arr = list.slice();
    if (state.sort === 'alpha') {
      arr.sort(function (a, b) { return collator.compare(a.name || '', b.name || ''); });
    } else if (state.sort === 'newest') {
      arr.sort(function (a, b) {
        return compareVersion(b.introducedVersion, a.introducedVersion) ||
          collator.compare(a.name || '', b.name || '');
      });
    } else if (state.sort === 'updated') {
      arr.sort(function (a, b) {
        return String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')) ||
          collator.compare(a.name || '', b.name || '');
      });
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

  function termCard(t) {
    const href = window.ZZZRouter.buildLink('term', { id: t.id });
    const sub = [t.nameEn, t.nameJa].filter(Boolean).join(' / ');
    const summary = UI.isEmpty(t.summary)
      ? '<span class="unknown">' + UI.UNKNOWN + '</span>'
      : UI.esc(t.summary);
    const tags = (t.tags || []).map(function (x) {
      return '<span class="tag">' + UI.esc(tagLabel[x] || x) + '</span>';
    }).join('');
    return '<a class="term-card" href="' + href + '">' +
      '<div class="term-card-head">' +
        '<h3 class="term-card-name">' + UI.esc(t.name || t.id) + '</h3>' +
        UI.badge(catLabel[t.category] || t.category, 'cyan') +
      '</div>' +
      (sub ? '<p class="term-card-sub">' + UI.esc(sub) + '</p>' : '') +
      '<p class="term-card-summary">' + summary + '</p>' +
      '<div class="term-card-foot">' +
        '<span class="term-card-tags">' + tags + '</span>' +
        (t.introducedVersion ? '<span class="term-card-ver">Ver ' + UI.esc(t.introducedVersion) + '</span>' : '') +
      '</div></a>';
  }

  function renderList() {
    const box = document.getElementById('glossary-list');
    const count = document.getElementById('glossary-count');
    if (!box) return;
    const list = sortList(terms.filter(matches));
    if (count) count.textContent = '共 ' + list.length + ' 条';
    box.innerHTML = list.length
      ? list.map(termCard).join('')
      : UI.emptyState('没有符合条件的术语，试试调整筛选条件');
  }

  function renderToolbar() {
    return '' +
      '<div class="glossary-toolbar" role="search">' +
        '<div class="glossary-search">' +
          '<input type="search" id="glossary-q" placeholder="搜索术语（支持中/英/日文名、别名、标签）" aria-label="搜索术语">' +
        '</div>' +
        '<div class="filter-group" aria-label="分类筛选">' +
          '<span class="filter-label">分类</span>' +
          '<div class="filter-bar" id="glossary-cats">' +
            '<button type="button" class="tag active" data-cat="all">全部</button>' +
            chipRow(categories, function (id) { return state.category === id; }, 'data-cat') +
          '</div>' +
        '</div>' +
        '<div class="filter-group" aria-label="标签筛选">' +
          '<span class="filter-label">标签</span>' +
          '<div class="filter-bar" id="glossary-tags">' +
            chipRow(tagDefs, function (id) { return state.tags.includes(id); }, 'data-tag') +
          '</div>' +
        '</div>' +
        '<div class="filter-group" aria-label="排序">' +
          '<span class="filter-label">排序</span>' +
          '<div class="filter-bar" id="glossary-sort">' +
            '<button type="button" class="tag active" data-sort="alpha">字母序</button>' +
            '<button type="button" class="tag" data-sort="newest">最新加入</button>' +
            '<button type="button" class="tag" data-sort="updated">最近更新</button>' +
          '</div>' +
        '</div>' +
        '<div class="glossary-count" id="glossary-count" aria-live="polite"></div>' +
      '</div>';
  }

  function bindEvents() {
    const q = document.getElementById('glossary-q');
    if (q) {
      q.addEventListener('input', function () {
        state.q = q.value.trim();
        renderList();
      });
    }
    bindChipGroup('glossary-cats', 'data-cat', function (val, btn, group) {
      state.category = val;
      group.querySelectorAll('.tag').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
    });
    bindChipGroup('glossary-tags', 'data-tag', function (val, btn) {
      const i = state.tags.indexOf(val);
      if (i === -1) { state.tags.push(val); btn.classList.add('active'); }
      else { state.tags.splice(i, 1); btn.classList.remove('active'); }
    });
    bindChipGroup('glossary-sort', 'data-sort', function (val, btn, group) {
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
    UI.breadcrumb([{ label: '术语' }]);

    const d = await window.ZZZData.loadJSON('glossary');
    if (!d || d.__error) { c.innerHTML = UI.errorState(d && d.message); return; }

    terms = d.terms || [];
    categories = (d.meta && d.meta.categories) || [];
    tagDefs = (d.meta && d.meta.tags) || [];
    categories.forEach(function (x) { catLabel[x.id] = x.label; });
    tagDefs.forEach(function (x) { tagLabel[x.id] = x.label; });

    c.innerHTML =
      '<section class="page-hero"><h1>术语</h1>' +
      '<p class="hero-sub">《绝区零》专有名词与官方概念释义 · 缺失信息标注' + UI.UNKNOWN + '</p></section>' +
      renderToolbar() +
      '<div class="glossary-grid" id="glossary-list"></div>';

    bindEvents();
    renderList();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
