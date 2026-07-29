// chapter.js —— 剧情章节详情页：Hero → 基本信息 → 梗概/详细剧情(剧透折叠) → 关联条目 → 上一章/下一章 → 来源
// 数据源：data/story.json；关联条目复用 components 的 relChips / loadRelIndex / renderSource
// 上一章/下一章 = 计算式导航（按 type + order 动态计算，不保存 prevId/nextId）
(function () {
  const UI = window.ZZZUI;

  let stories = [];                 // 全量列表（用于 prev/next 计算）
  const storyIndex = new Map();     // id -> 条目（用于来源章节链接）
  let relIndex = {};                // key -> Map（characters/factions/locations/glossary/timeline）

  async function init() {
    const c = document.getElementById('content');
    if (!c) return;

    const id = window.ZZZRouter.getParam('id');
    const [sd, cd, fd, ld, gd, td] = await Promise.all([
      window.ZZZData.loadJSON('story'),
      window.ZZZData.loadJSON('characters'),
      window.ZZZData.loadJSON('factions'),
      window.ZZZData.loadJSON('locations'),
      window.ZZZData.loadJSON('glossary'),
      window.ZZZData.loadJSON('timeline')
    ]);
    if (!sd || sd.__error) { c.innerHTML = UI.errorState(sd && sd.message); return; }

    stories = sd.story || [];
    stories.forEach(function (s) { if (s && s.id) storyIndex.set(s.id, s); });

    // 关联索引（缺失目标 → 灰态降级，绝不报错）
    relIndex = {
      characters: await UI.loadRelIndex('characters'),
      factions: await UI.loadRelIndex('factions'),
      locations: await UI.loadRelIndex('locations'),
      glossary: await UI.loadRelIndex('glossary'),
      timeline: await UI.loadRelIndex('timeline')
    };
    // 标记已加载（locations/glossary/timeline 当前多为骨架，仍走降级逻辑）

    const item = storyIndex.get(id);
    const name = item ? (item.title || item.id) : '剧情';
    UI.breadcrumb([
      { label: '剧情', href: window.ZZZ.pages.story },
      { label: name }
    ]);

    if (!item) {
      UI.placeholderPage({ title: '剧情', desc: '未找到指定条目（id=' + UI.esc(id || '') + '）。' });
      return;
    }

    c.innerHTML = renderDetail(item);
    bindSpoiler(item);
    renderNav(item);
  }

  // ---------- 详情渲染 ----------
  function renderDetail(s) {
    const typeLbl = (window.ZZZ.storyTypes || []).find(function (t) { return t.id === s.type; });
    const typeLabel = typeLbl ? typeLbl.label : (s.type || '');
    const seasonChapter = [s.season, s.chapter].filter(Boolean).join(' · ');

    // Hero
    const hero =
      '<section class="page-hero detail-hero story-hero">' +
        '<div class="detail-hero-badges">' +
          UI.badge(typeLabel, 'type-' + UI.esc(s.type)) +
          (s.version ? UI.badge('v' + UI.esc(s.version), 'cyan') : '') +
          (seasonChapter ? UI.badge(seasonChapter, 'default') : '') +
          (s.spoiler ? UI.badge('含剧透', 'warn') : '') +
        '</div>' +
        '<h1>' + UI.esc(s.title || s.id) + '</h1>' +
        (s.titleEn ? '<p class="hero-sub">' + UI.esc(s.titleEn) + '</p>' : '') +
      '</section>';

    // 基本信息
    const basic = UI.section('基本信息',
      UI.field('类型', typeLabel) +
      UI.field('版本', s.version ? 'v' + s.version : null) +
      UI.field('季度', s.season) +
      UI.field('章节', s.chapter) +
      UI.field('章节序号', s.order) +
      UI.field('上线日期', s.releaseDate) +
      UI.field('最近更新', s.updatedAt)
    );

    // 梗概（summary 始终可见）
    const summaryBody = UI.isEmpty(s.summary)
      ? '<p class="rel-empty"><span class="unknown">' + UI.UNKNOWN + '</span></p>'
      : '<p class="story-summary">' + UI.esc(s.summary) + '</p>';
    const summarySec = UI.section('剧情简介', summaryBody);

    // 详细剧情（synopsis）：spoiler=true 默认折叠
    const synopsisSec = UI.section('详细剧情', renderSynopsis(s));

    // 关联条目
    const rel =
      UI.section('关联角色', UI.relChips(s.participantIds, 'characters', relIndex.characters)) +
      UI.section('关联势力', UI.relChips(s.factionIds, 'factions', relIndex.factions)) +
      UI.section('关联地点', UI.relChips(s.locationIds, 'locations', relIndex.locations)) +
      UI.section('关联术语', UI.relChips(s.termIds, 'glossary', relIndex.glossary)) +
      UI.section('关联时间线', UI.relChips(s.timelineIds, 'timeline', relIndex.timeline));

    // 来源
    const source = UI.section('引用来源', UI.renderSource(s.source, storyIndex));

    return hero + basic + summarySec + synopsisSec + rel + source +
      '<nav class="chapter-nav" id="chapter-nav" aria-label="章节导航"></nav>';
  }

  // 详细剧情块：spoiler=true 时默认折叠，提供「显示剧透内容」按钮
  function renderSynopsis(s) {
    if (UI.isEmpty(s.synopsis)) {
      return '<p class="rel-empty"><span class="unknown">' + UI.UNKNOWN + '</span></p>';
    }
    if (s.spoiler) {
      return '<div class="spoiler-block">' +
        '<button type="button" class="spoiler-toggle" id="spoiler-toggle" aria-expanded="false">显示剧透内容</button>' +
        '<div class="spoiler-content" id="spoiler-content" hidden>' + UI.esc(s.synopsis) + '</div>' +
        '</div>';
    }
    return '<div class="spoiler-content">' + UI.esc(s.synopsis) + '</div>';
  }

  function bindSpoiler(s) {
    if (!s.spoiler || UI.isEmpty(s.synopsis)) return;
    const btn = document.getElementById('spoiler-toggle');
    const content = document.getElementById('spoiler-content');
    if (!btn || !content) return;
    btn.addEventListener('click', function () {
      const hidden = content.hasAttribute('hidden');
      if (hidden) {
        content.removeAttribute('hidden');
        btn.setAttribute('aria-expanded', 'true');
        btn.textContent = '隐藏剧透内容';
      } else {
        content.setAttribute('hidden', '');
        btn.setAttribute('aria-expanded', 'false');
        btn.textContent = '显示剧透内容';
      }
    });
  }

  // 上一章/下一章：按 type + order 计算（仅同类型内导航）
  function renderNav(s) {
    const nav = document.getElementById('chapter-nav');
    if (!nav) return;
    const siblings = stories
      .filter(function (x) { return x.type === s.type; })
      .sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
    const i = siblings.findIndex(function (x) { return x.id === s.id; });
    const prev = i > 0 ? siblings[i - 1] : null;
    const next = i >= 0 && i < siblings.length - 1 ? siblings[i + 1] : null;

    const link = function (label, item, dir) {
      if (!item) return '';
      const href = window.ZZZRouter.buildLink('chapter', { id: item.id });
      return '<a class="chapter-nav-link ' + dir + '" href="' + href + '">' +
        '<span class="chapter-nav-dir">' + (dir === 'prev' ? '← 上一章' : '下一章 →') + '</span>' +
        '<span class="chapter-nav-title">' + UI.esc(item.title || item.id) + '</span></a>';
    };

    if (!prev && !next) { nav.style.display = 'none'; return; }
    nav.innerHTML = link('prev', prev, 'prev') + link('next', next, 'next');
  }

  document.addEventListener('DOMContentLoaded', init);
})();
