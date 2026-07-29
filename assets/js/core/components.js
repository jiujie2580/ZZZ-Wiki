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
    detailPlaceholder: detailPlaceholder
  };
})();
