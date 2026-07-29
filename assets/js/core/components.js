// components.js —— 通用 UI 组件（所有页面复用）
// 暴露：window.ZZZUI
(function () {
  const UNKNOWN = '【官方暂未说明】';

  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function isEmpty(v) {
    return v == null || v === '' || (Array.isArray(v) && v.length === 0);
  }

  // 字段行：值为空 -> 显示【官方暂未说明】
  function field(label, value) {
    const v = isEmpty(value) ? '<span class="unknown">' + UNKNOWN + '</span>' : esc(value);
    return '<div class="field"><span class="field-label">' + esc(label) +
      '</span><span class="field-value">' + v + '</span></div>';
  }

  // 数组字段：自定义渲染每项；空 -> 【官方暂未说明】
  function fieldList(label, arr, renderItem) {
    if (!arr || !arr.length) return field(label, null);
    const items = arr.map(renderItem || function (x) { return esc(x); }).join('');
    return '<div class="field"><span class="field-label">' + esc(label) +
      '</span><span class="field-value">' + items + '</span></div>';
  }

  function badge(text, type) {
    if (text == null || text === '') return '';
    return '<span class="badge badge-' + (type || 'default') + '">' + esc(text) + '</span>';
  }

  // 通用卡片（列表项）
  function card(opts) {
    const href = opts.href ? 'href="' + opts.href + '"' : '';
    const media = opts.img
      ? '<div class="card-media" style="background-image:url(\'' + esc(opts.img) + '\')"></div>'
      : '<div class="card-media"></div>';
    return '<a class="card" ' + href + '>' + media +
      '<div class="card-body">' +
      '<h3 class="card-title">' + esc(opts.title || '未命名') + '</h3>' +
      (opts.subtitle ? '<p class="card-sub">' + esc(opts.subtitle) + '</p>' : '') +
      (opts.meta ? '<div class="card-meta">' + esc(opts.meta) + '</div>' : '') +
      '</div>' + badge(opts.badge, opts.badgeType) + '</a>';
  }

  // 面包屑：items 为 [{label, href?}]，首页自动前置
  function breadcrumb(items) {
    const bc = document.getElementById('breadcrumb');
    if (!bc) return;
    const parts = [{ label: '首页', href: 'index.html' }].concat(items || []);
    bc.innerHTML = parts.map(function (it, i) {
      if (i === parts.length - 1 || !it.href) {
        return '<span class="crumb current">' + esc(it.label) + '</span>';
      }
      return '<a class="crumb" href="' + it.href + '">' + esc(it.label) + '</a>';
    }).join('<span class="crumb-sep">/</span>');
  }

  function emptyState(msg) {
    return '<div class="empty-state"><div class="empty-icon">!</div><p>' +
      esc(msg || '暂无数据') + '</p></div>';
  }

  function errorState(msg) {
    return '<div class="error-state"><p>加载失败：' + esc(msg || '未知错误') + '</p>' +
      '<p class="hint">请通过本地服务器（如 python -m http.server）访问，而非直接打开文件（file://）。</p></div>';
  }

  // 占位页面（骨架阶段）：标题 + 说明 + 骨架占位
  function placeholderPage(opts) {
    const c = document.getElementById('content');
    if (!c) return;
    const title = esc(opts.title || '建设中');
    const desc = esc(opts.desc || '本模块框架已就绪，内容整理中。');
    c.innerHTML =
      '<section class="page-hero"><h1>' + title + '</h1><p class="hero-sub">' + desc + '</p></section>' +
      '<div class="card skeleton-card">' +
      '<div class="skeleton-line" style="width:60%"></div>' +
      '<div class="skeleton-line" style="width:90%"></div>' +
      '<div class="skeleton-line" style="width:75%"></div>' +
      '<p class="placeholder-note">内容建设中 · 缺失信息将标注【官方暂未说明】</p>' +
      '</div>';
  }

  // 列表页占位：尝试加载 JSON，有数据则提示条数，无数据/错误则提示
  async function listPlaceholder(opts) {
    const c = document.getElementById('content');
    if (opts.breadcrumb) breadcrumb(opts.breadcrumb);
    const d = await window.ZZZData.loadJSON(opts.dataKey);
    if (d && d.__error) { c.innerHTML = errorState(d.message); return; }
    const list = (d && d[opts.listProp]) || [];
    if (!list.length) {
      placeholderPage({ title: opts.title, desc: opts.desc });
      return;
    }
    placeholderPage({
      title: opts.title,
      desc: (opts.desc || '') + '（已录入 ' + list.length + ' 条，详情渲染将在对应模块实现。）'
    });
  }

  // 详情页占位：按 ?id 查找，找不到给出提示
  async function detailPlaceholder(opts) {
    const c = document.getElementById('content');
    const id = window.ZZZRouter.getParam('id');
    const d = await window.ZZZData.loadJSON(opts.dataKey);
    if (d && d.__error) { c.innerHTML = errorState(d.message); return; }
    const list = (d && d[opts.listProp]) || [];
    const item = list.find(function (x) { return x.id === id; });
    const name = item
      ? (item.name || item.title || item.term || item.version || opts.title)
      : opts.title;
    breadcrumb([
      { label: opts.listLabel, href: window.ZZZ.pages[opts.listPage] },
      { label: name }
    ]);
    if (!item) {
      placeholderPage({ title: opts.title, desc: '未找到指定条目（id=' + esc(id || '') + '）。' });
      return;
    }
    placeholderPage({ title: name, desc: '详情渲染待后续模块实现。' });
  }

  // ---------- 详情页关联渲染共享原语（term / faction / 后续 character / location / chapter 等复用）----------
  // 外键目标数据集配置：字段 key -> [数据逻辑名, 列表字段, 详情页逻辑名, 名称取值]
  const REL_SOURCES = {
    story:      ['story',      'story',      'chapter',   function (x) { return x.title; }],
    timeline:   ['timeline',   'events',     'timeline',  function (x) { return x.title; }],
    characters: ['characters', 'characters', 'character', function (x) { return x.name; }],
    factions:   ['factions',   'factions',   'faction',   function (x) { return x.name; }],
    locations:  ['locations',  'locations',  'location',  function (x) { return x.name; }],
    glossary:   ['glossary',   'terms',      'term',      function (x) { return x.name; }]
  };

  // 加载某数据集并建 id -> 条目 索引；加载失败返回空 Map（降级，不报错）
  async function loadRelIndex(key) {
    const cfg = REL_SOURCES[key];
    if (!cfg) return new Map();
    const d = await window.ZZZData.loadJSON(cfg[0]);
    const map = new Map();
    if (d && !d.__error) {
      (d[cfg[1]] || []).forEach(function (x) { if (x && x.id) map.set(x.id, x); });
    }
    return map;
  }

  // 渲染一组关联 chip：存在 → 可点击链接；缺失 → 灰态降级显示 id，绝不报错
  function relChips(ids, key, index) {
    if (!ids || !ids.length) {
      return '<p class="rel-empty"><span class="unknown">' + UNKNOWN + '</span></p>';
    }
    const cfg = REL_SOURCES[key];
    if (!cfg) return '<p class="rel-empty"><span class="unknown">' + UNKNOWN + '</span></p>';
    return '<div class="rel-chips">' + ids.map(function (id) {
      const item = index.get(id);
      const name = item ? (cfg[3](item) || id) : null;
      if (item && name) {
        return '<a class="rel-chip" href="' +
          window.ZZZRouter.buildLink(cfg[2], { id: id }) + '">' + esc(name) + '</a>';
      }
      // 目标不存在或名称未录入：降级为不可点击 chip（保留 id 供追溯）
      return '<span class="rel-chip missing" title="目标条目暂未录入">' + esc(id) + '</span>';
    }).join('') + '</div>';
  }

  // 单个外键（可能为 null）
  function relSingle(id, key, index) {
    return relChips(id ? [id] : [], key, index);
  }

  // 结构化 source 渲染：
  //   { type: "story", id } → 链接到章节
  //   { type: "official" | "game" | "video", title, url? } → 文本 + 可选外链
  //   "字符串" → 兼容旧格式（纯文本）
  function renderSource(source, storyIndex) {
    if (isEmpty(source)) {
      return '<p class="rel-empty"><span class="unknown">' + UNKNOWN + '</span></p>';
    }
    if (typeof source === 'string') {
      return '<p class="source-text">' + esc(source) + '</p>';
    }
    if (source.type === 'story' && source.id) {
      const chap = storyIndex && storyIndex.get(source.id);
      const label = chap && chap.title ? chap.title : source.id;
      return '<p class="source-text">剧情章节：<a class="rel-chip" href="' +
        window.ZZZRouter.buildLink('chapter', { id: source.id }) + '">' + esc(label) + '</a></p>';
    }
    const typeLabel = { official: '官方资料', game: '游戏内文本', video: '官方视频' }[source.type] || '来源';
    let html = '<p class="source-text"><span class="badge badge-cyan">' + esc(typeLabel) + '</span> ' +
      esc(source.title || '');
    if (source.url) {
      html += ' <a class="source-link" href="' + esc(source.url) +
        '" target="_blank" rel="noopener noreferrer">查看来源 ↗</a>';
    }
    return html + '</p>';
  }

  // 详情页分节包裹（hero/section 外的通用 section）
  function section(title, body) {
    return '<section class="detail-section"><h2>' + esc(title) + '</h2>' + body + '</section>';
  }

  window.ZZZUI = {
    esc: esc,
    isEmpty: isEmpty,
    UNKNOWN: UNKNOWN,
    field: field,
    fieldList: fieldList,
    badge: badge,
    card: card,
    breadcrumb: breadcrumb,
    emptyState: emptyState,
    errorState: errorState,
    placeholderPage: placeholderPage,
    listPlaceholder: listPlaceholder,
    detailPlaceholder: detailPlaceholder,
    // 详情页关联渲染共享原语
    REL_SOURCES: REL_SOURCES,
    loadRelIndex: loadRelIndex,
    relChips: relChips,
    relSingle: relSingle,
    renderSource: renderSource,
    section: section
  };
})();
