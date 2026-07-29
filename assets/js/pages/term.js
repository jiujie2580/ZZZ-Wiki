// term.js —— 术语详情页（?id=xxx）
// 详情页模板规范（后续角色/势力/地区/剧情章节 等详情页遵循同一结构）：
//   detail-hero（标题区）→ detail-section（信息分节）→ 关联区（rel-chips 优雅降级）→ 引用来源
// 关联渲染原语（relChips / loadRelIndex / renderSource / section）已抽取至 components.js 的 window.ZZZUI，本页直接复用。
// 外键解析原则：目标条目存在 → 可点击链接；不存在 → 灰态 chip 显示 id，绝不报错。
(function () {
  const UI = window.ZZZUI;

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
    const loaded = await Promise.all(keys.map(UI.loadRelIndex));
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
    html += UI.section('基本信息',
      UI.field('中文名称', t.name) +
      UI.field('英文名称', t.nameEn) +
      UI.field('日文名称', t.nameJa) +
      UI.fieldList('别名', t.aliases) +
      UI.field('分类', catLabel[t.category] || t.category) +
      UI.field('首次出现版本', t.introducedVersion) +
      UI.field('资料更新时间', t.updatedAt)
    );

    // ---------- 官方定义 ----------
    html += UI.section('官方定义',
      UI.isEmpty(t.description)
        ? '<p class="rel-empty"><span class="unknown">' + UI.UNKNOWN + '</span></p>'
        : '<p class="term-desc">' + UI.esc(t.description) + '</p>'
    );

    // ---------- 关联区 ----------
    html += UI.section('关联剧情',
      '<div class="rel-row"><span class="rel-label">首次出现章节</span>' +
        UI.relSingle(t.introducedStoryId, 'story', indexes.story) + '</div>' +
      '<div class="rel-row"><span class="rel-label">首次出现时间线</span>' +
        UI.relSingle(t.introducedTimelineId, 'timeline', indexes.timeline) + '</div>');
    html += UI.section('关联人物', UI.relChips(t.relatedCharacterIds, 'characters', indexes.characters));
    html += UI.section('关联势力', UI.relChips(t.relatedFactionIds, 'factions', indexes.factions));
    html += UI.section('关联地区', UI.relChips(t.relatedLocationIds, 'locations', indexes.locations));
    html += UI.section('关联术语', UI.relChips(t.relatedTermIds, 'glossary', indexes.glossary));

    // ---------- 引用来源 ----------
    html += UI.section('引用来源', UI.renderSource(t.source, indexes.story));

    c.innerHTML = html;
  }

  document.addEventListener('DOMContentLoaded', init);
})();
