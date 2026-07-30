// character.js —— 角色 / 代理人详情页（?id=xxx）
// 对齐 faction.js 详情页模板规范：hero → 基本信息 → 简介 → 关联区（rel-chips 优雅降级）→ 引用来源
// 关联渲染原语（relChips / relSingle / loadRelIndex / renderSource / section）复用 components.js 的 window.ZZZUI。
// 属性 / 稀有度 label 来自 config（单一数据源）。
// 外键解析原则：目标条目存在 → 可点击链接；不存在 → 灰态 chip 显示 id，绝不报错。
// 关联字段（Design Review 确认）：factionId（阵营）+ 新增 storyIds（关联剧情）/ termIds（关联术语）/ timelineIds（关联时间线事件）。
(function () {
  const UI = window.ZZZUI;

  // 自定义字段行（值已为 HTML 片段，不二次 escape）
  function fieldHTML(label, valueHTML) {
    return '<div class="field"><span class="field-label">' + UI.esc(label) +
      '</span><span class="field-value">' + valueHTML + '</span></div>';
  }

  async function init() {
    const c = document.getElementById('content');
    if (!c) return;
    const id = window.ZZZRouter.getParam('id');

    // 受控词表 label（单一数据源）
    const attrDefs = (window.ZZZ && window.ZZZ.characterAttributes) || [];
    const rarDefs = (window.ZZZ && window.ZZZ.characterRarities) || [];
    const attrLabel = {};
    const rarLabel = {};
    attrDefs.forEach(function (x) { attrLabel[x.id] = x.label; });
    rarDefs.forEach(function (x) { rarLabel[x.id] = x.label; });

    const d = await window.ZZZData.loadJSON('characters');
    if (!d || d.__error) {
      UI.breadcrumb([{ label: '角色', href: window.ZZZ.pages.characters }, { label: '详情' }]);
      c.innerHTML = UI.errorState(d && d.message);
      return;
    }

    const characters = d.characters || [];
    const ch = characters.find(function (x) { return x.id === id; });
    if (!ch) {
      UI.breadcrumb([{ label: '角色', href: window.ZZZ.pages.characters }, { label: '未找到' }]);
      c.innerHTML = UI.emptyState('未找到指定角色（id=' + (id || '空') + '），请从角色列表进入。');
      return;
    }

    UI.breadcrumb([
      { label: '角色', href: window.ZZZ.pages.characters },
      { label: ch.name || ch.id }
    ]);
    document.title = (ch.name || ch.id) + ' | 角色 / 代理人 | 绝区零 Wiki';

    // 并行加载外键目标索引（任一失败降级为空索引）
    const keys = ['factions', 'story', 'glossary', 'timeline'];
    const indexes = {};
    const loaded = await Promise.all(keys.map(UI.loadRelIndex));
    keys.forEach(function (k, i) { indexes[k] = loaded[i]; });

    const rarityLbl = rarLabel[ch.rarity] || ch.rarity;
    const attrLbl = attrLabel[ch.attribute] || ch.attribute;

    // ---------- Hero ----------
    const Img = window.ZZZImage;
    const subNames = [ch.nameEn, ch.codename].filter(Boolean).join(' / ');
    const avatar = (ch.thumbnail && !(Img && Img.isDisabled()))
      ? Img.lazyImg({ src: ch.thumbnail, alt: ch.name || ch.id, bare: true, cls: 'avatar', lazy: true })
      : '<div class="avatar"></div>';
    // 横幅（banner）：存在则展示于 hero 下方
    let bannerHtml = '';
    if (ch.banner && Img && !Img.isDisabled()) {
      bannerHtml = '<div class="character-hero-banner">' +
        Img.lazyImg({ src: ch.banner, alt: (ch.name || '') + ' 横幅', bare: true, cls: 'hero-banner-img' }) +
        '</div>';
    }
    let html =
      '<section class="detail-hero character-hero">' + avatar +
        '<div>' +
        '<h1>' + UI.esc(ch.name || ch.id) + '</h1>' +
        (subNames ? '<p class="term-hero-sub">' + UI.esc(subNames) + '</p>' : '') +
        '<div class="term-hero-meta">' +
          UI.badge(rarityLbl, 'rarity-' + UI.esc(ch.rarity)) +
          (attrLbl ? UI.badge(attrLbl, 'cyan') : '') +
          (ch.specialty ? UI.badge(ch.specialty, 'purple') : '') +
        '</div>' +
      '</div></section>';
    html += bannerHtml;

    // ---------- 基本信息 ----------
    const va = ch.voiceActors || {};
    const vaItems = [
      va.zh ? ('中：' + va.zh) : null,
      va.ja ? ('日：' + va.ja) : null,
      va.en ? ('英：' + va.en) : null,
      va.ko ? ('韩：' + va.ko) : null
    ].filter(Boolean);

    let basic =
      UI.field('中文名称', ch.name) +
      UI.field('英文名称', ch.nameEn) +
      UI.field('代号', ch.codename) +
      UI.field('稀有度', rarityLbl) +
      UI.field('属性', attrLbl) +
      UI.field('职业定位', ch.specialty) +
      fieldHTML('阵营', UI.relSingle(ch.factionId, 'factions', indexes.factions)) +
      UI.field('种族', ch.species) +
      UI.field('生日', ch.birthday) +
      UI.field('上线版本', ch.releaseVersion ? ('v' + ch.releaseVersion) : null) +
      UI.fieldList('声优', vaItems);
    html += UI.section('基本信息', basic);

    // ---------- 简介 ----------
    html += UI.section('简介',
      UI.isEmpty(ch.description)
        ? (UI.isEmpty(ch.summary)
          ? '<p class="rel-empty"><span class="unknown">' + UI.UNKNOWN + '</span></p>'
          : '<p class="term-desc">' + UI.esc(ch.summary) + '</p>')
        : '<p class="term-desc">' + UI.esc(ch.description) + '</p>'
    );

    // ---------- 关联区（Design Review 确认的三项）----------
    html += UI.section('关联剧情', UI.relChips(ch.storyIds, 'story', indexes.story));
    html += UI.section('关联术语', UI.relChips(ch.termIds, 'glossary', indexes.glossary));
    html += UI.section('关联时间线', UI.relChips(ch.timelineIds, 'timeline', indexes.timeline));

    // ---------- 图片画廊（v1.1.0 图片系统）----------
    if (Img) {
      const galleryItems = (ch.images && ch.images.gallery) ? ch.images.gallery : [];
      html += UI.section('图片画廊', Img.gallery(galleryItems));
    }

    // ---------- 引用来源 ----------
    html += UI.section('引用来源', UI.renderSource(ch.source, indexes.story));

    c.innerHTML = html;
  }

  document.addEventListener('DOMContentLoaded', init);
})();
