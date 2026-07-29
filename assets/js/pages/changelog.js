// changelog.js —— 更新日志（v1.0.0 真实渲染，数据驱动自 data/version.json）
// 双区块：游戏版本大事记（gameVersions）+ 站点更新日志（siteVersions）
// 结构见 docs/json-schema.md §2.2；新增版本只需在 JSON 中加一条，页面零改动。
(function () {
  var UI = window.ZZZUI;

  function esc(s) { return UI.esc(s); }

  // 单条游戏版本行：版本徽标 + 名称 + 日期；官方未公布的字段显示【官方暂未说明】
  function gameRow(v) {
    var title = v.title
      ? '<span class="cl-title">「' + esc(v.title) + '」</span>'
      : '<span class="cl-title unknown">【官方暂未说明】</span>';
    var date = v.date
      ? '<span class="cl-date">' + esc(v.date) + '</span>'
      : '<span class="cl-date unknown">【官方暂未说明】</span>';
    return '<li class="changelog-item">' +
      '<span class="cl-ver badge-ver-game">v' + esc(v.version) + '</span>' +
      title + date + '</li>';
  }

  // 单条站点版本行：版本徽标 + 里程碑名 + 日期 + 亮点列表
  function siteRow(v) {
    var title = v.title ? '<span class="cl-title">' + esc(v.title) + '</span>' : '';
    var date = v.date ? '<span class="cl-date">' + esc(v.date) + '</span>' : '';
    var hl = (v.highlights && v.highlights.length)
      ? '<ul class="cl-highlights">' + v.highlights.map(function (h) {
          return '<li>' + esc(h) + '</li>';
        }).join('') + '</ul>'
      : '';
    return '<li class="changelog-item changelog-item-site">' +
      '<div class="cl-row"><span class="cl-ver badge-ver-site">v' + esc(v.version) + '</span>' +
      title + date + '</div>' + hl + '</li>';
  }

  async function init() {
    UI.breadcrumb([{ label: '更新日志' }]);
    var c = document.getElementById('content');
    if (!c) return;

    var d = await window.ZZZData.loadJSON('version');
    if (!d || d.__error) {
      c.innerHTML = UI.errorState(d && d.message);
      return;
    }

    var game = d.gameVersions || [];
    var site = d.siteVersions || [];

    var html = '<section class="page-hero"><h1>更新日志</h1>' +
      '<p class="hero-sub">《绝区零》游戏版本大事记与本站点更新记录，数据驱动，随版本演进持续更新。</p></section>';

    // 区块一：游戏版本大事记（按 JSON 顺序 = 新在前）
    html += '<section class="detail-section"><h2>游戏版本大事记' +
      '<span class="section-count">共 ' + game.length + ' 个版本</span></h2>';
    html += game.length
      ? '<ul class="changelog-list">' + game.map(gameRow).join('') + '</ul>'
      : UI.emptyState('暂无游戏版本记录');
    html += '</section>';

    // 区块二：站点更新日志（本仓库里程碑，新在前）
    html += '<section class="detail-section"><h2>站点更新日志' +
      '<span class="section-count">共 ' + site.length + ' 个版本</span></h2>';
    html += site.length
      ? '<ul class="changelog-list">' + site.map(siteRow).join('') + '</ul>'
      : UI.emptyState('暂无站点版本记录');
    html += '</section>';

    c.innerHTML = html;
  }

  document.addEventListener('DOMContentLoaded', init);
})();
