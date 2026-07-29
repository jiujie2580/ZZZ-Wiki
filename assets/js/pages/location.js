// location.js —— 地区详情（?id=xxx）
// 对齐详情页模板：hero → 基本信息 → 简介 → 子地区 → 关联(剧情/事件/势力/术语) → 来源
// 关联采用反向计算（D2）：扫描 story/timeline/factions/glossary 索引中指向本 location.id 的外键
// parentId/childIds 层级导航（D6）：由 locations 自身索引计算
// 复用 components.js 共享原语：relChips/relSingle/loadRelIndex/renderSource/section/field/fieldList/badge/breadcrumb
(function () {
  var UI = window.ZZZUI;
  function esc(s) { return UI.esc(s == null ? '' : s); }
  function isEmpty(v) { return UI.isEmpty(v); }
  function fieldHTML(label, htmlValue) {
    return '<div class="field"><span class="field-label">' + esc(label) + '</span><span class="field-value">' + htmlValue + '</span></div>';
  }

  async function init() {
    var c = document.getElementById('content');
    if (!c) return;
    var id = window.ZZZRouter.getParam('id');

    var catDefs = (window.ZZZ && window.ZZZ.locationCategories) || [];
    var catLabel = {};
    catDefs.forEach(function (x) { catLabel[x.id] = x.label; });

    var d = await window.ZZZData.loadJSON('locations');
    if (!d || d.__error) {
      UI.breadcrumb([{ label: '地区', href: window.ZZZ.pages.locations }, { label: '详情' }]);
      c.innerHTML = UI.errorState(d && d.message);
      return;
    }
    var locations = d.locations || [];
    var loc = locations.find(function (x) { return x.id === id; });
    if (!loc) {
      UI.breadcrumb([{ label: '地区', href: window.ZZZ.pages.locations }, { label: '未找到' }]);
      c.innerHTML = UI.emptyState('未找到指定地区（id=' + (id || '空') + '），请从地区列表进入。');
      return;
    }

    UI.breadcrumb([{ label: '地区', href: window.ZZZ.pages.locations }, { label: loc.name || loc.id }]);
    document.title = (loc.name || loc.id) + ' | 地区 | 绝区零 Wiki';

    // 索引：本模块（父/子）+ 消费模块（反向关联）
    var idxLocation = new Map();
    locations.forEach(function (x) { if (x && x.id) idxLocation.set(x.id, x); });
    var keys = ['story', 'timeline', 'factions', 'glossary'];
    var loaded = await Promise.all(keys.map(UI.loadRelIndex));
    var idx = {};
    keys.forEach(function (k, i) { idx[k] = loaded[i]; });
    var storyList = Array.from(idx.story.values());
    var timelineList = Array.from(idx.timeline.values());
    var factionList = Array.from(idx.factions.values());
    var glossaryList = Array.from(idx.glossary.values());

    // 父/子（D6）
    var parent = loc.parentId ? (idxLocation.get(loc.parentId) || null) : null;
    var children = locations.filter(function (x) { return x.parentId === loc.id; });

    // 反向关联（D2）：扫描外键指向本 id 的条目
    function reverseIds(list, field) {
      return (list || []).filter(function (x) { return (x[field] || []).indexOf(id) !== -1; }).map(function (x) { return x.id; });
    }
    var storyIds = reverseIds(storyList, 'locationIds');
    var timelineIds = reverseIds(timelineList, 'locationIds');
    var factionIds = reverseIds(factionList, 'relatedLocationIds');
    var glossaryIds = reverseIds(glossaryList, 'relatedLocationIds');

    var subNames = [loc.nameEn].filter(Boolean).join(' / ');
    var catBadge = loc.category ? UI.badge(catLabel[loc.category] || loc.category, 'cat-' + loc.category) : '';
    var html =
      '<a class="back-link" href="' + window.ZZZ.pages.locations + '">← 返回地区</a>' +
      '<section class="detail-hero location-hero"><div>' +
        '<h1>' + esc(loc.name || loc.id) + '</h1>' +
        (subNames ? '<p class="term-hero-sub">' + esc(subNames) + '</p>' : '') +
        '<div class="term-hero-meta">' + catBadge + '</div>' +
      '</div></section>';

    // 基本信息
    var infoHtml =
      UI.field('中文名称', loc.name) +
      UI.field('英文名称', loc.nameEn) +
      UI.fieldList('别名', loc.aliases) +
      UI.field('类型', catLabel[loc.category] || loc.category) +
      fieldHTML('所属上级', parent ? UI.relSingle(loc.parentId, 'locations', idxLocation) : '<span class="unknown">' + UI.UNKNOWN + '</span>') +
      UI.field('资料更新时间', loc.updatedAt);
    html += UI.section('基本信息', infoHtml);

    // 简介
    html += UI.section('简介',
      isEmpty(loc.description)
        ? (isEmpty(loc.summary)
          ? '<p class="rel-empty"><span class="unknown">' + UI.UNKNOWN + '</span></p>'
          : '<p class="term-desc">' + esc(loc.summary) + '</p>')
        : '<p class="term-desc">' + esc(loc.description) + '</p>'
    );

    // 子地区（D6）
    html += UI.section('子地区',
      children.length
        ? UI.relChips(children.map(function (c) { return c.id; }), 'locations', idxLocation)
        : '<p class="rel-empty"><span class="unknown">' + UI.UNKNOWN + '</span></p>'
    );

    // 关联区（反向计算）
    html += UI.section('关联剧情', UI.relChips(storyIds, 'story', idx.story));
    html += UI.section('关联事件', UI.relChips(timelineIds, 'timeline', idx.timeline));
    html += UI.section('关联势力', UI.relChips(factionIds, 'factions', idx.factions));
    html += UI.section('关联术语', UI.relChips(glossaryIds, 'glossary', idx.glossary));

    // 来源
    html += UI.section('引用来源', UI.renderSource(loc.source, idx.story));

    c.innerHTML = html;
  }

  document.addEventListener('DOMContentLoaded', init);
})();
