// home.js —— 首页门户（v1.0.0 D4 升级）
// 1) Promise.all 并行加载（替代串行 await，8 文件并发）
// 2) hero 展示当前游戏版本 + 官方版本名（数据驱动自 version.json）+ 站点版本（site.json）
// 3) 模块卡片网格 + 各模块条目数；更新日志卡计数适配 gameVersions/siteVersions 新结构
(function () {
  function iconSvg(name) {
    return '<svg class="icon"><use href="' + window.ZZZ.iconBase + '#' + name + '"></use></svg>';
  }

  async function init() {
    const names = ['characters', 'factions', 'locations', 'glossary', 'story', 'timeline', 'version', 'worldview', 'site'];
    // 并行加载（D4：任一失败不阻塞首页，对应计数显示 —）
    const results = await Promise.all(names.map(function (n) { return window.ZZZData.loadJSON(n); }));
    const data = {};
    names.forEach(function (n, i) { data[n] = results[i]; });

    const counts = {};
    names.forEach(function (key) {
      const d = data[key];
      counts[key] = (d && !d.__error)
        ? Object.keys(d).reduce(function (a, k) { return a + (Array.isArray(d[k]) ? d[k].length : 0); }, 0)
        : null;
    });

    // 当前游戏版本信息：从 version.json.gameVersions 找到 config.gameVersion 对应条目（官方版本名）
    const gvList = (data.version && !data.version.__error && data.version.gameVersions) || [];
    const cur = gvList.find(function (v) { return v.version === window.ZZZ.gameVersion; }) || null;
    const site = (data.site && !data.site.__error && data.site.site) || {};

    const gameVerText = '游戏 ' + window.ZZZ.gameVersion +
      (cur && cur.title ? '「' + window.ZZZUI.esc(cur.title) + '」' : '');
    const siteVerText = site.version ? '站点 v' + window.ZZZUI.esc(site.version) : '';

    const modules = [
      { page: 'characters', icon: 'character', title: '角色',       n: counts.characters },
      { page: 'factions',   icon: 'faction',   title: '势力 / 组织', n: counts.factions },
      { page: 'locations',  icon: 'region',    title: '地区',       n: counts.locations },
      { page: 'glossary',   icon: 'glossary',  title: '术语',       n: counts.glossary },
      { page: 'story',      icon: 'story',     title: '剧情',       n: counts.story },
      { page: 'timeline',   icon: 'timeline',  title: '时间线',     n: counts.timeline },
      { page: 'changelog',  icon: 'update',    title: '更新日志',   n: counts.version },
      { page: 'worldview',  icon: 'world',     title: '世界观',     n: counts.worldview }
    ];

    // 内容总量（不计 version/site 配置型文件）
    const contentKeys = ['characters', 'factions', 'locations', 'glossary', 'story', 'timeline', 'worldview'];
    const total = contentKeys.reduce(function (a, k) { return a + (counts[k] || 0); }, 0);

    const c = document.getElementById('content');
    let html = '<section class="page-hero"><h1>绝区零 Wiki</h1>' +
      '<p class="hero-sub">基于官方正式剧情与设定的剧情百科</p>' +
      '<div class="home-meta">' +
        '<span class="home-meta-item badge-ver-game">' + gameVerText + '</span>' +
        (siteVerText ? '<span class="home-meta-item badge-ver-site">' + siteVerText + '</span>' : '') +
        '<span class="home-meta-item home-meta-total">' + modules.length + ' 个模块 · ' + total + ' 条内容</span>' +
      '</div></section>';

    html += '<div class="module-grid">';
    modules.forEach(function (m) {
      html += '<a class="module-card" href="' + window.ZZZ.pages[m.page] + '">' +
        '<div class="module-icon">' + iconSvg(m.icon) + '</div>' +
        '<div class="module-title">' + m.title + '</div>' +
        '<div class="module-count">' + (m.n == null ? '—' : m.n + ' 条') + '</div></a>';
    });
    html += '</div>';
    c.innerHTML = html;
  }

  document.addEventListener('DOMContentLoaded', init);
})();
