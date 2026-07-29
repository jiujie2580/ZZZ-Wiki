// story.js —— 剧情列表页：搜索 / 类型筛选 / 版本筛选 / 排序 / 卡片网格
// 数据源：data/story.json；类型受控词表来自 config.storyTypes（单一数据源，禁止硬编码）
// 交互风格对齐 Characters / Factions / Glossary：toolbar（搜索 + 筛选 Chips + 排序）+ 网格卡片
(function () {
  const UI = window.ZZZUI;
  const TYPE_PRIORITY = { main: 0, special: 1, agent: 2, event: 3 };

  // 页面状态（仅本页内存态，不污染全局）
  const state = {
    q: '',          // 搜索关键词
    type: 'all',    // 当前类型筛选（'all' = 全部）
    version: 'all', // 当前版本筛选（'all' = 全部）
    sort: 'order'   // order=剧情顺序 | version=上线版本倒序 | name=名称排序
  };

  let stories = [];
  let typeDefs = [];
  const typeLabel = {};
  const versionList = []; // 动态生成：去重后的版本号（倒序）

  const collator = new Intl.Collator('zh-Hans-CN', { sensitivity: 'base' });

  function matches(s) {
    if (state.type !== 'all' && s.type !== state.type) return false;
    if (state.version !== 'all' && s.version !== state.version) return false;
    if (state.q) {
      const q = state.q.toLowerCase();
      const hay = [s.title, s.titleEn, s.chapter, s.season, s.summary, s.synopsis]
        .filter(Boolean).join(' ').toLowerCase();
      if (hay.indexOf(q) === -1) return false;
    }
    return true;
  }

  function sortList(list) {
    const arr = list.slice();
    if (state.sort === 'name') {
      arr.sort(function (a, b) { return collator.compare(a.title || '', b.title || ''); });
    } else if (state.sort === 'version') {
      arr.sort(function (a, b) {
        return String(b.releaseDate || '0').localeCompare(String(a.releaseDate || '0')) ||
          (TYPE_PRIORITY[a.type] - TYPE_PRIORITY[b.type]) ||
          (a.order || 0) - (b.order || 0);
      });
    } else { // order=剧情顺序（默认）：按上线日期 → 类型优先级 → 章节顺序
      arr.sort(function (a, b) {
        return String(a.releaseDate || '0').localeCompare(String(b.releaseDate || '0')) ||
          (TYPE_PRIORITY[a.type] - TYPE_PRIORITY[b.type]) ||
          (a.order || 0) - (b.order || 0);
      });
    }
    return arr;
  }

  // ---------- 渲染 ----------
  // 受控词表 chips：defs = [{id,label}]，activeCheck(id) 决定 active
  function chipRow(defs, activeCheck, dataAttr) {
    return defs.map(function (d) {
      const on = activeCheck(d.id) ? ' active' : '';
      return '<button type="button" class="tag' + on + '" ' + dataAttr + '="' + UI.esc(d.id) + '">' +
        UI.esc(d.label) + '</button>';
    }).join('');
  }

  function storyCard(s) {
    const href = window.ZZZRouter.buildLink('chapter', { id: s.id });
    const tLabel = typeLabel[s.type] || s.type || '';
    const sub = [s.chapter, s.season].filter(Boolean).join(' · ');
    const summary = UI.isEmpty(s.summary)
      ? '<span class="unknown">' + UI.UNKNOWN + '</span>'
      : UI.esc(s.summary);
    return '<a class="story-card" href="' + href + '">' +
      '<div class="story-card-head">' +
        '<h3 class="story-card-title">' + UI.esc(s.title || s.id) + '</h3>' +
        UI.badge(tLabel, 'type-' + UI.esc(s.type)) +
      '</div>' +
      (sub ? '<p class="story-card-sub">' + UI.esc(sub) + '</p>' : '') +
      '<p class="story-card-summary">' + summary + '</p>' +
      '<div class="story-card-foot">' +
        (s.version ? UI.badge('v' + UI.esc(s.version), 'cyan') : '') +
        (s.spoiler ? UI.badge('含剧透', 'warn') : '') +
      '</div></a>';
  }

  function renderList() {
    const box = document.getElementById('story-list');
    const count = document.getElementById('story-count');
    if (!box) return;
    const list = sortList(stories.filter(matches));
    if (count) count.textContent = '共 ' + list.length + ' 条剧情';
    box.innerHTML = list.length
      ? list.map(storyCard).join('')
      : UI.emptyState('没有符合条件的剧情，试试调整筛选条件');
  }

  function renderToolbar() {
    return '' +
      '<div class="glossary-toolbar" role="search">' +
        '<div class="glossary-search">' +
          '<input type="search" id="story-q" placeholder="搜索剧情（标题、章节、简介）" aria-label="搜索剧情">' +
        '</div>' +
        '<div class="filter-group" aria-label="类型筛选">' +
          '<span class="filter-label">类型</span>' +
          '<div class="filter-bar" id="story-types">' +
            '<button type="button" class="tag active" data-type="all">全部</button>' +
            chipRow(typeDefs, function (id) { return state.type === id; }, 'data-type') +
          '</div>' +
        '</div>' +
        '<div class="filter-group" aria-label="版本筛选">' +
          '<span class="filter-label">版本</span>' +
          '<div class="filter-bar" id="story-versions">' +
            '<button type="button" class="tag active" data-version="all">全部</button>' +
            versionList.map(function (v) {
              const on = state.version === v ? ' active' : '';
              return '<button type="button" class="tag' + on + '" data-version="' + UI.esc(v) + '">v' + UI.esc(v) + '</button>';
            }).join('') +
          '</div>' +
        '</div>' +
        '<div class="filter-group" aria-label="排序">' +
          '<span class="filter-label">排序</span>' +
          '<div class="filter-bar" id="story-sort">' +
            '<button type="button" class="tag active" data-sort="order">剧情顺序</button>' +
            '<button type="button" class="tag" data-sort="version">上线版本</button>' +
            '<button type="button" class="tag" data-sort="name">名称排序</button>' +
          '</div>' +
        '</div>' +
        '<div class="glossary-count" id="story-count" aria-live="polite"></div>' +
      '</div>';
  }

  function bindEvents() {
    const q = document.getElementById('story-q');
    if (q) {
      q.addEventListener('input', function () {
        state.q = q.value.trim();
        renderList();
      });
    }
    bindChipGroup('story-types', 'data-type', function (val, btn, group) {
      state.type = val;
      group.querySelectorAll('.tag').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
    });
    bindChipGroup('story-versions', 'data-version', function (val, btn, group) {
      state.version = val;
      group.querySelectorAll('.tag').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
    });
    bindChipGroup('story-sort', 'data-sort', function (val, btn, group) {
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
    UI.breadcrumb([{ label: '剧情' }]);

    // 类型受控词表：来自 config（单一数据源）
    typeDefs = (window.ZZZ && window.ZZZ.storyTypes) || [];
    typeDefs.forEach(function (x) { typeLabel[x.id] = x.label; });

    const d = await window.ZZZData.loadJSON('story');
    if (!d || d.__error) { c.innerHTML = UI.errorState(d && d.message); return; }

    stories = d.story || [];

    // 版本 chips 动态生成：去重后按上线日期倒序
    const seen = {};
    stories.forEach(function (s) {
      if (s.version && !seen[s.version]) {
        seen[s.version] = s.releaseDate || '0';
      }
    });
    versionList.length = 0;
    versionList.push.apply(versionList,
      Object.keys(seen).sort(function (a, b) {
        return String(seen[b]).localeCompare(String(seen[a]));
      })
    );

    c.innerHTML =
      '<section class="page-hero"><h1>剧情</h1>' +
      '<p class="hero-sub">法厄同纪事 · 特别篇 · 代理人秘闻 · 活动剧情 · 缺失信息标注' + UI.UNKNOWN + '</p></section>' +
      renderToolbar() +
      '<div class="story-grid" id="story-list"></div>';

    bindEvents();
    renderList();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
