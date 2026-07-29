// faction.js —— 势力 / 组织详情页（?id=xxx）
// 对齐 term.js 详情页模板规范：hero → 基本信息 → 简介 → 关联区（rel-chips 优雅降级）→ 引用来源
// 关联渲染原语（relChips / loadRelIndex / renderSource / section）复用 components.js 的 window.ZZZUI。
// 分类 label 来自 config.factionCategories（单一数据源）。
// 外键解析原则：目标条目存在 → 可点击链接；不存在 → 灰态 chip 显示 id，绝不报错。
(function () {
  const UI = window.ZZZUI;

  async function init() {
    const c = document.getElementById('content');
    if (!c) return;
    const id = window.ZZZRouter.getParam('id');

    // 分类 label 来自 config.factionCategories（单一数据源）
    const catDefs = (window.ZZZ && window.ZZZ.factionCategories) || [];
    const catLabel = {};
    catDefs.forEach(function (x) { catLabel[x.id] = x.label; });

    const d = await window.ZZZData.loadJSON('factions');
    if (!d || d.__error) {
      UI.breadcrumb([{ label: '势力', href: window.ZZZ.pages.factions }, { label: '详情' }]);
      c.innerHTML = UI.errorState(d && d.message);
      return;
    }

    const factions = d.factions || [];
    const f = factions.find(function (x) { return x.id === id; });
    if (!f) {
      UI.breadcrumb([{ label: '势力', href: window.ZZZ.pages.factions }, { label: '未找到' }]);
      c.innerHTML = UI.emptyState('未找到指定势力（id=' + (id || '空') + '），请从势力列表进入。');
      return;
    }

    UI.breadcrumb([
      { label: '势力', href: window.ZZZ.pages.factions },
      { label: f.name || f.id }
    ]);
    document.title = (f.name || f.id) + ' | 势力 / 组织 | 绝区零 Wiki';

    // 并行加载外键目标索引（任一失败降级为空索引）
    const keys = ['characters', 'factions', 'locations', 'glossary', 'story'];
    const indexes = {};
    const loaded = await Promise.all(keys.map(UI.loadRelIndex));
    keys.forEach(function (k, i) { indexes[k] = loaded[i]; });

    // ---------- Hero ----------
    const subNames = [f.nameEn].filter(Boolean).join(' / ');
    const avatar = f.icon
      ? '<img class="avatar" src="' + UI.esc(f.icon) + '" alt="' + UI.esc(f.name || f.id) + '">'
      : '<div class="avatar"></div>';
    let html =
      '<section class="detail-hero faction-hero">' + avatar +
        '<div>' +
        '<h1>' + UI.esc(f.name || f.id) + '</h1>' +
        (subNames ? '<p class="term-hero-sub">' + UI.esc(subNames) + '</p>' : '') +
        '<div class="term-hero-meta">' +
          UI.badge(catLabel[f.category] || f.category, 'cyan') +
          (f.type ? UI.badge(f.type, 'purple') : '') +
        '</div>' +
      '</div></section>';

    // ---------- 基本信息 ----------
    html += UI.section('基本信息',
      UI.field('中文名称', f.name) +
      UI.field('英文名称', f.nameEn) +
      UI.field('分类', catLabel[f.category] || f.category) +
      UI.field('细分类型', f.type) +
      UI.fieldList('别名', f.alias) +
      UI.field('领导者', f.leader) +
      UI.field('总部', f.headquarters) +
      UI.field('成立时间', f.established) +
      UI.field('资料更新时间', f.updatedAt)
    );

    // ---------- 简介 ----------
    html += UI.section('简介',
      UI.isEmpty(f.description)
        ? (UI.isEmpty(f.summary)
          ? '<p class="rel-empty"><span class="unknown">' + UI.UNKNOWN + '</span></p>'
          : '<p class="term-desc">' + UI.esc(f.summary) + '</p>')
        : '<p class="term-desc">' + UI.esc(f.description) + '</p>'
    );

    // ---------- 关联区 ----------
    html += UI.section('关联角色', UI.relChips(f.memberIds, 'characters', indexes.characters));
    html += UI.section('关联势力', UI.relChips(f.relatedFactionIds, 'factions', indexes.factions));
    html += UI.section('关联地区', UI.relChips(f.relatedLocationIds, 'locations', indexes.locations));
    html += UI.section('关联术语', UI.relChips(f.relatedTermIds, 'glossary', indexes.glossary));

    // ---------- 引用来源 ----------
    html += UI.section('引用来源', UI.renderSource(f.source, indexes.story));

    c.innerHTML = html;
  }

  document.addEventListener('DOMContentLoaded', init);
})();
