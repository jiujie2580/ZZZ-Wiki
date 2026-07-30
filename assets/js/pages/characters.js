// characters.js —— 角色 / 代理人列表页：搜索 / 属性筛选 / 稀有度筛选 / 排序 / 卡片网格
// 数据源：data/characters.json；属性/稀有度受控词表来自 config（单一数据源，禁止硬编码）
// 列表项展示阵营名需读取 data/factions.json 建立 id -> 名称 索引（缺失 → 不显示，优雅降级）
// 交互风格对齐 Factions / Glossary：toolbar（搜索 + 双维度筛选 Chips + 排序）+ 网格卡片
(function () {
  const UI = window.ZZZUI;

  // 页面状态（仅本页内存态，不污染全局）
  const state = {
    q: '',            // 搜索关键词
    attribute: 'all', // 当前属性筛选（'all' = 全部）
    rarity: 'all',    // 当前稀有度筛选（'all' = 全部）
    sort: 'name'      // name=名称序 | version=上线版本倒序
  };

  let characters = [];
  let attrDefs = [];
  let rarDefs = [];
  const attrLabel = {};
  const rarLabel = {};
  const factionName = {}; // factionId -> 名称（用于卡片展示）

  const collator = new Intl.Collator('zh-Hans-CN', { sensitivity: 'base' });

  function matches(ch) {
    // 属性维度
    if (state.attribute !== 'all' && ch.attribute !== state.attribute) return false;
    // 稀有度维度
    if (state.rarity !== 'all' && ch.rarity !== state.rarity) return false;
    // 关键词：中文名 / 英文名 / 代号 / 简介 / 职业 / 属性名
    if (state.q) {
      const q = state.q.toLowerCase();
      const hay = [
        ch.name, ch.nameEn, ch.codename, ch.summary, ch.specialty,
        attrLabel[ch.attribute]
      ].filter(Boolean).join(' ').toLowerCase();
      if (hay.indexOf(q) === -1) return false;
    }
    return true;
  }

  function sortList(list) {
    const arr = list.slice();
    if (state.sort === 'version') {
      arr.sort(function (a, b) {
        return String(b.releaseVersion || '0.0').localeCompare(String(a.releaseVersion || '0.0')) ||
          collator.compare(a.name || '', b.name || '');
      });
    } else {
      arr.sort(function (a, b) { return collator.compare(a.name || '', b.name || ''); });
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

  function characterCard(ch) {
    const href = window.ZZZRouter.buildLink('character', { id: ch.id });
    const rarityLbl = rarLabel[ch.rarity] || (ch.rarity || '');
    const attrLbl = attrLabel[ch.attribute] || ch.attribute || '';
    const sub = [ch.nameEn].filter(Boolean).join(' / ');
    const summary = UI.isEmpty(ch.summary)
      ? '<span class="unknown">' + UI.UNKNOWN + '</span>'
      : UI.esc(ch.summary);
    const fac = ch.factionId ? (factionName[ch.factionId] || null) : null;
    const Img = window.ZZZImage;
    const thumbHtml = (ch.thumbnail && Img && !Img.isDisabled())
      ? '<div class="character-card-thumb">' +
        Img.lazyImg({ src: ch.thumbnail, alt: ch.name || ch.id, cls: 'character-card-thumb-img' }) +
        '</div>'
      : '';
    return '<a class="character-card" href="' + href + '">' +
      thumbHtml +
      '<div class="character-card-head">' +
        '<h3 class="character-card-name">' + UI.esc(ch.name || ch.id) + '</h3>' +
        UI.badge(rarityLbl, 'rarity-' + UI.esc(ch.rarity)) +
      '</div>' +
      (sub ? '<p class="character-card-sub">' + UI.esc(sub) + '</p>' : '') +
      '<p class="character-card-summary">' + summary + '</p>' +
      '<div class="character-card-foot">' +
        (attrLbl ? UI.badge(attrLbl, 'cyan') : '') +
        (fac ? '<span class="character-card-faction">' + UI.esc(fac) + '</span>' : '') +
        (ch.releaseVersion ? '<span class="character-card-ver">v' + UI.esc(ch.releaseVersion) + '</span>' : '') +
      '</div></a>';
  }

  function renderList() {
    const box = document.getElementById('character-list');
    const count = document.getElementById('character-count');
    if (!box) return;
    const list = sortList(characters.filter(matches));
    if (count) count.textContent = '共 ' + list.length + ' 名角色 / 代理人';
    box.innerHTML = list.length
      ? list.map(characterCard).join('')
      : UI.emptyState('没有符合条件的角色，试试调整筛选条件');
  }

  function renderToolbar() {
    return '' +
      '<div class="glossary-toolbar" role="search">' +
        '<div class="glossary-search">' +
          '<input type="search" id="character-q" placeholder="搜索角色（支持中/英文名、代号、简介、职业、属性）" aria-label="搜索角色">' +
        '</div>' +
        '<div class="filter-group" aria-label="属性筛选">' +
          '<span class="filter-label">属性</span>' +
          '<div class="filter-bar" id="character-attrs">' +
            '<button type="button" class="tag active" data-attr="all">全部</button>' +
            chipRow(attrDefs, function (id) { return state.attribute === id; }, 'data-attr') +
          '</div>' +
        '</div>' +
        '<div class="filter-group" aria-label="稀有度筛选">' +
          '<span class="filter-label">稀有度</span>' +
          '<div class="filter-bar" id="character-rarities">' +
            '<button type="button" class="tag active" data-rarity="all">全部</button>' +
            chipRow(rarDefs, function (id) { return state.rarity === id; }, 'data-rarity') +
          '</div>' +
        '</div>' +
        '<div class="filter-group" aria-label="排序">' +
          '<span class="filter-label">排序</span>' +
          '<div class="filter-bar" id="character-sort">' +
            '<button type="button" class="tag active" data-sort="name">名称序</button>' +
            '<button type="button" class="tag" data-sort="version">上线版本</button>' +
          '</div>' +
        '</div>' +
        '<div class="glossary-count" id="character-count" aria-live="polite"></div>' +
      '</div>';
  }

  function bindEvents() {
    const q = document.getElementById('character-q');
    if (q) {
      q.addEventListener('input', function () {
        state.q = q.value.trim();
        renderList();
      });
    }
    bindChipGroup('character-attrs', 'data-attr', function (val, btn, group) {
      state.attribute = val;
      group.querySelectorAll('.tag').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
    });
    bindChipGroup('character-rarities', 'data-rarity', function (val, btn, group) {
      state.rarity = val;
      group.querySelectorAll('.tag').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
    });
    bindChipGroup('character-sort', 'data-sort', function (val, btn, group) {
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
    UI.breadcrumb([{ label: '角色' }]);

    // 受控词表：来自 config（单一数据源）
    attrDefs = (window.ZZZ && window.ZZZ.characterAttributes) || [];
    rarDefs = (window.ZZZ && window.ZZZ.characterRarities) || [];
    attrDefs.forEach(function (x) { attrLabel[x.id] = x.label; });
    rarDefs.forEach(function (x) { rarLabel[x.id] = x.label; });

    // 并行加载 角色 + 势力（势力用于卡片显示阵营名）
    const [cd, fd] = await Promise.all([
      window.ZZZData.loadJSON('characters'),
      window.ZZZData.loadJSON('factions')
    ]);
    if (!cd || cd.__error) { c.innerHTML = UI.errorState(cd && cd.message); return; }

    characters = cd.characters || [];
    (fd && fd.factions || []).forEach(function (f) { factionName[f.id] = f.name; });

    c.innerHTML =
      '<section class="page-hero"><h1>角色 / 代理人</h1>' +
      '<p class="hero-sub">新艾利都的代理人档案 · 按属性与稀有度筛选 · 缺失信息标注' + UI.UNKNOWN + '</p></section>' +
      renderToolbar() +
      '<div class="character-grid" id="character-list"></div>';

    bindEvents();
    renderList();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
