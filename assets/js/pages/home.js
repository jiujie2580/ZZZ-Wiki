// home.js —— 首页门户：模块卡片网格 + 各模块条目数
(function () {
  function iconSvg(name) {
    return '<svg class="icon"><use href="' + window.ZZZ.iconBase + '#' + name + '"></use></svg>';
  }

  async function init() {
    const names = ['characters', 'factions', 'locations', 'glossary', 'story', 'timeline', 'version', 'worldview'];
    const counts = {};
    for (let i = 0; i < names.length; i++) {
      const d = await window.ZZZData.loadJSON(names[i]);
      const key = names[i];
      counts[key] = (d && !d.__error)
        ? Object.keys(d).reduce(function (a, k) { return a + (Array.isArray(d[k]) ? d[k].length : 0); }, 0)
        : 0;
    }

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

    const c = document.getElementById('content');
    let html = '<section class="page-hero"><h1>绝区零 Wiki</h1>' +
      '<p class="hero-sub">基于官方正式剧情与设定的剧情百科 · 当前版本 ' +
      window.ZZZ.gameVersion + '</p></section>';
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
